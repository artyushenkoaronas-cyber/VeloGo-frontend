import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { mediaUrl } from '../utils/mediaUrl';
import VerifiedBadge from '../components/VerifiedBadge';
import FounderBadge from '../components/FounderBadge';

function fv(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function VeloTokItem({ video, isActive, me, token }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!video) return;
    const myId = me?.id || me?._id;
    setLiked(myId ? (video.likes || []).includes(myId) : false);
    setLikeCount((video.likes || []).length);
  }, [video, me]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.currentTime = 0;
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
    }
  }, [isActive]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const handleLike = async () => {
    if (!token) { navigate('/login'); return; }
    try {
      const r = await api.post(`/api/videos/${video._id}/like`);
      setLiked(r.data.liked);
      setLikeCount(r.data.likes);
    } catch {}
  };

  if (!video) return null;
  const uploader = video.uploader || {};

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <video
        ref={videoRef}
        src={mediaUrl(video.videoUrl)}
        className="absolute inset-0 w-full h-full object-contain"
        loop
        playsInline
        muted={muted}
        onClick={togglePlay}
      />

      {/* Pause indicator */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 rounded-full p-5">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Right actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10">
        {/* Avatar */}
        <button onClick={() => navigate(`/c/${uploader.username}`)} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-zinc-700">
            {uploader.avatar
              ? <img src={uploader.avatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">{(uploader.name || 'U')[0].toUpperCase()}</div>
            }
          </div>
        </button>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className={`w-12 h-12 rounded-full bg-black/40 flex items-center justify-center ${liked ? 'text-red-500' : 'text-white'}`}>
            <svg className="w-7 h-7" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">{fv(likeCount)}</span>
        </button>

        {/* Comments */}
        <button onClick={() => navigate(`/watch/${video._id}`)} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-white">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">{fv(video.views || 0)}</span>
        </button>

        {/* Mute */}
        <button onClick={() => setMuted(m => !m)} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-white">
            {muted
              ? <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              : <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            }
          </div>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-6 left-3 right-20 z-10">
        <button onClick={() => navigate(`/c/${uploader.username}`)} className="flex items-center gap-2 mb-2">
          <span className="text-white font-bold text-sm drop-shadow">{uploader.name || uploader.username || 'Unknown'}</span>
          {uploader.isVerified && <VerifiedBadge />}
          {uploader.isFounder && <FounderBadge />}
        </button>
        <p className="text-white text-sm drop-shadow line-clamp-2">{video.title}</p>
      </div>
    </div>
  );
}

export default function VeloTok() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [current, setCurrent] = useState(0);
  const containerRef = useRef(null);
  const token = localStorage.getItem('velogo_token');
  const me = (() => { try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; } })();

  useEffect(() => {
    api.get('/api/videos?limit=50').then(r => {
      const list = Array.isArray(r.data) ? r.data : (r.data.videos || []);
      // Shuffle for variety
      const shuffled = [...list].sort(() => Math.random() - 0.5);
      setVideos(shuffled);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setCurrent(idx);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [videos.length]);

  return (
    <div className="fixed inset-0 bg-black" style={{ zIndex: 50 }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-20">
        <button onClick={() => navigate(-1)} className="text-white p-2 hover:bg-white/10 rounded-full transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.15 8.15 0 004.77 1.52V6.82a4.85 4.85 0 01-1-.13z"/>
          </svg>
          <span className="text-white font-bold text-lg">VeloTok</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Feed */}
      {videos.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-zinc-500 text-lg">No videos yet</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {videos.map((video, i) => (
            <div key={video._id} className="snap-start w-full flex-shrink-0" style={{ height: '100vh' }}>
              <VeloTokItem
                video={video}
                isActive={i === current}
                me={me}
                token={token}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
