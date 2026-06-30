import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Sidebar from '../components/Sidebar';

function mediaUrl(src) {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('http')) return src;
  return `https://velogo.onrender.com${src}`;
}

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      api.get(`/api/groups/all/list${search ? `?q=${encodeURIComponent(search)}` : ''}`)
        .then(r => setGroups(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const token = localStorage.getItem('velogo_token');

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <main className={`flex-1 pt-14 transition-all duration-200 ${sidebarOpen ? 'ml-60' : 'ml-16'} p-6`}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6 gap-4">
            <h1 className="text-2xl font-bold">Groups</h1>
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search groups..."
                className="bg-zinc-800 text-white text-sm px-4 py-2 rounded-full border border-zinc-700 outline-none focus:border-red-500 w-56"
              />
              {token && (
                <button onClick={() => navigate('/group/create')}
                  className="bg-red-600 hover:bg-red-500 text-white text-sm px-5 py-2 rounded-full font-semibold transition">
                  + Create
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-zinc-900 rounded-xl overflow-hidden animate-pulse">
                  <div className="h-28 bg-zinc-800" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <p className="text-lg">No groups found</p>
              {token && <button onClick={() => navigate('/group/create')} className="mt-4 bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold transition">Create the first one</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {groups.map(g => (
                <Link key={g._id} to={`/group/${g._id}`}
                  className="bg-zinc-900 rounded-xl overflow-hidden hover:bg-zinc-800 transition group">
                  <div className="h-28 relative overflow-hidden">
                    {g.background
                      ? <img src={mediaUrl(g.background)} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full bg-gradient-to-br from-purple-900 via-red-900 to-zinc-900" />}
                    {g.logo && (
                      <div className="absolute bottom-0 left-4 translate-y-1/2 w-14 h-14 rounded-full overflow-hidden ring-2 ring-zinc-900 bg-zinc-800">
                        <img src={mediaUrl(g.logo)} className="w-full h-full object-cover" alt="" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 pt-9">
                    <p className="font-semibold text-white group-hover:text-red-400 transition truncate">{g.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{g.members?.length || 0} members · by {g.owner?.name}</p>
                    {g.description && <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2">{g.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
