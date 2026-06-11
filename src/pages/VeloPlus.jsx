import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import VeloPlusBadge from '../components/VeloPlusBadge';
import api from '../utils/api';

const PLANS = [
  { id: 'weekly',  label: 'Weekly',  price: 1.99,  period: 'week',  save: null },
  { id: 'monthly', label: 'Monthly', price: 5.99,  period: 'month', save: 'Save 25%' },
  { id: 'yearly',  label: 'Yearly',  price: 49.99, period: 'year',  save: 'Save 30%', best: true },
];

const FEATURES = [
  '🏅 Exclusive VeloGo Plus badge next to your name',
  '🚫 No ads on all videos',
  '🎬 Early access to new features',
  '💬 Custom chat colors in live streams',
  '📁 Extended upload storage',
  '⭐ Priority support',
];

export default function VeloPlus() {
  const navigate = useNavigate();
  const token = localStorage.getItem('velogo_token');

  const [plan, setPlan] = useState('monthly');
  const [recipient, setRecipient] = useState('self');
  const [username, setUsername] = useState('');
  const [step, setStep] = useState('plans'); // plans | confirm | success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selected = PLANS.find(p => p.id === plan);

  const handleContinue = () => {
    if (recipient === 'friend' && !username.trim()) {
      setError('Please enter a username.');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleBuy = async () => {
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      await api.post('/api/veloplus/subscribe', {
        plan,
        recipient,
        username: recipient === 'friend' ? username.trim() : undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
      setStep('plans');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Navbar onMenuToggle={() => {}} />
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 pt-14">
        <div className="w-20 h-20 rounded-full bg-red-600/20 flex items-center justify-center">
          <VeloPlusBadge size={40} />
        </div>
        <h2 className="text-white text-2xl font-bold text-center">Welcome to VeloGo Plus!</h2>
        <p className="text-zinc-400 text-sm text-center max-w-xs">
          {recipient === 'self'
            ? `Your ${selected.label} plan is now active. The V+ badge will appear next to your name.`
            : `VeloGo Plus (${selected.label}) gifted to @${username} successfully!`}
        </p>
        <button onClick={() => { window.location.href = '/'; }}
          className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-full text-sm font-semibold transition">
          Back to Home
        </button>
      </div>
    </div>
  );

  if (step === 'confirm') return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Navbar onMenuToggle={() => {}} />
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-14">
        <div className="w-full max-w-sm">
          <button onClick={() => setStep('plans')} className="text-zinc-400 hover:text-white text-sm mb-6 flex items-center gap-1 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h2 className="text-white text-xl font-bold mb-6">Confirm purchase</h2>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Plan</span>
              <span className="text-white font-semibold">VeloGo Plus — {selected.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Price</span>
              <span className="text-white font-semibold">${selected.price} / {selected.period}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">For</span>
              <span className="text-white font-semibold">{recipient === 'self' ? 'You' : `@${username}`}</span>
            </div>
            <div className="border-t border-zinc-700 pt-3 flex justify-between">
              <span className="text-white font-bold">Total</span>
              <span className="text-white font-bold">${selected.price}</span>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}
          <button onClick={handleBuy} disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-sm transition flex items-center justify-center gap-2">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
              : `Subscribe — $${selected.price}`}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Navbar onMenuToggle={() => {}} />
      <div className="flex-1 flex flex-col items-center px-4 pt-20 pb-12">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <VeloPlusBadge size={32} />
          <h1 className="text-white text-3xl font-black">VeloGo Plus</h1>
        </div>
        <p className="text-zinc-400 text-sm mb-10 text-center">Premium membership for the VeloGo community</p>

        {/* Features */}
        <div className="w-full max-w-sm bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 mb-8">
          <p className="text-white font-semibold text-sm mb-4">What you get</p>
          <div className="space-y-2.5">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">{f}</div>
            ))}
          </div>
        </div>

        {/* Plan selector */}
        <div className="w-full max-w-sm space-y-3 mb-6">
          {PLANS.map(p => (
            <button key={p.id} onClick={() => setPlan(p.id)}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition ${
                plan === p.id
                  ? 'bg-red-600/10 border-red-500 text-white'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  plan === p.id ? 'border-red-500' : 'border-zinc-600'
                }`}>
                  {plan === p.id && <div className="w-2 h-2 rounded-full bg-red-500" />}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{p.label}</span>
                    {p.best && <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">BEST</span>}
                  </div>
                  {p.save && <span className="text-green-400 text-xs">{p.save}</span>}
                </div>
              </div>
              <span className="font-bold text-sm">${p.price}<span className="text-zinc-500 font-normal text-xs">/{p.period}</span></span>
            </button>
          ))}
        </div>

        {/* Recipient */}
        <div className="w-full max-w-sm mb-4">
          <p className="text-white text-sm font-semibold mb-3">Who is it for?</p>
          <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-700 mb-3">
            <button onClick={() => setRecipient('self')}
              className={`py-2.5 rounded-lg text-sm font-medium transition ${recipient === 'self' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
              🙋 For me
            </button>
            <button onClick={() => setRecipient('friend')}
              className={`py-2.5 rounded-lg text-sm font-medium transition ${recipient === 'friend' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'}`}>
              🎁 Gift a friend
            </button>
          </div>
          {recipient === 'friend' && (
            <div className="flex items-center bg-zinc-900 border border-zinc-700 focus-within:border-red-500 rounded-xl px-4 py-3 gap-2 transition">
              <span className="text-zinc-500 text-sm">@</span>
              <input value={username} onChange={e => { setUsername(e.target.value); setError(''); }}
                placeholder="friend's username"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-500" />
            </div>
          )}
          {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
        </div>

        {/* CTA */}
        <div className="w-full max-w-sm">
          <button onClick={handleContinue}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl text-sm transition shadow-lg shadow-red-900/30">
            Continue — ${selected.price}/{selected.period}
          </button>
          <p className="text-zinc-600 text-xs text-center mt-3">Cancel anytime. Billed {selected.period}ly.</p>
        </div>
      </div>
    </div>
  );
}
