import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import VideoCard from '../components/VideoCard';
import { mediaUrl } from '../utils/mediaUrl';

const categories = ['All', 'Gaming', 'Music', 'Minecraft', 'Technology', 'Sports', 'Movies', 'News', 'Fashion', 'Food', 'Travel', 'Live'];

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchQuery = new URLSearchParams(location.search).get('search') || '';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [liveStreams, setLiveStreams] = useState([]);

  // Load from cache immediately, then refresh in background
  const CACHE_KEY = 'velogo_home_videos';
  const [videos, setVideos] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });

  useEffect(() => {
    fetchVideos();
    fetchLives();
  }, [activeCategory, searchQuery]);

  const fetchLives = async () => {
    try {
      const { data } = await api.get('/api/lives');
      // Show streams that are live OR started within last 10 minutes (waiting to go live)
      const recent = Date.now() - 10 * 60 * 1000;
      setLiveStreams(data.filter(s => s.isLive || (!s.endedAt && new Date(s.createdAt) > new Date(recent))));
    } catch {}
  };

  const fetchVideos = async () => {
    // Only show spinner if no cached data
    if (videos.length === 0) setLoading(true);
    try {
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      if (searchQuery) params.search = searchQuery;
      const { data } = await api.get('/api/videos', { params });
      const filtered = data.filter(v => !v.isShort);
      setVideos(filtered);
      // Cache only for 'All' category (no search)
      if (activeCategory === 'All' && !searchQuery) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(filtered)); } catch {}
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar onMenuToggle={() => setSidebarOpen(p => !p)} onUpload={fetchVideos} />
      <Sidebar open={sidebarOpen} />

      <main className={`pt-14 transition-all duration-200 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        {/* Category bar */}
        <div className="sticky top-14 z-30 bg-[#0f0f0f] px-4 py-3 flex gap-2 overflow-x-auto border-b border-zinc-800" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeCategory === cat ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="px-4 py-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-zinc-800 rounded-xl mb-3" />
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-zinc-800 rounded w-3/4" />
                      <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <svg className="w-20 h-20 text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
              <h2 className="text-white text-xl font-semibold mb-2">No videos yet</h2>
              <p className="text-gray-500 text-sm">Be the first to upload a video!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map(v => <VideoCard key={v._id} video={v} />)}
            </div>
          )}
        </div>

        {/* Live now section */}
        {liveStreams.length > 0 && (
          <div className="px-4 pb-8">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />LIVE
              </span>
              Live now
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {liveStreams.map(stream => (
                <div key={stream._id} className="cursor-pointer group" onClick={() => navigate(`/watch-live/${stream._id}`)}>
                  <div className="relative aspect-video bg-zinc-800 rounded-xl overflow-hidden mb-3">
                    {stream.thumbnail
                      ? <img src={mediaUrl(stream.thumbnail)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                      : <div className="w-full h-full bg-gradient-to-br from-red-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
                          <svg className="w-12 h-12 text-red-500 opacity-60" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                        </div>}
                    {/* LIVE badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                      LIVE
                    </div>
                    {/* Viewer count */}
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                      ðŸ‘ {stream.viewers || 0} watching
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div
                      className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center overflow-hidden flex-shrink-0"
                      onClick={e => { e.stopPropagation(); navigate(`/c/${stream.streamer?.username}`); }}
                    >
                      {stream.streamer?.avatar
                        ? <img src={mediaUrl(stream.streamer.avatar)} className="w-full h-full object-cover" />
                        : <span className="text-white text-sm font-bold">{stream.streamer?.name?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-sm font-medium line-clamp-2 leading-snug">{stream.title}</h3>
                      <p className="text-gray-400 text-xs mt-0.5">{stream.streamer?.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}



