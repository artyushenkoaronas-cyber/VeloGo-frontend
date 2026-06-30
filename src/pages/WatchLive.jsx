import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { mediaUrl } from '../utils/mediaUrl';
import FounderBadge from '../components/FounderBadge';
import VerifiedBadge from '../components/VerifiedBadge';
import VeloPlusBadge from '../components/VeloPlusBadge';

const BACKEND = import.meta.env.VITE_API_URL || 'https://velogo.onrender.com';

function safeUser() {
  try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; }
}

// Decode whatever socket.io sends (ArrayBuffer, Uint8Array, base64 string, etc.)
function toArrayBuffer(chunk) {
  if (!chunk) return null;
  if (chunk instanceof ArrayBuffer) return chunk;
  if (chunk instanceof Uint8Array) return chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
  if (ArrayBuffer.isView(chunk)) return chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
  if (Array.isArray(chunk)) return new Uint8Array(chunk).buffer;
  if (typeof chunk === 'string') {
    // base64
    try {
      const binary = atob(chunk);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes.buffer;
    } catch { return null; }
  }
  return null;
}

function ChatMessage({ msg, streamer }) {
  const isOwner = msg.user?.username === streamer?.username;
  return (
    <div className="flex items-start gap-1.5">
      <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0 overflow-hidden mt-0.5">
        {msg.user?.avatar ? <img src={mediaUrl(msg.user.avatar)} className="w-full h-full object-cover" alt="" /> : msg.user?.name?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="text-xs leading-5 break-words min-w-0">
        {msg.user?.isFounder && <FounderBadge size={12} />}
        {msg.user?.isVeloPlus && <VeloPlusBadge size={12} />}{' '}
        <span className="font-semibold" style={{ color: msg.user?.isFounder ? '#facc15' : isOwner ? '#60a5fa' : '#ffffff' }}>
          {msg.user?.name || msg.user?.username}
        </span>
        {msg.user?.isVerified && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="inline text-zinc-400 ml-0.5 -mt-0.5">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        )}
        <span className="text-zinc-300">: {msg.message}</span>
      </div>
    </div>
  );
}

export default function WatchLive() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [streamer, setStreamer] = useState(null);
  const [viewers, setViewers] = useState(0);
  const [chat, setChat] = useState([]);
  const [chatMsg, setChatMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [ended, setEnded] = useState(false);
  const [isVod, setIsVod] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [poll, setPoll] = useState(null);
  const [voted, setVoted] = useState(false);

  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const msRef = useRef(null);
  const sbRef = useRef(null);
  const queueRef = useRef([]);
  const drainingRef = useRef(false);
  const msOpenRef = useRef(false);
  const mimeTypeRef = useRef(null);
  const chatScrollRef = useRef(null);

  const me = safeUser();

  const drainQueue = () => {
    if (drainingRef.current) return;
    if (!sbRef.current || sbRef.current.updating) return;
    if (queueRef.current.length === 0) { drainingRef.current = false; return; }
    drainingRef.current = true;
    const buf = queueRef.current.shift();
    try {
      sbRef.current.appendBuffer(buf);
    } catch (e) {
      console.warn('[viewer] appendBuffer error:', e.name, e.message);
      drainingRef.current = false;
      // If buffer is full, remove old data
      if (e.name === 'QuotaExceededError' && sbRef.current) {
        try {
          const buffered = sbRef.current.buffered;
          if (buffered.length > 0) sbRef.current.remove(buffered.start(0), buffered.end(0) - 5);
        } catch {}
      }
    }
  };

  // Try to add SourceBuffer once BOTH MediaSource is open AND mimeType is known
  const tryAddSourceBuffer = () => {
    if (!msOpenRef.current) return;
    if (sbRef.current) return; // already added
    const mime = mimeTypeRef.current;
    if (!mime) return;
    if (!MediaSource.isTypeSupported(mime)) {
      console.warn('[viewer] mimeType not supported:', mime);
      // Fallback to any supported type
      const fallback = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaSource.isTypeSupported(m));
      if (!fallback) return;
      mimeTypeRef.current = fallback;
    }
    try {
      console.log('[viewer] addSourceBuffer:', mimeTypeRef.current);
      const sb = msRef.current.addSourceBuffer(mimeTypeRef.current);
      sbRef.current = sb;
      sb.addEventListener('updateend', () => {
        drainingRef.current = false;
        drainQueue();
        if (videoRef.current && videoRef.current.paused && videoRef.current.readyState >= 2) {
          videoRef.current.play().catch(() => {});
        }
      });
      drainQueue();
    } catch (e) {
      console.warn('[viewer] addSourceBuffer failed:', e);
    }
  };

  // MediaSource setup — only once on mount
  useEffect(() => {
    if (typeof MediaSource === 'undefined') {
      console.warn('[viewer] MediaSource not supported');
      return;
    }
    const ms = new MediaSource();
    msRef.current = ms;

    ms.addEventListener('sourceopen', () => {
      console.log('[viewer] sourceopen, readyState:', ms.readyState);
      msOpenRef.current = true;
      // If mimeType already received (e.g. re-join), add buffer immediately
      if (mimeTypeRef.current) tryAddSourceBuffer();
      // Fallback: if no mime in 2s, use best available
      setTimeout(() => {
        if (!sbRef.current && msOpenRef.current) {
          const fallback = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaSource.isTypeSupported(m));
          if (fallback) { mimeTypeRef.current = fallback; tryAddSourceBuffer(); }
        }
      }, 2000);
    });

    const url = URL.createObjectURL(ms);
    // Retry until videoRef is available
    const setVideoSrc = () => {
      if (videoRef.current) {
        videoRef.current.src = url;
      } else {
        requestAnimationFrame(setVideoSrc);
      }
    };
    setVideoSrc();

    return () => {
      URL.revokeObjectURL(url);
      if (ms.readyState === 'open') try { ms.endOfStream(); } catch {}
    };
  }, []);

  // Socket + stream fetch
  useEffect(() => {
    api.get(`/api/lives/${id}`).then(r => {
      const data = r.data;
      setStream(data);
      if (data.streamer) setStreamer(data.streamer);
      setLoading(false);
      if (!data.isLive && data.endedAt) {
        setIsVod(true);
        api.get(`/api/lives/${id}/chat`).then(res => setChat(res.data)).catch(() => {});
      }
    }).catch(() => { setLoading(false); setEnded(true); });

    const socket = io(BACKEND, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 30000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('live:join', {
        streamId: id,
        user: { name: me.name, username: me.username, avatar: me.avatar, isFounder: me.isFounder },
      });
    });

    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('live:viewers', count => setViewers(count));
    socket.on('live:chat_history', msgs => setChat(msgs));
    socket.on('live:chat', msg => setChat(prev => [...prev, msg]));
    socket.on('live:pinned', msg => setPinnedMsg(msg));
    socket.on('live:poll', p => { setPoll(p); setVoted(false); });
    socket.on('live:poll_update', ({ options }) => setPoll(prev => prev ? { ...prev, options } : null));

    // Receive streamer's codec and init SourceBuffer
    socket.on('live:mime', (mimeType) => {
      console.log('[viewer] live:mime received:', mimeType);
      mimeTypeRef.current = mimeType;
      tryAddSourceBuffer();
    });

    socket.on('live:chunk', (raw) => {
      const buf = toArrayBuffer(raw);
      if (!buf || buf.byteLength === 0) {
        console.warn('[viewer] chunk decode failed, type:', typeof raw);
        return;
      }
      queueRef.current.push(buf);
      if (sbRef.current) {
        drainQueue();
      }
      // If SourceBuffer not ready yet, chunks stay in queue and drain when ready
      if (videoRef.current && videoRef.current.paused && videoRef.current.readyState >= 2) {
        videoRef.current.play().catch(() => {});
      }
    });

    socket.on('live:ended', () => setEnded(true));

    return () => { socket.disconnect(); };
  }, [id]);

  // Auto-scroll chat during live
  useEffect(() => {
    if (isVod) return;
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat, isVod]);

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatMsg.trim() || !socketRef.current?.connected) return;
    socketRef.current.emit('live:chat', {
      streamId: id,
      message: chatMsg.trim(),
      user: { name: me.name, username: me.username, avatar: me.avatar, isFounder: me.isFounder, isVerified: me.isVerified },
    });
    setChatMsg('');
  };

  const handleVote = (i) => {
    if (voted || !poll?.open) return;
    socketRef.current?.emit('live:poll_vote', { streamId: id, optionIndex: i });
    setVoted(true);
  };

  const totalVotes = poll?.options?.reduce((s, o) => s + o.votes, 0) || 0;

  if (ended && !isVod) return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Navbar onMenuToggle={() => {}} />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">📴</div>
        <h2 className="text-white text-xl font-semibold">Stream has ended</h2>
        <p className="text-zinc-400 text-sm">This live stream is no longer available.</p>
        <button onClick={() => navigate('/')} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-full text-sm font-medium transition">Go to Home</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Navbar onMenuToggle={() => {}} />
      <div className="pt-14 flex flex-1 overflow-hidden">

        {/* Video + info */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
          <div className="relative w-full bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '60vh' }}>
            <video ref={videoRef} autoPlay playsInline controls className="w-full h-full object-contain" />

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loading && !isVod && !socketConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-white text-sm">Connecting...</p>
              </div>
            )}
            {!loading && (
              <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                {isVod
                  ? <span className="bg-zinc-700 text-white text-xs font-bold px-2 py-0.5 rounded">VOD</span>
                  : <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />LIVE
                    </span>}
                {!isVod && <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">👁 {viewers}</span>}
              </div>
            )}

            {/* Poll overlay */}
            {poll && (
              <div className="absolute bottom-14 left-4 right-4 bg-black/85 backdrop-blur-sm rounded-xl p-3 border border-zinc-700">
                <p className="text-white text-sm font-semibold mb-2">{poll.question}</p>
                <div className="space-y-1.5">
                  {poll.options?.map((opt, i) => {
                    const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                    return (
                      <button key={i} onClick={() => handleVote(i)} disabled={voted || !poll.open}
                        className="w-full text-left relative overflow-hidden rounded-lg border border-zinc-600 disabled:cursor-default hover:border-red-500 transition">
                        <div className="absolute inset-0 bg-red-600/30" style={{ width: `${pct}%` }} />
                        <div className="relative flex justify-between items-center px-3 py-1.5">
                          <span className="text-white text-xs font-medium">{opt.label}</span>
                          <span className="text-zinc-300 text-xs">{pct}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {!poll.open && <p className="text-zinc-400 text-xs mt-2 text-center">Poll closed · {totalVotes} votes</p>}
                {voted && poll.open && <p className="text-green-400 text-xs mt-2 text-center">Vote recorded!</p>}
              </div>
            )}
          </div>

          {stream && (
            <div className="bg-zinc-900 rounded-xl p-4 flex gap-4 items-start">
              <button onClick={() => streamer?.username && navigate(`/c/${streamer.username}`)}
                className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-red-500 transition">
                {streamer?.avatar ? <img src={mediaUrl(streamer.avatar)} className="w-full h-full object-cover" alt={streamer.name} /> : <span className="text-white font-bold text-lg">{streamer?.name?.[0]?.toUpperCase() || '?'}</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {streamer?.isFounder && <FounderBadge size={16} />}
                  <button onClick={() => streamer?.username && navigate(`/c/${streamer.username}`)} className="text-white font-semibold text-sm hover:underline">
                    {streamer?.name || 'Unknown'}
                  </button>
                  {streamer?.isVerified && <VerifiedBadge size={14} full />}
                  {streamer?.username && <span className="text-zinc-500 text-xs">@{streamer.username}</span>}
                </div>
                <h2 className="text-white font-medium">{stream.title}</h2>
                {stream.description && <p className="text-gray-400 text-sm mt-1">{stream.description}</p>}
                <p className="text-zinc-500 text-xs mt-1">{isVod ? 'Recorded stream' : `👁 ${viewers} watching`}</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="w-80 flex flex-col border-l border-zinc-800 bg-[#0f0f0f]">
          <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
            <h3 className="text-white font-semibold text-sm">{isVod ? 'Live chat replay' : 'Live chat'}</h3>
            {!isVod && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${socketConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />}
            {isVod && <span className="text-zinc-500 text-xs">(read-only)</span>}
          </div>

          {pinnedMsg && (
            <div className="mx-3 mt-2 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 flex items-start gap-2">
              <svg className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" /></svg>
              <div className="min-w-0">
                <p className="text-yellow-400 text-[10px] font-semibold mb-0.5">Pinned</p>
                <p className="text-zinc-300 text-xs break-words"><span className="font-semibold text-white">{pinnedMsg.user?.name}: </span>{pinnedMsg.message}</p>
              </div>
            </div>
          )}

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {chat.length === 0 && <p className="text-zinc-600 text-xs text-center mt-4">No messages yet</p>}
            {chat.map((msg, i) => <ChatMessage key={msg.id || i} msg={msg} streamer={streamer} />)}
          </div>

          {!isVod && stream?.chatMode !== 'none' && (
            <form onSubmit={sendChat} className="p-3 border-t border-zinc-800 flex gap-2">
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                placeholder={socketConnected ? 'Chat...' : 'Connecting...'}
                maxLength={200} disabled={!socketConnected}
                className="flex-1 bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg outline-none placeholder-zinc-500 disabled:opacity-50" />
              <button type="submit" disabled={!socketConnected}
                className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-sm transition disabled:opacity-50">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
              </button>
            </form>
          )}
          {isVod && <div className="p-3 border-t border-zinc-800"><p className="text-zinc-600 text-xs text-center">Chat replay — comments disabled</p></div>}
        </div>
      </div>
    </div>
  );
}
