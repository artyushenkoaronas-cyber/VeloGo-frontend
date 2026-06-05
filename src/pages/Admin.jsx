import { mediaUrl } from '../utils/mediaUrl';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const token = localStorage.getItem('velogo_token');
  const me = (() => { try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; } })();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadStats();
    loadUsers();
    loadVideos();
  }, []);

  const loadStats = async () => {
    try { const { data } = await api.get('/api/admin/stats', { headers }); setStats(data); }
    catch (err) { if (err.response?.status === 403 || err.response?.status === 401) setUnauthorized(true); }
  };
  const loadUsers = async () => {
    try { const { data } = await api.get('/api/admin/users', { headers }); setUsers(data); }
    catch (err) { if (err.response?.status === 403 || err.response?.status === 401) setUnauthorized(true); }
  };
  const loadVideos = async () => {
    try { const { data } = await api.get('/api/admin/videos', { headers }); setVideos(data); }
    catch (err) { if (err.response?.status === 403 || err.response?.status === 401) setUnauthorized(true); }
  };

  const toggleVerify = async (id) => {
    try {
      const { data } = await api.put(`/api/admin/users/${id}/verify`, {}, { headers });
      setUsers(u => u.map(x => x._id === id ? { ...x, isVerified: data.isVerified } : x));
    } catch {}
  };

  const toggleOfficial = async (id) => {
    try {
      const { data } = await api.put(`/api/admin/users/${id}/official`, {}, { headers });
      setUsers(u => u.map(x => x._id === id ? { ...x, isOfficialArtist: data.isOfficialArtist } : x));
    } catch {}
  };

  const toggleAdmin = async (id) => {
    if (!confirm('Toggle admin status for this user?')) return;
    try {
      const { data } = await api.put(`/api/admin/users/${id}/admin`, {}, { headers });
      setUsers(u => u.map(x => x._id === id ? { ...x, isAdmin: data.isAdmin } : x));
    } catch {}
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user and all their videos?')) return;
    try {
      await api.delete(`/api/admin/users/${id}`, { headers });
      setUsers(u => u.filter(x => x._id !== id));
    } catch {}
  };

  const deleteVideo = async (id) => {
    if (!confirm('Delete this video?')) return;
    try {
      await api.delete(`/api/admin/videos/${id}`, { headers });
      setVideos(v => v.filter(x => x._id !== id));
    } catch {}
  };

  const setSubscribers = async (id, val) => {
    try {
      const { data } = await api.put(`/api/admin/users/${id}/subscribers`, { subscribers: val }, { headers });
      setUsers(u => u.map(x => x._id === id ? { ...x, subscribers: data.subscribers } : x));
    } catch {}
  };

  const setViews = async (id, val) => {
    try {
      const { data } = await api.put(`/api/admin/videos/${id}/views`, { views: val }, { headers });
      setVideos(v => v.map(x => x._id === id ? { ...x, views: data.views } : x));
    } catch {}
  };

  if (unauthorized) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center flex-col gap-4">
      <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <p className="text-white text-lg font-semibold">Access denied</p>
      <p className="text-gray-400 text-sm">You need to log in with the admin account.</p>
      <button onClick={() => navigate('/')} className="mt-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2 rounded-full text-sm transition">Go home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar onMenuToggle={() => setSidebarOpen(p => !p)} />
      <Sidebar open={sidebarOpen} />

      <main className={`pt-14 transition-all duration-200 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">Admin Panel</h1>
              <p className="text-gray-400 text-sm">VeloGo management dashboard</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Users', value: stats.users || 0, icon: '👥' },
              { label: 'Total Videos', value: stats.videos || 0, icon: '🎬' },
              { label: 'Total Views', value: stats.totalViews || 0, icon: '👁' },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <p className="text-3xl mb-2">{s.icon}</p>
                <p className="text-white text-2xl font-bold">{s.value.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {['users', 'videos'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition capitalize ${tab === t ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>
                {t} ({t === 'users' ? users.length : videos.length})
              </button>
            ))}
          </div>

          {/* Users table */}
          {tab === 'users' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {users.map((u, i) => (
                <UserRow key={u._id} u={u} me={me} isLast={i === users.length - 1}
                  headers={headers}
                  onVerify={() => toggleVerify(u._id)}
                  onOfficial={() => toggleOfficial(u._id)}
                  onAdmin={() => toggleAdmin(u._id)}
                  onDelete={() => deleteUser(u._id)}
                  onSetSubs={(val) => setSubscribers(u._id, val)}
                />
              ))}
            </div>
          )}

          {/* Videos table */}
          {tab === 'videos' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {videos.map((v, i) => (
                <VideoRow key={v._id} v={v} isLast={i === videos.length - 1}
                  headers={headers}
                  onDelete={() => deleteVideo(v._id)}
                  onSetViews={(val) => setViews(v._id, val)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function UserRow({ u, me, isLast, headers, onVerify, onOfficial, onAdmin, onDelete, onSetSubs }) {
  const [expanded, setExpanded] = useState(false);
  const [subsInput, setSubsInput] = useState(String(u.subscribers ?? 0));
  const [userVideos, setUserVideos] = useState([]);
  const [videosLoaded, setVideosLoaded] = useState(false);

  useEffect(() => { setSubsInput(String(u.subscribers ?? 0)); }, [u.subscribers]);

  const loadUserVideos = async () => {
    if (videosLoaded) return;
    try {
      const { data } = await api.get(`/api/admin/users/${u._id}/videos`, { headers });
      setUserVideos(data);
      setVideosLoaded(true);
    } catch {}
  };

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) loadUserVideos();
  };

  const updateVideo = (id, patch) => setUserVideos(vs => vs.map(v => v._id === id ? { ...v, ...patch } : v));

  return (
    <div className={`${!isLast ? 'border-b border-zinc-800' : ''}`}>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition cursor-pointer" onClick={handleExpand}>
        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center overflow-hidden flex-shrink-0">
          {u.avatar
            ? <img src={mediaUrl(u.avatar)} className="w-full h-full object-cover" />
            : <span className="text-white text-xs font-bold">{u.name?.[0]?.toUpperCase()}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white text-sm font-medium truncate">{u.name}</p>
            {u.isAdmin && <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full">Admin</span>}
            {u.isOfficialArtist && <span className="text-[10px] text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded-full">🎵 Official</span>}
            {u.isVerified && <span className="text-[10px] text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-full">✓ Verified</span>}
          </div>
          <p className="text-gray-400 text-xs truncate">{u.email} · @{u.username || '—'} · {u.subscribers ?? 0} subs</p>
        </div>
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="bg-zinc-800/30 border-t border-zinc-800">
          {/* User actions */}
          <div className="px-4 py-3 flex flex-wrap gap-2 items-center border-b border-zinc-800/60">
            <button onClick={e => { e.stopPropagation(); onOfficial(); }}
              className={`text-xs px-3 py-1.5 rounded-lg transition ${u.isOfficialArtist ? 'bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
              {u.isOfficialArtist ? 'Remove Official' : '🎵 Official Artist'}
            </button>
            <button onClick={e => { e.stopPropagation(); onVerify(); }}
              className={`text-xs px-3 py-1.5 rounded-lg transition ${u.isVerified ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
              {u.isVerified ? 'Unverify' : 'Verify ✓'}
            </button>
            {u._id !== me.id && (
              <button onClick={e => { e.stopPropagation(); onAdmin(); }}
                className={`text-xs px-3 py-1.5 rounded-lg transition ${u.isAdmin ? 'bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-white'}`}>
                {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
              </button>
            )}
            {!u.isAdmin && (
              <button onClick={e => { e.stopPropagation(); onDelete(); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition">
                Delete
              </button>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-gray-400 text-xs">Subscribers:</span>
              <input
                type="number" min="0"
                value={subsInput}
                onChange={e => setSubsInput(e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-24 bg-zinc-700 border border-zinc-600 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
              />
              <button onClick={e => { e.stopPropagation(); onSetSubs(Number(subsInput)); }}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition">
                Set
              </button>
            </div>
          </div>

          {/* Credentials */}
          <div className="px-4 py-3 border-b border-zinc-800/60 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-16">Email:</span>
              <span className="text-gray-200 text-xs font-mono">{u.email || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-16">Password:</span>
              <span className="text-gray-200 text-xs font-mono break-all">{u.password || '(Google login)'}</span>
            </div>
          </div>

          {/* User videos */}
          <div className="px-4 py-3">
            <p className="text-gray-400 text-xs font-medium mb-2">Videos & Shorts ({userVideos.length})</p>
            {userVideos.length === 0 && videosLoaded && (
              <p className="text-gray-600 text-xs">No videos uploaded.</p>
            )}
            {!videosLoaded && (
              <p className="text-gray-600 text-xs">Loading...</p>
            )}
            <div className="space-y-2">
              {userVideos.map(v => (
                <AdminVideoItem key={v._id} v={v} headers={headers} onUpdate={patch => updateVideo(v._id, patch)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminVideoItem({ v, headers, onUpdate }) {
  const [viewsInput, setViewsInput] = useState(String(v.views ?? 0));
  const [likesInput, setLikesInput] = useState(String(v.likes?.length ?? 0));

  useEffect(() => { setViewsInput(String(v.views ?? 0)); }, [v.views]);
  useEffect(() => { setLikesInput(String(v.likes?.length ?? 0)); }, [v.likes]);

  const setViews = async () => {
    try {
      const { data } = await api.put(`/api/admin/videos/${v._id}/views`, { views: Number(viewsInput) }, { headers });
      onUpdate({ views: data.views });
    } catch {}
  };

  const setLikes = async () => {
    try {
      const { data } = await api.put(`/api/admin/videos/${v._id}/likes`, { likes: Number(likesInput) }, { headers });
      onUpdate({ likes: Array(data.likes) });
    } catch {}
  };

  return (
    <div className="bg-zinc-800 rounded-xl px-3 py-2 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {v.isShort && <span className="text-[10px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded-full">Short</span>}
          <p className="text-white text-xs truncate">{v.title}</p>
        </div>
        <p className="text-gray-500 text-[11px]">{v.views ?? 0} views · {v.likes?.length ?? 0} likes · <span className={v.visibility === 'public' ? 'text-green-400' : 'text-gray-500'}>{v.visibility}</span></p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500 text-[11px]">👁</span>
        <input type="number" min="0" value={viewsInput} onChange={e => setViewsInput(e.target.value)}
          className="w-20 bg-zinc-700 border border-zinc-600 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500" />
        <button onClick={setViews} className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg transition">Set</button>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500 text-[11px]">👍</span>
        <input type="number" min="0" value={likesInput} onChange={e => setLikesInput(e.target.value)}
          className="w-20 bg-zinc-700 border border-zinc-600 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-red-500" />
        <button onClick={setLikes} className="text-[11px] bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg transition">Set</button>
      </div>
    </div>
  );
}

function VideoRow({ v, isLast, headers, onDelete, onSetViews }) {
  const [expanded, setExpanded] = useState(false);
  const [viewsInput, setViewsInput] = useState(String(v.views ?? 0));
  const [likesInput, setLikesInput] = useState(String(v.likes?.length ?? 0));
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  useEffect(() => { setViewsInput(String(v.views ?? 0)); }, [v.views]);

  const setLikes = async () => {
    try {
      await api.put(`/api/admin/videos/${v._id}/likes`, { likes: Number(likesInput) }, { headers });
    } catch {}
  };

  const loadComments = async () => {
    if (commentsLoaded) return;
    try {
      const { data } = await api.get(`/api/admin/videos/${v._id}/comments`, { headers });
      setComments(data);
      setCommentsLoaded(true);
    } catch {}
  };

  return (
    <div className={`${!isLast ? 'border-b border-zinc-800' : ''}`}>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition cursor-pointer" onClick={() => { setExpanded(p => !p); if (!expanded) loadComments(); }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {v.isShort && <span className="text-[10px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded-full">Short</span>}
            <p className="text-white text-sm truncate">{v.title}</p>
          </div>
          <p className="text-gray-400 text-xs">{v.uploader?.name} · {v.views} views · {v.likes?.length ?? 0} likes · <span className={v.visibility === 'public' ? 'text-green-400' : 'text-gray-500'}>{v.visibility}</span></p>
        </div>
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {expanded && (
        <div className="px-4 pb-4 bg-zinc-800/30 border-t border-zinc-800 flex flex-wrap gap-3 items-center pt-3">
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition">
            Delete
          </button>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-gray-400 text-xs">👁 Views:</span>
            <input type="number" min="0" value={viewsInput} onChange={e => setViewsInput(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="w-28 bg-zinc-700 border border-zinc-600 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500" />
            <button onClick={e => { e.stopPropagation(); onSetViews(Number(viewsInput)); }}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition">Set</button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-xs">👍 Likes:</span>
            <input type="number" min="0" value={likesInput} onChange={e => setLikesInput(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="w-28 bg-zinc-700 border border-zinc-600 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-red-500" />
            <button onClick={e => { e.stopPropagation(); setLikes(); }}
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition">Set</button>
          </div>
          {/* Comments */}
          {comments.length > 0 && (
            <div className="w-full mt-2 border-t border-zinc-700 pt-3 space-y-2">
              <p className="text-gray-400 text-xs font-medium">Comments ({comments.length})</p>
              {comments.map(c => (
                <CommentLikeItem key={c._id} c={c} headers={headers}
                  onUpdate={likes => setComments(prev => prev.map(x => x._id === c._id ? { ...x, likes: Array(likes) } : x))} />
              ))}
            </div>
          )}
          {commentsLoaded && comments.length === 0 && (
            <p className="w-full text-gray-600 text-xs mt-2">No comments yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function CommentLikeItem({ c, headers, onUpdate }) {
  const [input, setInput] = useState(String(c.likes?.length ?? 0));
  useEffect(() => { setInput(String(c.likes?.length ?? 0)); }, [c.likes]);
  const set = async () => {
    try {
      const { data } = await api.put(`/api/admin/comments/${c._id}/likes`, { likes: Number(input) }, { headers });
      onUpdate(data.likes);
    } catch {}
  };
  return (
    <div className="flex items-center gap-2 bg-zinc-700/40 rounded-lg px-3 py-2">
      <p className="text-gray-300 text-xs flex-1 truncate">"{c.text}" — <span className="text-gray-500">@{c.author?.username}</span></p>
      <span className="text-gray-500 text-[11px]">👍 {c.likes?.length ?? 0}</span>
      <input type="number" min="0" value={input} onChange={e => setInput(e.target.value)}
        className="w-16 bg-zinc-700 border border-zinc-600 text-white text-xs rounded px-2 py-0.5 focus:outline-none" />
      <button onClick={set} className="text-[11px] bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded transition">Set</button>
    </div>
  );
}
