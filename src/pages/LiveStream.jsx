import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const BACKEND = import.meta.env.VITE_API_URL || 'https://velo-go.onrender.com';

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

  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const peersRef = useRef({}); // viewerSocketId -> RTCPeerConnection
  const chatEndRef = useRef(null);

  const token = localStorage.getItem('velogo_token');
  const headers = { Authorization: `Bearer ${token}` };
  const me = safeUser();

  useEffect(() => {
    api.get(`/api/lives/${id}`, { headers }).then(r => {
      setStream(r.data);
      setLoading(false);
    }).catch(() => { navigate('/channel'); });

    const socket = io(BACKEND, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.emit('live:start', { streamId: id, user: { name: me.name, username: me.username, avatar: me.avatar } });

    socket.on('live:viewers', count => setViewers(count));

    // New viewer joined — send them a WebRTC offer
    socket.on('live:viewer_joined', async ({ viewerSocketId }) => {
      if (!mediaStreamRef.current) return;
      const pc = createPeerConnection(viewerSocketId, socket);
      peersRef.current[viewerSocketId] = pc;
      mediaStreamRef.current.getTracks().forEach(track => pc.addTrack(track, mediaStreamRef.current));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('live:offer', { targetSocketId: viewerSocketId, offer });
    });

    socket.on('live:answer', async ({ from, answer }) => {
      const pc = peersRef.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('live:ice', ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc && candidate) pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    });

    socket.on('live:chat', msg => setChat(prev => [...prev, msg]));

    return () => {
      socket.disconnect();
      Object.values(peersRef.current).forEach(pc => pc.close());
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  function createPeerConnection(viewerSocketId, socket) {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pc.onicecandidate = e => {
      if (e.candidate) socket.emit('live:ice', { targetSocketId: viewerSocketId, candidate: e.candidate });
    };
    return pc;
  }

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = ms;
      if (videoRef.current) videoRef.current.srcObject = ms;
    } catch (e) {
      alert('Could not access camera: ' + e.message);
    }
  };

  const startScreen = async () => {
    try {
      const ms = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      mediaStreamRef.current = ms;
      if (videoRef.current) videoRef.current.srcObject = ms;
      ms.getVideoTracks()[0].onended = () => {
        setIsLive(false);
        mediaStreamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
      };
    } catch (e) {
      alert('Could not share screen: ' + e.message);
    }
  };

  const goLive = async () => {
    if (!mediaStreamRef.current) { alert('Please select camera or screen first'); return; }
    await api.post(`/api/lives/${id}/start`, {}, { headers });
    setIsLive(true);
  };

  const endStream = async () => {
    setEnding(true);
    socketRef.current?.emit('live:end', { streamId: id });
    await api.post(`/api/lives/${id}/end`, {}, { headers }).catch(() => {});
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    Object.values(peersRef.current).forEach(pc => pc.close());
    navigate('/channel');
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    socketRef.current?.emit('live:chat', {
      streamId: id,
      message: chatMsg.trim(),
      user: { name: me.name, username: me.username, avatar: me.avatar },
    });
    setChatMsg('');
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Navbar onMenuToggle={() => {}} />
      <div className="pt-14 flex flex-1 overflow-hidden">
        {/* Main stream area */}
        <div className="flex-1 flex flex-col p-4 gap-4">
          {/* Video preview */}
          <div className="relative w-full bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '60vh' }}>
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-contain" />
            {!mediaStreamRef.current && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-zinc-500 text-sm">No source selected</p>
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

          {/* Controls */}
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
              <button onClick={endStream} disabled={ending}
                className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50">
                {ending ? 'Ending...' : 'End stream'}
              </button>
            )}
          </div>

          {/* Stream info */}
          {stream && (
            <div className="bg-zinc-900 rounded-xl p-4">
              <h2 className="text-white font-semibold">{stream.title}</h2>
              {stream.description && <p className="text-gray-400 text-sm mt-1">{stream.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                <span>Chat: {stream.chatMode === 'everyone' ? 'Everyone' : stream.chatMode === 'subscribers' ? 'Subscribers only' : 'Disabled'}</span>
                <span>·</span>
                <span>{stream.visibility === 'public' ? '🌍 Public' : '🔗 Unlisted'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Live chat */}
        <div className="w-80 flex flex-col border-l border-zinc-800 bg-[#0f0f0f]">
          <div className="p-3 border-b border-zinc-800">
            <h3 className="text-white font-semibold text-sm">Live chat</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {chat.length === 0 && <p className="text-zinc-600 text-xs text-center mt-4">No messages yet</p>}
            {chat.map(msg => (
              <div key={msg.id} className="flex gap-2 items-start">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                  {msg.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <span className="text-blue-400 text-xs font-medium">{msg.user?.name || msg.user?.username} </span>
                  <span className="text-white text-xs">{msg.message}</span>
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
                placeholder="Chat..."
                maxLength={200}
                className="flex-1 bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg outline-none placeholder-zinc-500"
              />
              <button type="submit" className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-sm transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
