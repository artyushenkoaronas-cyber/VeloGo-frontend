import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const STARS = Array.from({ length: 167 }, (_, i) => ({
  id: i,
  right: Math.random() * 100,
  top: Math.random() * 100,
  fixed: Math.random() > 0.4,
}));

const SOCIAL_URLS = {
  roblox: v => `https://www.roblox.com/users/search?keyword=${encodeURIComponent(v)}`,
  youtube: v => `https://youtube.com/@${v}`,
  tiktok: v => `https://tiktok.com/@${v}`,
  twitch: v => `https://twitch.tv/${v}`,
  kick: v => `https://kick.com/${v}`,
  discord: v => `https://discord.gg/${v}`,
};

const SOCIAL_ICONS = {
  roblox: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M5.005 0L0 19.05 19.04 24 24 4.95zm9.37 13.36l-4.77-1.27 1.27-4.77 4.77 1.28z"/></svg>,
  youtube: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>,
  tiktok: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.15 8.15 0 004.77 1.52V6.82a4.85 4.85 0 01-1-.13z"/></svg>,
  twitch: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.6 6H13v4.5h-1.4zm3.8 0H17v4.5h-1.4zM2.1 0L0 5.1v16.5h5.6V24h3.2l2.4-2.4h3.6L21 16V0H2.1zm17.4 14.9l-2.8 2.8H12l-2.4 2.4v-2.4H5.2V1.6h14.3v13.3z"/></svg>,
  kick: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 2h4v8l5-8h5l-6 10 6 10h-5l-5-8v8H3z"/></svg>,
  discord: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.3 4a15.4 15.4 0 00-3.8-1.2l-.5.9a14.3 14.3 0 00-4 0l-.5-.9A15.4 15.4 0 007.7 4 16.3 16.3 0 004 19.5a15.5 15.5 0 004.7 2.4l1-1.3a10 10 0 01-1.5-.7l.3-.3a11 11 0 009.5 0l.3.3a10 10 0 01-1.5.7l1 1.3A15.5 15.5 0 0020 19.5 16.3 16.3 0 0020.3 4zM8.5 16.6c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z"/></svg>,
};

export default function ProfileCard() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    api.get(`/api/users/${username}`)
      .then(r => {
        setUser(r.data);
        api.post(`/api/users/${r.data._id}/view`).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => setDuration(audio.duration);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDur);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDur);
    };
  }, [user]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const fmt = s => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const seek = e => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const socials = Object.entries(user?.socialLinks || {}).filter(([, v]) => v);
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '';

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" /></div>;

  if (!user) return <div className="min-h-screen bg-black flex items-center justify-center text-white/40 text-sm">Not found</div>;

  const linkText = `velo-go-frontend.vercel.app/u/${username}`;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col items-center justify-center">
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
      `}</style>

      {/* Star particles */}
      {STARS.map(s => (
        <div key={s.id} style={{
          position: s.fixed ? 'fixed' : 'absolute',
          right: `${s.right}%`,
          top: `${s.top}%`,
          width: 2, height: 2,
          borderRadius: '50%',
          backgroundColor: 'white',
          opacity: 0.6,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Marquee top */}
      <div className="fixed top-0 left-0 right-0 z-30 overflow-hidden" style={{ height: 20 }}>
        <div className="flex whitespace-nowrap" style={{ animation: 'marquee 20s linear infinite' }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'monospace', marginLeft: 32 }}>
              {linkText}
            </span>
          ))}
        </div>
      </div>

      {/* Volume button */}
      <button onClick={() => { setMuted(m => !m); if (audioRef.current) audioRef.current.muted = !muted; }}
        className="fixed top-5 left-4 z-30 text-white/50 hover:text-white transition">
        {muted
          ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
          : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536A5 5 0 008 12m-2.464 2.536A5 5 0 015.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5"/></svg>
        }
      </button>

      {/* Main content — floating, no card borders */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-6 flex flex-col items-center gap-5 pt-6">

        {/* Avatar + name + bio */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '20px 24px', width: '100%' }}>
          <div className="flex items-center gap-4">
            <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#333' }}>
              {user.avatar
                ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 22, fontWeight: 700 }}>{user.name?.[0]?.toUpperCase()}</div>}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>{user.name}</span>
                {user.isVerified && <svg style={{ width: 18, height: 18, color: '#60a5fa' }} viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>}
              </div>
              {user.bio && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 2 }}>{user.bio}</p>}
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 4 }}>Joined on {joinDate}</p>
            </div>
          </div>
        </div>

        {/* Social icons */}
        {socials.length > 0 && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {socials.map(([platform, val]) => (
              <a key={platform} href={SOCIAL_URLS[platform]?.(val)} target="_blank" rel="noopener noreferrer"
                style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                {SOCIAL_ICONS[platform]}
              </a>
            ))}
          </div>
        )}

        {/* Views + location */}
        <div style={{ display: 'flex', gap: 20, color: 'rgba(255,255,255,0.35)', fontSize: 13, alignSelf: 'flex-start' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            {(user.profileViews || 0).toLocaleString()}
          </span>
          {user.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {user.location}
            </span>
          )}
        </div>

        {/* Music player */}
        {user.profileSong && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '14px 16px', width: '100%' }}>
            <audio ref={audioRef} src={user.profileSong} loop />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.5)' }} fill="currentColor" viewBox="0 0 24 24"><path d="M9 3v10.55A4 4 0 107 17V7h8V3H9z"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.profileSongName || 'Profile Song'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, width: 28 }}>{fmt(currentTime)}</span>
                  <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, cursor: 'pointer' }} onClick={seek}>
                    <div style={{ height: '100%', background: 'white', borderRadius: 2, width: duration ? `${(currentTime / duration) * 100}%` : '0%', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, width: 28, textAlign: 'right' }}>{fmt(duration)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10); }} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <svg style={{ width: 18, height: 18 }} fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                <button onClick={togglePlay} style={{ width: 34, height: 34, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {playing
                    ? <svg style={{ width: 14, height: 14 }} fill="black" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    : <svg style={{ width: 14, height: 14, marginLeft: 2 }} fill="black" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                </button>
                <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 10); }} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <svg style={{ width: 18, height: 18 }} fill="currentColor" viewBox="0 0 24 24"><path d="M18 6h-2v12h2V6zM6 18l8.5-6L6 6v12z"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <button onClick={() => navigate(`/c/${user.username}`)}
          style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
          View VeloGo channel →
        </button>
      </div>
    </div>
  );
}
