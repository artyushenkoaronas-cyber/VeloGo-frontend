import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'google_not_configured') setError('Google Sign In is not configured yet. Use email/password instead.');
    if (err === 'google_failed') setError('Google Sign In failed. Please try again or use email/password.');
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', form);
      localStorage.setItem('velogo_token', data.token);
      // Fetch fresh profile data (includes latest username, avatar, subscribers)
      try {
        const me = await axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${data.token}` } });
        localStorage.setItem('velogo_user', JSON.stringify({
          id: me.data._id,
          name: me.data.name,
          username: me.data.username,
          email: me.data.email,
          avatar: me.data.avatar,
          isVerified: me.data.isVerified,
          isAdmin: me.data.isAdmin,
          subscribers: me.data.subscribers
        }));
      } catch {
        localStorage.setItem('velogo_user', JSON.stringify(data.user));
      }
      navigate('/');
    } catch (err) {
      if (!err.response) {
        setError('Nepavyko pasiekti serverio. Patikrinkite ar backend yra paleistas (npm start).');
      } else {
        setError(err.response.data?.message || 'Klaida. Bandykite dar kartą.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            Velo<span className="text-red-500">Go</span>
          </h1>
          <p className="text-gray-400 mt-2">Prisijunkite prie paskyros</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 shadow-xl border border-zinc-800">
          {/* Google mygtukas */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Prisijungti su Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-zinc-700" />
            <span className="text-zinc-500 text-sm">arba</span>
            <div className="flex-1 h-px bg-zinc-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">El. paštas</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jusu@pastas.lt"
                required
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Slaptažodis</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Jūsų slaptažodis"
                required
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Jungiamasi...' : 'Prisijungti'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Neturite paskyros?{' '}
            <Link to="/register" className="text-red-400 hover:text-red-300 font-medium">
              Registruotis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
