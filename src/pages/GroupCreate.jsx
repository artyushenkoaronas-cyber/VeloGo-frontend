import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';

function safeUser() {
  try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; }
}

export default function GroupCreate() {
  const navigate = useNavigate();
  const me = safeUser();
  const token = localStorage.getItem('velogo_token');
  const headers = { Authorization: `Bearer ${token}` };

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [joinMode, setJoinMode] = useState('open');
  const [logo, setLogo] = useState('');
  const [background, setBackground] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [bgPreview, setBgPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const logoRef = useRef(null);
  const bgRef = useRef(null);

  const handleImage = (file, type) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'logo') { setLogoPreview(e.target.result); setLogo(e.target.result); }
      else { setBgPreview(e.target.result); setBackground(e.target.result); }
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Group name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/groups', { name, description, logo, background, joinMode }, { headers });
      navigate(`/group/${data._id}`);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create group');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar onMenuToggle={() => {}} />
      <div className="pt-20 max-w-2xl mx-auto px-4 pb-20">
        <h1 className="text-white text-2xl font-bold mb-8">Create Group</h1>

        {/* Background */}
        <div className="relative w-full h-40 rounded-2xl bg-zinc-800 overflow-hidden mb-4 cursor-pointer group"
          onClick={() => bgRef.current?.click()}>
          {bgPreview
            ? <img src={bgPreview} className="w-full h-full object-cover" alt="background" />
            : <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-zinc-500 text-sm">Click to upload background</p>
              </div>}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <p className="text-white text-sm font-medium">Change background</p>
          </div>
          <input ref={bgRef} type="file" accept="image/*" className="hidden"
            onChange={e => handleImage(e.target.files[0], 'bg')} />
        </div>

        {/* Logo */}
        <div className="flex items-end gap-4 mb-8 -mt-12 pl-6">
          <div className="relative w-24 h-24 rounded-2xl bg-zinc-700 overflow-hidden cursor-pointer group border-4 border-[#0f0f0f] flex-shrink-0"
            onClick={() => logoRef.current?.click()}>
            {logoPreview
              ? <img src={logoPreview} className="w-full h-full object-cover" alt="logo" />
              : <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden"
              onChange={e => handleImage(e.target.files[0], 'logo')} />
          </div>
          <p className="text-zinc-500 text-xs mb-2">Group logo</p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Group name *</label>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={80}
              placeholder="Enter group name..."
              className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl outline-none placeholder-zinc-500 border border-zinc-700 focus:border-red-500 transition" />
            <p className="text-zinc-600 text-xs mt-1 text-right">{name.length}/80</p>
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1.5 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={500} rows={3}
              placeholder="What is this group about?"
              className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl outline-none placeholder-zinc-500 border border-zinc-700 focus:border-red-500 transition resize-none" />
            <p className="text-zinc-600 text-xs mt-1 text-right">{description.length}/500</p>
          </div>

          {/* Join mode */}
          <div>
            <label className="text-zinc-400 text-sm mb-3 block">Who can join?</label>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${joinMode === 'open' ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'}`}>
                <input type="radio" name="joinMode" value="open" checked={joinMode === 'open'} onChange={() => setJoinMode('open')} className="mt-0.5 accent-red-500" />
                <div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                    <span className="text-white font-medium text-sm">Anyone</span>
                  </div>
                  <p className="text-zinc-400 text-xs mt-0.5">Anyone can join instantly without approval</p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${joinMode === 'request' ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'}`}>
                <input type="radio" name="joinMode" value="request" checked={joinMode === 'request'} onChange={() => setJoinMode('request')} className="mt-0.5 accent-red-500" />
                <div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-white font-medium text-sm">Request only</span>
                  </div>
                  <p className="text-zinc-400 text-xs mt-0.5">Members must be approved by you before joining</p>
                </div>
              </label>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={() => navigate(-1)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-full font-medium transition">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={loading || !name.trim()}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-full font-semibold transition disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
