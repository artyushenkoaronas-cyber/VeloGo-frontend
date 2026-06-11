import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AMOUNTS = [5, 10, 20, 50, 100];

function GiftCardVisual({ amount }) {
  return (
    <div className="relative w-72 h-44 rounded-2xl overflow-hidden shadow-2xl shadow-red-900/50 select-none"
      style={{ background: 'linear-gradient(135deg, #1a0000 0%, #3d0000 40%, #7f1d1d 70%, #dc2626 100%)' }}>
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-red-500/10" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-red-800/20" />
      <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/5 border border-white/10" />

      {/* Logo */}
      <div className="absolute top-4 left-5 flex items-center gap-1.5">
        <span className="text-white font-black text-xl tracking-tight">
          Velo<span className="text-red-400">Go</span>
        </span>
      </div>

      {/* Amount */}
      <div className="absolute bottom-5 left-5">
        <p className="text-white/50 text-xs font-medium mb-0.5 uppercase tracking-wider">Gift Card</p>
        <p className="text-white font-black text-4xl leading-none">${amount}</p>
      </div>

      {/* Credits label */}
      <div className="absolute bottom-5 right-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-right">
        <p className="text-white/60 text-[10px] uppercase tracking-wide">Credits</p>
        <p className="text-white font-bold text-sm">{amount * 100}</p>
      </div>

      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}

export default function GiftCards() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(20);
  const [recipient, setRecipient] = useState('self'); // 'self' | 'friend'
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleBuy = async (e) => {
    e.preventDefault();
    if (recipient === 'friend' && !username.trim()) {
      setError('Please enter a username.');
      return;
    }
    setError('');
    setLoading(true);
    // Simulate purchase (real payment integration goes here)
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setDone(true);
  };

  if (done) return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Navbar onMenuToggle={() => {}} />
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 pt-14">
        <div className="text-6xl">🎉</div>
        <h2 className="text-white text-2xl font-bold text-center">
          {recipient === 'self' ? 'Purchase complete!' : `Gift sent to @${username}!`}
        </h2>
        <p className="text-zinc-400 text-sm text-center">
          {recipient === 'self'
            ? `$${amount} worth of VeloGo Credits added to your account.`
            : `A $${amount} VeloGo Gift Card has been sent to @${username}.`}
        </p>
        <button onClick={() => navigate('/')}
          className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-full text-sm font-semibold transition">
          Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Navbar onMenuToggle={() => {}} />

      <div className="flex-1 flex flex-col items-center px-4 pt-20 pb-12">
        <h1 className="text-white text-3xl font-bold mb-1">VeloGo Gift Cards</h1>
        <p className="text-zinc-400 text-sm mb-10">Give the gift of VeloGo Credits</p>

        {/* Card preview */}
        <div className="mb-10 transition-all duration-300">
          <GiftCardVisual amount={amount} />
        </div>

        <div className="w-full max-w-sm space-y-6">
          {/* Amount selector */}
          <div>
            <p className="text-white text-sm font-semibold mb-3">Select amount</p>
            <div className="grid grid-cols-5 gap-2">
              {AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(a)}
                  className={`py-2.5 rounded-xl text-sm font-bold transition border ${
                    amount === a
                      ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/40'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                  }`}>
                  ${a}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient toggle */}
          <div>
            <p className="text-white text-sm font-semibold mb-3">Who is it for?</p>
            <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-700">
              <button onClick={() => setRecipient('self')}
                className={`py-2.5 rounded-lg text-sm font-medium transition ${
                  recipient === 'self' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}>
                🙋 For me
              </button>
              <button onClick={() => setRecipient('friend')}
                className={`py-2.5 rounded-lg text-sm font-medium transition ${
                  recipient === 'friend' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}>
                🎁 For a friend
              </button>
            </div>
          </div>

          {/* Friend username input */}
          {recipient === 'friend' && (
            <div className="animate-fade-in">
              <p className="text-white text-sm font-semibold mb-2">Friend's username</p>
              <div className="flex items-center bg-zinc-900 border border-zinc-700 focus-within:border-red-500 rounded-xl px-4 py-3 gap-2 transition">
                <span className="text-zinc-500 text-sm">@</span>
                <input
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder="username"
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-500"
                  autoComplete="off"
                />
              </div>
              {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
            </div>
          )}

          {/* Summary */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-zinc-400 text-xs">Total</p>
              <p className="text-white font-bold text-lg">${amount}.00</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-400 text-xs">Credits</p>
              <p className="text-white font-bold text-lg">{amount * 100}</p>
            </div>
          </div>

          {/* Buy button */}
          <form onSubmit={handleBuy}>
            <button type="submit" disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-base transition flex items-center justify-center gap-2 shadow-lg shadow-red-900/30">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
              ) : recipient === 'self' ? (
                <>Buy for ${amount}</>
              ) : (
                <>Send gift — ${amount}</>
              )}
            </button>
          </form>

          <p className="text-zinc-600 text-xs text-center">
            Payments are processed securely. VeloGo Credits are non-refundable.
          </p>
        </div>
      </div>
    </div>
  );
}
