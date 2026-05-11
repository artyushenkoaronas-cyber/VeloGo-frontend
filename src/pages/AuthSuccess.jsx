import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (!token) { navigate('/login'); return; }
    localStorage.setItem('velogo_token', token);
    api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        localStorage.setItem('velogo_user', JSON.stringify({
          id: data._id,
          name: data.name,
          username: data.username,
          email: data.email,
          avatar: data.avatar,
          isVerified: data.isVerified,
          isAdmin: data.isAdmin,
          subscribers: data.subscribers,
          bio: data.bio
        }));
        if (!data.username) {
          navigate('/setup');
        } else {
          navigate('/');
        }
      })
      .catch(() => navigate('/login'));
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
