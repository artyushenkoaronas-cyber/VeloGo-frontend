import { mediaUrl } from '../utils/mediaUrl';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import UploadModal from './UploadModal';
import VerifiedBadge from './VerifiedBadge';
import OfficialArtistBadge from './OfficialArtistBadge';
import { useLang } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onMenuToggle, onUpload }) {
  const navigate = useNavigate();
  const { lang, switchLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const user = (() => { try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; } })();
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadShort, setUploadShort] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef(null);
  const createRef = useRef(null);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const searchTimer = useRef(null);
  const token = localStorage.getItem('velogo_token');
  const notifHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (createRef.current && !createRef.current.contains(e.target)) setCreateOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const { data } = await api.get('/api/notifications', { headers: notifHeaders });
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch {}
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const openNotifications = async () => {
    setNotifOpen(p => !p);
    if (unreadCount > 0) {
      try {
        await api.put('/api/notifications/read', {}, { headers: notifHeaders });
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch {}
    }
  };

  const respondToCollab = async (notifId, action) => {
    try {
      await api.put(`/api/notifications/${notifId}/respond`, { action }, { headers: notifHeaders });
      setNotifications(prev => prev.filter(n => n._id !== notifId));
    } catch {}
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimer.current);
    if (val.trim().length < 1) { setSuggestions([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/api/videos', { params: { search: val } });
        const videoSugg = data.slice(0, 5).map(v => ({ type: 'video', text: v.title, id: v._id }));
        const channelMap = {};
        data.forEach(v => {
          if (v.uploader?.name && !channelMap[v.uploader._id]) channelMap[v.uploader._id] = { type: 'channel', text: v.uploader.name, username: v.uploader.username };
        });
        const channelSugg = Object.values(channelMap).slice(0, 3);
        setSuggestions([...videoSugg, ...channelSugg]);
      } catch { setSuggestions([]); }
    }, 300);
  };

  const handleSearchSubmit = (q) => {
    const query = q || search;
    if (!query.trim()) return;
    setSuggestions([]);
    setSearchFocused(false);
    navigate(`/?search=${encodeURIComponent(query.trim())}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('velogo_token');
    localStorage.removeItem('velogo_user');
    localStorage.removeItem('velogo_saved_accounts');
    navigate('/login');
  };

  const initial = user?.name?.[0]?.toUpperCase() || 'V';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f] flex items-center justify-between px-4 h-14">
        {/* Left */}
        <div className="flex items-center gap-4 min-w-[160px]">
          <button onClick={onMenuToggle} className="p-2 rounded-full hover:bg-zinc-800 transition">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-xl font-bold text-white cursor-pointer select-none" onClick={() => navigate('/')}>
            Velo<span className="text-red-500">Go</span>
          </span>
        </div>

        {/* Center - Search */}
        <div className="flex items-center gap-2 flex-1 max-w-2xl mx-4 relative" ref={searchRef}>
          <div className={`flex flex-1 rounded-full overflow-visible border transition ${searchFocused ? 'border-blue-500' : 'border-zinc-700'} relative`}>
            <div className="flex flex-1 rounded-l-full overflow-hidden bg-[#121212]">
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
                placeholder="Search"
                className="flex-1 bg-transparent text-white px-5 py-2 text-sm focus:outline-none"
              />
            </div>
            <button onClick={() => handleSearchSubmit()} className="bg-zinc-800 hover:bg-zinc-700 px-5 border-l border-zinc-700 transition rounded-r-full">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </button>
          </div>

          {/* Suggestions dropdown */}
          {searchFocused && suggestions.length > 0 && (
            <div className="absolute top-11 left-0 right-10 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 overflow-hidden py-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => {
                  if (s.type === 'channel' && s.username) { navigate(`/c/${s.username}`); setSearchFocused(false); }
                  else { handleSearchSubmit(s.text); }
                }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-zinc-800 transition text-left">
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {s.type === 'channel'
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />}
                  </svg>
                  <span className="text-white text-sm truncate">{s.text}</span>
                  {s.type === 'channel' && <span className="text-gray-500 text-xs ml-auto flex-shrink-0">Channel</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 min-w-[160px] justify-end">
          {/* Create button */}
          <div className="relative" ref={createRef}>
            <button
              onClick={() => setCreateOpen(p => !p)}
              className="flex items-center gap-2 hover:bg-zinc-800 text-white text-sm px-4 py-2 rounded-full transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create
            </button>
            {createOpen && (
              <div className="absolute right-0 top-11 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl w-48 py-2 z-50">
                <button onClick={() => { setCreateOpen(false); setUploadShort(false); setUploadOpen(true); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white hover:bg-zinc-800 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload video
                </button>
                <button onClick={() => { setCreateOpen(false); setUploadShort(true); setUploadOpen(true); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white hover:bg-zinc-800 transition">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.56-3.22 1.6-5.06s-3.22-2.56-5.06-1.6L6 6.94c-1.29.68-2.07 2.01-2 3.44.07 1.29.75 2.43 1.79 3.06L7 14l-1.2.5C3.96 15.46 3.24 17.72 4.2 19.56c.96 1.84 3.22 2.56 5.06 1.6l8.54-4.54c1.29-.68 2.07-2.01 2-3.44-.07-1.29-.75-2.43-1.79-3.06zm-7.65 4.06l-.97.52.04-5.2.93.48 4.58 2.44-4.58 1.76z"/>
                  </svg>
                  Upload Short
                </button>
                <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white hover:bg-zinc-800 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                  </svg>
                  Go live
                </button>
                <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white hover:bg-zinc-800 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Create post
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={openNotifications} className="relative p-2 rounded-full hover:bg-zinc-800 transition">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <p className="text-white font-semibold text-sm">Notifications</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <p className="text-gray-500 text-sm">No notifications</p>
                    </div>
                  ) : notifications.map(n => {
                    const fromAvatar = n.from?.avatar ? mediaUrl(n.from.avatar) : null;
                    const thumb = n.video?.thumbnail ? mediaUrl(n.video.thumbnail) : null;
                    return (
                      <div key={n._id} className={`px-4 py-3 border-b border-zinc-800 last:border-0 ${!n.read ? 'bg-blue-600/5' : ''}`}>
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-full bg-red-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {fromAvatar ? <img src={fromAvatar} className="w-full h-full object-cover" /> : <span className="text-white text-xs font-bold">{n.from?.name?.[0]?.toUpperCase()}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs leading-snug">
                              {n.type === 'collab_request' && <><span className="font-semibold">@{n.from?.username || n.from?.name}</span> invited you to collaborate on <span className="font-semibold">"{n.video?.title}"</span></>}
                              {n.type === 'collab_accepted' && <><span className="font-semibold">@{n.from?.username || n.from?.name}</span> accepted your collaboration on <span className="font-semibold">"{n.video?.title}"</span></>}
                              {n.type === 'collab_declined' && <><span className="font-semibold">@{n.from?.username || n.from?.name}</span> declined your collaboration on <span className="font-semibold">"{n.video?.title}"</span></>}
                              {n.type === 'new_subscriber' && <><span className="font-semibold">@{n.from?.username || n.from?.name}</span> subscribed to your channel 🔔</>}
                            </p>
                            {n.type === 'collab_request' && (
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => respondToCollab(n._id, 'accept')} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-full transition">Accept</button>
                                <button onClick={() => respondToCollab(n._id, 'decline')} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-3 py-1 rounded-full transition">Decline</button>
                              </div>
                            )}
                          </div>
                          {thumb && <img src={thumb} className="w-12 h-8 rounded object-cover flex-shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(p => !p)}
              className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm hover:ring-2 hover:ring-white transition"
            >
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                : initial}
            </button>

            {profileOpen && (
              <ProfileMenu
                user={user} initial={initial} navigate={navigate}
                onClose={() => setProfileOpen(false)}
                onLogout={handleLogout} lang={lang} switchLang={switchLang} t={t}
                theme={theme} toggleTheme={toggleTheme}
              />
            )}
          </div>
        </div>
      </header>

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onSuccess={onUpload} defaultShort={uploadShort} />}
    </>
  );
}

function MenuItem({ icon, label, arrow, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white hover:bg-zinc-800 transition text-left">
      <span className="text-gray-300 w-5 h-5 flex items-center justify-center flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {arrow && <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
    </button>
  );
}

function ProfileMenu({ user, initial, navigate, onClose, onLogout, lang, switchLang, t, theme, toggleTheme }) {
  const [panel, setPanel] = useState('main'); // main | switch | language

  const avatarSrc = user?.avatar
    ? mediaUrl(user.avatar)
    : null;

  const go = (path) => { onClose(); navigate(path); };

  if (panel === 'switch') {
    const savedAccounts = (() => { try { return JSON.parse(localStorage.getItem('velogo_saved_accounts') || '[]'); } catch { return []; } })();

    const switchToAccount = (acc) => {
      // Save current account back into saved list
      const currentToken = localStorage.getItem('velogo_token');
      const currentUser = (() => { try { return JSON.parse(localStorage.getItem('velogo_user') || 'null'); } catch { return null; } })();
      const updated = savedAccounts.filter(a => a.user?.id !== acc.user?.id);
      if (currentToken && currentUser?.id) updated.push({ token: currentToken, user: currentUser });
      localStorage.setItem('velogo_saved_accounts', JSON.stringify(updated));
      localStorage.setItem('velogo_token', acc.token);
      localStorage.setItem('velogo_user', JSON.stringify(acc.user));
      onClose();
      window.location.href = '/';
    };

    const addAccount = () => {
      // Save current session to saved accounts, then go to login
      const currentToken = localStorage.getItem('velogo_token');
      const currentUser = (() => { try { return JSON.parse(localStorage.getItem('velogo_user') || 'null'); } catch { return null; } })();
      if (currentToken && currentUser?.id) {
        const already = savedAccounts.some(a => a.user?.id === currentUser.id);
        if (!already) {
          savedAccounts.push({ token: currentToken, user: currentUser });
          localStorage.setItem('velogo_saved_accounts', JSON.stringify(savedAccounts));
        }
      }
      onClose();
      navigate('/login');
    };

    return (
      <div className="absolute right-0 top-11 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-80 z-50 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-700">
          <button onClick={() => setPanel('main')} className="text-white hover:text-gray-300 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <p className="text-white font-medium text-sm">{t('accounts')}</p>
        </div>

        <div className="py-2 border-b border-zinc-700">
          {/* Active account */}
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800/50 rounded-xl mx-2">
            <div className="w-10 h-10 rounded-full bg-red-600 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-sm">{initial}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                {user?.isOfficialArtist && <OfficialArtistBadge size={13} />}
                {user?.isVerified && <VerifiedBadge size={13} full />}
              </div>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>

          {/* Saved accounts */}
          {savedAccounts.map((acc, i) => {
            const src = acc.user?.avatar ? (acc.user.avatar.startsWith('http') ? acc.user.avatar : null) : null;
            const init = acc.user?.name?.[0]?.toUpperCase() || '?';
            return (
              <button key={i} onClick={() => switchToAccount(acc)}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-zinc-800 transition rounded-xl mx-0">
                <div className="w-10 h-10 rounded-full bg-red-600 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {src ? <img src={src} className="w-full h-full object-cover" /> : <span className="text-white font-bold text-sm">{init}</span>}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1">
                    <p className="text-white text-sm font-medium truncate">{acc.user?.name}</p>
                    {acc.user?.isOfficialArtist && <OfficialArtistBadge size={13} />}
                    {acc.user?.isVerified && <VerifiedBadge size={13} full />}
                  </div>
                  <p className="text-gray-400 text-xs truncate">{acc.user?.email}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="py-2">
          <button onClick={addAccount}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white hover:bg-zinc-800 transition">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            {t('addAccount')}
          </button>
          <button onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-white hover:bg-zinc-800 transition">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {t('signOut')}
          </button>
        </div>
      </div>
    );
  }

  if (panel === 'language') return (
    <div className="absolute right-0 top-11 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-72 z-50 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-700">
        <button onClick={() => setPanel('main')} className="text-white hover:text-gray-300 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <p className="text-white font-medium text-sm">{t('language')}</p>
      </div>
      <div className="py-2">
        {[{ code: 'en', label: 'English' }, { code: 'lt', label: 'Lietuvių' }].map(l => (
          <button key={l.code} onClick={() => { switchLang(l.code); setPanel('main'); }}
            className="flex items-center justify-between w-full px-4 py-3 hover:bg-zinc-800 transition">
            <span className="text-white text-sm">{l.label}</span>
            {lang === l.code && <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="absolute right-0 top-11 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-72 z-50 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-700">
        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
          {avatarSrc ? <img src={avatarSrc} className="w-full h-full object-cover" /> : initial}
        </div>
        <div>
          <div className="flex items-center gap-1">
            <p className="text-white text-sm font-medium">{user?.name}</p>
            {user?.isOfficialArtist && <OfficialArtistBadge size={14} />}
            {user?.isVerified && <VerifiedBadge size={14} full />}
          </div>
          <p className="text-gray-400 text-xs">{user?.email}</p>
          <button onClick={() => go('/channel')} className="text-blue-400 text-xs hover:text-blue-300 mt-0.5">{t('viewYourChannel')}</button>
        </div>
      </div>
      <div className="py-2 border-b border-zinc-700">
        <MenuItem icon={<GoogleIcon />} label={t('googleAccount')} />
        <MenuItem icon={<SwitchIcon />} label={t('switchAccount')} arrow onClick={() => setPanel('switch')} />
        <MenuItem icon={<SignOutIcon />} label={t('signOut')} onClick={onLogout} />
      </div>
      <div className="py-2 border-b border-zinc-700">
        {user?.isAdmin && <MenuItem icon={<StudioIcon />} label={t('adminPanel')} onClick={() => go('/admin')} />}
        <MenuItem icon={<PurchasesIcon />} label={t('purchases')} />
      </div>
      <div className="py-2 border-b border-zinc-700">
        <MenuItem icon={<AppearanceIcon theme={theme} />} label={theme === 'dark' ? t('appearanceDark') : t('appearanceLight')} onClick={toggleTheme} />
        <MenuItem icon={<LanguageIcon />} label={`${t('language')}: ${lang === 'en' ? 'English' : 'Lietuvių'}`} arrow onClick={() => setPanel('language')} />
        <MenuItem icon={<SettingsIcon />} label={t('settings')} />
      </div>
      <div className="py-2">
        <MenuItem icon={<HelpIcon />} label={t('help')} />
        <MenuItem icon={<FeedbackIcon />} label={t('sendFeedback')} />
      </div>
    </div>
  );
}

const GoogleIcon = () => <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;
const SwitchIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SignOutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const StudioIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>;
const PurchasesIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AppearanceIcon = ({ theme }) => theme === 'dark'
  ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
  : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>;
const LanguageIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>;
const SettingsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const HelpIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const FeedbackIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>;
