import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { mediaUrl } from '../utils/mediaUrl';
import FounderBadge from '../components/FounderBadge';

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
  const [error, setError] = useState('');
  const [tab, setTab] = useState('About');
  const [joinStatus, setJoinStatus] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);

  const [showRankModal, setShowRankModal] = useState(false);
  const [rankName, setRankName] = useState('');
  const [rankColor, setRankColor] = useState('#a855f7');
  const [rankLoading, setRankLoading] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [postingAnn, setPostingAnn] = useState(false);

  const isOwner = group && String(group.owner?._id || group.owner) === me.id;

  useEffect(() => {
    api.get(`/api/groups/${id}`)
      .then(r => {
        setGroup(r.data);
        const membIds = (r.data.members || []).map(m => String(m._id || m));
        const reqIds = (r.data.requests || []).map(m => String(m._id || m));
        if (membIds.includes(me.id)) setJoinStatus('member');
        else if (reqIds.includes(me.id)) setJoinStatus('pending');
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load group'))
      .finally(() => setLoading(false));
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
      setRankName(''); setRankColor('#a855f7'); setShowRankModal(false);
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setRankLoading(false);
  };

  const deleteRank = async (rankId) => {
    if (!confirm('Delete this rank?')) return;
    await api.delete(`/api/groups/${id}/ranks/${rankId}`, { headers });
    setGroup(g => ({ ...g, ranks: g.ranks.filter(r => r._id !== rankId) }));
  };

  const assignRank = async (rankId, userId) => {
    try {
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
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
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
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Navbar onMenuToggle={() => {}} />
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="text-red-400">{error}</p>
        <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white text-sm underline">Go back</button>
      </div>
    </div>
  );

  if (!group) return null;

  const memberCount = group.members?.length || 0;

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <Navbar onMenuToggle={() => {}} />

      {/* Rank modal */}
      {showRankModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1c] rounded-2xl p-6 w-full max-w-sm border border-zinc-800">
            <h2 className="text-white font-semibold text-lg mb-4">Create rank</h2>
            <input value={rankName} onChange={e => setRankName(e.target.value)} maxLength={50}
              placeholder="Rank name..."
              className="w-full bg-zinc-800 text-white px-4 py-2.5 rounded-xl outline-none placeholder-zinc-500 mb-3 border border-zinc-700 focus:border-red-500" />
            <div className="flex items-center gap-3 mb-5">
              <label className="text-zinc-400 text-sm">Color</label>
              <input type="color" value={rankColor} onChange={e => setRankColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0" />
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
        {/* Banner */}
        <div className="w-full h-56 bg-zinc-800 relative overflow-hidden">
          {group.background
            ? <img src={group.background} className="w-full h-full object-contain" alt="" />
            : <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />}
        </div>

        {/* Profile section */}
        <div className="bg-[#1a1a1a] border-b border-zinc-800">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-end gap-5 -mt-16 pb-5">
              {/* Logo */}
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-[#1a1a1a] flex-shrink-0 bg-zinc-700">
                {group.logo
                  ? <img src={group.logo} className="w-full h-full object-cover" alt={group.name} />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-700 to-purple-900">
                      <span className="text-white font-black text-4xl">{group.name[0]?.toUpperCase()}</span>
                    </div>}
              </div>

              {/* Name + owner */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-white text-2xl font-bold">{group.name}</h1>
                </div>
                <p className="text-zinc-400 text-sm mt-0.5">
                  By{' '}
                  <button onClick={() => group.owner?.username && navigate(`/c/${group.owner.username}`)}
                    className="text-white hover:underline font-medium">
                    {group.owner?.name || 'Unknown'}
                  </button>
                  {group.owner?.isFounder && <span className="ml-1 inline-flex"><FounderBadge size={14} /></span>}
                </p>
              </div>

              {/* Join / status button */}
              <div className="pb-1 flex-shrink-0">
                {isOwner ? (
                  <span className="bg-zinc-700 text-zinc-300 px-5 py-2 rounded-full text-sm font-medium">Owner</span>
                ) : joinStatus === 'member' ? (
                  <span className="bg-zinc-700 text-green-400 px-5 py-2 rounded-full text-sm font-medium flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    Member
                  </span>
                ) : joinStatus === 'pending' ? (
                  <span className="bg-zinc-700 text-yellow-400 px-5 py-2 rounded-full text-sm font-medium">Pending</span>
                ) : (
                  <button onClick={handleJoin} disabled={joinLoading}
                    className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50">
                    {joinLoading ? '...' : group.joinMode === 'open' ? 'Join Group' : 'Request to Join'}
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-2 flex-wrap pb-4">
              <div className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-full font-medium">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
                {memberCount.toLocaleString()}+ Members
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-full font-medium">
                {group.joinMode === 'open' ? '🌍 Open' : '🔒 Request only'}
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-full font-medium">
                📅 {new Date(group.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} Created
              </div>
              {(group.ranks || []).length > 0 && (
                <div className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-full font-medium">
                  🏅 {group.ranks.length} Ranks
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#1a1a1a] border-b border-zinc-800 sticky top-14 z-10">
          <div className="max-w-5xl mx-auto px-6 flex">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-6 py-3.5 text-sm font-medium transition border-b-2 -mb-px ${tab === t ? 'text-white border-white' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                {t}
                {t === 'Members' && <span className="ml-1.5 text-zinc-600 text-xs">({memberCount})</span>}
                {t === 'Ranks' && (group.ranks || []).length > 0 && <span className="ml-1.5 text-zinc-600 text-xs">({group.ranks.length})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 py-8 pb-20">

          {/* ── About ── */}
          {tab === 'About' && (
            <div className="max-w-2xl space-y-8">
              {group.description && (
                <div className="bg-[#1a1a1a] rounded-xl p-5 border border-zinc-800">
                  <h2 className="text-white font-semibold mb-2">About</h2>
                  <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{group.description}</p>
                </div>
              )}

              {/* Announcements */}
              <div>
                <h2 className="text-white font-semibold text-lg mb-4">Announcements</h2>
                {isOwner && (
                  <div className="mb-5 bg-[#1a1a1a] rounded-xl p-4 border border-zinc-800">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0 mt-0.5">
                        {me.avatar && <img src={mediaUrl(me.avatar)} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div className="flex-1">
                        <textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)}
                          maxLength={2000} rows={3} placeholder="Write an announcement..."
                          className="w-full bg-zinc-800 text-white text-sm px-3 py-2.5 rounded-lg outline-none placeholder-zinc-500 resize-none border border-zinc-700 focus:border-zinc-500 mb-2" />
                        <div className="flex justify-end">
                          <button onClick={postAnnouncement} disabled={postingAnn || !announcementText.trim()}
                            className="bg-red-600 hover:bg-red-500 text-white px-5 py-1.5 rounded-full text-sm font-semibold transition disabled:opacity-50">
                            {postingAnn ? 'Posting...' : 'Post'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(group.announcements || []).length === 0 && (
                  <p className="text-zinc-600 text-sm">No announcements yet.</p>
                )}

                <div className="space-y-4">
                  {(group.announcements || []).map((ann, i) => {
                    const authorRank = getMemberRank(String(ann.author?._id || ann.author));
                    const authorIsOwner = String(ann.author?._id || ann.author) === String(group.owner?._id || group.owner);
                    return (
                      <div key={i} className="bg-[#1a1a1a] rounded-xl border border-zinc-800 overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60">
                          <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                            {ann.author?.avatar && <img src={mediaUrl(ann.author.avatar)} className="w-full h-full object-cover" alt="" />}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white text-sm font-semibold">{ann.author?.name || 'Unknown'}</span>
                            {ann.author?.isFounder && <FounderBadge size={13} />}
                            {authorIsOwner && <span className="bg-blue-500/20 text-blue-400 text-[11px] font-semibold px-2 py-0.5 rounded">Owner</span>}
                            {authorRank && <span className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ color: authorRank.color, backgroundColor: authorRank.color + '22' }}>{authorRank.name}</span>}
                            <span className="text-zinc-600 text-xs">· {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : ''}</span>
                          </div>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{ann.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Members ── */}
          {tab === 'Members' && (
            <div>
              {/* Join requests (owner) */}
              {isOwner && (group.requests || []).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    Join Requests
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{group.requests.length}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.requests.map(r => {
                      const rId = String(r._id || r);
                      return (
                        <div key={rId} className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl px-4 py-3 border border-zinc-700">
                          <div className="w-9 h-9 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                            {r.avatar && <img src={mediaUrl(r.avatar)} className="w-full h-full object-cover" alt="" />}
                          </div>
                          <span className="text-white text-sm flex-1 font-medium">{r.name || r.username}</span>
                          <button onClick={async () => {
                            await api.post(`/api/groups/${id}/requests/${rId}/accept`, {}, { headers });
                            setGroup(g => ({ ...g, requests: g.requests.filter(x => String(x._id || x) !== rId), members: [...g.members, r] }));
                          }} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-full transition font-medium">Accept</button>
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

              <h3 className="text-white font-semibold mb-4 text-lg">{memberCount.toLocaleString()} Members</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(group.members || []).map(m => {
                  const membId = String(m._id || m);
                  const rank = getMemberRank(membId);
                  const isThisOwner = String(group.owner?._id || group.owner) === membId;
                  return (
                    <div key={membId} className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl px-4 py-3 border border-zinc-800 hover:border-zinc-700 transition">
                      <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0 cursor-pointer"
                        onClick={() => m.username && navigate(`/c/${m.username}`)}>
                        {m.avatar && <img src={mediaUrl(m.avatar)} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {m.isFounder && <FounderBadge size={13} />}
                          <span className="text-white text-sm font-medium truncate">{m.name || m.username}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isThisOwner && <span className="text-[11px] text-blue-400 font-semibold">Owner</span>}
                          {rank
                            ? <span className="text-[11px] font-semibold" style={{ color: rank.color }}>{rank.name}</span>
                            : !isThisOwner && <span className="text-[11px] text-zinc-600">Member</span>}
                        </div>
                      </div>
                      {isOwner && !isThisOwner && (group.ranks || []).length > 0 && (
                        <select
                          value={rank?._id || ''}
                          onChange={e => e.target.value && assignRank(e.target.value, membId)}
                          className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-lg border border-zinc-700 outline-none cursor-pointer max-w-[100px]"
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
            </div>
          )}

          {/* ── Ranks ── */}
          {tab === 'Ranks' && (
            <div className="max-w-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-semibold text-lg">Ranks</h2>
                {isOwner && (
                  <button onClick={() => setShowRankModal(true)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New rank
                  </button>
                )}
              </div>

              {(group.ranks || []).length === 0 && (
                <div className="text-center py-16 text-zinc-600">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                  <p className="text-sm">{isOwner ? 'No ranks yet. Create one to assign roles to members.' : 'No ranks in this group yet.'}</p>
                </div>
              )}

              <div className="space-y-2">
                {(group.ranks || []).map((rank, i) => (
                  <div key={rank._id} className="flex items-center gap-4 bg-[#1a1a1a] rounded-xl px-4 py-3.5 border border-zinc-800">
                    <span className="text-zinc-500 text-xs font-mono w-5 text-center">{i + 1}</span>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: rank.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: rank.color }}>{rank.name}</p>
                      <p className="text-zinc-500 text-xs">{(rank.members || []).length} members</p>
                    </div>
                    {isOwner && (
                      <button onClick={() => deleteRank(rank._id)}
                        className="text-zinc-600 hover:text-red-400 transition p-1">
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
