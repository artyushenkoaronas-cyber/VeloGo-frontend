import { useState, useEffect, useRef } from 'react';
import { mediaUrl } from '../utils/mediaUrl';

/**
 * Shows thumbnail image if available.
 * If not, loads the video silently, seeks to a random frame, captures it via canvas.
 */
export default function VideoThumbnail({ thumbnail, videoUrl, className = '', alt = '' }) {
  const [frameSrc, setFrameSrc] = useState(null);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (thumbnail || !videoUrl) return;
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';
    video.src = mediaUrl(videoUrl);

    const capture = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setFrameSrc(dataUrl);
      } catch {
        setFailed(true);
      }
      video.pause();
      video.src = '';
    };

    video.addEventListener('loadedmetadata', () => {
      // seek to ~20% of duration, or 2s if unknown
      const seekTo = video.duration && isFinite(video.duration)
        ? video.duration * 0.2
        : 2;
      video.currentTime = seekTo;
    });

    video.addEventListener('seeked', capture);
    video.addEventListener('error', () => setFailed(true));
    video.load();

    return () => {
      video.src = '';
    };
  }, [thumbnail, videoUrl]);

  if (thumbnail) {
    return <img src={mediaUrl(thumbnail)} alt={alt} className={className} />;
  }

  if (frameSrc) {
    return <img src={frameSrc} alt={alt} className={className} />;
  }

  // Loading or failed — show placeholder icon
  return (
    <div className={`flex items-center justify-center bg-zinc-800 ${className}`}>
      {failed
        ? <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        : <div className="w-5 h-5 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin" />}
    </div>
  );
}
