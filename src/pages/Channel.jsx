import { mediaUrl } from '../utils/mediaUrl';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import VerifiedBadge from '../components/VerifiedBadge';
import OfficialArtistBadge from '../components/OfficialArtistBadge';
import VideoCard from '../components/VideoCard';
import AvatarCropModal from '../components/AvatarCropModal';
import BgCropModal from '../components/BgCropModal';
import ShortTrimModal from '../components/ShortTrimModal';
import api from '../utils/api';

const tabs = ['Home', 'Videos', 'Shorts', 'Playlists', 'Posts'];

function fv(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n;
}

export default function Channel() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; } });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user.name || '', username: user.username || '', bio: user.bio || '' });
  const [saving, setSaving] = useState(false);
  const [videos, setVideos] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [editPlaylist, setEditPlaylist] = useState(null); // { _id, title, visibility }
  const [trimShort, setTrimShort] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [bgCropFile, setBgCropFile] = useState(null);
  const [thumbUploading, setThumbUploading] = useState(null); // video _id being updated
  const avatarRef = useRef(null);
  const bgRef = useRef(null);
  const thumbInputRef = useRef(null);
  const thumbTargetRef = useRef(null); // video _id for thumb input

  const token = localStorage.getItem('velogo_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!user.id) { navigate('/login'); return; }
    if (user.id) {
      api.get('/api/videos/mine', { headers }).then(r => {
        const all = r.data;
        setVideos(all.filter(v => !v.isShort));
        setShorts(all.filter(v => v.isShort));
      }).catch(() => {});
      api.get('/api/playlists/mine', { headers }).then(r => setPlaylists(r.data)).catch(() => {});
      const token = localStorage.getItem('velogo_token');
      api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => {
          const updated = { ...user, subscribers: r.data.subscribers, isVerified: r.data.isVerified, isOfficialArtist: r.data.isOfficialArtist, avatar: r.data.avatar || user.avatar, createdAt: r.data.createdAt || user.createdAt, bio: r.data.bio || user.bio };
          setUser(updated);
          localStorage.setItem('velogo_user', JSON.stringify(updated));
        }).catch(() => {});
    }
  }, [user.id]);

  const handleBgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBgCropFile(file);
    e.target.value = '';
  };

  const handleBgCropSave = async (croppedFile) => {
    setBgCropFile(null);
    const fd = new FormData();
    fd.append('background', croppedFile);
    try {
      const { data } = await api.post('/api/users/me/background', fd, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      const updated = { ...user, background: data.background };
      setUser(updated);
      localStorage.setItem('velogo_user', JSON.stringify(updated));
    } catch {}
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCropFile(file);
    e.target.value = '';
  };

  const handleThumbChange = async (e) => {
    const file = e.target.files?.[0];
    const videoId = thumbTargetRef.current;
    if (!file || !videoId) return;
    e.target.value = '';
    setThumbUploading(videoId);
    try {
      const { data: sigData } = await api.get('/api/videos/upload-signature?type=thumbnail', { headers });
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sigData.api_key);
      fd.append('timestamp', sigData.timestamp);
      fd.append('signature', sigData.signature);
      fd.append('folder', sigData.folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`, { method: 'POST', body: fd });
      const cloudData = await res.json();
      await api.put(`/api/videos/${videoId}`, { thumbnail: cloudData.secure_url }, { headers });
      setVideos(prev => prev.map(v => v._id === videoId ? { ...v, thumbnail: cloudData.secure_url } : v));
      setShorts(prev => prev.map(v => v._id === videoId ? { ...v, thumbnail: cloudData.secure_url } : v));
    } catch { alert('Failed to update thumbnail'); }
    setThumbUploading(null);
  };

  const handleCropSave = async (croppedFile) => {
    setCropFile(null);
    const fd = new FormData();
    fd.append('avatar', croppedFile);
    try {
      const { data } = await api.post('/api/users/me/avatar', fd, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      const updated = { ...user, avatar: data.avatar };
      setUser(updated);
      localStorage.setItem('velogo_user', JSON.stringify(updated));
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/api/users/me/update', form, { headers });
      const updated = { ...user, ...form, username: data.username };
      setUser(updated);
      localStorage.setItem('velogo_user', JSON.stringify(updated));
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = user.avatar
    ? mediaUrl(user.avatar)
    : null;

  const initial = user?.name?.[0]?.toUpperCase() || 'V';

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbChange} />
      {cropFile && <AvatarCropModal file={cropFile} onSave={handleCropSave} onClose={() => setCropFile(null)} />}
      {bgCropFile && <BgCropModal file={bgCropFile} onSave={handleBgCropSave} onClose={() => setBgCropFile(null)} />}
      {trimShort && <ShortTrimModal short={trimShort} onClose={() => setTrimShort(null)} onSaved={updated => setShorts(prev => prev.map(s => s._id === updated._id ? updated : s))} />}
      {infoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setInfoOpen(false)}>
          <div className="bg-[#212121] rounded-2xl p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">{user.name}</h2>
              <button onClick={() => setInfoOpen(false)} className="text-gray-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-gray-300 text-sm font-medium mb-4">More info</p>
            <div className="space-y-3">
              {user.bio && (
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01" /></svg>
                  <p className="text-gray-300 text-sm">{user.bio}</p>
                </div>
              )}
              {user.createdAt && (
                <div className="flex gap-3 items-center">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-gray-300 text-sm">Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              )}
              <div className="flex gap-3 items-center">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>
                <p className="text-gray-300 text-sm">{fv(user.subscribers || 0)} subscribers</p>
              </div>
              <div className="flex gap-3 items-center">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
                <p className="text-gray-300 text-sm">{videos.length + shorts.length} videos</p>
              </div>
              <div className="flex gap-3 items-center">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                <p className="text-gray-300 text-sm">{fv([...videos, ...shorts].reduce((s, v) => s + (v.views || 0), 0))} views</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Navbar onMenuToggle={() => setSidebarOpen(p => !p)} />
      <Sidebar open={sidebarOpen} />

      <main className={`pt-14 transition-all duration-200 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        {/* Banner / Background */}
        <div className="w-full h-40 relative overflow-hidden group/banner bg-zinc-800">
          {user.background
            ? <img src={mediaUrl(user.background)} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900" />}
          <button onClick={() => bgRef.current.click()}
            className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full transition opacity-0 group-hover/banner:opacity-100">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Change background
          </button>
          <input ref={bgRef} type="file" accept="image/*" onChange={handleBgChange} className="hidden" />
        </div>

        {/* Profile section */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-end gap-6 -mt-10 mb-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-36 h-36 rounded-full bg-red-600 flex items-center justify-center overflow-hidden ring-4 ring-[#0f0f0f]">
                {avatarSrc
                  ? <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
                  : <span className="text-4xl font-bold text-white">{initial}</span>}
              </div>
              <button onClick={() => avatarRef.current.click()}
                className="absolute bottom-2 right-2 w-8 h-8 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-full flex items-center justify-center transition">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>

            {/* Info */}
            <div className="pb-2 flex-1">
              {editing ? (
                <div className="space-y-2">
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Name"
                    className="bg-zinc-800 border border-zinc-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-500 w-full max-w-xs" />
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                    <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                      placeholder="username"
                      className="bg-zinc-800 border border-zinc-600 text-white rounded-lg pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:border-red-500 w-full" />
                  </div>
                  <input value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Channel description"
                    className="bg-zinc-800 border border-zinc-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-500 w-full max-w-sm" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="text-white text-2xl font-bold">{user.name}</h1>
                    {user.isOfficialArtist && <OfficialArtistBadge size={22} />}
                    {user.isVerified && <VerifiedBadge size={22} full />}
                  </div>
                  <p className="text-gray-400 text-sm">@{user.username || 'yourhandle'} · {fv(user.subscribers || 0)} subscribers · {videos.length} videos</p>
                  {user.bio ? (
                    <div className="mt-1">
                      <p className="text-gray-400 text-sm line-clamp-2">{user.bio}</p>
                      <button onClick={() => setInfoOpen(true)} className="text-gray-300 text-xs font-medium mt-0.5 hover:text-white transition">...more</button>
                    </div>
                  ) : (
                    <button onClick={() => setInfoOpen(true)} className="text-gray-400 text-xs mt-1 hover:text-white transition">More about this channel</button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mb-4">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving}
                  className="bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="bg-zinc-800 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-zinc-700 transition">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2 rounded-full text-sm font-medium transition">
                  Customize channel
                </button>
                <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2 rounded-full text-sm font-medium transition">
                  Manage videos
                </button>
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-800 mb-6">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition border-b-2 ${
                  activeTab === tab
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Edit Playlist Modal */}
          {editPlaylist && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <div className="bg-zinc-900 rounded-2xl p-6 w-80 space-y-4">
                <h2 className="text-white text-lg font-semibold">Edit playlist</h2>

                {/* Thumbnail picker */}
                <div>
                  <p className="text-gray-400 text-xs mb-2">Thumbnail</p>
                  <label className="relative block w-full aspect-video bg-zinc-800 rounded-xl overflow-hidden cursor-pointer group border border-zinc-700 hover:border-zinc-500 transition">
                    {editPlaylist.thumbnailPreview || editPlaylist.thumbnail
                      ? <img src={editPlaylist.thumbnailPreview || mediaUrl(editPlaylist.thumbnail)} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-500">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                          <span className="text-xs">Upload thumbnail</span>
                        </div>}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Change</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files[0];
                      if (!f) return;
                      setEditPlaylist(p => ({ ...p, thumbnailFile: f, thumbnailPreview: URL.createObjectURL(f) }));
                      e.target.value = '';
                    }} />
                  </label>
                </div>

                <input
                  value={editPlaylist.title}
                  onChange={e => setEditPlaylist(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  placeholder="Playlist title"
                />
                <select
                  value={editPlaylist.visibility}
                  onChange={e => setEditPlaylist(p => ({ ...p, visibility: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setEditPlaylist(null)} className="text-gray-400 hover:text-white text-sm px-4 py-2">Cancel</button>
                  <button
                    onClick={async () => {
                      try {
                        await api.put(`/api/playlists/${editPlaylist._id}`, { title: editPlaylist.title, visibility: editPlaylist.visibility }, { headers });
                        let newThumb = editPlaylist.thumbnail;
                        if (editPlaylist.thumbnailFile) {
                          const fd = new FormData();
                          fd.append('thumbnail', editPlaylist.thumbnailFile);
                          const { data } = await api.post(`/api/playlists/${editPlaylist._id}/thumbnail`, fd, {
                            headers: { ...headers, 'Content-Type': 'multipart/form-data' }
                          });
                          newThumb = data.thumbnail;
                        }
                        setPlaylists(prev => prev.map(p => p._id === editPlaylist._id
                          ? { ...p, title: editPlaylist.title, visibility: editPlaylist.visibility, thumbnail: newThumb }
                          : p));
                        setEditPlaylist(null);
                      } catch { alert('Failed to save'); }
                    }}
                    className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200"
                  >Save</button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {activeTab === 'Home' && (
            <div className="pb-10 space-y-10">
              {/* Shorts row */}
              {shorts.length > 0 && (
                <section>
                  <h2 className="text-white text-lg font-semibold mb-4">Shorts</h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {shorts.map(v => (
                      <div key={v._id} className="relative flex-shrink-0 w-36 group/card cursor-pointer" onClick={() => navigate(`/watch/${v._id}`)}>
                        <div className="w-36 h-64 bg-zinc-800 rounded-xl overflow-hidden">
                          {v.thumbnail
                            ? <img src={mediaUrl(v.thumbnail)} className="w-full h-full object-cover group-hover/card:scale-105 transition" />
                            : <div className="w-full h-full bg-zinc-700" />}
                        </div>
                        <p className="text-white text-xs font-medium mt-1.5 line-clamp-2">{v.title}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {/* Videos row */}
              {videos.length > 0 && (
                <section>
                  <h2 className="text-white text-lg font-semibold mb-4">Videos</h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {videos.map(v => (
                      <div key={v._id} className="flex-shrink-0 w-56 relative group/card cursor-pointer" onClick={() => navigate(`/watch/${v._id}`)}>
                        <div className="w-56 aspect-video bg-zinc-800 rounded-xl overflow-hidden">
                          {v.thumbnail
                            ? <img src={mediaUrl(v.thumbnail)} className="w-full h-full object-cover group-hover/card:scale-105 transition" />
                            : <div className="w-full h-full bg-zinc-700" />}
                        </div>
                        <p className="text-white text-xs font-medium mt-1.5 line-clamp-2">{v.title}</p>
                        <p className="text-gray-500 text-xs">{v.views?.toLocaleString()} views</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {/* Playlists row */}
              {playlists.length > 0 && (
                <section>
                  <h2 className="text-white text-lg font-semibold mb-4">Playlists</h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {playlists.map(pl => (
                      <div key={pl._id} className="flex-shrink-0 w-48 cursor-pointer group/card" onClick={() => pl.videos?.[0] && navigate(`/watch/${pl.videos[0]._id || pl.videos[0]}?list=${pl._id}`)}>
                        <div className="w-48 aspect-video bg-zinc-800 rounded-xl overflow-hidden">
                          {(pl.thumbnail || pl.videos?.[0]?.thumbnail)
                            ? <img src={mediaUrl(pl.thumbnail || pl.videos[0].thumbnail)} className="w-full h-full object-cover group-hover/card:scale-105 transition" />
                            : <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                                <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10" />
                                </svg>
                              </div>}
                        </div>
                        <p className="text-white text-xs font-medium mt-1.5 line-clamp-2">{pl.title}</p>
                        <p className="text-gray-500 text-xs">{pl.videos?.length || 0} videos</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {videos.length === 0 && shorts.length === 0 && playlists.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-gray-500 text-sm">Nothing here yet. Upload a video or create a playlist.</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'Videos' && (
            videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-white font-medium mb-1">No videos yet</p>
                <p className="text-gray-500 text-sm">Your uploaded videos will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
                {videos.map(v => (
                  <div key={v._id} className="relative group/card">
                    <VideoCard video={v} />
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); thumbTargetRef.current = v._id; thumbInputRef.current?.click(); }}
                      disabled={thumbUploading === v._id}
                      className="absolute top-2 left-2 w-8 h-8 bg-black/70 hover:bg-zinc-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition z-10"
                      title="Change thumbnail"
                    >
                      {thumbUploading === v._id
                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    </button>
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!confirm('Delete this video?')) return;
                        try {
                          await api.delete(`/api/videos/${v._id}`, { headers });
                          setVideos(prev => prev.filter(x => x._id !== v._id));
                        } catch { alert('Failed to delete'); }
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition z-10"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
          {activeTab === 'Shorts' && (
            shorts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-white font-medium mb-1">No Shorts yet</p>
                <p className="text-gray-500 text-sm">Your uploaded Shorts will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pb-10">
                {shorts.map(v => (
                  <div key={v._id} className="relative group/card cursor-pointer" onClick={() => navigate(`/watch/${v._id}`)}>
                    <div className="w-full aspect-[9/16] bg-zinc-800 rounded-xl overflow-hidden">
                      {v.thumbnail
                        ? <img src={mediaUrl(v.thumbnail)} className="w-full h-full object-cover group-hover/card:scale-105 transition" />
                        : <div className="w-full h-full bg-zinc-700" />}
                    </div>
                    <p className="text-white text-xs font-medium mt-1 line-clamp-2">{v.title}</p>
                    {/* Trim button */}
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setTrimShort(v); }}
                      className="absolute top-2 left-2 w-8 h-8 bg-black/70 hover:bg-zinc-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition z-10"
                      title="Trim"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                      </svg>
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!confirm('Delete this Short?')) return;
                        try {
                          await api.delete(`/api/videos/${v._id}`, { headers });
                          setShorts(prev => prev.filter(x => x._id !== v._id));
                        } catch { alert('Failed to delete'); }
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition z-10"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
          {activeTab === 'Playlists' && (
            playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-white font-medium mb-1">No playlists yet</p>
                <p className="text-gray-500 text-sm">Create a playlist by saving a video.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
                {playlists.map(pl => (
                  <div key={pl._id} className="group/pl relative">
                    <div className="cursor-pointer" onClick={() => pl.videos?.[0] && navigate(`/watch/${pl.videos[0]._id || pl.videos[0]}?list=${pl._id}`)}>
                      <div className="relative w-full aspect-video bg-zinc-800 rounded-xl overflow-hidden mb-3">
                        {(pl.thumbnail || pl.videos?.[0]?.thumbnail)
                          ? <img src={mediaUrl(pl.thumbnail || pl.videos[0].thumbnail)} className="w-full h-full object-cover group-hover/pl:scale-105 transition" />
                          : <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10" />
                              </svg>
                            </div>}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                          {pl.videos?.length || 0} videos
                        </div>
                      </div>
                      <h3 className="text-white text-sm font-medium line-clamp-2">{pl.title}</h3>
                      <p className="text-gray-400 text-xs capitalize">{pl.visibility}</p>
                    </div>
                    {/* Edit/Delete buttons */}
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => setEditPlaylist({ _id: pl._id, title: pl.title, visibility: pl.visibility })}
                        className="flex-1 text-xs text-gray-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg py-1 transition"
                      >Edit</button>
                      <button
                        onClick={async () => {
                          if (!confirm('Delete this playlist?')) return;
                          try {
                            await api.delete(`/api/playlists/${pl._id}`, { headers });
                            setPlaylists(prev => prev.filter(p => p._id !== pl._id));
                          } catch { alert('Failed to delete'); }
                        }}
                        className="flex-1 text-xs text-gray-400 hover:text-red-400 bg-zinc-800 hover:bg-zinc-900 rounded-lg py-1 transition"
                      >Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          {activeTab === 'Posts' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-gray-500 text-sm">Posts coming soon.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
