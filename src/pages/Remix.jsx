import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { mediaUrl } from '../utils/mediaUrl';

export default function Remix() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('velogo_token');
  const headers = { Authorization: `Bearer ${token}` };

  const [original, setOriginal] = useState(null);
  const [title, setTitle] = useState('');
  const [creatorVol, setCreatorVol] = useState(80);
  const [yourVol, setYourVol] = useState(100);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const origVideoRef = useRef();
  const yourVideoRef = useRef();

  useEffect(() => {
    api.get(`/api/videos/${id}`).then(r => { setOriginal(r.data); setTitle(r.data.title || ''); }).catch(() => navigate('/shorts'));
  }, [id]);

  // Sync volumes
  useEffect(() => {
    if (origVideoRef.current) origVideoRef.current.volume = creatorVol / 100;
  }, [creatorVol]);
  useEffect(() => {
    if (yourVideoRef.current) yourVideoRef.current.volume = yourVol / 100;
  }, [yourVol]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handlePost = async () => {
    if (!file) { setError('Please select your video first'); return; }
    setUploading(true); setError(''); setProgress(0);
    try {
      // Get signature
      const { data: sig } = await api.get('/api/videos/upload-signature', { headers });
      // Upload to Cloudinary
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sig.api_key);
      fd.append('timestamp', sig.timestamp);
      fd.append('signature', sig.signature);
      fd.append('folder', sig.folder);
      fd.append('resource_type', 'video');
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 90)); };
      const cloudRes = await new Promise((resolve, reject) => {
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`);
        xhr.onload = () => resolve(JSON.parse(xhr.responseText));
        xhr.onerror = reject;
        xhr.send(fd);
      });
      setProgress(95);
      // Save
      // title is user-editable but defaults to original
      await api.post('/api/videos/save', {
        title: title || original.title,
        videoUrl: cloudRes.secure_url,
        isShort: true,
        sound: original.sound || `Original sound - @${original.uploader?.username}`,
        remixOf: id,
        creatorSoundVolume: creatorVol,
        yourSoundVolume: yourVol,
      }, { headers });
      setProgress(100);
      setTimeout(() => navigate('/shorts'), 800);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed');
      setUploading(false);
    }
  };

  if (!original) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div>
          <p className="text-white font-bold text-base">Remix</p>
          <p className="text-gray-400 text-xs">@{original.uploader?.username} · {original.title}</p>
        </div>
        <div className="ml-auto">
          <span className="bg-red-600/20 text-red-400 text-xs font-semibold px-3 py-1 rounded-full border border-red-600/40">
            🔄 REMIX
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Two-panel preview */}
        <div className="grid grid-cols-2 gap-3">
          {/* Creator short */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">Creator</span>
              <span className="bg-zinc-700 text-gray-300 text-[10px] px-1.5 py-0.5 rounded">@{original.uploader?.username}</span>
            </div>
            <div className="aspect-[9/16] rounded-xl overflow-hidden bg-zinc-900 relative">
              <video
                ref={origVideoRef}
                src={mediaUrl(original.videoUrl)}
                loop autoPlay playsInline
                style={{ volume: creatorVol / 100 }}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Your video */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-400 font-medium">Your video</span>
            <div
              className="aspect-[9/16] rounded-xl overflow-hidden bg-zinc-900 relative cursor-pointer border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition"
              onClick={() => !preview && fileRef.current?.click()}
            >
              {preview
                ? <video ref={yourVideoRef} src={preview} loop autoPlay playsInline muted={yourVol === 0} style={{ volume: yourVol / 100 }} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-zinc-500 text-xs text-center">Tap to add<br/>your video</p>
                  </div>}
            </div>
            {preview && (
              <button onClick={() => fileRef.current?.click()} className="text-xs text-blue-400 hover:text-blue-300 text-center transition">
                Change video
              </button>
            )}
          </div>
        </div>

        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />

        {/* Sound controls */}
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-4 border border-zinc-800">
          <p className="text-white font-semibold text-sm">Sound mix</p>

          {/* Creator sound */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">Creator sound</span>
                <span className="text-gray-500 text-xs">(locked)</span>
              </div>
              <span className="text-white text-sm font-bold">{creatorVol}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={creatorVol}
              onChange={e => setCreatorVol(Number(e.target.value))}
              className="w-full accent-red-500 h-1.5"
            />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Mute</span>
              <span className="truncate max-w-[180px] text-center">{original.sound || `Original sound · @${original.uploader?.username}`}</span>
              <span>Full</span>
            </div>
          </div>

          <div className="h-px bg-zinc-800" />

          {/* Your sound */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">Your sound</span>
              </div>
              <span className="text-white text-sm font-bold">{yourVol}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={yourVol}
              onChange={e => setYourVol(Number(e.target.value))}
              className="w-full accent-blue-500 h-1.5"
            />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Mute</span>
              <span>Full</span>
            </div>
          </div>
        </div>

        {/* Title (editable) */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-3">
          <div>
            <p className="text-gray-400 text-xs mb-1.5">Title</p>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-zinc-500"
              placeholder="Enter title..."
              maxLength={100}
            />
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1.5 flex items-center gap-1">
              <span>Sound</span>
              <span className="bg-zinc-700 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded">locked</span>
            </p>
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              <p className="text-gray-400 text-sm truncate">{original.sound || `Original sound · @${original.uploader?.username}`}</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {/* Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-gray-400 text-xs text-center">{progress < 100 ? `Uploading... ${progress}%` : 'Done! Redirecting...'}</p>
          </div>
        )}

        {/* Post button */}
        <button
          onClick={handlePost}
          disabled={uploading || !file}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-3 rounded-2xl transition text-sm"
        >
          {uploading ? 'Uploading...' : 'Post Remix'}
        </button>
      </div>
    </div>
  );
}
