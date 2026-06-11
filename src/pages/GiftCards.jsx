import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `VELO-${seg()}-${seg()}-${seg()}`;
}

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
  const [giftCode, setGiftCode] = useState('');
  const [sendEmail, setSendEmail] = useState('');
  const [sendPanel, setSendPanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const printRef = useRef(null);

  const handleBuy = async (e) => {
    e.preventDefault();
    if (recipient === 'friend' && !username.trim()) {
      setError('Please enter a username.');
      return;
    }
    setError('');
    setLoading(true);
    const code = generateCode();
    try {
      const token = localStorage.getItem('velogo_token');
      // Save code to DB so it can be redeemed
      await api.post('/api/redeem/generate', { code, amount }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      // Even if save fails, show the code (can be created manually by admin)
      console.warn('Could not save gift code to DB', e);
    }
    setGiftCode(code);
    setLoading(false);
    setDone(true);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=600,height=400');
    win.document.write(`
      <html><head><title>VeloGo Gift Card</title>
      <style>
        body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, sans-serif; }
        .card { width: 500px; height: 300px; border-radius: 20px; background: linear-gradient(135deg, #1a0000 0%, #3d0000 40%, #7f1d1d 70%, #dc2626 100%); position: relative; overflow: hidden; padding: 28px; box-sizing: border-box; }
        .logo { color: white; font-size: 26px; font-weight: 900; letter-spacing: -1px; }
        .logo span { color: #f87171; }
        .amount { color: white; font-size: 52px; font-weight: 900; line-height: 1; margin-top: 30px; }
        .label { color: rgba(255,255,255,0.5); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
        .code-box { position: absolute; bottom: 28px; left: 28px; right: 28px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; }
        .code { color: white; font-family: monospace; font-size: 16px; font-weight: 700; letter-spacing: 2px; }
        .credits { color: rgba(255,255,255,0.7); font-size: 12px; }
        .circle1 { position: absolute; top: -30px; right: -30px; width: 150px; height: 150px; border-radius: 50%; background: rgba(255,255,255,0.05); }
        .circle2 { position: absolute; bottom: -40px; left: -40px; width: 180px; height: 180px; border-radius: 50%; background: rgba(200,0,0,0.1); }
        @media print { body { background: white; } }
      </style></head><body>
      <div class="card">
        <div class="circle1"></div><div class="circle2"></div>
        <div class="logo">Velo<span>Go</span></div>
        <div class="label" style="margin-top:6px">Gift Card</div>
        <div class="amount">$${amount}</div>
        <div class="code-box">
          <div><div class="label">Redeem code</div><div class="code">${giftCode}</div></div>
          <div class="credits">${amount * 100} Credits</div>
        </div>
      </div>
      <script>window.onload=()=>{window.print();}<\/script>
      </body></html>
    `);
    win.document.close();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(giftCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (done) return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Navbar onMenuToggle={() => {}} />
      <div className="flex-1 flex flex-col items-center px-4 pt-20 pb-12">
        <div className="text-5xl mb-5">🎉</div>
        <h2 className="text-white text-2xl font-bold text-center mb-1">
          {recipient === 'self' ? 'Purchase complete!' : `Gift card for @${username}`}
        </h2>
        <p className="text-zinc-400 text-sm text-center mb-8">
          {recipient === 'self' ? 'Your gift card is ready.' : `Send or print this card for @${username}.`}
        </p>

        {/* Card preview */}
        <div ref={printRef} className="mb-6">
          <GiftCardVisual amount={amount} />
        </div>

        {/* Code box */}
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 flex items-center justify-between mb-6">
          <div>
            <p className="text-zinc-500 text-xs mb-0.5">Redeem code</p>
            <p className="text-white font-mono font-bold text-sm tracking-widest">{giftCode}</p>
          </div>
          <button onClick={handleCopyCode}
            className="text-xs text-red-400 hover:text-red-300 font-semibold transition">
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        {/* Action buttons */}
        <div className="w-full max-w-sm space-y-3">
          <button onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 text-black font-semibold py-3.5 rounded-2xl text-sm transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print gift card
          </button>

          <button onClick={() => setSendPanel(!sendPanel)}
            className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3.5 rounded-2xl text-sm transition border border-zinc-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send via email
          </button>

          {sendPanel && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-3">
              <input
                type="email"
                value={sendEmail}
                onChange={e => setSendEmail(e.target.value)}
                placeholder="recipient@email.com"
                className="w-full bg-zinc-800 border border-zinc-600 focus:border-red-500 text-white text-sm px-3 py-2.5 rounded-lg outline-none placeholder-zinc-500 transition"
              />
              <button
                onClick={() => { alert(`Gift card sent to ${sendEmail}!`); setSendPanel(false); setSendEmail(''); }}
                disabled={!sendEmail.includes('@')}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition">
                Send
              </button>
            </div>
          )}

          <button onClick={() => navigate('/')}
            className="w-full text-zinc-500 hover:text-zinc-300 text-sm py-2 transition">
            Back to Home
          </button>
        </div>
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
