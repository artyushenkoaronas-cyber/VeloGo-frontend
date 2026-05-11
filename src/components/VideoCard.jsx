import { mediaUrl } from '../utils/mediaUrl';
import { useNavigate } from 'react-router-dom';
import VerifiedBadge from './VerifiedBadge';
import OfficialArtistBadge from './OfficialArtistBadge';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} minutes ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)} days ago`;
  if (s < 31536000) return `${Math.floor(s / 2592000)} months ago`;
  return `${Math.floor(s / 31536000)} years ago`;
}

function fv(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n;
}

export default function VideoCard({ video }) {
  const navigate = useNavigate();
  const thumb = video.thumbnail ? mediaUrl(video.thumbnail) : null;
  const avatar = video.uploader?.avatar
    ? (mediaUrl(video.uploader.avatar))
    : null;

  const goChannel = (e) => {
    e.stopPropagation();
    const target = video.uploader?.username ? `/@${video.uploader.username}` : video.uploader?._id ? `/@${video.uploader._id}` : null;
    if (target) navigate(target);
  };

  return (
    <div className="cursor-pointer group" onClick={() => navigate(`/watch/${video._id}`)}>
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-zinc-800 rounded-xl overflow-hidden mb-3">
        {thumb
          ? <img src={thumb} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
          : <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
        }
        {video.isMusicVideo && (
          <div className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center shadow-lg" title="Music Video">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex gap-3">
        <button onClick={goChannel} className="w-9 h-9 rounded-full bg-red-600 flex-shrink-0 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-white transition">
          {avatar
            ? <img src={avatar} alt={video.uploader?.name} className="w-full h-full object-cover" />
            : <span className="text-white text-xs font-bold">{video.uploader?.name?.[0]?.toUpperCase()}</span>}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-white text-sm font-medium line-clamp-2 leading-snug mb-1">{video.title}</h3>
          <div className="flex items-center gap-1 flex-wrap">
            <button onClick={goChannel} className="flex items-center gap-1 hover:text-white transition">
              <span className="text-gray-400 text-xs">@{video.uploader?.username || video.uploader?.name}</span>
              {video.uploader?.isOfficialArtist && <OfficialArtistBadge size={13} />}
              {video.uploader?.isVerified && <VerifiedBadge size={13} />}
            </button>
            {video.collaborators?.length > 0 && (
              <>
                <span className="text-gray-500 text-xs">and</span>
                {video.collaborators.slice(0, 1).map(c => (
                  <span key={c._id} className="flex items-center gap-0.5">
                    <button onClick={e => { e.stopPropagation(); navigate(c.username ? `/@${c.username}` : `/@${c._id}`); }}
                      className="text-gray-400 text-xs hover:text-white transition">@{c.username || c.name}</button>
                    {c.isOfficialArtist && <OfficialArtistBadge size={13} />}
                    {c.isVerified && <VerifiedBadge size={13} />}
                  </span>
                ))}
                {video.collaborators.length > 1 && (
                  <span className="text-gray-500 text-xs">+{video.collaborators.length - 1}</span>
                )}
              </>
            )}
          </div>
          <p className="text-gray-400 text-xs">{fv(video.views)} views · {timeAgo(video.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
