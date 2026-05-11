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
import api from '../utils/api';

const tabs = ['Home', 'Videos', 'Shorts', 'Playlists', 'Posts'];

export default function Channel() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Videos');
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; } });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user.name || '', username: user.username || '', bio: user.bio || '' });
  const [saving, setSaving] = useState(false);
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [cropFile, setCropFile] = useState(null);
  const [bgCropFile, setBgCropFile] = useState(null);
  const avatarRef = useRef(null);
  const bgRef = useRef(null);

  const token = localStorage.getItem('velogo_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!user.id) { navigate('/login'); return; }
    if (user.id) {
      api.get(`/api/videos/user/${user.id}`).then(r => setVideos(r.data)).catch(() => {});
      api.get('/api/playlists/mine', { headers }).then(r => setPlaylists(r.data)).catch(() => {});
      const token = localStorage.getItem('velogo_token');
      api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => {
          const updated = { ...user, subscribers: r.data.subscribers };
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
      {cropFile && <AvatarCropModal file={cropFile} onSave={handleCropSave} onClose={() => setCropFile(null)} />}
      {bgCropFile && <BgCropModal file={bgCropFile} onSave={handleBgCropSave} onClose={() => setBgCropFile(null)} />}

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
                    {user.isVerified && <VerifiedBadge size={22} />}
                  </div>
                  <p className="text-gray-400 text-sm">@{user.username || 'yourhandle'} · {user.subscribers || 0} subscribers · {videos.length} videos</p>
                  {user.bio && <p className="text-gray-400 text-sm mt-1">{user.bio}</p>}
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

          {/* Content */}
          {activeTab === 'Videos' && (
            videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-16 h-16 text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <p className="text-white font-medium mb-1">No videos yet</p>
                <p className="text-gray-500 text-sm">Your uploaded videos will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
                {videos.map(v => (
                  <div key={v._id} className="relative group/card">
                    <VideoCard video={v} />
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
          {activeTab === 'Playlists' && (
            playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-white font-medium mb-1">No playlists yet</p>
                <p className="text-gray-500 text-sm">Create a playlist by saving a video.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
                {playlists.map(pl => (
                  <div key={pl._id} className="cursor-pointer group" onClick={() => pl.videos?.[0] && navigate(`/watch/${pl.videos[0]._id || pl.videos[0]}?list=${pl._id}`)}>
                    <div className="relative w-full aspect-video bg-zinc-800 rounded-xl overflow-hidden mb-3">
                      {pl.videos?.[0]?.thumbnail
                        ? <img src={mediaUrl(pl.videos[0].thumbnail)} className="w-full h-full object-cover group-hover:scale-105 transition" />
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
                ))}
              </div>
            )
          )}
          {activeTab !== 'Videos' && activeTab !== 'Playlists' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-gray-500 text-sm">{activeTab} coming soon.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
