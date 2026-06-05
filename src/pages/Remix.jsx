import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { mediaUrl } from '../utils/mediaUrl';

export default function Remix() {
  const { id } = useParams();
  const navigate = useNavigate();

  const getHeaders = () => {
    const t = localStorage.getItem('velogo_token');
    if (!t) { navigate('/login'); return null; }
    return { Authorization: `Bearer ${t}` };
  };

  const [original, setOriginal] = useState(null);
  const [title, setTitle] = useState('');
  const [creatorVol, setCreatorVol] = useState(80);
  const [yourVol, setYourVol] = useState(100);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const thumbRef = useRef();
  const origVideoRef = useRef();
  const yourVideoRef = useRef();

  useEffect(() => {
    if (!localStorage.getItem('velogo_token')) { navigate('/login'); return; }
    api.get(`/api/videos/${id}`).then(r => { setOriginal(r.data); setTitle(r.data.title || ''); }).catch(() => navigate('/shorts'));
  }, [id]);

  useEffect(() => { if (origVideoRef.current) origVideoRef.current.volume = creatorVol / 100; }, [creatorVol]);
  useEffect(() => { if (yourVideoRef.current) yourVideoRef.current.volume = yourVol / 100; }, [yourVol]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleThumb = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setThumbFile(f);
    setThumbPreview(URL.createObjectURL(f));
  };

  const uploadToCloudinary = async (fileObj, resourceType, sig) => {
    const fd = new FormData();
    fd.append('file', fileObj);
    fd.append('api_key', sig.api_key);
    fd.append('timestamp', sig.timestamp);
    fd.append('signature', sig.signature);
    fd.append('folder', sig.folder);
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = e => { if (e.lengthComputable && resourceType === 'video') setProgress(Math.round(e.loaded / e.total * 85)); };
    return new Promise((resolve, reject) => {
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloud_name}/${resourceType}/upload`);
      xhr.onload = () => { const d = JSON.parse(xhr.responseText); d.error ? reject(d.error) : resolve(d); };
      xhr.onerror = reject;
      xhr.send(fd);
    });
  };

  const handlePost = async () => {
    const headers = getHeaders();
    if (!headers) return;
    if (!file) { setError('Please select your video first'); return; }
    setUploading(true); setError(''); setProgress(0);
    try {
      const { data: sig } = await api.get('/api/videos/upload-signature', { headers });
      setProgress(5);
      const cloudRes = await uploadToCloudinary(file, 'video', sig);
      setProgress(90);

      let thumbnailUrl = null;
      if (thumbFile) {
        const { data: imgSig } = await api.get('/api/videos/upload-signature', { headers });
        const thumbRes = await uploadToCloudinary(thumbFile, 'image', imgSig);
        thumbnailUrl = thumbRes.secure_url;
      }
      setProgress(95);

      await api.post('/api/videos/save', {
        title: title || original.title,
        videoUrl: cloudRes.secure_url,
        thumbnail: thumbnailUrl,
        isShort: true,
        sound: original.sound || `Original sound - @${original.uploader?.username}`,
        remixOf: id,
        creatorSoundVolume: creatorVol,
        yourSoundVolume: yourVol,
      }, { headers });

      setProgress(100);
      setTimeout(() => navigate('/shorts'), 800);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Upload failed';
      if (msg.includes('token') || err.response?.status === 401) {
        setError('Session expired — please log out and log in again');
      } else {
        setError(msg);
      }
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
          <span className="bg-red-600/20 text-red-400 text-xs font-semibold px-3 py-1 rounded-full border border-red-600/40">🔄 REMIX</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* Two-panel preview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium">Creator</span>
              <span className="bg-zinc-700 text-gray-300 text-[10px] px-1.5 py-0.5 rounded">@{original.uploader?.username}</span>
            </div>
            <div className="aspect-[9/16] rounded-xl overflow-hidden bg-zinc-900">
              <video ref={origVideoRef} src={mediaUrl(original.videoUrl)} loop autoPlay playsInline className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-400 font-medium">Your video</span>
            <div className="aspect-[9/16] rounded-xl overflow-hidden bg-zinc-900 relative cursor-pointer border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition"
              onClick={() => !preview && fileRef.current?.click()}>
              {preview
                ? <video ref={yourVideoRef} src={preview} loop autoPlay playsInline muted={yourVol === 0} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-zinc-500 text-xs text-center">Tap to add<br/>your video</p>
                  </div>}
            </div>
            {preview && <button onClick={() => fileRef.current?.click()} className="text-xs text-blue-400 hover:text-blue-300 text-center transition">Change video</button>}
          </div>
        </div>

        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
        <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumb} />

        {/* Thumbnail */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
          <p className="text-gray-400 text-xs mb-2">Thumbnail (optional)</p>
          <div className="flex items-center gap-3">
            {thumbPreview
              ? <img src={thumbPreview} className="w-20 aspect-[9/16] object-cover rounded-lg" />
              : <div className="w-20 aspect-[9/16] bg-zinc-800 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>}
            <button onClick={() => thumbRef.current?.click()} className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-4 py-2 rounded-xl transition">
              {thumbPreview ? 'Change thumbnail' : 'Upload thumbnail'}
            </button>
          </div>
        </div>

        {/* Sound controls */}
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-4 border border-zinc-800">
          <p className="text-white font-semibold text-sm">Sound mix</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                </div>
                <span className="text-white text-sm font-medium">Creator sound</span>
                <span className="text-gray-500 text-xs">(locked)</span>
              </div>
              <span className="text-white text-sm font-bold">{creatorVol}%</span>
            </div>
            <input type="range" min={0} max={100} value={creatorVol} onChange={e => setCreatorVol(Number(e.target.value))} className="w-full accent-red-500 h-1.5" />
            <p className="text-[10px] text-gray-500 truncate">{original.sound || `Original sound · @${original.uploader?.username}`}</p>
          </div>
          <div className="h-px bg-zinc-800" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <span className="text-white text-sm font-medium">Your sound</span>
              </div>
              <span className="text-white text-sm font-bold">{yourVol}%</span>
            </div>
            <input type="range" min={0} max={100} value={yourVol} onChange={e => setYourVol(Number(e.target.value))} className="w-full accent-blue-500 h-1.5" />
          </div>
        </div>

        {/* Title + Sound */}
        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 space-y-3">
          <div>
            <p className="text-gray-400 text-xs mb-1.5">Title</p>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-zinc-500"
              placeholder="Enter title..." maxLength={100} />
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1.5 flex items-center gap-1">
              Sound <span className="bg-zinc-700 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded">locked</span>
            </p>
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
              <p className="text-gray-400 text-sm truncate">{original.sound || `Original sound · @${original.uploader?.username}`}</p>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {uploading && (
          <div className="space-y-2">
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-gray-400 text-xs text-center">{progress < 100 ? `Uploading... ${progress}%` : 'Done! Redirecting...'}</p>
          </div>
        )}

        <button onClick={handlePost} disabled={uploading || !file}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-3 rounded-2xl transition text-sm">
          {uploading ? 'Uploading...' : 'Post Remix'}
        </button>
      </div>
    </div>
  );
}
