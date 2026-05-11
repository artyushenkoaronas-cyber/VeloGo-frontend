import { mediaUrl } from '../utils/mediaUrl';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import VideoCard from '../components/VideoCard';
import VerifiedBadge from '../components/VerifiedBadge';
import OfficialArtistBadge from '../components/OfficialArtistBadge';

const tabs = ['Home', 'Videos', 'Shorts', 'Playlists', 'Posts'];

function fv(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n;
}

function safeParseUser() {
  try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; }
}

export default function PublicChannel() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Videos');
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [subscribed, setSubscribed] = useState(false);
  const [subCount, setSubCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  const me = safeParseUser();
  const token = localStorage.getItem('velogo_token');
  const isOwn = me.username && me.username === username;

  useEffect(() => {
    if (isOwn) { navigate('/channel'); return; }
    setLoading(true);
    setNotFound(false);
    loadChannel();
  }, [username]);

  const loadChannel = async () => {
    try {
      const isId = /^[a-f\d]{24}$/i.test(username);
      const { data } = await api.get(`/api/users/${isId ? username : `@${username}`}`);
      setChannel(data);
      setSubCount(data.subscribers || 0);

      if (me.id && token) {
        try {
          const meData = await api.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSubscribed(meData.data.subscribedTo?.includes(data._id));
        } catch {}
      }

      try {
        const vids = await api.get(`/api/videos/user/${data._id}`);
        const videoList = vids.data || [];
        setVideos(videoList);
        setTotalViews(videoList.reduce((sum, v) => sum + (v.views || 0), 0));
      } catch {}

      try {
        const pls = await api.get(`/api/playlists/user/${data._id}`);
        setPlaylists(pls.data || []);
      } catch {}

    } catch {
      setNotFound(true);
    }
    setLoading(false);
  };

  const handleSubscribe = async () => {
    if (!token) return navigate('/login');
    try {
      const { data } = await api.post(`/api/users/${channel._id}/subscribe`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscribed(data.subscribed);
      setSubCount(data.subscribers);
    } catch {}
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar onMenuToggle={() => setSidebarOpen(p => !p)} />
      <Sidebar open={sidebarOpen} />
      <div className="pt-14 flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (notFound || !channel) return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar onMenuToggle={() => setSidebarOpen(p => !p)} />
      <Sidebar open={sidebarOpen} />
      <main className={`pt-14 transition-all duration-200 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <svg className="w-16 h-16 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-white font-semibold text-lg">Channel not found</p>
          <p className="text-gray-400 text-sm">This channel doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/')} className="mt-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2 rounded-full text-sm transition">Go home</button>
        </div>
      </main>
    </div>
  );

  const avatarSrc = channel?.avatar
    ? mediaUrl(channel.avatar)
    : null;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar onMenuToggle={() => setSidebarOpen(p => !p)} />
      <Sidebar open={sidebarOpen} />

      <main className={`pt-14 transition-all duration-200 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        {/* Banner / Background */}
        <div className="w-full h-40 overflow-hidden bg-zinc-800">
          {(channel?.background || channel?.banner)
            ? <img src={(() => { const s = channel.background || channel.banner; return mediaUrl(s); })()} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900" />}
        </div>

        <div className="max-w-5xl mx-auto px-6">
          {/* Profile row */}
          <div className="flex items-end gap-6 -mt-12 mb-5">
            <div className="w-36 h-36 rounded-full bg-red-600 flex items-center justify-center overflow-hidden ring-4 ring-[#0f0f0f] flex-shrink-0">
              {avatarSrc
                ? <img src={avatarSrc} alt={channel?.name} className="w-full h-full object-cover" />
                : <span className="text-4xl font-bold text-white">{channel?.name?.[0]?.toUpperCase()}</span>}
            </div>
            <div className="pb-2 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-white text-2xl font-bold">{channel?.name}</h1>
                {channel?.isOfficialArtist && <OfficialArtistBadge size={22} />}
                {channel?.isVerified && <VerifiedBadge size={22} />}
              </div>
              <p className="text-gray-400 text-sm">
                @{channel?.username} · {fv(subCount)} subscribers · {videos.length} videos
              </p>
              {channel?.bio && (
                <div className="mt-1">
                  <p className={`text-gray-400 text-sm ${bioExpanded ? '' : 'line-clamp-2'}`}>
                    {channel.bio}
                  </p>
                  <button
                    onClick={() => setBioExpanded(p => !p)}
                    className="text-gray-300 text-xs font-medium mt-0.5 hover:text-white transition"
                  >
                    {bioExpanded ? 'Show less' : '...more'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={handleSubscribe}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition ${
                subscribed
                  ? 'bg-zinc-700 text-white hover:bg-zinc-600'
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-800 mb-6">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition border-b-2 ${
                  activeTab === tab ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          {/* HOME tab */}
          {activeTab === 'Home' && (
            <div className="pb-8 space-y-10">
              {playlists.length === 0 && videos.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-20">No content yet.</p>
              )}
              {playlists.map(pl => (
                <PlaylistRow key={pl._id} playlist={pl} navigate={navigate} />
              ))}
              {videos.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                    </div>
                    <h2 className="text-white font-semibold text-base">Videos</h2>
                  </div>
                  <HorizontalVideoRow videos={videos.filter(v => !v.isShort)} navigate={navigate} />
                </div>
              )}
            </div>
          )}

          {/* VIDEOS tab */}
          {activeTab === 'Videos' && (
            videos.filter(v => !v.isShort).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-white font-medium">No videos yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
                {videos.filter(v => !v.isShort).map(v => <VideoCard key={v._id} video={v} />)}
              </div>
            )
          )}

          {/* SHORTS tab */}
          {activeTab === 'Shorts' && (
            videos.filter(v => v.isShort).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-white font-medium">No shorts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
                {videos.filter(v => v.isShort).map(v => <VideoCard key={v._id} video={v} />)}
              </div>
            )
          )}

          {/* PLAYLISTS tab */}
          {activeTab === 'Playlists' && (
            playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-white font-medium">No playlists yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
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
                    <p className="text-gray-400 text-xs capitalize">{pl.visibility} playlist</p>
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

          {/* Total views footer */}
          <div className="border-t border-zinc-800 py-6 flex items-center gap-6 text-gray-500 text-sm">
            <span>👁 {fv(totalViews)} total views</span>
            <span>🎬 {videos.length} videos</span>
            <span>👥 {fv(subCount)} subscribers</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function PlaylistRow({ playlist, navigate }) {
  const scrollRef = useRef(null);
  const videos = playlist.videos || [];
  if (videos.length === 0) return null;

  const thumb = (v) => v.thumbnail
    ? (mediaUrl(v.thumbnail)mediaUrl(v.thumbnail))
    : null;

  const playAll = () => navigate(`/watch/${videos[0]._id}?list=${playlist._id}`);
  const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
          {videos[0]?.thumbnail
            ? <img src={thumb(videos[0])} className="w-full h-full object-cover" />
            : <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
              </svg>}
        </div>
        <h2 className="text-white font-semibold text-base flex-1">{playlist.title}</h2>
        <button onClick={playAll} className="flex items-center gap-1.5 text-white text-sm hover:text-gray-300 transition">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          Play all
        </button>
      </div>
      <div className="relative group/row">
        <button onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition -translate-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {videos.map((v, idx) => {
            const t = thumb(v);
            return (
              <div key={v._id} className="flex-shrink-0 w-48 cursor-pointer group"
                onClick={() => navigate(`/watch/${v._id}?list=${playlist._id}`)}>
                <div className="relative w-48 h-28 bg-zinc-800 rounded-xl overflow-hidden mb-2">
                  {t ? <img src={t} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13" />
                        </svg>
                      </div>}
                  <div className="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                    {idx + 1} / {videos.length}
                  </div>
                </div>
                <p className="text-white text-xs font-medium line-clamp-2">{v.title}</p>
                <p className="text-gray-500 text-[11px]">{fv(v.views || 0)} views</p>
              </div>
            );
          })}
        </div>
        <button onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition translate-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

function HorizontalVideoRow({ videos, navigate }) {
  const scrollRef = useRef(null);
  const thumb = (v) => v.thumbnail
    ? (mediaUrl(v.thumbnail)mediaUrl(v.thumbnail))
    : null;
  const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });

  return (
    <div className="relative group/row">
      <button onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition -translate-x-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {videos.map(v => {
          const t = thumb(v);
          return (
            <div key={v._id} className="flex-shrink-0 w-48 cursor-pointer group" onClick={() => navigate(`/watch/${v._id}`)}>
              <div className="w-48 h-28 bg-zinc-800 rounded-xl overflow-hidden mb-2">
                {t ? <img src={t} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                    </div>}
              </div>
              <p className="text-white text-xs font-medium line-clamp-2">{v.title}</p>
              <p className="text-gray-500 text-[11px]">{fv(v.views || 0)} views</p>
            </div>
          );
        })}
      </div>
      <button onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition translate-x-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}
