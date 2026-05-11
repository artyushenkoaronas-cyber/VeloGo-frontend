import { mediaUrl } from '../utils/mediaUrl';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import VerifiedBadge from '../components/VerifiedBadge';
import OfficialArtistBadge from '../components/OfficialArtistBadge';
import UploadModal from '../components/UploadModal';

function fv(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n;
}

export default function Shorts() {
  const navigate = useNavigate();
  const [shorts, setShorts] = useState([]);
  const [current, setCurrent] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const containerRef = useRef(null);
  const token = localStorage.getItem('velogo_token');
  const me = (() => { try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; } })();

  useEffect(() => {
    api.get('/api/videos/shorts').then(r => setShorts(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / window.innerHeight);
      setCurrent(idx);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  if (shorts.length === 0) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center flex-col gap-4">
      <button onClick={() => navigate('/')} className="absolute top-4 left-4 text-white p-2 hover:bg-white/10 rounded-full transition">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <svg className="w-16 h-16 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
      </svg>
      <p className="text-white text-lg font-semibold">No Shorts yet</p>
      <p className="text-gray-500 text-sm">Be the first to upload a Short!</p>
      <button onClick={() => setUploadOpen(true)}
        className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-200 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Upload Short
      </button>
      {uploadOpen && (
        <UploadModal
          defaultShort={true}
          onClose={() => setUploadOpen(false)}
          onSuccess={() => {
            setUploadOpen(false);
            api.get('/api/videos/shorts').then(r => setShorts(r.data)).catch(() => {});
          }}
        />
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {/* Upload Short button */}
      <button
        onClick={() => setUploadOpen(true)}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2 rounded-full hover:bg-gray-200 transition shadow-lg"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Upload Short
      </button>

      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 text-white p-2 hover:bg-white/10 rounded-full transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {shorts.map((short, i) => (
        <ShortItem
          key={short._id}
          short={short}
          isActive={i === current}
          token={token}
          me={me}
          navigate={navigate}
        />
      ))}

      {uploadOpen && (
        <UploadModal
          defaultShort={true}
          onClose={() => setUploadOpen(false)}
          onSuccess={() => {
            setUploadOpen(false);
            api.get('/api/videos/shorts').then(r => setShorts(r.data)).catch(() => {});
          }}
        />
      )}
    </div>
  );
}

function ShortItem({ short, isActive, token, me, navigate }) {
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(short.likes?.includes(me.id));
  const [likes, setLikes] = useState(short.likes?.length || 0);
  const [loopCount, setLoopCount] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const headers = { Authorization: `Bearer ${token}` };

  const uploaderAvatar = short.uploader?.avatar
    ? mediaUrl(short.uploader.avatar)
    : null;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.play().catch(() => {});
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [isActive]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onEnded = () => {
      setLoopCount(p => p + 1);
      el.play().catch(() => {});
    };
    el.addEventListener('ended', onEnded);
    return () => el.removeEventListener('ended', onEnded);
  }, []);

  const handleLike = async () => {
    if (!token) return navigate('/login');
    try {
      const { data } = await api.post(`/api/videos/${short._id}/like`, {}, { headers });
      setLikes(data.likes);
      setLiked(data.liked);
    } catch {}
  };

  const loadComments = async () => {
    try {
      const { data } = await api.get(`/api/videos/${short._id}/comments`);
      setComments(data);
    } catch {}
  };

  const sendComment = async () => {
    if (!token) return navigate('/login');
    if (!commentText.trim()) return;
    try {
      const { data } = await api.post(`/api/videos/${short._id}/comments`, { text: commentText }, { headers });
      setComments(p => [data, ...p]);
      setCommentText('');
    } catch {}
  };

  const openComments = () => {
    loadComments();
    setShowComments(true);
  };

  return (
    <div
      className="relative flex items-center justify-center bg-black"
      style={{ height: '100vh', scrollSnapAlign: 'start' }}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={mediaUrl(short.videoUrl)}
        loop
        muted={muted}
        playsInline
        className="h-full max-w-[400px] w-full object-cover"
        style={{ maxHeight: '100vh' }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none max-w-[400px] mx-auto" />

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 max-w-[400px] mx-auto px-4 pb-6 z-10">
        {/* Channel info */}
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => navigate(short.uploader?.username ? `/@${short.uploader.username}` : `/@${short.uploader?._id}`)}>
            <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center overflow-hidden border-2 border-white">
              {uploaderAvatar
                ? <img src={uploaderAvatar} className="w-full h-full object-cover" />
                : <span className="text-white text-xs font-bold">{short.uploader?.name?.[0]?.toUpperCase()}</span>}
            </div>
          </button>
          <button
            onClick={() => navigate(short.uploader?.username ? `/@${short.uploader.username}` : `/@${short.uploader?._id}`)}
            className="flex items-center gap-1 hover:opacity-80 transition"
          >
            <span className="text-white text-sm font-semibold">@{short.uploader?.username || short.uploader?.name}</span>
            {short.uploader?.isOfficialArtist && <OfficialArtistBadge size={13} />}
            {short.uploader?.isVerified && <VerifiedBadge size={13} />}
          </button>
          <button className="ml-1 border border-white text-white text-xs font-medium px-3 py-0.5 rounded-full hover:bg-white/10 transition">
            Subscribe
          </button>
        </div>

        {/* Title */}
        <p className="text-white text-sm leading-snug mb-2">{short.title}</p>

        {/* Sound info */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <div className="overflow-hidden flex-1">
            <p className="text-white text-xs truncate">{short.sound || `Original sound - @${short.uploader?.username}`}</p>
          </div>
        </div>
      </div>

      {/* Right action buttons */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-10">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition ${liked ? 'bg-red-500' : 'bg-white/10 hover:bg-white/20'}`}>
            <svg className="w-6 h-6 text-white" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </div>
          <span className="text-white text-xs">{fv(likes)}</span>
        </button>

        {/* Comments */}
        <button onClick={openComments} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-white text-xs">{fv(short.commentsCount || 0)}</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <span className="text-white text-xs">Share</span>
        </button>

        {/* Loops */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <span className="text-white text-xs">{loopCount}</span>
        </button>

        {/* Mute */}
        <button onClick={() => setMuted(p => !p)} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
            {muted
              ? <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              : <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M9 9H5a2 2 0 00-2 2v2a2 2 0 002 2h4l5 5V4L9 9z" />
                </svg>
            }
          </div>
          <span className="text-white text-xs">{muted ? 'Unmute' : 'Mute'}</span>
        </button>
      </div>

      {/* Comments drawer */}
      {showComments && (
        <div className="absolute inset-0 z-20 flex items-end justify-center max-w-[400px] mx-auto">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowComments(false)} />
          <div className="relative bg-zinc-900 rounded-t-2xl w-full max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <p className="text-white font-semibold text-sm">{comments.length} Comments</p>
              <button onClick={() => setShowComments(false)} className="text-gray-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
              {comments.map(c => (
                <div key={c._id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {c.author?.avatar
                      ? <img src={mediaUrl(c.author.avatar)} className="w-full h-full object-cover" />
                      : <span className="text-white text-xs font-bold">{c.author?.name?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">@{c.author?.username || c.author?.name}</p>
                    <p className="text-gray-300 text-sm mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-zinc-800 flex gap-2">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendComment()}
                placeholder="Add a comment..."
                className="flex-1 bg-zinc-800 text-white text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              />
              <button
                onClick={sendComment}
                disabled={!commentText.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-full transition"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
