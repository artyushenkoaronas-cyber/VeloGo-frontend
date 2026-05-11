import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import VideoCard from '../components/VideoCard';

const categories = ['All', 'Gaming', 'Music', 'Minecraft', 'Technology', 'Sports', 'Movies', 'News', 'Fashion', 'Food', 'Travel', 'Live'];

export default function Home() {
  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search).get('search') || '';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, [activeCategory, searchQuery]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      if (searchQuery) params.search = searchQuery;
      const { data } = await api.get('/api/videos', { params });
      setVideos(data);
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
      </main>
    </div>
  );
}
