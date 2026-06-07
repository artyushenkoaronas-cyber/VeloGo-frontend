import { mediaUrl } from '../utils/mediaUrl';
import { useNavigate } from 'react-router-dom';
import VerifiedBadge from './VerifiedBadge';
import OfficialArtistBadge from './OfficialArtistBadge';
import VideoThumbnail from './VideoThumbnail';

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
    const target = video.uploader?.channelToken ? `/c/${video.uploader.channelToken}` : video.uploader?._id ? `/c/${video.uploader._id}` : null;
    if (target) navigate(target);
  };

  return (
    <div className="cursor-pointer group" onClick={() => navigate(`/watch/${video._id}`)}>
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-zinc-800 rounded-xl overflow-hidden mb-3">
        <VideoThumbnail
          thumbnail={video.thumbnail}
          videoUrl={video.videoUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
        />
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
          <div className="flex items-center gap-1 min-w-0">
            <button onClick={goChannel} className="flex items-center gap-1 hover:text-white transition min-w-0 overflow-hidden max-w-[160px]">
              <span className="text-gray-400 text-xs truncate">{video.uploader?.name}</span>
              {video.uploader?.isOfficialArtist && <OfficialArtistBadge size={13} />}
              {video.uploader?.isVerified && <VerifiedBadge size={13} full />}
            </button>
            {video.collaborators?.length > 0 && (
              <>
                <span className="text-gray-500 text-xs flex-shrink-0">and</span>
                {video.collaborators.slice(0, 1).map(c => (
                  <span key={c._id} className="flex items-center gap-0.5 min-w-0">
                    <button onClick={e => { e.stopPropagation(); navigate(`/c/${c.channelToken || c._id}`); }}
                      className="text-gray-400 text-xs hover:text-white transition truncate max-w-[80px]">{c.name}</button>
                    {c.isOfficialArtist && <OfficialArtistBadge size={13} />}
                    {c.isVerified && <VerifiedBadge size={13} full />}
                  </span>
                ))}
                {video.collaborators.length > 1 && (
                  <span className="text-gray-500 text-xs flex-shrink-0">+{video.collaborators.length - 1}</span>
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
