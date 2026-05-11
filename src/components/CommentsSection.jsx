import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import VerifiedBadge from './VerifiedBadge';
import OfficialArtistBadge from './OfficialArtistBadge';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)} days ago`;
  return `${Math.floor(s / 2592000)} months ago`;
}

export default function CommentsSection({ videoId, uploaderId, pinnedCommentId: initialPinned, uploaderAvatar }) {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const [pinnedId, setPinnedId] = useState(initialPinned || null);
  const inputRef = useRef(null);
  const token = localStorage.getItem('velogo_token');
  const me = (() => { try { return JSON.parse(localStorage.getItem('velogo_user') || '{}'); } catch { return {}; } })();
  const headers = { Authorization: `Bearer ${token}` };
  const isOwner = me.id === uploaderId;

  useEffect(() => { loadComments(); }, [videoId]);
  useEffect(() => { setPinnedId(initialPinned || null); }, [initialPinned]);

  const loadComments = async () => {
    try {
      const { data } = await axios.get(`/api/videos/${videoId}/comments`);
      setComments(data);
    } catch {}
  };

  const handleSend = async (parentId = null, replyText = null) => {
    const body = replyText ?? text;
    if (!token) return navigate('/login');
    if (!body.trim()) return;
    if (!parentId) setSending(true);
    try {
      const { data } = await axios.post(
        `/api/videos/${videoId}/comments`,
        { text: body, parentId },
        { headers }
      );
      setComments(prev => [data, ...prev]);
      if (!parentId) { setText(''); setFocused(false); }
    } catch {}
    if (!parentId) setSending(false);
  };

  const handleLike = async (commentId) => {
    if (!token) return navigate('/login');
    try {
      const { data } = await axios.post(`/api/videos/${videoId}/comments/${commentId}/like`, {}, { headers });
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, likes: Array(data.likes).fill(''), _liked: data.liked } : c));
    } catch {}
  };

  const handleHeart = async (commentId) => {
    try {
      const { data } = await axios.post(`/api/videos/${videoId}/comments/${commentId}/heart`, {}, { headers });
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, creatorHeart: data.creatorHeart } : c));
    } catch {}
  };

  const handleDelete = async (commentId) => {
    try {
      await axios.delete(`/api/videos/${videoId}/comments/${commentId}`, { headers });
      setComments(prev => prev.filter(c => c._id !== commentId && c.parentId !== commentId));
      if (pinnedId === commentId) setPinnedId(null);
    } catch {}
  };

  const handlePin = async (commentId) => {
    try {
      const { data } = await axios.put(`/api/videos/${videoId}/pin-comment`, { commentId }, { headers });
      setPinnedId(data.pinnedComment || null);
    } catch {}
  };

  const myAvatar = me.avatar
    ? (me.avatar.startsWith('http') ? me.avatar : `http://localhost:5000${me.avatar}`)
    : null;

  const topLevel = comments.filter(c => !c.parentId || c.parentId === null);
  const replies = comments.filter(c => c.parentId && c.parentId !== null);

  const pinned = pinnedId ? topLevel.find(c => c._id === pinnedId) : null;
  const rest = topLevel.filter(c => c._id !== pinnedId);
  const ordered = pinned ? [pinned, ...rest] : rest;

  const totalCount = comments.length;

  return (
    <div className="mb-8">
      <p className="text-white font-semibold text-lg mb-5">{totalCount} Comments</p>

      {/* Input */}
      <div className="flex gap-3 mb-6">
        <div className="w-9 h-9 rounded-full bg-red-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
          {myAvatar
            ? <img src={myAvatar} className="w-full h-full object-cover" />
            : <span className="text-white text-xs font-bold">{me.name?.[0]?.toUpperCase() || 'V'}</span>}
        </div>
        <div className="flex-1">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Add a comment..."
            className="w-full bg-transparent border-b border-zinc-700 focus:border-white text-white text-sm py-2 focus:outline-none transition"
          />
          {focused && (
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => { setFocused(false); setText(''); }}
                className="px-4 py-2 text-white text-sm rounded-full hover:bg-zinc-800 transition">
                Cancel
              </button>
              <button onClick={() => handleSend()} disabled={!text.trim() || sending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-full transition">
                {sending ? 'Sending...' : 'Comment'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-5">
        {ordered.map(c => (
          <CommentRow
            key={c._id}
            comment={c}
            isPinned={c._id === pinnedId}
            isOwner={isOwner}
            me={me}
            headers={headers}
            token={token}
            uploaderAvatar={uploaderAvatar}
            replies={replies.filter(r => r.parentId?.toString() === c._id?.toString())}
            onLike={handleLike}
            onHeart={handleHeart}
            onDelete={handleDelete}
            onPin={handlePin}
            onReply={(parentId, txt) => handleSend(parentId, txt)}
            navigate={navigate}
          />
        ))}
      </div>
    </div>
  );
}

function CommentRow({ comment: c, isPinned, isOwner, me, headers, token, uploaderAvatar, replies, onLike, onHeart, onDelete, onPin, onReply, navigate }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  const authorAvatar = c.author?.avatar
    ? (c.author.avatar.startsWith('http') ? c.author.avatar : `http://localhost:5000${c.author.avatar}`)
    : null;
  const uploaderAvatarSrc = uploaderAvatar
    ? (uploaderAvatar.startsWith('http') ? uploaderAvatar : `http://localhost:5000${uploaderAvatar}`)
    : null;
  const isOwn = me.id === c.author?._id || me.isAdmin || isOwner;
  const likesCount = c.likes?.length || 0;

  const sendReply = () => {
    if (!replyText.trim()) return;
    onReply(c._id, replyText);
    setReplyText('');
    setReplyOpen(false);
    setShowReplies(true);
  };

  return (
    <div className="flex gap-3 group">
      <div className="relative flex-shrink-0">
        <button
          onClick={() => c.author?.username && navigate(`/@${c.author.username}`)}
          className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center overflow-hidden"
        >
          {authorAvatar
            ? <img src={authorAvatar} className="w-full h-full object-cover" />
            : <span className="text-white text-xs font-bold">{c.author?.name?.[0]?.toUpperCase()}</span>}
        </button>
        {/* Creator heart overlay */}
        {c.creatorHeart && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0f0f0f] flex items-center justify-center ring-1 ring-zinc-700">
            <div className="relative w-4 h-4">
              {uploaderAvatarSrc
                ? <img src={uploaderAvatarSrc} className="w-full h-full rounded-full object-cover" />
                : <div className="w-full h-full rounded-full bg-red-600 flex items-center justify-center">
                    <span className="text-[6px] text-white font-bold">V</span>
                  </div>}
              <svg className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {isPinned && (
          <div className="flex items-center gap-1.5 mb-1">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="text-gray-400 text-xs">Pinned by creator</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 mb-0.5">
          <button
            onClick={() => c.author?.username && navigate(`/@${c.author.username}`)}
            className="flex items-center gap-1 hover:opacity-80 transition"
          >
            <span className="text-white text-sm font-medium">@{c.author?.username || c.author?.name}</span>
            {c.author?.isOfficialArtist && <OfficialArtistBadge size={13} />}
            {c.author?.isVerified && <VerifiedBadge size={13} />}
          </button>
          <span className="text-gray-500 text-xs">{timeAgo(c.createdAt)}</span>
        </div>
        <p className="text-gray-200 text-sm leading-relaxed">{c.text}</p>

        {/* Actions row */}
        <div className="flex items-center gap-3 mt-2">
          <button onClick={() => onLike(c._id)}
            className={`flex items-center gap-1.5 text-xs transition ${c._liked ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}>
            <svg className="w-4 h-4" fill={c._liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>

          <button onClick={() => { if (!token) navigate('/login'); else setReplyOpen(p => !p); }}
            className="text-gray-400 hover:text-white text-xs transition">
            Reply
          </button>

          {isOwner && (
            <>
              <button onClick={() => onHeart(c._id)}
                className={`text-xs transition opacity-0 group-hover:opacity-100 flex items-center gap-1 ${c.creatorHeart ? 'text-red-400' : 'text-gray-600 hover:text-red-400'}`}>
                <svg className="w-3.5 h-3.5" fill={c.creatorHeart ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
              <button onClick={() => onPin(c._id)}
                className={`text-xs transition opacity-0 group-hover:opacity-100 ${isPinned ? 'text-blue-400' : 'text-gray-600 hover:text-gray-300'}`}>
                {isPinned ? 'Unpin' : 'Pin'}
              </button>
            </>
          )}

          {isOwn && (
            <button onClick={() => onDelete(c._id)}
              className="text-gray-600 hover:text-red-400 text-xs transition opacity-0 group-hover:opacity-100">
              Delete
            </button>
          )}
        </div>

        {/* Reply input */}
        {replyOpen && (
          <div className="flex gap-2 mt-3">
            <input
              autoFocus
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendReply()}
              placeholder={`Reply to @${c.author?.username || c.author?.name}...`}
              className="flex-1 bg-transparent border-b border-zinc-700 focus:border-white text-white text-sm py-1 focus:outline-none transition"
            />
            <button onClick={() => setReplyOpen(false)} className="text-gray-400 text-xs hover:text-white transition">Cancel</button>
            <button onClick={sendReply} disabled={!replyText.trim()}
              className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-1 rounded-full transition">
              Reply
            </button>
          </div>
        )}

        {/* Replies toggle */}
        {replies.length > 0 && (
          <button onClick={() => setShowReplies(p => !p)}
            className="flex items-center gap-1.5 mt-3 text-blue-400 hover:text-blue-300 text-xs font-medium transition">
            <svg className={`w-4 h-4 transition-transform ${showReplies ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showReplies ? 'Hide' : `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
          </button>
        )}

        {/* Replies list */}
        {showReplies && replies.length > 0 && (
          <div className="mt-3 space-y-4 pl-1">
            {replies.map(r => {
              const rAvatar = r.author?.avatar
                ? (r.author.avatar.startsWith('http') ? r.author.avatar : `http://localhost:5000${r.author.avatar}`)
                : null;
              const isOwnReply = me.id === r.author?._id || me.isAdmin || isOwner;
              const rLikes = r.likes?.length || 0;
              return (
                <div key={r._id} className="flex gap-2 group/reply">
                  <button onClick={() => r.author?.username && navigate(`/@${r.author.username}`)}
                    className="w-7 h-7 rounded-full bg-red-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {rAvatar
                      ? <img src={rAvatar} className="w-full h-full object-cover" />
                      : <span className="text-white text-[10px] font-bold">{r.author?.name?.[0]?.toUpperCase()}</span>}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <button onClick={() => r.author?.username && navigate(`/@${r.author.username}`)}
                        className="flex items-center gap-1 hover:opacity-80 transition">
                        <span className="text-white text-xs font-medium">@{r.author?.username || r.author?.name}</span>
                        {r.author?.isOfficialArtist && <OfficialArtistBadge size={11} />}
                        {r.author?.isVerified && <VerifiedBadge size={11} />}
                      </button>
                      <span className="text-gray-500 text-[11px]">{timeAgo(r.createdAt)}</span>
                    </div>
                    <p className="text-gray-200 text-xs leading-relaxed">{r.text}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <button onClick={() => onLike(r._id)}
                        className={`flex items-center gap-1 text-[11px] transition ${r._liked ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}>
                        <svg className="w-3.5 h-3.5" fill={r._liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        {rLikes > 0 && <span>{rLikes}</span>}
                      </button>
                      {isOwnReply && (
                        <button onClick={() => onDelete(r._id)}
                          className="text-gray-600 hover:text-red-400 text-[11px] transition opacity-0 group-hover/reply:opacity-100">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
