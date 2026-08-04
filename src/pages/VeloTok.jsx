import { useState, useEffect, useRef } from 'react';
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

function VeloTokItem({ video, isActive, me, token, onNext, onPrev }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

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

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (v.duration) setProgress((v.currentTime / v.duration) * 100);
    };
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, []);

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
    <div className="relative w-full h-full flex bg-black">
      {/* Video */}
      <div className="relative flex-1 flex items-center justify-center bg-black cursor-pointer" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={mediaUrl(video.videoUrl)}
          className="h-full max-h-full object-contain"
          style={{ maxWidth: '100%' }}
          loop
          playsInline
          muted={muted}
        />

        {/* Pause overlay */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/40 rounded-full p-5">
              <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Mute indicator top-left */}
        <button
          className="absolute top-4 left-4 bg-black/50 rounded-full p-2 text-white z-10"
          onClick={e => { e.stopPropagation(); setMuted(m => !m); }}
        >
          {muted
            ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
            : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
          }
        </button>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-12 bg-gradient-to-t from-black/70 to-transparent z-10">
          <button
            className="flex items-center gap-2 mb-1"
            onClick={e => { e.stopPropagation(); navigate(`/c/${uploader.username}`); }}
          >
            <span className="text-white font-bold text-sm drop-shadow">@{uploader.username || uploader.name || 'unknown'}</span>
            {uploader.isVerified && <VerifiedBadge />}
            {uploader.isFounder && <FounderBadge />}
          </button>
          <p className="text-white text-sm drop-shadow line-clamp-2 mb-3">{video.title}</p>
          {/* Progress bar */}
          <div className="w-full h-0.5 bg-white/30 rounded-full">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex flex-col items-center justify-end gap-4 px-3 pb-8 w-16 flex-shrink-0">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <button onClick={() => navigate(`/c/${uploader.username}`)} className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-zinc-700">
              {uploader.avatar
                ? <img src={uploader.avatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">{(uploader.name || 'U')[0].toUpperCase()}</div>
              }
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/></svg>
            </div>
          </button>

          {/* Like */}
          <button onClick={handleLike} className="flex flex-col items-center gap-1 mt-2">
            <div className={`w-12 h-12 rounded-full bg-zinc-800/60 flex items-center justify-center ${liked ? 'text-red-500' : 'text-white'}`}>
              <svg className="w-7 h-7" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-white text-xs font-semibold">{fv(likeCount)}</span>
          </button>

          {/* Comments */}
          <button onClick={() => navigate(`/watch/${video._id}`)} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-zinc-800/60 flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-white text-xs font-semibold">{fv(video.comments || 0)}</span>
          </button>

          {/* Bookmark */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-zinc-800/60 flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <span className="text-white text-xs font-semibold">{fv(video.views || 0)}</span>
          </button>

          {/* Share */}
          <button
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/watch/${video._id}`).catch(() => {}); }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-800/60 flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <span className="text-white text-xs font-semibold">Share</span>
          </button>
        </div>
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
    api.get('/api/videos/shorts').then(r => {
      const list = Array.isArray(r.data) ? r.data : [];
      setVideos(list);
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

  const goNext = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ top: el.clientHeight, behavior: 'smooth' });
  };
  const goPrev = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ top: -el.clientHeight, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 bg-black flex" style={{ zIndex: 50 }}>
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-30 bg-gradient-to-b from-black/60 to-transparent">
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

      {/* Up/down nav arrows (right side, like TikTok desktop) */}
      <div className="absolute right-20 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30">
        <button onClick={goPrev} disabled={current === 0}
          className="w-10 h-10 rounded-full bg-zinc-800/70 flex items-center justify-center text-white disabled:opacity-30 hover:bg-zinc-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button onClick={goNext} disabled={current >= videos.length - 1}
          className="w-10 h-10 rounded-full bg-zinc-800/70 flex items-center justify-center text-white disabled:opacity-30 hover:bg-zinc-700 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Feed */}
      {videos.length === 0 ? (
        <div className="flex items-center justify-center w-full h-full flex-col gap-3">
          <svg className="w-16 h-16 text-zinc-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.15 8.15 0 004.77 1.52V6.82a4.85 4.85 0 01-1-.13z"/>
          </svg>
          <p className="text-zinc-500 text-lg">No shorts yet</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="w-full h-full overflow-y-scroll snap-y snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {videos.map((video, i) => (
            <div key={video._id} className="snap-start w-full flex-shrink-0" style={{ height: '100vh' }}>
              <VeloTokItem
                video={video}
                isActive={i === current}
                me={me}
                token={token}
                onNext={goNext}
                onPrev={goPrev}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
