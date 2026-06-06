import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaUrl } from '../utils/mediaUrl';
import api from '../utils/api';
import VerifiedBadge from '../components/VerifiedBadge';
import OfficialArtistBadge from '../components/OfficialArtistBadge';

const TABS = ['Online', 'All', 'Pending', 'Add Friend'];

function Avatar({ user, size = 8, online = false }) {
  const src = user?.avatar ? mediaUrl(user.avatar) : null;
  const s = typeof size === 'number' ? `${size * 4}px` : size;
  return (
    <div className="relative flex-shrink-0" style={{ width: s, height: s }}>
      <div className="w-full h-full rounded-full bg-red-600 flex items-center justify-center overflow-hidden">
        {src ? <img src={src} className="w-full h-full object-cover" /> : <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>}
      </div>
      {online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2b2d31]" />}
    </div>
  );
}

function timeStr(date) {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function VeloGram() {
  const navigate = useNavigate();
  const me = (() => { try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; } })();
  const token = localStorage.getItem('velogo_token');
  const headers = { Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState('Online');
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [sent, setSent] = useState([]);
  const [addInput, setAddInput] = useState('');
  const [addMsg, setAddMsg] = useState({ text: '', ok: false });
  const [sending, setSending] = useState(false);
  const [activeDM, setActiveDM] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [unread, setUnread] = useState({});
  const [imgUploading, setImgUploading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const imgInputRef = useRef(null);

  const copyMessage = (msg) => {
    const text = msg.text || (msg.sharedVideo ? `${window.location.origin}/watch/${msg.sharedVideo._id || msg.sharedVideo}` : msg.image || '');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(msg._id);
      setTimeout(() => setCopiedId(null), 1500);
    }).catch(() => {});
  };

  const avatarSrc = me.avatar ? mediaUrl(me.avatar) : null;
  const initial = me.name?.[0]?.toUpperCase() || 'V';

  useEffect(() => {
    loadFriends();
    loadUnread();
  }, []);

  useEffect(() => {
    if (activeDM) {
      loadMessages(activeDM._id);
      clearInterval(pollRef.current);
      pollRef.current = setInterval(() => loadMessages(activeDM._id), 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [activeDM?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadFriends = () => {
    api.get('/api/friends', { headers }).then(r => setFriends(r.data || [])).catch(() => {});
    api.get('/api/friends/pending', { headers }).then(r => setPending(r.data || [])).catch(() => {});
    api.get('/api/friends/sent', { headers }).then(r => setSent(r.data || [])).catch(() => {});
  };

  const loadUnread = () => {
    api.get('/api/messages', { headers }).then(r => setUnread(r.data || {})).catch(() => {});
  };

  const loadMessages = async (userId) => {
    try {
      const { data } = await api.get(`/api/messages/${userId}`, { headers });
      setMessages(data);
      setUnread(p => { const n = { ...p }; delete n[userId]; return n; });
    } catch {}
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeDM) return;
    const text = msgInput.trim();
    setMsgInput('');
    // Optimistic
    const tempId = `t${Date.now()}`;
    const temp = { _id: tempId, from: me.id || me._id, to: activeDM._id, text, createdAt: new Date().toISOString(), _sending: true };
    setMessages(p => [...p, temp]);
    try {
      const { data } = await api.post(`/api/messages/${activeDM._id}`, { text }, { headers });
      setMessages(p => p.map(m => m._id === tempId ? data : m));
    } catch (err) {
      // Mark as failed but keep visible
      setMessages(p => p.map(m => m._id === tempId ? { ...m, _sending: false, _failed: true } : m));
    }
  };

  const sendImage = async (file) => {
    if (!file || !activeDM) return;
    setImgUploading(true);
    try {
      const { data: sig } = await api.get('/api/videos/upload-signature', { headers });
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sig.api_key);
      fd.append('timestamp', sig.timestamp);
      fd.append('signature', sig.signature);
      fd.append('folder', sig.folder);
      const xhr = new XMLHttpRequest();
      const cloudRes = await new Promise((resolve, reject) => {
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`);
        xhr.onload = () => resolve(JSON.parse(xhr.responseText));
        xhr.onerror = reject;
        xhr.send(fd);
      });
      const tempId = `t${Date.now()}`;
      const temp = { _id: tempId, from: me.id || me._id, to: activeDM._id, text: '', image: cloudRes.secure_url, createdAt: new Date().toISOString(), _sending: true };
      setMessages(p => [...p, temp]);
      const { data } = await api.post(`/api/messages/${activeDM._id}`, { image: cloudRes.secure_url }, { headers });
      setMessages(p => p.map(m => m._id === tempId ? data : m));
    } catch {
      // silent
    }
    setImgUploading(false);
  };

  const sendRequest = async () => {
    if (!addInput.trim()) return;
    setSending(true); setAddMsg({ text: '', ok: false });
    try {
      const { data } = await api.post('/api/friends/request', { username: addInput.trim() }, { headers });
      setAddMsg({ text: data.message, ok: true });
      setAddInput('');
      api.get('/api/friends/sent', { headers }).then(r => setSent(r.data || [])).catch(() => {});
    } catch (err) {
      const msg = err.response?.data?.message || 'Error';
      if (err.response?.status === 401) {
        setAddMsg({ text: 'Session expired — please log out and log in again', ok: false, expired: true });
      } else {
        setAddMsg({ text: msg, ok: false });
      }
    }
    setSending(false);
  };

  const respond = async (id, action) => {
    try {
      await api.put(`/api/friends/${id}`, { action }, { headers });
      setPending(p => p.filter(f => f._id !== id));
      if (action === 'accept') api.get('/api/friends', { headers }).then(r => setFriends(r.data || [])).catch(() => {});
    } catch {}
  };

  const removeFriend = async (id) => {
    try {
      await api.delete(`/api/friends/${id}`, { headers });
      setFriends(p => p.filter(f => f._id !== id));
      if (activeDM?._id === id) setActiveDM(null);
    } catch {}
  };

  const pendingCount = pending.length + sent.length;
  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="flex h-screen bg-[#313338] text-white select-none overflow-hidden">
      {/* Server rail */}
      <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2 flex-shrink-0">
        <div onClick={() => navigate('/')} className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center cursor-pointer hover:rounded-xl transition-all duration-200 group relative" title="VeloGo">
          <span className="text-white font-bold text-xl">V</span>
          <span className="absolute left-0 w-1 h-5 bg-white rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="w-8 h-px bg-[#35363c] my-1" />
        <div className="w-12 h-12 rounded-xl bg-[#5865f2] flex items-center justify-center cursor-pointer relative" title="VeloGoCord">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute left-0 w-1 h-10 bg-white rounded-r-full" />
        </div>
      </div>

      {/* DM Sidebar */}
      <div className="w-60 bg-[#2b2d31] flex flex-col flex-shrink-0">
        <div className="p-3">
          <button className="w-full bg-[#1e1f22] text-gray-400 text-sm rounded-md px-3 py-1.5 text-left hover:bg-[#111214] transition">
            Find or start a conversation
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {/* Friends button */}
          <button onClick={() => { setActiveDM(null); setTab('Online'); }}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition ${!activeDM && tab !== 'Add Friend' ? 'bg-[#404249] text-white' : 'text-gray-400 hover:bg-[#35373c]'}`}>
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="flex-1 text-left">Friends</span>
            {(pendingCount > 0 || totalUnread > 0) && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pendingCount + totalUnread}
              </span>
            )}
          </button>

          {/* DM list — friends */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 pt-4 pb-1">Direct Messages</p>
          {friends.length === 0 && (
            <p className="text-gray-500 text-xs px-2 py-1 opacity-50">Add friends to start chatting</p>
          )}
          {friends.map(f => {
            const unreadCount = unread[f._id] || 0;
            const isActive = activeDM?._id === f._id;
            return (
              <button key={f._id} onClick={() => setActiveDM(f)}
                className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md transition group ${isActive ? 'bg-[#404249]' : 'hover:bg-[#35373c]'}`}>
                <Avatar user={f} size={8} />
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-sm font-medium truncate ${isActive || unreadCount > 0 ? 'text-white' : 'text-gray-400'}`}>{f.name}</p>
                  <p className="text-gray-500 text-xs truncate">@{f.username}</p>
                </div>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center flex-shrink-0">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Self */}
        <div className="h-14 bg-[#232428] flex items-center px-2 gap-2 flex-shrink-0">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-red-600 overflow-hidden flex items-center justify-center">
              {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover" /> : <span className="text-white text-xs font-bold">{initial}</span>}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#232428]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{me.name || 'VeloGo User'}</p>
            <p className="text-gray-400 text-xs truncate">@{me.username || 'user'}</p>
          </div>
          <button onClick={() => navigate('/')} className="p-1.5 hover:bg-[#35373c] rounded transition" title="Back to VeloGo">
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeDM ? (
          /* ── CHAT VIEW ── */
          <>
            <div className="h-12 bg-[#313338] border-b border-[#1e1f22] flex items-center px-4 gap-3 flex-shrink-0 shadow-sm">
              <Avatar user={activeDM} size={8} />
              <span className="text-white font-semibold text-sm">{activeDM.name}</span>
              <span className="text-gray-400 text-xs">@{activeDM.username}</span>
              <div className="flex-1" />
              <button onClick={() => navigate(`/c/${activeDM.channelToken || activeDM._id}`)} className="p-1.5 hover:bg-[#404249] rounded transition" title="View channel">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Welcome */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center py-10 gap-3">
                  <Avatar user={activeDM} size={16} />
                  <p className="text-white text-xl font-bold">{activeDM.name}</p>
                  <p className="text-gray-400 text-sm">This is the beginning of your direct message history with <strong>@{activeDM.username}</strong>.</p>
                </div>
              )}
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-[#3f4147]" />
                    <span className="text-[#949ba4] text-xs font-semibold">{date}</span>
                    <div className="flex-1 h-px bg-[#3f4147]" />
                  </div>
                  <div className="space-y-0.5">
                    {msgs.map((msg, i) => {
                      const myId = me.id || me._id || '';
                      const fromId = msg.from?._id?.toString() || msg.from?.toString() || msg.from;
                      const isMine = fromId === myId;
                      const prevMsg = msgs[i - 1];
                      const prevFromId = prevMsg?.from?._id?.toString() || prevMsg?.from?.toString() || prevMsg?.from;
                      const sameAuthor = prevMsg && prevFromId === fromId;
                      const showHeader = !sameAuthor;
                      // Use populated from data if available, fallback to me/activeDM
                      const fromUser = msg.from?._id ? msg.from : (isMine ? me : activeDM);
                      return (
                        <div key={msg._id} className={`flex gap-3 hover:bg-[#2e3035] px-2 py-0.5 rounded group relative ${showHeader ? 'mt-3' : ''}`}>
                          <div className="w-10 flex-shrink-0 flex items-start justify-center pt-0.5">
                            {showHeader
                              ? <Avatar user={fromUser} size={10} />
                              : <span className="text-[#949ba4] text-[10px] opacity-0 group-hover:opacity-100 pt-1">{timeStr(msg.createdAt)}</span>}
                          </div>
                          {/* Copy button on hover */}
                          <div className="absolute right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                            <button onClick={() => copyMessage(msg)}
                              className="p-1.5 hover:bg-[#404249] rounded text-gray-400 hover:text-white transition relative" title="Copy">
                              {copiedId === msg._id
                                ? <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            {showHeader && (
                              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                <span className="text-white text-sm font-semibold">{fromUser.name}</span>
                                {fromUser.isOfficialArtist && <OfficialArtistBadge size={13} />}
                                {fromUser.isVerified && <VerifiedBadge size={13} full />}
                                <span className="text-[#949ba4] text-xs">{timeStr(msg.createdAt)}</span>
                              </div>
                            )}
                            {msg.text && (
                              <p className={`text-sm leading-relaxed break-words ${msg._failed ? 'text-red-400' : msg._sending ? 'text-[#dbdee1] opacity-60' : 'text-[#dbdee1]'}`}>
                                {msg.text}
                                {msg._failed && <span className="ml-2 text-xs text-red-400">(failed)</span>}
                              </p>
                            )}
                            {msg.image && (
                              <img src={msg.image} alt="" className={`max-w-[280px] rounded-lg mt-1 cursor-pointer ${msg._sending ? 'opacity-60' : ''}`}
                                onClick={() => window.open(msg.image, '_blank')} />
                            )}
                            {msg.sharedVideo && (
                              <div className="mt-1 bg-[#2b2d31] border border-[#3f4147] rounded-lg overflow-hidden max-w-[280px] cursor-pointer hover:border-[#5865f2] transition"
                                onClick={() => navigate(`/watch/${msg.sharedVideo._id || msg.sharedVideo}`)}>
                                {msg.sharedVideo.thumbnail
                                  ? <img src={mediaUrl(msg.sharedVideo.thumbnail)} className="w-full h-36 object-cover" />
                                  : <div className="w-full h-36 bg-zinc-800 flex items-center justify-center"><svg className="w-8 h-8 text-zinc-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg></div>}
                                <div className="px-3 py-2">
                                  <p className="text-white text-xs font-medium line-clamp-1">{msg.sharedVideo.title}</p>
                                  <p className="text-[#949ba4] text-[11px]">@{msg.sharedVideo.uploader?.username} · {msg.sharedVideo.isShort ? 'Short' : 'Video'}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-6 pt-2 flex-shrink-0">
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && sendImage(e.target.files[0])} />
              <div className="bg-[#383a40] rounded-lg flex items-center px-2 gap-1">
                <button onClick={() => imgInputRef.current?.click()} disabled={imgUploading}
                  className="text-gray-400 hover:text-white disabled:opacity-30 transition p-2 flex-shrink-0" title="Send image">
                  {imgUploading
                    ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                </button>
                <input
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={`Message @${activeDM.username}`}
                  className="flex-1 bg-transparent text-white text-sm py-3 focus:outline-none placeholder-[#6d6f78]"
                />
                <button onClick={sendMessage} disabled={!msgInput.trim()}
                  className="text-gray-400 hover:text-white disabled:opacity-30 transition p-2 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── FRIENDS VIEW ── */
          <>
            <div className="h-12 bg-[#313338] border-b border-[#1e1f22] flex items-center px-4 gap-3 flex-shrink-0 shadow-sm">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white font-semibold text-sm">Friends</span>
              <div className="w-px h-5 bg-gray-600 mx-1" />
              <div className="flex items-center gap-1">
                {TABS.filter(t => t !== 'Add Friend').map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-3 py-1 rounded text-sm font-medium transition relative ${tab === t ? 'bg-[#404249] text-white' : 'text-gray-400 hover:bg-[#35373c]'}`}>
                    {t}
                    {t === 'Pending' && pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">{pendingCount}</span>
                    )}
                  </button>
                ))}
                <button onClick={() => setTab('Add Friend')}
                  className={`ml-2 px-3 py-1 rounded text-sm font-medium transition ${tab === 'Add Friend' ? 'bg-[#248046] text-white' : 'text-[#248046] border border-[#248046] hover:bg-[#248046] hover:text-white'}`}>
                  Add Friend
                </button>
              </div>
            </div>

            <div className="flex flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto">

                {tab === 'Add Friend' && (
                  <div className="p-8 max-w-2xl">
                    <h2 className="text-white font-bold text-lg mb-1">Add Friend</h2>
                    <p className="text-[#949ba4] text-sm mb-4">You can add friends with their VeloGo username.</p>
                    <div className={`flex items-center gap-2 bg-[#1e1f22] rounded-lg px-4 py-3 border-2 transition ${addMsg.ok ? 'border-[#248046]' : addMsg.text ? 'border-red-500' : 'border-transparent focus-within:border-[#5865f2]'}`}>
                      <input
                        value={addInput}
                        onChange={e => { setAddInput(e.target.value); setAddMsg({ text: '', ok: false }); }}
                        onKeyDown={e => e.key === 'Enter' && sendRequest()}
                        placeholder="Enter a username"
                        className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
                      />
                      <button onClick={sendRequest} disabled={!addInput.trim() || sending}
                        className="bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-40 text-white text-sm font-medium px-4 py-1.5 rounded transition">
                        {sending ? 'Sending...' : 'Send Friend Request'}
                      </button>
                    </div>
                    {addMsg.text && (
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        <p className={`text-sm ${addMsg.ok ? 'text-[#248046]' : 'text-red-400'}`}>{addMsg.text}</p>
                        {addMsg.expired && (
                          <button onClick={() => { localStorage.removeItem('velogo_token'); localStorage.removeItem('velogo_user'); navigate('/login'); }}
                            className="bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs px-3 py-1.5 rounded transition font-medium">
                            Log in again
                          </button>
                        )}
                      </div>
                    )}
                    {sent.length > 0 && (
                      <div className="mt-8">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Sent — {sent.length}</p>
                        {sent.map(f => (
                          <div key={f._id} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#35373c] transition group">
                            <Avatar user={f.recipient} size={10} />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-semibold truncate">{f.recipient?.name}</p>
                              <p className="text-gray-400 text-xs">Pending</p>
                            </div>
                            <button onClick={() => removeFriend(f._id)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 text-red-400 rounded-full transition">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'Pending' && (
                  <div className="p-4 space-y-6">
                    {/* Incoming */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-2">Incoming — {pending.length}</p>
                      {pending.length === 0
                        ? <p className="text-[#949ba4] text-sm px-2">No incoming requests</p>
                        : pending.map(f => (
                        <div key={f._id} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#35373c] transition group">
                          <Avatar user={f.requester} size={10} />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{f.requester?.name}</p>
                            <p className="text-gray-400 text-xs">@{f.requester?.username} · Incoming</p>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => respond(f._id, 'accept')} className="p-2 hover:bg-green-500/20 text-green-400 rounded-full transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button onClick={() => respond(f._id, 'decline')} className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    </div>

                    {/* Outgoing / Sent */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-2">Sent — {sent.length}</p>
                      {sent.length === 0
                        ? <p className="text-[#949ba4] text-sm px-2">No sent requests</p>
                        : sent.map(f => (
                          <div key={f._id} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#35373c] transition group">
                            <Avatar user={f.recipient} size={10} />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-semibold truncate">{f.recipient?.name}</p>
                              <p className="text-gray-400 text-xs">@{f.recipient?.username} · Outgoing</p>
                            </div>
                            <button onClick={() => removeFriend(f._id)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 text-red-400 rounded-full transition" title="Cancel">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {(tab === 'All' || tab === 'Online') && (
                  <div className="p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-2">All Friends — {friends.length}</p>
                    {friends.length === 0 ? (
                      <div className="flex flex-col items-center py-20 gap-3">
                        <p className="text-[#949ba4] text-sm font-semibold">No friends yet</p>
                        <button onClick={() => setTab('Add Friend')} className="bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium px-4 py-2 rounded transition">Add Friend</button>
                      </div>
                    ) : friends.map(f => (
                      <div key={f._id} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#35373c] transition group">
                        <Avatar user={f} size={10} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{f.name}</p>
                          <p className="text-gray-400 text-xs">@{f.username}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => setActiveDM(f)} className="p-2 hover:bg-[#404249] rounded-full transition" title="Message">
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          </button>
                          <button onClick={() => removeFriend(f._id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition" title="Remove">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-60 bg-[#2b2d31] flex-shrink-0 border-l border-[#1e1f22] p-4">
                <p className="text-white font-semibold text-sm mb-4">Active Now</p>
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <p className="text-[#949ba4] text-xs font-semibold">It's quiet for now...</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
