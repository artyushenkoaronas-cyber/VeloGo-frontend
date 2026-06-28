import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useEffect, Component } from 'react';
import api from './utils/api';

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, color: '#fff', background: '#0f0f0f', minHeight: '100vh', fontFamily: 'monospace' }}>
        <h2 style={{ color: '#f87171', marginBottom: 16 }}>Something crashed</h2>
        <pre style={{ color: '#fca5a5', fontSize: 13, whiteSpace: 'pre-wrap' }}>{this.state.error?.message}{'\n'}{this.state.error?.stack}</pre>
        <button onClick={() => window.location.href='/'} style={{ marginTop: 24, padding: '8px 20px', background: '#3f3f46', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Go home</button>
      </div>
    );
    return this.props.children;
  }
}
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Channel from './pages/Channel';
import PublicChannel from './pages/PublicChannel';
import Watch from './pages/Watch';
import Admin from './pages/Admin';
import AuthSuccess from './pages/AuthSuccess';
import Shorts from './pages/Shorts';
import Setup from './pages/Setup';
import VeloGram from './pages/VeloGram';
import Subscriptions from './pages/Subscriptions';
import Remix from './pages/Remix';
import GoLive from './pages/GoLive';
import LiveStream from './pages/LiveStream';
import WatchLive from './pages/WatchLive';
import Redeem from './pages/Redeem';
import GiftCards from './pages/GiftCards';
import VeloPlus from './pages/VeloPlus';
import GroupCreate from './pages/GroupCreate';


const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('velogo_token');
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  useEffect(() => {
    api.get('/ping').catch(() => {});
    const interval = setInterval(() => api.get('/ping').catch(() => {}), 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/channel" element={<PrivateRoute><Channel /></PrivateRoute>} />
        <Route path="/c/:username" element={<PublicChannel />} />
        <Route path="/watch/:id" element={<PrivateRoute><Watch /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="/shorts" element={<PrivateRoute><Shorts /></PrivateRoute>} />
        <Route path="/velogram" element={<PrivateRoute><VeloGram /></PrivateRoute>} />
        <Route path="/subscriptions" element={<PrivateRoute><Subscriptions /></PrivateRoute>} />
        <Route path="/remix/:id" element={<PrivateRoute><Remix /></PrivateRoute>} />
        <Route path="/go-live" element={<PrivateRoute><GoLive /></PrivateRoute>} />
        <Route path="/live/:id" element={<PrivateRoute><LiveStream /></PrivateRoute>} />
        <Route path="/watch-live/:id" element={<WatchLive />} />
        <Route path="/redeem" element={<PrivateRoute><Redeem /></PrivateRoute>} />
        <Route path="/gift-cards" element={<PrivateRoute><GiftCards /></PrivateRoute>} />
        <Route path="/veloplus" element={<PrivateRoute><VeloPlus /></PrivateRoute>} />
        <Route path="/group/create" element={<PrivateRoute><GroupCreate /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
