import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import VideoCard from '../components/VideoCard';

export default function Subscriptions() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('velogo_token');

  useEffect(() => {
    api.get('/api/videos/subscriptions', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => setVideos(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar onMenuToggle={() => setSidebarOpen(p => !p)} />
      <Sidebar open={sidebarOpen} />
      <main className={`pt-14 transition-all duration-200 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        <div className="max-w-screen-xl mx-auto px-6 py-6">
          <h1 className="text-white text-xl font-semibold mb-6">Subscriptions</h1>
          {loading ? (
            <div className="flex justify-center pt-20">
              <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <svg className="w-16 h-16 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-white font-medium">No videos yet</p>
              <p className="text-gray-400 text-sm">Subscribe to channels to see their latest videos here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {videos.map(v => <VideoCard key={v._id} video={v} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
