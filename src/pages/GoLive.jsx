import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';

const STEPS = ['Details', 'Customization', 'Visibility'];

export default function GoLive() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '',
    description: '',
    chatMode: 'everyone',
    visibility: 'public',
    thumbnail: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('velogo_token');
  const headers = { Authorization: `Bearer ${token}` };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/lives', form, { headers });
      navigate(`/live/${data._id}`);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create stream');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar onMenuToggle={() => setSidebarOpen(p => !p)} />
      <Sidebar open={sidebarOpen} />
      <main className={`pt-14 transition-all duration-200 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <h1 className="text-white text-2xl font-bold mb-8">Create stream</h1>

          {/* Step indicator */}
          <div className="flex items-center mb-10">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => i < step ? setStep(i) : undefined}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition
                      ${step === i ? 'border-white bg-white text-black' : i < step ? 'border-white bg-white text-black' : 'border-zinc-600 text-zinc-500'}`}
                  >
                    {i < step ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i + 1}
                  </button>
                  <span className={`text-xs mt-1 font-medium ${step === i ? 'text-white' : 'text-zinc-500'}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step ? 'bg-white' : 'bg-zinc-700'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 0: Details */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
                <label className="text-gray-400 text-sm mb-2 block">Title (required)</label>
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  maxLength={100}
                  placeholder="Add a title that describes your stream (type @ to mention a channel)"
                  className="w-full bg-transparent text-white text-sm outline-none placeholder-zinc-600 resize-none"
                />
                <div className="text-right text-zinc-600 text-xs mt-2">{form.title.length}/100</div>
              </div>
              <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
                <label className="text-gray-400 text-sm mb-2 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  maxLength={500}
                  rows={5}
                  placeholder="Tell viewers more about your stream (type @ to mention a channel)"
                  className="w-full bg-transparent text-white text-sm outline-none placeholder-zinc-600 resize-none"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                disabled={!form.title.trim()}
                onClick={() => setStep(1)}
                className="bg-white text-black px-8 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-200 transition disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}

          {/* Step 1: Customization */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">
                <h3 className="text-white font-medium mb-4">Chat settings</h3>
                <div className="space-y-3">
                  {[
                    { val: 'everyone', label: 'Everyone can chat', desc: 'All viewers can send messages' },
                    { val: 'subscribers', label: 'Subscribers only', desc: 'Only people subscribed to you can chat' },
                    { val: 'none', label: 'No chat', desc: 'Chat is disabled for this stream' },
                  ].map(opt => (
                    <label key={opt.val} className="flex items-start gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition
                        ${form.chatMode === opt.val ? 'border-white bg-white' : 'border-zinc-600 group-hover:border-zinc-400'}`}
                        onClick={() => set('chatMode', opt.val)}>
                        {form.chatMode === opt.val && <div className="w-2 h-2 rounded-full bg-black" />}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{opt.label}</p>
                        <p className="text-zinc-500 text-xs">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="bg-zinc-800 text-white px-8 py-2.5 rounded-full text-sm font-semibold hover:bg-zinc-700 transition">Back</button>
                <button onClick={() => setStep(2)} className="bg-white text-black px-8 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-200 transition">Next</button>
              </div>
            </div>
          )}

          {/* Step 2: Visibility */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">
                <h3 className="text-white font-medium mb-4">Stream visibility</h3>
                <div className="space-y-3">
                  {[
                    { val: 'public', label: 'Public', desc: 'Anyone can find and watch your stream', icon: '🌍' },
                    { val: 'unlisted', label: 'Unlisted', desc: 'Only people with the link can watch', icon: '🔗' },
                  ].map(opt => (
                    <label key={opt.val} className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-zinc-800 transition"
                      onClick={() => set('visibility', opt.val)}>
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition
                        ${form.visibility === opt.val ? 'border-white bg-white' : 'border-zinc-600 group-hover:border-zinc-400'}`}>
                        {form.visibility === opt.val && <div className="w-2 h-2 rounded-full bg-black" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{opt.icon}</span>
                        <div>
                          <p className="text-white text-sm font-medium">{opt.label}</p>
                          <p className="text-zinc-500 text-xs">{opt.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="bg-zinc-800 text-white px-8 py-2.5 rounded-full text-sm font-semibold hover:bg-zinc-700 transition">Back</button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-500 text-white px-8 py-2.5 rounded-full text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                  ) : (
                    <><span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" /> Go Live</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
