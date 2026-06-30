import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { mediaUrl } from '../utils/mediaUrl';
import FounderBadge from '../components/FounderBadge';

function safeUser() {
  try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; }
}

const TABS = ['Wall', 'About', 'Events', 'Members', 'Ranks'];

const REACTION_EMOJIS = ['❤️', '😢', '👍', '😡', '🔥', '💀', '😱'];

function compressImage(file, maxW, maxH, quality = 0.8) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = url;
  });
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getReactionCounts(reactions) {
  const map = {};
  for (const r of reactions || []) {
    map[r.emoji] = (map[r.emoji] || 0) + 1;
  }
  return map;
}

export default function GroupPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = safeUser();
  const token = localStorage.getItem('velogo_token');
  const headers = { Authorization: `Bearer ${token}` };

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Wall');
  const [joinStatus, setJoinStatus] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);

  // Posts / Wall
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postText, setPostText] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState(null);

  // Ranks
  const [showRankModal, setShowRankModal] = useState(false);
  const [rankName, setRankName] = useState('');
  const [rankColor, setRankColor] = useState('#a855f7');
  const [rankLoading, setRankLoading] = useState(false);
  const [savingPermission, setSavingPermission] = useState(false);

  // Announcements
  const [announcementText, setAnnouncementText] = useState('');
  const [annImage, setAnnImage] = useState('');
  const [annImagePreview, setAnnImagePreview] = useState('');
  const [postingAnn, setPostingAnn] = useState(false);
  const annImgRef = useRef(null);

  // Events
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventImage, setEventImage] = useState('');
  const [eventImagePreview, setEventImagePreview] = useState('');
  const [eventLoading, setEventLoading] = useState(false);
  const eventImgRef = useRef(null);

  // Members filter
  const [memberRankFilter, setMemberRankFilter] = useState('all');

  const isOwner = group && String(group.owner?._id || group.owner) === me.id;
  const isMember = group && (group.members || []).map(m => String(m._id || m)).includes(me.id);

  const canPost = () => {
    if (!group || !isMember && !isOwner) return false;
    const perm = group.postPermission || 'all';
    if (isOwner) return true;
    if (perm === 'all' || perm === 'members') return true;
    // rank-based
    const allowedIds = perm.split(',').filter(Boolean);
    const myRanks = (group.ranks || [])
      .filter(r => (r.members || []).map(m => String(m._id || m)).includes(me.id))
      .map(r => r._id);
    return allowedIds.some(rid => myRanks.includes(rid));
  };

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

  useEffect(() => {
    if (tab === 'Wall') {
      setPostsLoading(true);
      api.get(`/api/groups/${id}/posts`)
        .then(r => setPosts(r.data))
        .catch(() => {})
        .finally(() => setPostsLoading(false));
    }
  }, [tab, id]);

  const handleJoin = async () => {
    setJoinLoading(true);
    try {
      const { data } = await api.post(`/api/groups/${id}/join`, {}, { headers });
      setJoinStatus(data.status);
      if (data.status === 'member') {
        setGroup(g => ({ ...g, members: [...(g.members || []), { _id: me.id, name: me.name, username: me.username, avatar: me.avatar }] }));
      }
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setJoinLoading(false);
  };

  const submitPost = async () => {
    if (!postText.trim()) return;
    setSubmittingPost(true);
    try {
      const { data } = await api.post(`/api/groups/${id}/posts`, { title: postTitle, text: postText }, { headers });
      setPosts(p => [data, ...p]);
      setPostTitle(''); setPostText('');
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setSubmittingPost(false);
  };

  const submitReply = async (postId) => {
    const text = replyTexts[postId];
    if (!text?.trim()) return;
    setSubmittingReply(s => ({ ...s, [postId]: true }));
    try {
      const { data } = await api.post(`/api/groups/${id}/posts/${postId}/replies`, { text }, { headers });
      setPosts(ps => ps.map(p => p._id === postId ? { ...p, replies: [...(p.replies || []), data] } : p));
      setReplyTexts(t => ({ ...t, [postId]: '' }));
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setSubmittingReply(s => ({ ...s, [postId]: false }));
  };

  const toggleReaction = async (postId, emoji) => {
    try {
      const { data } = await api.post(`/api/groups/${id}/posts/${postId}/react`, { emoji }, { headers });
      setPosts(ps => ps.map(p => p._id === postId ? { ...p, reactions: data.reactions } : p));
    } catch {}
    setShowReactionPicker(null);
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

  const savePostPermission = async (val) => {
    setSavingPermission(true);
    try {
      await api.patch(`/api/groups/${id}/post-permission`, { postPermission: val }, { headers });
      setGroup(g => ({ ...g, postPermission: val }));
    } catch (e) { alert('Error saving permission'); }
    setSavingPermission(false);
  };

  const handleAnnImage = async (file) => {
    if (!file) return;
    const compressed = await compressImage(file, 1200, 800);
    setAnnImage(compressed); setAnnImagePreview(compressed);
  };

  const postAnnouncement = async () => {
    if (!announcementText.trim() && !annImage) return;
    setPostingAnn(true);
    try {
      const { data } = await api.post(`/api/groups/${id}/announcements`, { text: announcementText, image: annImage }, { headers });
      setGroup(g => ({ ...g, announcements: [data, ...(g.announcements || [])] }));
      setAnnouncementText(''); setAnnImage(''); setAnnImagePreview('');
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setPostingAnn(false);
  };

  const handleEventImage = async (file) => {
    if (!file) return;
    const compressed = await compressImage(file, 800, 500);
    setEventImage(compressed); setEventImagePreview(compressed);
  };

  const createEvent = async () => {
    if (!eventTitle.trim()) return;
    setEventLoading(true);
    try {
      const { data } = await api.post(`/api/groups/${id}/events`, { title: eventTitle, description: eventDesc, image: eventImage, date: eventDate || null }, { headers });
      setGroup(g => ({ ...g, events: [data, ...(g.events || [])] }));
      setEventTitle(''); setEventDesc(''); setEventDate(''); setEventImage(''); setEventImagePreview('');
      setShowEventModal(false);
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    setEventLoading(false);
  };

  const deleteEvent = async (eventId) => {
    if (!confirm('Delete this event?')) return;
    await api.delete(`/api/groups/${id}/events/${eventId}`, { headers });
    setGroup(g => ({ ...g, events: g.events.filter(e => e._id !== eventId) }));
  };

  const getMemberRank = (memberId) => {
    if (!group?.ranks) return null;
    for (const rank of group.ranks) {
      if ((rank.members || []).map(m => String(m._id || m)).includes(String(memberId))) return rank;
    }
    return null;
  };

  const getAuthorRankInGroup = (authorId) => getMemberRank(String(authorId));

  const filteredMembers = () => {
    if (!group) return [];
    const members = group.members || [];
    if (memberRankFilter === 'all') return members;
    return members.filter(m => {
      const rank = getMemberRank(String(m._id || m));
      return rank && rank._id === memberRankFilter;
    });
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
    <div className="min-h-screen bg-[#111] text-white" onClick={() => setShowReactionPicker(null)}>
      <Navbar onMenuToggle={() => {}} />

      {/* Rank modal */}
      {showRankModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1c] rounded-2xl p-6 w-full max-w-sm border border-zinc-800">
            <h2 className="text-white font-semibold text-lg mb-4">Create rank</h2>
            <input value={rankName} onChange={e => setRankName(e.target.value)} maxLength={50} placeholder="Rank name..."
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

      {/* Event modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1c] rounded-2xl p-6 w-full max-w-md border border-zinc-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-white font-semibold text-lg mb-4">Create Event</h2>
            <div className="w-full h-40 rounded-xl bg-zinc-800 overflow-hidden mb-4 cursor-pointer relative group"
              onClick={() => eventImgRef.current?.click()}>
              {eventImagePreview
                ? <img src={eventImagePreview} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <span className="text-sm">Add event image</span>
                  </div>}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="text-white text-sm font-medium">Change image</span>
              </div>
              <input ref={eventImgRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleEventImage(e.target.files[0])} />
            </div>
            <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} maxLength={100} placeholder="Event title *"
              className="w-full bg-zinc-800 text-white px-4 py-2.5 rounded-xl outline-none placeholder-zinc-500 mb-3 border border-zinc-700 focus:border-red-500" />
            <textarea value={eventDesc} onChange={e => setEventDesc(e.target.value)} maxLength={500} rows={2} placeholder="Description (optional)"
              className="w-full bg-zinc-800 text-white px-4 py-2.5 rounded-xl outline-none placeholder-zinc-500 mb-3 border border-zinc-700 focus:border-red-500 resize-none" />
            <div className="mb-5">
              <label className="text-zinc-400 text-xs mb-1.5 block">Date & time</label>
              <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)}
                className="w-full bg-zinc-800 text-white px-4 py-2.5 rounded-xl outline-none border border-zinc-700 focus:border-red-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowEventModal(false); setEventTitle(''); setEventDesc(''); setEventDate(''); setEventImage(''); setEventImagePreview(''); }}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2.5 rounded-full text-sm transition">Cancel</button>
              <button onClick={createEvent} disabled={eventLoading || !eventTitle.trim()}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-full text-sm font-semibold transition disabled:opacity-50">
                {eventLoading ? 'Creating...' : 'Create Event'}
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

        {/* Profile header */}
        <div className="bg-[#1a1a1a] border-b border-zinc-800">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-end gap-5 -mt-16 pb-5">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-[#1a1a1a] flex-shrink-0 bg-zinc-700">
                {group.logo
                  ? <img src={group.logo} className="w-full h-full object-cover" alt={group.name} />
                  : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-700 to-purple-900">
                      <span className="text-white font-black text-4xl">{group.name[0]?.toUpperCase()}</span>
                    </div>}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-white text-2xl font-bold">{group.name}</h1>
                <p className="text-zinc-400 text-sm mt-0.5">
                  By{' '}
                  <button onClick={() => group.owner?.username && navigate(`/c/${group.owner.username}`)}
                    className="text-white hover:underline font-medium">{group.owner?.name || 'Unknown'}</button>
                  {group.owner?.isFounder && <span className="ml-1 inline-flex"><FounderBadge size={14} /></span>}
                </p>
              </div>
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
              <div className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-full font-medium">
                {group.joinMode === 'open' ? '🌍 Open' : '🔒 Request only'}
              </div>
              <div className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-full font-medium">
                📅 {new Date(group.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} Created
              </div>
              {posts.length > 0 && (
                <div className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-full font-medium">
                  📝 {posts.length} Posts
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#1a1a1a] border-b border-zinc-800 sticky top-14 z-10">
          <div className="max-w-5xl mx-auto px-6 flex overflow-x-auto">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3.5 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap ${tab === t ? 'text-white border-white' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                {t}
                {t === 'Members' && <span className="ml-1.5 text-zinc-600 text-xs">({memberCount})</span>}
                {t === 'Events' && (group.events || []).length > 0 && <span className="ml-1.5 text-zinc-600 text-xs">({group.events.length})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 py-8 pb-20">

          {/* ── Wall ── */}
          {tab === 'Wall' && (
            <div className="max-w-2xl">
              <h2 className="text-white font-semibold text-lg mb-5">Group Posts</h2>

              {/* Composer */}
              {canPost() && (
                <div className="bg-[#1a1a1a] rounded-2xl border border-zinc-800 p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0 mt-0.5">
                      {me.avatar && <img src={mediaUrl(me.avatar)} className="w-full h-full object-cover" alt="" />}
                    </div>
                    <div className="flex-1">
                      <input value={postTitle} onChange={e => setPostTitle(e.target.value)} maxLength={100}
                        placeholder="Title (optional)"
                        className="w-full bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg outline-none placeholder-zinc-600 border border-zinc-700 focus:border-zinc-500 mb-2" />
                      <textarea value={postText} onChange={e => setPostText(e.target.value)} maxLength={2000} rows={3}
                        placeholder="Write something..."
                        className="w-full bg-zinc-800 text-white text-sm px-3 py-2.5 rounded-lg outline-none placeholder-zinc-500 resize-none border border-zinc-700 focus:border-zinc-500 mb-2" />
                      <div className="flex justify-end">
                        <button onClick={submitPost} disabled={submittingPost || !postText.trim()}
                          className="bg-red-600 hover:bg-red-500 text-white px-5 py-1.5 rounded-full text-sm font-semibold transition disabled:opacity-50">
                          {submittingPost ? 'Posting...' : 'Post'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!canPost() && (isMember || isOwner) && (
                <div className="bg-[#1a1a1a] rounded-xl border border-zinc-800 p-4 mb-5 text-zinc-500 text-sm text-center">
                  Your rank doesn't have permission to post here.
                </div>
              )}

              {postsLoading && (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!postsLoading && posts.length === 0 && (
                <div className="text-center py-16 text-zinc-600">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  <p className="text-sm">No posts yet. Be the first to post!</p>
                </div>
              )}

              <div className="space-y-3">
                {posts.map(post => {
                  const reactionCounts = getReactionCounts(post.reactions);
                  const myReactions = (post.reactions || []).filter(r => String(r.user) === me.id).map(r => r.emoji);
                  const authorRank = getAuthorRankInGroup(String(post.author?._id || post.author));
                  const authorIsOwner = String(post.author?._id || post.author) === String(group.owner?._id || group.owner);
                  const isExpanded = expandedPost === post._id;

                  return (
                    <div key={post._id} className="bg-[#1a1a1a] rounded-2xl border border-zinc-800 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                          {post.author?.avatar && <img src={mediaUrl(post.author.avatar)} className="w-full h-full object-cover" alt="" />}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap flex-1">
                          <span className="text-white text-sm font-semibold">{post.author?.name || 'Unknown'}</span>
                          {post.author?.isFounder && <FounderBadge size={12} />}
                          {authorIsOwner && <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded">Owner</span>}
                          {authorRank && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: authorRank.color, backgroundColor: authorRank.color + '22' }}>{authorRank.name}</span>}
                          <span className="text-zinc-600 text-xs">· {timeAgo(post.createdAt)}</span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="px-4 pb-3">
                        {post.title && <p className="text-white font-bold text-base mb-1">{post.title}</p>}
                        <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{post.text}</p>
                      </div>

                      {/* Reactions row */}
                      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                        {/* Reaction picker */}
                        <div className="relative">
                          <button
                            onClick={e => { e.stopPropagation(); setShowReactionPicker(showReactionPicker === post._id ? null : post._id); }}
                            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-full text-sm transition">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          </button>
                          {showReactionPicker === post._id && (
                            <div className="absolute bottom-8 left-0 z-20 bg-[#2a2a2a] border border-zinc-700 rounded-2xl px-2 py-1.5 flex gap-1 shadow-xl"
                              onClick={e => e.stopPropagation()}>
                              {REACTION_EMOJIS.map(emoji => (
                                <button key={emoji} onClick={() => toggleReaction(post._id, emoji)}
                                  className={`text-lg hover:scale-125 transition-transform px-1 py-0.5 rounded ${myReactions.includes(emoji) ? 'bg-zinc-600' : ''}`}>
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Existing reactions */}
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                          <button key={emoji} onClick={() => toggleReaction(post._id, emoji)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${myReactions.includes(emoji) ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                            <span>{emoji}</span>
                            <span>{count}</span>
                          </button>
                        ))}

                        <div className="flex-1" />

                        {/* Reply count */}
                        <button onClick={() => setExpandedPost(isExpanded ? null : post._id)}
                          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                          {(post.replies || []).length} {(post.replies || []).length === 1 ? 'reply' : 'replies'}
                        </button>
                      </div>

                      {/* Replies */}
                      {isExpanded && (
                        <div className="border-t border-zinc-800 bg-[#161616]">
                          {(post.replies || []).map((reply, ri) => (
                            <div key={ri} className="flex items-start gap-2.5 px-4 py-3 border-b border-zinc-800/50">
                              <div className="w-6 h-6 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0 mt-0.5">
                                {reply.author?.avatar && <img src={mediaUrl(reply.author.avatar)} className="w-full h-full object-cover" alt="" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-white text-xs font-semibold">{reply.author?.name}</span>
                                  {reply.author?.isFounder && <FounderBadge size={10} />}
                                  <span className="text-zinc-600 text-[10px]">· {timeAgo(reply.createdAt)}</span>
                                </div>
                                <p className="text-zinc-300 text-xs leading-relaxed">{reply.text}</p>
                              </div>
                            </div>
                          ))}

                          {(isMember || isOwner) && (
                            <div className="flex items-center gap-2 px-4 py-3">
                              <div className="w-6 h-6 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                                {me.avatar && <img src={mediaUrl(me.avatar)} className="w-full h-full object-cover" alt="" />}
                              </div>
                              <input value={replyTexts[post._id] || ''} onChange={e => setReplyTexts(t => ({ ...t, [post._id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitReply(post._id))}
                                placeholder="Write a reply..."
                                className="flex-1 bg-zinc-800 text-white text-xs px-3 py-2 rounded-full outline-none placeholder-zinc-600 border border-zinc-700" />
                              <button onClick={() => submitReply(post._id)} disabled={submittingReply[post._id]}
                                className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-2 rounded-full font-medium transition disabled:opacity-50">
                                {submittingReply[post._id] ? '...' : 'Reply'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── About ── */}
          {tab === 'About' && (
            <div className="max-w-2xl space-y-8">
              {group.description && (
                <div className="bg-[#1a1a1a] rounded-xl p-5 border border-zinc-800">
                  <h2 className="text-white font-semibold mb-2">About</h2>
                  <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{group.description}</p>
                </div>
              )}
              <div>
                <h2 className="text-white font-semibold text-lg mb-4">Announcements</h2>
                {isOwner && (
                  <div className="mb-5 bg-[#1a1a1a] rounded-xl p-4 border border-zinc-800">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0 mt-0.5">
                        {me.avatar && <img src={mediaUrl(me.avatar)} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div className="flex-1">
                        <textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)} maxLength={2000} rows={2}
                          placeholder="Write an announcement..."
                          className="w-full bg-zinc-800 text-white text-sm px-3 py-2.5 rounded-lg outline-none placeholder-zinc-500 resize-none border border-zinc-700 focus:border-zinc-500 mb-2" />
                        {annImagePreview && (
                          <div className="relative inline-block mb-2">
                            <img src={annImagePreview} className="max-h-40 rounded-lg object-cover" alt="" />
                            <button onClick={() => { setAnnImage(''); setAnnImagePreview(''); }}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/80">✕</button>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <button onClick={() => annImgRef.current?.click()}
                            className="text-zinc-400 hover:text-zinc-200 transition p-1.5 rounded-lg hover:bg-zinc-800">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                          </button>
                          <input ref={annImgRef} type="file" accept="image/*" className="hidden"
                            onChange={e => handleAnnImage(e.target.files[0])} />
                          <button onClick={postAnnouncement} disabled={postingAnn || (!announcementText.trim() && !annImage)}
                            className="bg-red-600 hover:bg-red-500 text-white px-5 py-1.5 rounded-full text-sm font-semibold transition disabled:opacity-50">
                            {postingAnn ? 'Posting...' : 'Post'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {(group.announcements || []).length === 0 && <p className="text-zinc-600 text-sm">No announcements yet.</p>}
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
                          <div className="flex items-center gap-2 flex-wrap flex-1">
                            <span className="text-white text-sm font-semibold">{ann.author?.name || 'Unknown'}</span>
                            {ann.author?.isFounder && <FounderBadge size={13} />}
                            {authorIsOwner && <span className="bg-blue-500/20 text-blue-400 text-[11px] font-semibold px-2 py-0.5 rounded">Owner</span>}
                            {authorRank && <span className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ color: authorRank.color, backgroundColor: authorRank.color + '22' }}>{authorRank.name}</span>}
                            <span className="text-zinc-600 text-xs">· {ann.createdAt ? timeAgo(ann.createdAt) : ''}</span>
                          </div>
                        </div>
                        {ann.text && <div className="px-4 pt-3"><p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{ann.text}</p></div>}
                        {ann.image && <div className="px-4 pt-3"><img src={ann.image} className="w-full rounded-xl object-cover max-h-96" alt="" /></div>}
                        <div className="h-3" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Events ── */}
          {tab === 'Events' && (
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-semibold text-lg">Events</h2>
                {isOwner && (
                  <button onClick={() => setShowEventModal(true)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    New event
                  </button>
                )}
              </div>
              {(group.events || []).length === 0 && (
                <div className="text-center py-16 text-zinc-600">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <p className="text-sm">{isOwner ? 'No events yet. Create one!' : 'No upcoming events.'}</p>
                </div>
              )}
              <div className="space-y-3">
                {(group.events || []).map(evt => (
                  <div key={evt._id} className="bg-[#1a1a1a] rounded-2xl border border-zinc-800 overflow-hidden flex">
                    <div className="w-44 h-32 flex-shrink-0 bg-zinc-800 overflow-hidden">
                      {evt.image
                        ? <img src={evt.image} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
                            <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                          </div>}
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="text-white font-bold text-base leading-tight mb-1">{evt.title}</h3>
                        {evt.date && <p className="text-zinc-400 text-xs mb-1.5">{new Date(evt.date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>}
                        {evt.description && <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2">{evt.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition">Join Event</button>
                        {isOwner && (
                          <button onClick={() => deleteEvent(evt._id)} className="text-zinc-600 hover:text-red-400 transition p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Members ── */}
          {tab === 'Members' && (
            <div>
              {isOwner && (group.requests || []).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    Join Requests
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{group.requests.length}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                    {group.requests.map(r => {
                      const rId = String(r._id || r);
                      return (
                        <div key={rId} className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl px-4 py-3 border border-zinc-700">
                          <div className="w-9 h-9 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                            {r.avatar && <img src={mediaUrl(r.avatar)} className="w-full h-full object-cover" alt="" />}
                          </div>
                          <span className="text-white text-sm flex-1 font-medium">{r.name || r.username}</span>
                          <button onClick={async () => { await api.post(`/api/groups/${id}/requests/${rId}/accept`, {}, { headers }); setGroup(g => ({ ...g, requests: g.requests.filter(x => String(x._id || x) !== rId), members: [...g.members, r] })); }} className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-full transition font-medium">Accept</button>
                          <button onClick={async () => { await api.post(`/api/groups/${id}/requests/${rId}/decline`, {}, { headers }); setGroup(g => ({ ...g, requests: g.requests.filter(x => String(x._id || x) !== rId) })); }} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-3 py-1.5 rounded-full transition">Decline</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Members header with rank filter */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold text-lg">Members ({memberCount.toLocaleString()})</h3>
                {(group.ranks || []).length > 0 && (
                  <select value={memberRankFilter} onChange={e => setMemberRankFilter(e.target.value)}
                    className="bg-zinc-800 text-zinc-300 text-sm px-3 py-2 rounded-xl border border-zinc-700 outline-none cursor-pointer">
                    <option value="all">All ranks ({memberCount})</option>
                    {(group.ranks || []).map(r => (
                      <option key={r._id} value={r._id}>
                        {r.name} ({(r.members || []).length})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Avatar grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                {filteredMembers().map(m => {
                  const membId = String(m._id || m);
                  const rank = getMemberRank(membId);
                  const isThisOwner = String(group.owner?._id || group.owner) === membId;
                  return (
                    <div key={membId} className="flex flex-col items-center gap-1.5 cursor-pointer group"
                      onClick={() => m.username && navigate(`/c/${m.username}`)}>
                      <div className="w-14 h-14 rounded-full bg-zinc-700 overflow-hidden border-2 border-zinc-800 group-hover:border-zinc-500 transition flex-shrink-0">
                        {m.avatar
                          ? <img src={mediaUrl(m.avatar)} className="w-full h-full object-cover" alt="" />
                          : <div className="w-full h-full flex items-center justify-center bg-zinc-600">
                              <span className="text-white font-bold text-sm">{(m.name || m.username || '?')[0].toUpperCase()}</span>
                            </div>}
                      </div>
                      <p className="text-zinc-400 text-[10px] text-center leading-tight max-w-[56px] truncate group-hover:text-white transition">
                        {m.username || m.name}
                      </p>
                      {(isThisOwner || rank) && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={rank ? { color: rank.color, backgroundColor: rank.color + '22' } : { color: '#60a5fa', backgroundColor: '#3b82f620' }}>
                          {isThisOwner && !rank ? 'Owner' : rank?.name}
                        </span>
                      )}
                      {isOwner && !isThisOwner && (group.ranks || []).length > 0 && (
                        <select value={rank?._id || ''} onChange={e => { e.stopPropagation(); e.target.value && assignRank(e.target.value, membId); }}
                          onClick={e => e.stopPropagation()}
                          className="bg-zinc-800 text-zinc-400 text-[9px] px-1 py-0.5 rounded border border-zinc-700 outline-none cursor-pointer max-w-[56px] w-full">
                          <option value="">Set rank</option>
                          {(group.ranks || []).map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
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
              {/* Post permission */}
              {isOwner && (
                <div className="bg-[#1a1a1a] rounded-xl border border-zinc-800 p-5 mb-6">
                  <h3 className="text-white font-semibold mb-1">Who can post on the Wall?</h3>
                  <p className="text-zinc-500 text-xs mb-3">Choose which ranks are allowed to create posts.</p>
                  <div className="space-y-2">
                    <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${(group.postPermission || 'all') === 'all' ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 hover:border-zinc-600'}`}>
                      <input type="radio" name="perm" checked={(group.postPermission || 'all') === 'all'}
                        onChange={() => savePostPermission('all')} className="accent-red-500" />
                      <div>
                        <p className="text-white text-sm font-medium">Everyone</p>
                        <p className="text-zinc-500 text-xs">All members can post</p>
                      </div>
                    </label>
                    {(group.ranks || []).length > 0 && (
                      <div className="border border-zinc-700 rounded-xl p-3">
                        <p className="text-zinc-400 text-xs font-medium mb-2 px-1">Specific ranks only:</p>
                        {(group.ranks || []).map(rank => {
                          const currentPerm = group.postPermission || 'all';
                          const allowedIds = currentPerm === 'all' || currentPerm === 'members' ? [] : currentPerm.split(',').filter(Boolean);
                          const isAllowed = allowedIds.includes(rank._id);
                          const toggleRankPerm = () => {
                            let newAllowed = isAllowed ? allowedIds.filter(r => r !== rank._id) : [...allowedIds, rank._id];
                            savePostPermission(newAllowed.length > 0 ? newAllowed.join(',') : 'all');
                          };
                          return (
                            <label key={rank._id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 cursor-pointer transition">
                              <input type="checkbox" checked={isAllowed} onChange={toggleRankPerm} className="accent-red-500" />
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rank.color }} />
                              <span className="text-sm font-medium" style={{ color: rank.color }}>{rank.name}</span>
                              <span className="text-zinc-500 text-xs ml-auto">{(rank.members || []).length} members</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {savingPermission && <p className="text-zinc-500 text-xs mt-2">Saving...</p>}
                </div>
              )}

              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-semibold text-lg">Ranks</h2>
                {isOwner && (
                  <button onClick={() => setShowRankModal(true)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    New rank
                  </button>
                )}
              </div>

              {(group.ranks || []).length === 0 && (
                <div className="text-center py-16 text-zinc-600">
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
                      <button onClick={() => deleteRank(rank._id)} className="text-zinc-600 hover:text-red-400 transition p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
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
