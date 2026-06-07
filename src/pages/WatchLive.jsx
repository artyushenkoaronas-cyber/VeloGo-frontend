import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { mediaUrl } from '../utils/mediaUrl';
import FounderBadge from '../components/FounderBadge';
import VerifiedBadge from '../components/VerifiedBadge';

const BACKEND = import.meta.env.VITE_API_URL || 'https://velogo.onrender.com';

function safeUser() {
  try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; }
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
  const [socketConnected, setSocketConnected] = useState(false);

  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const msRef = useRef(null);
  const sbRef = useRef(null);
  const queueRef = useRef([]);
  const drainingRef = useRef(false);
  const chatEndRef = useRef(null);

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
      console.warn('appendBuffer error', e);
      drainingRef.current = false;
    }
  };

  // Fetch stream info + set up socket
  useEffect(() => {
    api.get(`/api/lives/${id}`).then(r => {
      const data = r.data;
      setStream(data);
      if (data.streamer) setStreamer(data.streamer);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
      setEnded(true);
    });

    // polling first — more reliable through proxies/firewalls
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

    socket.on('live:chunk', (chunk) => {
      if (!sbRef.current) return;
      // Normalize chunk to ArrayBuffer regardless of how socket.io delivers it
      let buf;
      if (chunk instanceof ArrayBuffer) {
        buf = chunk;
      } else if (ArrayBuffer.isView(chunk)) {
        buf = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
      } else {
        return;
      }
      queueRef.current.push(buf);
      drainQueue();
      if (videoRef.current && videoRef.current.paused && videoRef.current.readyState >= 2) {
        videoRef.current.play().catch(() => {});
      }
    });

    socket.on('live:ended', () => setEnded(true));

    return () => {
      socket.disconnect();
      if (msRef.current && msRef.current.readyState === 'open') {
        try { msRef.current.endOfStream(); } catch {}
      }
    };
  }, [id]);

  // Set up MediaSource AFTER loading is done so videoRef.current exists in the DOM
  useEffect(() => {
    if (loading || ended) return;
    if (typeof MediaSource === 'undefined') return;
    if (!videoRef.current) return;

    const ms = new MediaSource();
    msRef.current = ms;
    videoRef.current.src = URL.createObjectURL(ms);

    ms.addEventListener('sourceopen', () => {
      // Try codecs in order of preference
      const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
        .find(m => MediaSource.isTypeSupported(m));
      if (!mimeType) return;
      try {
        const sb = ms.addSourceBuffer(mimeType);
        sbRef.current = sb;
        sb.addEventListener('updateend', () => {
          drainingRef.current = false;
          drainQueue();
        });
        // Drain any chunks that arrived before MediaSource was ready
        drainQueue();
      } catch (e) {
        console.warn('addSourceBuffer error', e);
      }
    });
  }, [loading, ended]);

  useEffect(() => {
    const el = chatEndRef.current;
    if (el) el.scrollIntoView({ behavior: 'auto' });
  }, [chat]);

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

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (ended) return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Navbar onMenuToggle={() => {}} />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">📴</div>
        <h2 className="text-white text-xl font-semibold">Stream has ended</h2>
        <p className="text-zinc-400 text-sm">This live stream is no longer available.</p>
        <button onClick={() => navigate('/')} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-full text-sm font-medium transition">
          Go to Home
        </button>
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
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
            {/* Connecting overlay */}
            {!socketConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-white text-sm">Connecting...</p>
              </div>
            )}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />LIVE
              </span>
              <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">👁 {viewers}</span>
            </div>
          </div>

          {stream && (
            <div className="bg-zinc-900 rounded-xl p-4 flex gap-4 items-start">
              <button
                onClick={() => streamer?.username && navigate(`/c/${streamer.username}`)}
                className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-red-500 transition"
              >
                {streamer?.avatar
                  ? <img src={mediaUrl(streamer.avatar)} className="w-full h-full object-cover" alt={streamer.name} />
                  : <span className="text-white font-bold text-lg">{streamer?.name?.[0]?.toUpperCase() || '?'}</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {streamer?.isFounder && <FounderBadge size={16} />}
                  <button
                    onClick={() => streamer?.username && navigate(`/c/${streamer.username}`)}
                    className="text-white font-semibold text-sm hover:underline"
                  >
                    {streamer?.name || 'Unknown'}
                  </button>
                  {streamer?.isVerified && <VerifiedBadge size={14} full />}
                  {streamer?.username && <span className="text-zinc-500 text-xs">@{streamer.username}</span>}
                </div>
                <h2 className="text-white font-medium">{stream.title}</h2>
                {stream.description && <p className="text-gray-400 text-sm mt-1">{stream.description}</p>}
                <p className="text-zinc-500 text-xs mt-1">👁 {viewers} watching</p>
              </div>
            </div>
          )}
        </div>

        {/* Live chat */}
        <div className="w-80 flex flex-col border-l border-zinc-800 bg-[#0f0f0f]">
          <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
            <h3 className="text-white font-semibold text-sm">Live chat</h3>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${socketConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
            {!socketConnected && <span className="text-yellow-400 text-xs">Connecting...</span>}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {chat.length === 0 && <p className="text-zinc-600 text-xs text-center mt-4">No messages yet</p>}
            {chat.map((msg, i) => (
              <div key={msg.id || i} className="flex gap-2 items-start">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0 overflow-hidden">
                  {msg.user?.avatar
                    ? <img src={mediaUrl(msg.user.avatar)} className="w-full h-full object-cover" alt="" />
                    : msg.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    {msg.user?.isFounder && <FounderBadge size={13} />}
                    <span className="text-blue-400 text-xs font-medium">{msg.user?.name || msg.user?.username}</span>
                    {msg.user?.isVerified && <VerifiedBadge size={11} full />}
                  </div>
                  <span className="text-white text-xs break-words">{msg.message}</span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          {stream?.chatMode !== 'none' && (
            <form onSubmit={sendChat} className="p-3 border-t border-zinc-800 flex gap-2">
              <input
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                placeholder={socketConnected ? 'Chat...' : 'Connecting...'}
                maxLength={200}
                disabled={!socketConnected}
                className="flex-1 bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg outline-none placeholder-zinc-500 disabled:opacity-50"
              />
              <button type="submit" disabled={!socketConnected}
                className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-sm transition disabled:opacity-50">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
