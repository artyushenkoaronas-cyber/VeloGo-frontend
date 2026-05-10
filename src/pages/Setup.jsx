import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Setup() {
  const navigate = useNavigate();
  const token = localStorage.getItem('velogo_token');
  const user = (() => { try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; } })();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.put('/api/users/me/update', { username }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updated = { ...user, username: data.username };
      localStorage.setItem('velogo_user', JSON.stringify(updated));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Velo<span className="text-red-500">Go</span></h1>
          <p className="text-gray-400 mt-2">One last step — choose your username</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 shadow-xl border border-zinc-800">
          {/* Avatar preview */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center overflow-hidden">
              {user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-white">{user.name?.[0]?.toUpperCase() || 'V'}</span>}
            </div>
          </div>
          <p className="text-center text-white font-semibold mb-1">{user.name}</p>
          <p className="text-center text-gray-500 text-sm mb-6">{user.email}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">Choose a username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="yourhandle"
                  required
                  autoFocus
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-red-500 transition"
                />
              </div>
              <p className="text-gray-600 text-xs mt-1.5">Only letters, numbers and underscores. Cannot be changed easily.</p>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
