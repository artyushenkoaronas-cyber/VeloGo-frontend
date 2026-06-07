import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import { mediaUrl } from '../utils/mediaUrl';
import FounderBadge from '../components/FounderBadge';
import MazeBadge from '../components/MazeBadge';
import VerifiedBadge from '../components/VerifiedBadge';

const BACKEND = import.meta.env.VITE_API_URL || 'https://velo-go.onrender.com';

function safeUser() {
  try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; }
}

export default function WatchLive() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [ended, setEnded] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [chat, setChat] = useState([]);
  const [chatMsg, setChatMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const chatEndRef = useRef(null);

  const token = localStorage.getItem('velogo_token');
  const headers = { Authorization: `Bearer ${token}` };
  const me = safeUser();

  useEffect(() => {
    api.get(`/api/lives/${id}`).then(r => {
      setStream(r.data);
      setLoading(false);
    }).catch(() => { navigate('/'); });

    const socket = io(BACKEND, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.emit('live:join', {
      streamId: id,
      user: { name: me.name, username: me.username, avatar: me.avatar },
    });

    socket.on('live:chat_history', msgs => setChat(msgs));
    socket.on('live:chat', msg => setChat(prev => [...prev, msg]));
    socket.on('live:viewers', count => setViewers(count));
    socket.on('live:ended', () => setEnded(true));

    // Receive offer from streamer
    socket.on('live:offer', async ({ from, offer }) => {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcRef.current = pc;

      pc.onicecandidate = e => {
        if (e.candidate) socket.emit('live:ice', { targetSocketId: from, candidate: e.candidate });
      };

      pc.ontrack = e => {
        if (videoRef.current) videoRef.current.srcObject = e.streams[0];
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('live:answer', { targetSocketId: from, answer });
    });

    socket.on('live:ice', ({ candidate }) => {
      pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    });

    return () => {
      socket.disconnect();
      pcRef.current?.close();
    };
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

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

  const canChat = () => {
    if (!stream) return false;
    if (stream.chatMode === 'none') return false;
    if (!me.id) return false;
    return true;
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const streamer = stream?.streamer;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar onMenuToggle={() => setSidebarOpen(p => !p)} />
      <Sidebar open={sidebarOpen} />
      <div className={`pt-14 transition-all duration-200 flex ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        {/* Video + info */}
        <div className="flex-1 flex flex-col">
          {/* Video */}
          <div className="relative w-full bg-black" style={{ aspectRatio: '16/9', maxHeight: '70vh' }}>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
            {ended && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3">
                <p className="text-white text-xl font-semibold">Stream ended</p>
                <button onClick={() => navigate('/')} className="bg-white text-black px-6 py-2 rounded-full text-sm font-semibold">Go home</button>
              </div>
            )}
            {!ended && stream?.isLive && (
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />LIVE
                </span>
                <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">👁 {viewers}</span>
              </div>
            )}
            {!stream?.isLive && !ended && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Waiting for stream to start...</p>
              </div>
            )}
          </div>

          {/* Stream info */}
          <div className="p-5 border-b border-zinc-800">
            <h1 className="text-white text-xl font-bold">{stream?.title}</h1>
            <div className="flex items-center gap-3 mt-3">
              <div
                className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center overflow-hidden cursor-pointer flex-shrink-0"
                onClick={() => navigate(`/channel/${streamer?.channelToken || streamer?._id}`)}
              >
                {streamer?.avatar
                  ? <img src={mediaUrl(streamer.avatar)} className="w-full h-full object-cover" />
                  : <span className="text-white font-bold">{streamer?.name?.[0]?.toUpperCase()}</span>}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  {streamer?.isFounder && <MazeBadge size={16} />}
                  {streamer?.isFounder && <FounderBadge size={16} />}
                  <span
                    className="text-white font-medium text-sm cursor-pointer hover:underline"
                    onClick={() => navigate(`/channel/${streamer?.channelToken || streamer?._id}`)}
                  >{streamer?.name}</span>
                  {streamer?.isVerified && <VerifiedBadge size={14} />}
                </div>
                <p className="text-zinc-500 text-xs">@{streamer?.username}</p>
              </div>
            </div>
            {stream?.description && <p className="text-gray-400 text-sm mt-3">{stream.description}</p>}
          </div>
        </div>

        {/* Live chat sidebar */}
        <div className="w-80 flex flex-col border-l border-zinc-800 h-[calc(100vh-56px)] sticky top-14">
          <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
            <h3 className="text-white font-semibold text-sm">Live chat</h3>
            <span className="text-zinc-500 text-xs">· {viewers} watching</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {chat.length === 0 && !ended && (
              <p className="text-zinc-600 text-xs text-center mt-4">Chat will appear here</p>
            )}
            {chat.map((msg, i) => (
              <div key={msg.id || i} className="flex gap-2 items-start">
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
          {stream?.chatMode === 'none' ? (
            <div className="p-3 border-t border-zinc-800 text-center text-zinc-600 text-xs">Chat is disabled</div>
          ) : !me.id ? (
            <div className="p-3 border-t border-zinc-800 text-center">
              <button onClick={() => navigate('/login')} className="text-blue-400 text-xs hover:underline">Sign in to chat</button>
            </div>
          ) : (
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
