import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import api from './utils/api';
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

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('velogo_token');
  return token ? children : <Navigate to="/login" />;
};

export default function App() {
  useEffect(() => {
    api.get('/ping').catch(() => {});
    const interval = setInterval(() => api.get('/ping').catch(() => {}), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/channel" element={<PrivateRoute><Channel /></PrivateRoute>} />
        <Route path="/@:username" element={<PrivateRoute><PublicChannel /></PrivateRoute>} />
        <Route path="/watch/:id" element={<PrivateRoute><Watch /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="/shorts" element={<PrivateRoute><Shorts /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
