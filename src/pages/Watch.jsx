import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import VerifiedBadge from '../components/VerifiedBadge';
import CommentsSection from '../components/CommentsSection';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)} days ago`;
  if (s < 31536000) return `${Math.floor(s / 2592000)} months ago`;
  return `${Math.floor(s / 31536000)} years ago`;
}
function fv(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n;
}

export default function Watch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [descOpen, setDescOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', visibility: 'public' });
  const [editSaving, setEditSaving] = useState(false);
  const token = localStorage.getItem('velogo_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const me = JSON.parse(localStorage.getItem('velogo_user') || '{}');

  useEffect(() => {
    loadVideo();
    loadRecommended();
    const viewed = sessionStorage.getItem(`viewed_${id}`);
    if (!viewed) {
      axios.post(`/api/videos/${id}/view`).catch(() => {});
      sessionStorage.setItem(`viewed_${id}`, '1');
    }
  }, [id]);

  const loadVideo = async () => {
    try {
      const { data } = await axios.get(`/api/videos/${id}`);
      setVideo(data);
      setLikes(data.likes.length);
      setSubCount(data.uploader?.subscribers || 0);
      setLiked(data.likes.includes(me.id));
      setDisliked(data.dislikes.includes(me.id));
      setEditForm({ title: data.title, description: data.description || '', visibility: data.visibility });
      if (me.id && token) {
        try {
          const meRes = await axios.get('/api/auth/me', { headers });
          setSubscribed(meRes.data.subscribedTo?.includes(data.uploader?._id));
        } catch {}
      }
    } catch { navigate('/'); }
  };

  const loadRecommended = async () => {
    try {
      const { data } = await axios.get('/api/videos');
      setRecommended(data.filter(v => v._id !== id).slice(0, 20));
    } catch {}
  };

  const handleLike = async () => {
    if (!token) return navigate('/login');
    try {
      const { data } = await axios.post(`/api/videos/${id}/like`, {}, { headers });
      setLikes(data.likes);
      setLiked(data.liked);
      if (data.liked) setDisliked(false);
    } catch {}
  };

  const handleDislike = async () => {
    if (!token) return navigate('/login');
    try {
      const { data } = await axios.post(`/api/videos/${id}/dislike`, {}, { headers });
      setDisliked(data.disliked);
      if (data.disliked) setLiked(false);
    } catch {}
  };

  const handleSubscribe = async () => {
    if (!token) return navigate('/login');
    try {
      const { data } = await axios.post(`/api/users/${video.uploader._id}/subscribe`, {}, { headers });
      setSubscribed(data.subscribed);
      setSubCount(data.subscribers);
    } catch {}
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      const { data } = await axios.put(`/api/videos/${id}`, editForm, { headers });
      setVideo(prev => ({ ...prev, title: data.title, description: data.description, visibility: data.visibility }));
      setEditOpen(false);
    } catch {}
    setEditSaving(false);
  };

  if (!video) return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar onMenuToggle={() => {}} />
      <div className="pt-14 flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const isOwner = me.id === video.uploader?._id;
  const isSelf = isOwner;

  const goChannel = (uploader) => {
    if (!uploader) return;
    navigate(uploader.username ? `/@${uploader.username}` : `/@${uploader._id}`);
  };

  const videoSrc = `http://localhost:5000${video.videoUrl}`;
  const uploaderAvatar = video.uploader?.avatar
    ? (video.uploader.avatar.startsWith('http') ? video.uploader.avatar : `http://localhost:5000${video.uploader.avatar}`)
    : null;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar onMenuToggle={() => {}} />

      <div className="pt-14 flex gap-6 max-w-[1600px] mx-auto px-4 py-4">
        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Video player */}
          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-4">
            <video src={videoSrc} controls autoPlay className="w-full h-full" />
          </div>

          {/* Title + edit */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-white text-xl font-semibold">{video.title}</h1>
            {isOwner && (
              <button onClick={() => setEditOpen(p => !p)}
                className="flex-shrink-0 flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-full transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          {/* Edit panel */}
          {editOpen && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-4 space-y-3">
              <input
                value={editForm.title}
                onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Title"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition"
              />
              <textarea
                value={editForm.description}
                onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Description"
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 transition resize-none"
              />
              <select
                value={editForm.visibility}
                onChange={e => setEditForm(p => ({ ...p, visibility: e.target.value }))}
                className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
              </select>
              <div className="flex gap-2">
                <button onClick={handleEditSave} disabled={editSaving}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded-full transition disabled:opacity-50">
                  {editSaving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditOpen(false)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-4 py-1.5 rounded-full transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Channel + actions */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
                onClick={() => goChannel(video.uploader)}
              >
                {uploaderAvatar
                  ? <img src={uploaderAvatar} alt={video.uploader?.name} className="w-full h-full object-cover" />
                  : <span className="text-white text-sm font-bold">{video.uploader?.name?.[0]?.toUpperCase()}</span>}
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button onClick={() => goChannel(video.uploader)}
                    className="flex items-center gap-1 hover:opacity-80 transition">
                    <p className="text-white text-sm font-medium">{video.uploader?.name}</p>
                    {video.uploader?.isVerified && <VerifiedBadge size={16} />}
                  </button>
                  {video.collaborators?.length > 0 && (
                    <span className="text-gray-400 text-sm">
                      and{' '}
                      {video.collaborators.map((c, i) => (
                        <span key={c._id}>
                          <button onClick={() => navigate(c.username ? `/@${c.username}` : `/@${c._id}`)}
                            className="text-white font-medium hover:opacity-80 transition">
                            {c.name}
                          </button>
                          {i < video.collaborators.length - 1 && ', '}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs">{fv(subCount)} subscribers</p>
              </div>
              {!isSelf && (
                <button onClick={handleSubscribe}
                  className={`ml-2 text-sm font-semibold px-5 py-2 rounded-full transition ${subscribed ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-white text-black hover:bg-gray-200'}`}>
                  {subscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              )}
            </div>

            {/* Like / Dislike / Share / Save */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-full overflow-hidden bg-zinc-800">
                <button onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 text-sm transition hover:bg-zinc-700 ${liked ? 'text-blue-400' : 'text-white'}`}>
                  <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  {fv(likes)}
                </button>
                <div className="w-px bg-zinc-700" />
                <button onClick={handleDislike}
                  className={`px-4 py-2 transition hover:bg-zinc-700 ${disliked ? 'text-blue-400' : 'text-white'}`}>
                  <svg className="w-5 h-5" fill={disliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                  </svg>
                </button>
              </div>
              <button className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-full transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              <button className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-full transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Save
              </button>
            </div>
          </div>

          {/* Collaborators panel */}
          {video.collaborators?.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
              <p className="text-white text-sm font-semibold mb-3">Collaborators</p>
              <div className="space-y-3">
                {video.collaborators.map(c => (
                  <CollaboratorCard key={c._id} collab={c} token={token} headers={headers} navigate={navigate} me={me} />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-zinc-800 rounded-xl p-4 mb-4 cursor-pointer" onClick={() => setDescOpen(p => !p)}>
            <p className="text-white text-sm font-medium mb-1">
              {fv(video.views)} views · {timeAgo(video.createdAt)}
            </p>
            <p className={`text-gray-300 text-sm whitespace-pre-line ${descOpen ? '' : 'line-clamp-2'}`}>
              {video.description || 'No description.'}
            </p>
            <button className="text-white text-sm font-medium mt-1">{descOpen ? 'Show less' : '...more'}</button>
          </div>

          <CommentsSection
            videoId={id}
            uploaderId={video.uploader?._id}
            pinnedCommentId={video.pinnedComment}
            uploaderAvatar={uploaderAvatar}
          />
        </div>

        {/* Recommended sidebar */}
        <aside className="w-96 flex-shrink-0 hidden lg:block">
          <div className="space-y-3">
            {recommended.map(v => <RecommendedCard key={v._id} video={v} />)}
          </div>
        </aside>
      </div>
    </div>
  );
}

function CollaboratorCard({ collab: c, token, headers, navigate, me }) {
  const [subscribed, setSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(c.subscribers || 0);
  const isSelf = me.id === c._id;

  useEffect(() => {
    if (!token || isSelf) return;
    axios.get('/api/auth/me', { headers }).then(r => {
      setSubscribed(r.data.subscribedTo?.includes(c._id));
    }).catch(() => {});
  }, [c._id]);

  const handleSubscribe = async () => {
    if (!token) return navigate('/login');
    try {
      const { data } = await axios.post(`/api/users/${c._id}/subscribe`, {}, { headers });
      setSubscribed(data.subscribed);
      setSubCount(data.subscribers);
    } catch {}
  };

  const avatar = c.avatar ? (c.avatar.startsWith('http') ? c.avatar : `http://localhost:5000${c.avatar}`) : null;

  return (
    <div className="flex items-center gap-3">
      <button onClick={() => navigate(c.username ? `/@${c.username}` : `/@${c._id}`)}
        className="w-10 h-10 rounded-full bg-red-600 flex-shrink-0 flex items-center justify-center overflow-hidden hover:opacity-90 transition">
        {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <span className="text-white text-sm font-bold">{c.name?.[0]?.toUpperCase()}</span>}
      </button>
      <div className="flex-1 min-w-0">
        <button onClick={() => navigate(c.username ? `/@${c.username}` : `/@${c._id}`)}
          className="flex items-center gap-1 hover:opacity-80 transition">
          <span className="text-white text-sm font-medium">{c.name}</span>
          {c.isVerified && <VerifiedBadge size={14} />}
        </button>
        <p className="text-gray-400 text-xs">@{c.username || c._id} · {fv(subCount)} subscribers</p>
      </div>
      {!isSelf && (
        <button onClick={handleSubscribe}
          className={`text-sm font-semibold px-5 py-2 rounded-full transition flex-shrink-0 ${subscribed ? 'bg-zinc-700 text-white hover:bg-zinc-600' : 'bg-white text-black hover:bg-gray-200'}`}>
          {subscribed ? 'Subscribed' : 'Subscribe'}
        </button>
      )}
    </div>
  );
}

function RecommendedCard({ video }) {
  const navigate = useNavigate();
  const thumb = video.thumbnail ? `http://localhost:5000${video.thumbnail}` : null;
  const avatar = video.uploader?.avatar
    ? (video.uploader.avatar.startsWith('http') ? video.uploader.avatar : `http://localhost:5000${video.uploader.avatar}`)
    : null;

  function fv(n) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n;
  }
  function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
    if (s < 2592000) return `${Math.floor(s / 86400)} days ago`;
    return `${Math.floor(s / 2592000)} months ago`;
  }

  return (
    <div className="flex gap-2 cursor-pointer group" onClick={() => navigate(`/watch/${video._id}`)}>
      <div className="w-40 h-24 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden">
        {thumb
          ? <img src={thumb} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
          : <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium line-clamp-2 leading-snug mb-1">{video.title}</p>
        <div className="flex items-center gap-1">
          <p className="text-gray-400 text-xs">{video.uploader?.name}</p>
          {video.uploader?.isVerified && <VerifiedBadge size={12} />}
        </div>
        <p className="text-gray-400 text-xs">{fv(video.views)} views · {timeAgo(video.createdAt)}</p>
      </div>
    </div>
  );
}
