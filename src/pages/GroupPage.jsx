import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { mediaUrl } from '../utils/mediaUrl';
import FounderBadge from '../components/FounderBadge';
import VerifiedBadge from '../components/VerifiedBadge';

function safeUser() {
  try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; }
}

const TABS = ['About', 'Members', 'Ranks'];

export default function GroupPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = safeUser();
  const token = localStorage.getItem('velogo_token');
  const headers = { Authorization: `Bearer ${token}` };

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('About');
  const [joinStatus, setJoinStatus] = useState(null); // 'member' | 'pending' | null
  const [joinLoading, setJoinLoading] = useState(false);

  // Ranks state (owner)
  const [showRankModal, setShowRankModal] = useState(false);
  const [rankName, setRankName] = useState('');
  const [rankColor, setRankColor] = useState('#6b7280');
  const [rankLoading, setRankLoading] = useState(false);

  // Announcement state (owner)
  const [announcementText, setAnnouncementText] = useState('');
  const [postingAnn, setPostingAnn] = useState(false);

  const isOwner = group && String(group.owner?._id || group.owner) === me.id;

  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/groups/${id}`).then(r => {
      setGroup(r.data);
      const membIds = (r.data.members || []).map(m => String(m._id || m));
      const reqIds = (r.data.requests || []).map(m => String(m._id || m));
      if (membIds.includes(me.id)) setJoinStatus('member');
      else if (reqIds.includes(me.id)) setJoinStatus('pending');
    }).catch(e => {
      setError(e.response?.data?.message || 'Failed to load group');
    }).finally(() => setLoading(false));
  }, [id]);

  const handleJoin = async () => {
    setJoinLoading(true);
    try {
      const { data } = await api.post(`/api/groups/${id}/join`, {}, { headers });
      setJoinStatus(data.status);
      if (data.status === 'member') setGroup(g => ({ ...g, members: [...(g.members || []), { _id: me.id, name: me.name, username: me.username, avatar: me.avatar }] }));
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setJoinLoading(false);
  };

  const createRank = async () => {
    if (!rankName.trim()) return;
    setRankLoading(true);
    try {
      const { data } = await api.post(`/api/groups/${id}/ranks`, { name: rankName, color: rankColor }, { headers });
      setGroup(g => ({ ...g, ranks: [...(g.ranks || []), data] }));
      setRankName(''); setRankColor('#6b7280'); setShowRankModal(false);
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setRankLoading(false);
  };

  const deleteRank = async (rankId) => {
    if (!confirm('Delete this rank?')) return;
    await api.delete(`/api/groups/${id}/ranks/${rankId}`, { headers });
    setGroup(g => ({ ...g, ranks: g.ranks.filter(r => r._id !== rankId) }));
  };

  const assignRank = async (rankId, userId) => {
    await api.post(`/api/groups/${id}/ranks/${rankId}/assign/${userId}`, {}, { headers });
    setGroup(g => ({
      ...g,
      ranks: g.ranks.map(r => ({
        ...r,
        members: r._id === rankId
          ? [...(r.members || []).filter(m => String(m._id || m) !== userId), userId]
          : (r.members || []).filter(m => String(m._id || m) !== userId),
      })),
    }));
  };

  const postAnnouncement = async () => {
    if (!announcementText.trim()) return;
    setPostingAnn(true);
    try {
      const { data } = await api.post(`/api/groups/${id}/announcements`, { text: announcementText }, { headers });
      setGroup(g => ({ ...g, announcements: [data, ...(g.announcements || [])] }));
      setAnnouncementText('');
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setPostingAnn(false);
  };

  const getMemberRank = (memberId) => {
    if (!group?.ranks) return null;
    for (const rank of group.ranks) {
      if ((rank.members || []).map(m => String(m._id || m)).includes(String(memberId))) return rank;
    }
    return null;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-3">
      <Navbar onMenuToggle={() => {}} />
      <p className="text-red-400 text-sm">{error}</p>
      <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white text-sm underline">Go back</button>
    </div>
  );
  if (!group) return null;

  const memberCount = group.members?.length || 0;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar onMenuToggle={() => {}} />

      {/* Rank create modal */}
      {showRankModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1c] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-zinc-800">
            <h2 className="text-white font-semibold text-lg mb-4">Create rank</h2>
            <input value={rankName} onChange={e => setRankName(e.target.value)} maxLength={50}
              placeholder="Rank name..."
              className="w-full bg-zinc-800 text-white px-4 py-2.5 rounded-xl outline-none placeholder-zinc-500 mb-3 border border-zinc-700 focus:border-red-500" />
            <div className="flex items-center gap-3 mb-5">
              <label className="text-zinc-400 text-sm">Color</label>
              <input type="color" value={rankColor} onChange={e => setRankColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <span className="text-zinc-400 text-sm font-mono">{rankColor}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowRankModal(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2.5 rounded-full text-sm transition">Cancel</button>
              <button onClick={createRank} disabled={rankLoading || !rankName.trim()}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-full text-sm font-semibold transition disabled:opacity-50">
                {rankLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-14">
        {/* Background */}
        <div className="relative w-full h-52 bg-zinc-800 overflow-hidden">
          {group.background
            ? <img src={group.background} className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />}
        </div>

        {/* Header info */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-end gap-5 -mt-14 mb-4">
            <div className="w-28 h-28 rounded-2xl bg-zinc-700 overflow-hidden border-4 border-[#0f0f0f] flex-shrink-0">
              {group.logo
                ? <img src={group.logo} className="w-full h-full object-cover" alt={group.name} />
                : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
                    <span className="text-white font-bold text-3xl">{group.name[0]?.toUpperCase()}</span>
                  </div>}
            </div>
            <div className="pb-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-white text-2xl font-bold">{group.name}</h1>
              </div>
              <p className="text-zinc-400 text-sm mt-0.5">
                By{' '}
                <button onClick={() => group.owner?.username && navigate(`/c/${group.owner.username}`)}
                  className="text-white hover:underline font-medium">
                  {group.owner?.name || 'Unknown'}
                </button>
              </p>
            </div>
            {/* Join button */}
            <div className="pb-2 flex-shrink-0">
              {joinStatus === 'member' ? (
                <span className="bg-zinc-700 text-zinc-300 px-5 py-2 rounded-full text-sm font-medium">Member ✓</span>
              ) : joinStatus === 'pending' ? (
                <span className="bg-zinc-700 text-yellow-400 px-5 py-2 rounded-full text-sm font-medium">Request sent</span>
              ) : isOwner ? (
                <span className="bg-zinc-700 text-zinc-300 px-5 py-2 rounded-full text-sm font-medium">Owner</span>
              ) : (
                <button onClick={handleJoin} disabled={joinLoading}
                  className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50">
                  {joinLoading ? '...' : group.joinMode === 'open' ? 'Join' : 'Request to join'}
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-3 flex-wrap mb-6">
            <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-full font-medium">
              👥 {memberCount.toLocaleString()} Members
            </span>
            <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-full font-medium">
              {group.joinMode === 'open' ? '🌍 Open' : '🔒 Request only'}
            </span>
            <span className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-full font-medium">
              📅 {new Date(group.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-800 mb-8">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-6 py-3 text-sm font-medium transition border-b-2 -mb-px ${tab === t ? 'text-white border-white' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* About tab */}
          {tab === 'About' && (
            <div className="max-w-2xl space-y-6 pb-16">
              {group.description && (
                <div>
                  <h2 className="text-white font-semibold mb-2">Description</h2>
                  <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{group.description}</p>
                </div>
              )}

              {/* Announcements */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-semibold">Announcements</h2>
                </div>
                {isOwner && (
                  <div className="mb-4 bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                    <textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)}
                      maxLength={2000} rows={3} placeholder="Write an announcement..."
                      className="w-full bg-zinc-800 text-white text-sm px-3 py-2.5 rounded-lg outline-none placeholder-zinc-500 resize-none border border-zinc-700 focus:border-red-500 mb-2" />
                    <div className="flex justify-end">
                      <button onClick={postAnnouncement} disabled={postingAnn || !announcementText.trim()}
                        className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50">
                        {postingAnn ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </div>
                )}
                {(group.announcements || []).length === 0 && <p className="text-zinc-600 text-sm">No announcements yet.</p>}
                <div className="space-y-4">
                  {(group.announcements || []).map((ann, i) => (
                    <div key={i} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                          {ann.author?.avatar && <img src={mediaUrl(ann.author.avatar)} className="w-full h-full object-cover" alt="" />}
                        </div>
                        <span className="text-white text-sm font-medium">{ann.author?.name}</span>
                        <span className="text-zinc-600 text-xs">{ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{ann.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Members tab */}
          {tab === 'Members' && (
            <div className="pb-16">
              <p className="text-zinc-500 text-sm mb-4">{memberCount.toLocaleString()} members</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(group.members || []).map(m => {
                  const membId = String(m._id || m);
                  const rank = getMemberRank(membId);
                  const isThisOwner = String(group.owner?._id || group.owner) === membId;
                  return (
                    <div key={membId} className="flex items-center gap-3 bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
                      <div className="w-9 h-9 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0 cursor-pointer"
                        onClick={() => m.username && navigate(`/c/${m.username}`)}>
                        {m.avatar && <img src={mediaUrl(m.avatar)} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {m.isFounder && <FounderBadge size={14} />}
                          <span className="text-white text-sm font-medium truncate">{m.name || m.username}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isThisOwner && <span className="text-xs text-blue-400 font-medium">Owner</span>}
                          {rank && <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ color: rank.color, backgroundColor: rank.color + '20' }}>{rank.name}</span>}
                        </div>
                      </div>
                      {/* Assign rank (owner) */}
                      {isOwner && !isThisOwner && (group.ranks || []).length > 0 && (
                        <select
                          value={rank?._id || ''}
                          onChange={e => e.target.value && assignRank(e.target.value, membId)}
                          className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-lg border border-zinc-700 outline-none cursor-pointer"
                        >
                          <option value="">No rank</option>
                          {(group.ranks || []).map(r => (
                            <option key={r._id} value={r._id}>{r.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pending requests (owner) */}
              {isOwner && (group.requests || []).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-white font-semibold mb-3">Join requests ({group.requests.length})</h3>
                  <div className="space-y-2">
                    {group.requests.map(r => {
                      const rId = String(r._id || r);
                      return (
                        <div key={rId} className="flex items-center gap-3 bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
                          <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                            {r.avatar && <img src={mediaUrl(r.avatar)} className="w-full h-full object-cover" alt="" />}
                          </div>
                          <span className="text-white text-sm flex-1">{r.name || r.username}</span>
                          <button onClick={async () => {
                            await api.post(`/api/groups/${id}/requests/${rId}/accept`, {}, { headers });
                            setGroup(g => ({ ...g, requests: g.requests.filter(x => String(x._id || x) !== rId), members: [...g.members, r] }));
                          }} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-full transition">Accept</button>
                          <button onClick={async () => {
                            await api.post(`/api/groups/${id}/requests/${rId}/decline`, {}, { headers });
                            setGroup(g => ({ ...g, requests: g.requests.filter(x => String(x._id || x) !== rId) }));
                          }} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-3 py-1.5 rounded-full transition">Decline</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ranks tab */}
          {tab === 'Ranks' && (
            <div className="pb-16 max-w-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-semibold">Ranks</h2>
                {isOwner && (
                  <button onClick={() => setShowRankModal(true)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New rank
                  </button>
                )}
              </div>
              {(group.ranks || []).length === 0 && <p className="text-zinc-600 text-sm">No ranks yet.{isOwner ? ' Create one above.' : ''}</p>}
              <div className="space-y-3">
                {(group.ranks || []).map(rank => (
                  <div key={rank._id} className="bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: rank.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium" style={{ color: rank.color }}>{rank.name}</p>
                      <p className="text-zinc-500 text-xs">{(rank.members || []).length} members</p>
                    </div>
                    {isOwner && (
                      <button onClick={() => deleteRank(rank._id)}
                        className="text-zinc-600 hover:text-red-400 transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
