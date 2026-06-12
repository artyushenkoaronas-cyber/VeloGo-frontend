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

export default function LiveStream() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stream, setStream] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [chat, setChat] = useState([]);
  const [chatMsg, setChatMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [poll, setPoll] = useState(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const chatEndRef = useRef(null);

  const token = localStorage.getItem('velogo_token');
  const headers = { Authorization: `Bearer ${token}` };
  const me = safeUser();

  useEffect(() => {
    api.get(`/api/lives/${id}`, { headers }).then(r => {
      setStream(r.data);
      // Restore isLive state from DB (in case of page refresh)
      if (r.data.isLive) setIsLive(true);
      setLoading(false);
    }).catch(() => { navigate('/channel'); });

    // Use polling first — more reliable through proxies/firewalls
    const socket = io(BACKEND, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 30000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      // Emit live:start so server tracks streamer socket + joins room
      socket.emit('live:start', { streamId: id, user: { name: me.name, username: me.username, avatar: me.avatar, isFounder: me.isFounder } });
      // Also join as viewer so we receive chat_history and live:chat broadcasts
      socket.emit('live:join', { streamId: id, user: { name: me.name, username: me.username, avatar: me.avatar, isFounder: me.isFounder } });
    });
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('live:viewers', count => setViewers(count));
    socket.on('live:chat_history', msgs => setChat(msgs));
    socket.on('live:chat', msg => setChat(prev => [...prev, msg]));
    socket.on('live:pinned', msg => setPinnedMsg(msg));
    socket.on('live:poll', p => setPoll(p));
    socket.on('live:poll_update', ({ options }) => setPoll(prev => prev ? { ...prev, options } : null));

    // Warn user before closing tab/window while streaming
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Stream is still live. Are you sure you want to leave?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // When tab actually closes — end stream in DB (keepalive fetch fires even on tab close)
    const handleUnload = () => {
      if (socketRef.current) {
        socketRef.current.emit('live:end', { streamId: id });
      }
      const token = localStorage.getItem('velogo_token');
      fetch(`${BACKEND}/api/lives/${id}/end`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      socket.disconnect();
      recorderRef.current?.stop();
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [id]);

  const chatScrollRef = useRef(null);
  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat]);

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = ms;
      if (videoRef.current) videoRef.current.srcObject = ms;
    } catch (e) { alert('Could not access camera: ' + e.message); }
  };

  const startScreen = async () => {
    try {
      const ms = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
      mediaStreamRef.current = ms;
      if (videoRef.current) videoRef.current.srcObject = ms;
      ms.getVideoTracks()[0].onended = () => {
        recorderRef.current?.stop();
        setIsLive(false);
        mediaStreamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
      };
    } catch (e) { alert('Could not share screen: ' + e.message); }
  };

  const goLive = async () => {
    if (!mediaStreamRef.current) { alert('Please select Camera or Share screen first'); return; }
    await api.post(`/api/lives/${id}/start`, {}, { headers });
    setIsLive(true);

    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
    const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType, videoBitsPerSecond: 1500000 });
    recorderRef.current = recorder;

    recorder.ondataavailable = async (e) => {
      if (e.data && e.data.size > 0 && socketRef.current?.connected) {
        const buf = await e.data.arrayBuffer();
        socketRef.current.emit('live:chunk', { streamId: id, chunk: buf });
      }
    };
    recorder.start(1000);
  };

  const endStream = async (saveToChannel) => {
    setEnding(true);
    setShowEndModal(false);
    recorderRef.current?.stop();
    socketRef.current?.emit('live:end', { streamId: id });
    await api.post(`/api/lives/${id}/end`, {}, { headers }).catch(() => {});
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    if (!saveToChannel) await api.delete(`/api/lives/${id}`, { headers }).catch(() => {});
    navigate('/channel');
  };

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

  const pinMessage = (msg) => {
    socketRef.current?.emit('live:pin', { streamId: id, msg });
    setPinnedMsg(msg);
  };

  const unpinMessage = () => {
    socketRef.current?.emit('live:unpin', { streamId: id });
    setPinnedMsg(null);
  };

  const createPoll = () => {
    const opts = pollOptions.filter(o => o.trim());
    if (!pollQuestion.trim() || opts.length < 2) return;
    socketRef.current?.emit('live:poll_create', { streamId: id, question: pollQuestion.trim(), options: opts });
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPollModal(false);
  };

  const closePoll = () => {
    socketRef.current?.emit('live:poll_close', { streamId: id });
  };

  const totalVotes = poll?.options?.reduce((s, o) => s + o.votes, 0) || 0;

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Navbar onMenuToggle={() => {}} />

      {/* End stream modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#212121] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-white text-lg font-semibold mb-2">End stream</h2>
            <p className="text-gray-400 text-sm mb-5">Do you want to save this stream to your channel?</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => endStream(true)} disabled={ending}
                className="w-full bg-white text-black py-2.5 rounded-full text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-50">
                Save to channel & end
              </button>
              <button onClick={() => endStream(false)} disabled={ending}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-2.5 rounded-full text-sm font-semibold transition disabled:opacity-50">
                End without saving
              </button>
              <button onClick={() => setShowEndModal(false)} className="w-full text-gray-400 hover:text-white py-2 text-sm transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Poll creation modal */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#212121] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-white text-lg font-semibold mb-4">Create poll</h2>
            <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="w-full bg-zinc-800 text-white text-sm px-3 py-2.5 rounded-lg outline-none placeholder-zinc-500 mb-3 border border-zinc-700 focus:border-red-500" />
            <div className="space-y-2 mb-3">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={opt} onChange={e => { const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o); }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg outline-none placeholder-zinc-500 border border-zinc-700 focus:border-red-500" />
                  {pollOptions.length > 2 && (
                    <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                      className="text-zinc-500 hover:text-red-400 text-lg leading-none">×</button>
                  )}
                </div>
              ))}
            </div>
            {pollOptions.length < 4 && (
              <button onClick={() => setPollOptions([...pollOptions, ''])}
                className="text-red-400 text-sm mb-4 hover:text-red-300 transition">+ Add option</button>
            )}
            <div className="flex gap-2">
              <button onClick={createPoll}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-full text-sm font-semibold transition">
                Start poll
              </button>
              <button onClick={() => setShowPollModal(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2.5 rounded-full text-sm transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-14 flex flex-1 overflow-hidden">
        {/* Video + controls */}
        <div className="flex-1 flex flex-col p-4 gap-4">
          <div className="relative w-full bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '60vh' }}>
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
            {!mediaStreamRef.current && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <p className="text-zinc-500 text-sm">Select Camera or Share screen to start</p>
              </div>
            )}
            {isLive && (
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />LIVE
                </span>
                <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">👁 {viewers}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={startCamera}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-full text-sm transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
              Camera
            </button>
            <button onClick={startScreen}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-full text-sm transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Share screen
            </button>
            {!isLive ? (
              <button onClick={goLive}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold transition">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" />
                Go Live
              </button>
            ) : (
              <button onClick={() => setShowEndModal(true)} disabled={ending}
                className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50">
                {ending ? 'Ending...' : 'End stream'}
              </button>
            )}
            {/* Poll button — only while live */}
            {isLive && (
              <button onClick={() => setShowPollModal(true)}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-full text-sm transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Poll
              </button>
            )}

            {/* Always show End button if stream is live in DB */}
            {!isLive && stream?.isLive && (
              <button onClick={() => setShowEndModal(true)} disabled={ending}
                className="flex items-center gap-2 bg-red-800 hover:bg-red-700 text-white px-6 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50">
                {ending ? 'Ending...' : 'End stream (active)'}
              </button>
            )}
          </div>

          {stream && (
            <div className="bg-zinc-900 rounded-xl p-4 flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                {me.avatar ? <img src={mediaUrl(me.avatar)} className="w-full h-full object-cover" alt="" />
                  : <span className="text-white font-bold text-lg">{me.name?.[0]?.toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {me.isFounder && <FounderBadge size={16} />}
                  <span className="text-white font-semibold text-sm">{me.name}</span>
                  {me.isVerified && <VerifiedBadge size={14} full />}
                  <span className="text-zinc-500 text-xs">@{me.username}</span>
                </div>
                <h2 className="text-white font-medium">{stream.title}</h2>
                {stream.description && <p className="text-gray-400 text-sm mt-1">{stream.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                  <span>Chat: {stream.chatMode === 'everyone' ? 'Everyone' : stream.chatMode === 'subscribers' ? 'Subscribers only' : 'Disabled'}</span>
                  <span>·</span>
                  <span>{stream.visibility === 'public' ? '🌍 Public' : '🔗 Unlisted'}</span>
                  {isLive && <><span>·</span><span>👁 {viewers} watching</span></>}
                </div>
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
          {/* Pinned message */}
          {pinnedMsg && (
            <div className="mx-3 mt-2 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 flex items-start gap-2">
              <svg className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-yellow-400 text-[10px] font-semibold mb-0.5">Pinned</p>
                <p className="text-zinc-300 text-xs break-words">
                  <span className="font-semibold text-white">{pinnedMsg.user?.name}: </span>
                  {pinnedMsg.message}
                </p>
              </div>
              <button onClick={unpinMessage} className="text-zinc-500 hover:text-zinc-300 text-xs flex-shrink-0">×</button>
            </div>
          )}

          {/* Active poll summary for creator */}
          {poll && (
            <div className="mx-3 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg p-2.5">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-white text-xs font-semibold truncate">{poll.question}</p>
                {poll.open && (
                  <button onClick={closePoll} className="text-zinc-500 hover:text-red-400 text-[10px] flex-shrink-0 ml-2">Close</button>
                )}
              </div>
              {poll.options?.map((opt, i) => {
                const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                return (
                  <div key={i} className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
                    <span className="truncate">{opt.label}</span>
                    <span className="ml-2 flex-shrink-0">{opt.votes} ({pct}%)</span>
                  </div>
                );
              })}
              <p className="text-zinc-600 text-[10px] mt-1">{totalVotes} total votes · {poll.open ? 'Open' : 'Closed'}</p>
            </div>
          )}

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {chat.length === 0 && <p className="text-zinc-600 text-xs text-center mt-4">No messages yet</p>}
            {chat.map((msg, i) => {
              const isOwner = msg.user?.username === me.username;
              const nameColor = msg.user?.isFounder
                ? 'text-yellow-400'
                : isOwner
                  ? 'text-blue-400'
                  : 'text-white';
              return (
                <div key={msg.id || i} className="flex items-start gap-1.5 group">
                  <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0 overflow-hidden mt-0.5">
                    {msg.user?.avatar
                      ? <img src={mediaUrl(msg.user.avatar)} className="w-full h-full object-cover" alt="" />
                      : msg.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="text-xs leading-5 break-words min-w-0 flex-1">
                    {msg.user?.isFounder && <FounderBadge size={12} />}
                    {msg.user?.isVeloPlus && <VeloPlusBadge size={12} />}{' '}
                    <span className="font-semibold" style={{ color: msg.user?.isFounder ? '#facc15' : isOwner ? '#60a5fa' : '#ffffff' }}>{msg.user?.name || msg.user?.username}</span>
                    {msg.user?.isVerified && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="inline text-zinc-400 ml-0.5 -mt-0.5">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                      </svg>
                    )}
                    <span className="text-zinc-300">: {msg.message}</span>
                  </div>
                  {/* Pin button — visible on hover */}
                  <button onClick={() => pinMessage(msg)} title="Pin message"
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-zinc-500 hover:text-yellow-400 transition-opacity mt-0.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6h2v-6h5v-2l-2-2z" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
          {stream?.chatMode !== 'none' && (
            <form onSubmit={sendChat} className="p-3 border-t border-zinc-800 flex gap-2">
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder={socketConnected ? 'Chat...' : 'Connecting...'} maxLength={200}
                disabled={!socketConnected}
                className="flex-1 bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg outline-none placeholder-zinc-500 disabled:opacity-50" />
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
