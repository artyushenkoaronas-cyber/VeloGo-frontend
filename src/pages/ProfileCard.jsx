import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const STARS = Array.from({ length: 167 }, (_, i) => ({
  id: i,
  right: Math.random() * 101,
  top: Math.random() * 101,
  fixed: Math.random() > 0.4,
  size: Math.random() < 0.3 ? 2 : 1,
}));

function Stars() {
  return (
    <>
      {STARS.map(s => (
        <div key={s.id}
          style={{
            color: 'rgb(255,255,255)',
            position: s.fixed ? 'fixed' : 'absolute',
            transform: 'translateX(0deg) translateY(0deg)',
            verticalAlign: 'baseline',
            right: `${s.right}%`,
            top: 'auto',
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            backgroundColor: 'white',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
      ))}
    </>
  );
}

const SOCIAL_ICONS = {
  roblox: { label: 'Roblox', color: '#e74c3c', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M5.005 0L0 19.05 19.04 24 24 4.95zm9.37 13.36l-4.77-1.27 1.27-4.77 4.77 1.28z"/>
    </svg>
  )},
  youtube: { label: 'YouTube', color: '#FF0000', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/>
    </svg>
  )},
  tiktok: { label: 'TikTok', color: '#ffffff', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.6 3.3a4.5 4.5 0 01-2.8-1 4.5 4.5 0 01-1.5-3.3h-3.4v14.1a2.6 2.6 0 01-2.6 2.3 2.6 2.6 0 01-2.6-2.6 2.6 2.6 0 012.6-2.6c.3 0 .5 0 .8.1V6.9a6 6 0 00-.8-.1 6 6 0 00-6 6 6 6 0 006 6 6 6 0 006-6V8.8a7.8 7.8 0 004.6 1.5V6.9a4.5 4.5 0 01-1.3-.4 4.5 4.5 0 01-1-.5 4.6 4.6 0 01-1-.7h-.2"/>
    </svg>
  )},
  twitch: { label: 'Twitch', color: '#9146FF', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.6 6H13v4.5h-1.4zm3.8 0H17v4.5h-1.4zM2.1 0L0 5.1v16.5h5.6V24h3.2l2.4-2.4h3.6L21 16V0H2.1zm17.4 14.9l-2.8 2.8H12l-2.4 2.4v-2.4H5.2V1.6h14.3v13.3z"/>
    </svg>
  )},
  kick: { label: 'Kick', color: '#53FC18', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3 2h4v8l5-8h5l-6 10 6 10h-5l-5-8v8H3z"/>
    </svg>
  )},
  discord: { label: 'Discord', color: '#5865F2', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20.3 4a15.4 15.4 0 00-3.8-1.2l-.5.9a14.3 14.3 0 00-4 0l-.5-.9A15.4 15.4 0 007.7 4 16.3 16.3 0 004 19.5a15.5 15.5 0 004.7 2.4l1-1.3a10 10 0 01-1.5-.7l.3-.3a11 11 0 009.5 0l.3.3a10 10 0 01-1.5.7l1 1.3A15.5 15.5 0 0020 19.5 16.3 16.3 0 0020.3 4zM8.5 16.6c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z"/>
    </svg>
  )},
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
    const onEnd = () => setPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDur);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDur);
      audio.removeEventListener('ended', onEnd);
    };
  }, [user]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * duration;
  };

  const socialEntries = Object.entries(user?.socialLinks || {}).filter(([, v]) => v);

  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '';

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="text-center">
        <p className="text-xl font-bold mb-2">User not found</p>
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white">Go home</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <Stars />

      {/* Volume icon top left */}
      <button onClick={() => { setMuted(m => !m); if (audioRef.current) audioRef.current.muted = !muted; }}
        className="fixed top-4 left-4 text-white/60 hover:text-white transition z-10">
        {muted
          ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
          : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536A5 5 0 008 12a5 5 0 00.464 2.536M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
        }
      </button>

      {/* Animated link banner at top */}
      <div className="fixed top-0 left-0 right-0 z-20 overflow-hidden py-1.5 bg-black/30 backdrop-blur-sm border-b border-white/5">
        <div className="flex whitespace-nowrap" style={{ animation: 'marquee 18s linear infinite' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="text-white/40 text-xs font-mono mx-6">
              velo-go-frontend.vercel.app/u/{username}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div className="relative z-10 w-full max-w-md mx-auto px-4 flex flex-col gap-4 pt-8">
        {/* Profile card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 ring-2 ring-white/10">
              {user.avatar
                ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">{user.name?.[0]?.toUpperCase()}</div>}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-bold text-xl">{user.name}</h1>
                {user.isVerified && (
                  <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                )}
              </div>
              {user.bio && <p className="text-gray-400 text-sm mt-0.5">{user.bio}</p>}
              <p className="text-gray-600 text-xs mt-1">Joined on {joinDate}</p>
            </div>
          </div>
        </div>

        {/* Roblox-style profile widget */}
        {user.socialLinks?.roblox && (
          <a href={`https://www.roblox.com/users/search?keyword=${encodeURIComponent(user.socialLinks.roblox)}`}
            target="_blank" rel="noopener noreferrer"
            className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 hover:bg-white/10 transition">
            <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
              {user.avatar && <img src={user.avatar} className="w-full h-full object-cover" alt="" />}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{user.socialLinks.roblox}</p>
              <p className="text-gray-400 text-xs">{(user.subscribers || 0).toLocaleString()} Followers</p>
            </div>
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M5.005 0L0 19.05 19.04 24 24 4.95zm9.37 13.36l-4.77-1.27 1.27-4.77 4.77 1.28z"/></svg>
              Roblox
            </span>
          </a>
        )}

        {/* Social links */}
        {socialEntries.length > 0 && (
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-center gap-3 flex-wrap">
            {socialEntries.map(([platform, val]) => {
              const s = SOCIAL_ICONS[platform];
              if (!s) return null;
              const urls = {
                roblox: `https://www.roblox.com/users/search?keyword=${encodeURIComponent(val)}`,
                youtube: `https://youtube.com/@${val}`,
                tiktok: `https://tiktok.com/@${val}`,
                twitch: `https://twitch.tv/${val}`,
                kick: `https://kick.com/${val}`,
                discord: `https://discord.gg/${val}`,
              };
              return (
                <a key={platform} href={urls[platform]} target="_blank" rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition hover:scale-110"
                  style={{ backgroundColor: s.color + '22', color: s.color }}
                  title={s.label}>
                  {s.icon}
                </a>
              );
            })}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-gray-500 text-sm px-1">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            {(user.profileViews || 0).toLocaleString()}
          </span>
          {user.location && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              {user.location}
            </span>
          )}
        </div>

        {/* Music player */}
        {user.profileSong && (
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4">
            <audio ref={audioRef} src={user.profileSong} loop />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 3v10.55A4 4 0 107 17V7h8V3H9z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.profileSongName || 'Profile Song'}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-gray-500 text-xs w-8">{fmt(currentTime)}</span>
                  <div className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer" onClick={seek}>
                    <div className="h-full bg-white rounded-full transition-all"
                      style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-gray-500 text-xs w-8 text-right">{fmt(duration)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10); }}
                  className="text-gray-400 hover:text-white transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                <button onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black hover:bg-gray-200 transition">
                  {playing
                    ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    : <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                </button>
                <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 10); }}
                  className="text-gray-400 hover:text-white transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 6h-2v12h2V6zM6 18l8.5-6L6 6v12z"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VeloGo link */}
        <div className="text-center">
          <button onClick={() => navigate(`/c/${user.username}`)}
            className="text-gray-600 hover:text-gray-400 text-xs transition">
            View VeloGo channel →
          </button>
        </div>
      </div>
    </div>
  );
}
