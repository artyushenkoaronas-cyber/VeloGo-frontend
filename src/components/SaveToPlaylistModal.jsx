import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const VISIBILITY_ICONS = {
  public: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.8} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  ),
  unlisted: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  private: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={1.8} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
};

const VISIBILITY_LABELS = {
  public: { label: 'Public', desc: 'Anyone can search for and view' },
  unlisted: { label: 'Unlisted', desc: 'Anyone with the link can view' },
  private: { label: 'Private', desc: 'Only you can view' }
};

export default function SaveToPlaylistModal({ videoId, onClose }) {
  const [playlists, setPlaylists] = useState([]);
  const [saved, setSaved] = useState({});
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [visOpen, setVisOpen] = useState(false);
  const [collaborate, setCollaborate] = useState(false);
  const [collabUser, setCollabUser] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('velogo_token');
  const headers = { Authorization: `Bearer ${token}` };
  const ref = useRef(null);

  useEffect(() => {
    loadPlaylists();
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadPlaylists = async () => {
    try {
      const { data } = await axios.get('/api/playlists/mine', { headers });
      setPlaylists(data);
      const map = {};
      data.forEach(p => { map[p._id] = p.videos.includes(videoId); });
      setSaved(map);
    } catch {}
  };

  const toggle = async (plId) => {
    try {
      const { data } = await axios.put(`/api/playlists/${plId}/videos/${videoId}`, {}, { headers });
      setSaved(s => ({ ...s, [plId]: data.saved }));
    } catch {}
  };

  const createPlaylist = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.post('/api/playlists', {
        title: title.trim(),
        visibility,
        collaborate,
        collaboratorUsername: collaborate ? collabUser : ''
      }, { headers });
      await axios.put(`/api/playlists/${data._id}/videos/${videoId}`, {}, { headers });
      setPlaylists(p => [data, ...p]);
      setSaved(s => ({ ...s, [data._id]: true }));
      setCreating(false);
      setTitle('');
      setVisibility('private');
      setCollaborate(false);
      setCollabUser('');
    } catch {}
    setLoading(false);
  };

  const getThumb = (pl) => {
    return pl.thumbnail || null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div ref={ref} className="bg-white rounded-2xl shadow-2xl w-[340px] max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {!creating ? (
          <>
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-gray-900 text-base font-semibold">Save to...</h2>
            </div>

            <div className="overflow-y-auto flex-1 px-2">
              {playlists.map(pl => (
                <button key={pl._id} onClick={() => toggle(pl._id)}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-100 rounded-xl transition">
                  <div className="w-12 h-9 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-gray-900 text-sm font-medium truncate">{pl.title}</p>
                    <p className="text-gray-500 text-xs capitalize">{pl.visibility}</p>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${saved[pl._id] ? 'bg-black border-black' : 'border-gray-400'}`}>
                    {saved[pl._id] && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 px-2 py-2">
              <button onClick={() => setCreating(true)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-100 rounded-xl transition text-gray-700">
                <div className="w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium">New playlist</span>
              </button>
            </div>
          </>
        ) : (
          <div className="px-5 py-5 flex flex-col gap-4">
            <h2 className="text-gray-900 text-base font-semibold">New playlist</h2>

            <input
              autoFocus
              type="text"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
            />

            {/* Visibility picker */}
            <div className="relative">
              <p className="text-gray-500 text-xs mb-1">Visibility</p>
              <button onClick={() => setVisOpen(p => !p)}
                className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition">
                <span className="capitalize">{visibility}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {visOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {Object.entries(VISIBILITY_LABELS).map(([key, val]) => (
                    <button key={key} onClick={() => { setVisibility(key); setVisOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                      <span className="text-gray-600">{VISIBILITY_ICONS[key]}</span>
                      <div className="text-left flex-1">
                        <p className="text-sm text-gray-900 font-medium">{val.label}</p>
                        <p className="text-xs text-gray-500">{val.desc}</p>
                      </div>
                      {visibility === key && (
                        <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Collaborate toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-900">Collaborate</span>
              <button onClick={() => setCollaborate(p => !p)}
                className={`w-12 h-6 rounded-full transition relative ${collaborate ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${collaborate ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Collaborator username input — only if collaborate + public */}
            {collaborate && visibility === 'public' && (
              <input
                type="text"
                placeholder="Enter collaborator username"
                value={collabUser}
                onChange={e => setCollabUser(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
              />
            )}

            <div className="flex items-center justify-between mt-1">
              <button onClick={() => setCreating(false)} className="text-sm text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition">Cancel</button>
              <button onClick={createPlaylist} disabled={!title.trim() || loading}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition disabled:opacity-40">
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
