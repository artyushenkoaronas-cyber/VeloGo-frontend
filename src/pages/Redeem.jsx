import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';

function safeUser() {
  try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; }
}

export default function Redeem() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [reward, setReward] = useState(null);
  const token = localStorage.getItem('velogo_token');

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    if (!token) { navigate('/login'); return; }

    setStatus('loading');
    setReward(null);
    setMessage('');

    try {
      const res = await api.post('/api/redeem', { code: code.trim().toUpperCase() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus('success');
      setMessage(res.data.message || 'Code redeemed successfully!');
      setReward(res.data.reward || null);
      setCode('');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Invalid or expired code.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Navbar onMenuToggle={() => {}} />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-14">
        {/* Card */}
        <div className="w-full max-w-md">
          {/* Gift icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/40">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 8v13m0-13V6a4 4 0 014-4 2 2 0 010 4H12zm0 0V6a4 4 0 00-4-4 2 2 0 000 4h4zM5 8h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V9a1 1 0 011-1zm1 4v8a1 1 0 001 1h10a1 1 0 001-1v-8" />
              </svg>
            </div>
          </div>

          <h1 className="text-white text-3xl font-bold text-center mb-2">Redeem Code</h1>
          <p className="text-zinc-400 text-sm text-center mb-8">
            Enter your VeloGo gift card or promo code below
          </p>

          <form onSubmit={handleRedeem} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={e => {
                  setCode(e.target.value.toUpperCase());
                  setStatus(null);
                }}
                placeholder="Enter code (e.g. VELO-XXXX-XXXX)"
                maxLength={32}
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 text-white placeholder-zinc-500 rounded-xl px-4 py-3.5 text-sm outline-none transition text-center tracking-widest font-mono"
                spellCheck={false}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={!code.trim() || status === 'loading'}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redeeming...
                </>
              ) : 'Redeem'}
            </button>
          </form>

          {/* Result */}
          {status === 'success' && (
            <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-xl p-5 text-center animate-fade-in">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-green-400 font-semibold text-sm mb-1">Success!</p>
              <p className="text-white text-sm">{message}</p>
              {reward && (
                <div className="mt-3 bg-zinc-800/60 rounded-lg px-4 py-2.5 inline-block">
                  <p className="text-zinc-300 text-xs">You received: <span className="text-white font-semibold">{reward}</span></p>
                </div>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center">
              <div className="text-4xl mb-3">❌</div>
              <p className="text-red-400 font-semibold text-sm mb-1">Could not redeem</p>
              <p className="text-zinc-400 text-sm">{message}</p>
            </div>
          )}

          {/* Info */}
          <div className="mt-8 bg-zinc-900/50 rounded-xl p-4 space-y-2">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-3">Where to find codes</p>
            {[
              { icon: '🎁', text: 'VeloGo gift cards from official stores' },
              { icon: '📢', text: 'Creator giveaways and promotions' },
              { icon: '🏆', text: 'Events and competitions' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className="text-zinc-400 text-xs">{text}</span>
              </div>
            ))}
          </div>

          <p className="text-zinc-600 text-xs text-center mt-6">
            Each code can only be redeemed once per account.
          </p>
        </div>
      </div>
    </div>
  );
}
