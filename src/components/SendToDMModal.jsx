import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { mediaUrl } from '../utils/mediaUrl';

export default function SendToDMModal({ video, onClose }) {
  const token = localStorage.getItem('velogo_token');
  const headers = { Authorization: `Bearer ${token}` };
  const [friends, setFriends] = useState([]);
  const [sent, setSent] = useState({});
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    api.get('/api/friends', { headers }).then(r => setFriends(r.data || [])).catch(() => {});
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const sendToFriend = async (friend) => {
    if (sent[friend._id]) return;
    try {
      await api.post(`/api/messages/${friend._id}`, { sharedVideo: video._id }, { headers });
      setSent(p => ({ ...p, [friend._id]: true }));
    } catch {}
  };

  const filtered = friends.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div ref={ref} className="bg-[#313338] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e1f22] flex items-center justify-between">
          <p className="text-white font-semibold text-base">Send to friend</p>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Video preview */}
        <div className="px-5 py-3 flex items-center gap-3 bg-[#2b2d31] border-b border-[#1e1f22]">
          {video.thumbnail
            ? <img src={mediaUrl(video.thumbnail)} className="w-14 h-10 object-cover rounded-lg flex-shrink-0" />
            : <div className="w-14 h-10 bg-zinc-700 rounded-lg flex-shrink-0 flex items-center justify-center">
                <svg className="w-5 h-5 text-zinc-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>
              </div>}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium line-clamp-1">{video.title}</p>
            <p className="text-gray-400 text-xs">{video.isShort ? 'Short' : 'Video'}</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-[#1e1f22]">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="w-full bg-[#1e1f22] text-white text-sm rounded-lg px-3 py-2 focus:outline-none placeholder-gray-500" />
        </div>

        {/* Friends list */}
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No friends yet</p>
          ) : filtered.map(f => {
            const avatarSrc = f.avatar ? mediaUrl(f.avatar) : null;
            const isSent = sent[f._id];
            return (
              <div key={f._id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#35373c] transition">
                <div className="w-9 h-9 rounded-full bg-red-600 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover" /> : <span className="text-white text-sm font-bold">{f.name?.[0]?.toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{f.name}</p>
                  <p className="text-gray-400 text-xs">@{f.username}</p>
                </div>
                <button onClick={() => sendToFriend(f)}
                  className={`text-sm font-medium px-4 py-1.5 rounded-full transition flex-shrink-0 ${isSent ? 'bg-[#248046] text-white cursor-default' : 'bg-[#5865f2] hover:bg-[#4752c4] text-white'}`}>
                  {isSent ? 'Sent ✓' : 'Send'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
