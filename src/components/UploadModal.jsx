import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';

const categories = ['All', 'Gaming', 'Music', 'Minecraft', 'Technology', 'Sports', 'Movies', 'News', 'Fashion', 'Food', 'Travel'];

export default function UploadModal({ onClose, onSuccess, defaultShort = false }) {
  const [step, setStep] = useState('select');
  const [file, setFile] = useState(null);
  const [thumb, setThumb] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [preview, setPreview] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(null);
  const trimVideoRef = useRef(null);
  const [form, setForm] = useState({ title: '', description: '', visibility: 'public', category: 'All', isShort: defaultShort, isMusicVideo: false, commentsDisabled: false, sound: '' });
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [collabInput, setCollabInput] = useState('');
  const [collabMsg, setCollabMsg] = useState('');
  const [uploadedVideoId, setUploadedVideoId] = useState(null);
  const fileRef = useRef(null);
  const thumbRef = useRef(null);
  const token = localStorage.getItem('velogo_token');

  const loadFileWithDuration = (f) => {
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreview(url);
    setForm(p => ({ ...p, title: f.name.replace(/\.[^/.]+$/, '') }));
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.src = url;
    vid.onloadedmetadata = () => {
      setVideoDuration(vid.duration);
      setTrimStart(0);
      setTrimEnd(Math.min(vid.duration, 30));
      setStep('details');
    };
    vid.onerror = () => setStep('details');
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 500 * 1024 * 1024) {
      alert(`File is too large (${(f.size / 1024 / 1024).toFixed(0)} MB). Maximum size is 500 MB.`);
      e.target.value = '';
      return;
    }
    loadFileWithDuration(f);
  };

  const handleThumb = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setThumb(f);
    setThumbPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('video/')) {
      if (f.size > 500 * 1024 * 1024) {
        alert(`File is too large (${(f.size / 1024 / 1024).toFixed(0)} MB). Maximum size is 500 MB.`);
        return;
      }
      loadFileWithDuration(f);
    }
  };

  const handleUpload = async () => {
    if (form.isShort && videoDuration !== null) {
      if (videoDuration < 3 && (trimEnd === null || trimEnd - trimStart < 3)) {
        setError('Shorts must be at least 3 seconds long.');
        return;
      }
      const selectedDuration = (trimEnd ?? videoDuration) - trimStart;
      if (selectedDuration < 3) {
        setError('Selected trim must be at least 3 seconds.');
        return;
      }
      if (selectedDuration > 30) {
        setError('Selected trim cannot exceed 30 seconds.');
        return;
      }
    }
    setStep('uploading');
    setError('');

    try {
      // Step 1: get signed params from backend
      const { data: sigData } = await api.get('/api/videos/upload-signature', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Step 2: upload video directly to Cloudinary (bypasses Render timeout)
      const videoFd = new FormData();
      videoFd.append('file', file);
      videoFd.append('api_key', sigData.api_key);
      videoFd.append('timestamp', sigData.timestamp);
      videoFd.append('signature', sigData.signature);
      videoFd.append('folder', sigData.folder);
      const videoRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.cloud_name}/video/upload`,
        { method: 'POST', body: videoFd }
      );
      if (!videoRes.ok) throw new Error('Video upload to Cloudinary failed');
      const videoData = await videoRes.json();
      setProgress(80);

      // Step 3: upload thumbnail directly to Cloudinary if provided
      let thumbUrl = null;
      if (thumb) {
        const { data: thumbSig } = await api.get('/api/videos/upload-signature?type=thumbnail', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const thumbFd = new FormData();
        thumbFd.append('file', thumb);
        thumbFd.append('api_key', thumbSig.api_key);
        thumbFd.append('timestamp', thumbSig.timestamp);
        thumbFd.append('signature', thumbSig.signature);
        thumbFd.append('folder', thumbSig.folder);
        const thumbRes = await fetch(
          `https://api.cloudinary.com/v1_1/${thumbSig.cloud_name}/image/upload`,
          { method: 'POST', body: thumbFd }
        );
        if (thumbRes.ok) { const td = await thumbRes.json(); thumbUrl = td.secure_url; }
      }
      setProgress(95);

      // Step 4: save metadata to backend
      const { data: uploaded } = await api.post('/api/videos/save', {
        title: form.title,
        description: form.description,
        visibility: form.visibility,
        category: form.category,
        isShort: form.isShort,
        isMusicVideo: form.isMusicVideo,
        commentsDisabled: form.commentsDisabled,
        sound: form.sound,
        videoUrl: videoData.secure_url,
        thumbnail: thumbUrl,
        trimStart: form.isShort && videoDuration > 30 ? trimStart : 0,
        trimEnd: form.isShort && videoDuration > 30 ? trimEnd : null
      }, { headers: { Authorization: `Bearer ${token}` } });

      setUploadedVideoId(uploaded._id);
      setProgress(100);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed. Try again.');
      setStep('details');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-white text-lg font-semibold">
            {step === 'select' && (defaultShort ? 'Upload Short' : 'Upload video')}
            {step === 'details' && (form.isShort ? 'Short details' : 'Video details')}
            {step === 'uploading' && 'Uploading...'}
            {step === 'done' && 'Upload complete!'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-zinc-700 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Select */}
        {step === 'select' && (
          <div className="p-12 flex flex-col items-center gap-6" onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
            <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-dashed border-zinc-600">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white text-lg font-medium">Drag and drop video files to upload</p>
              <p className="text-gray-400 text-sm mt-1">Your videos will be private until you publish them.</p>
              <p className="text-gray-500 text-xs mt-1">Max file size: 500 MB</p>
            </div>
            <input ref={fileRef} type="file" accept="video/*" onChange={handleFile} className="hidden" />
            <button onClick={() => fileRef.current.click()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition">
              Select files
            </button>
          </div>
        )}

        {/* Details */}
        {step === 'details' && (
          <div className="p-6 flex gap-6 max-h-[70vh] overflow-y-auto">
            <div className="flex-1 space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>}
              <div>
                <label className="text-sm text-gray-400 block mb-1">Title <span className="text-red-400">*</span></label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-600 focus:border-blue-500 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Tell viewers about your video"
                  className="w-full bg-zinc-800 border border-zinc-600 focus:border-blue-500 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Thumbnail</label>
                <div className="flex items-center gap-3">
                  {thumbPreview && <img src={thumbPreview} className="w-24 h-14 object-cover rounded-lg" />}
                  <button onClick={() => thumbRef.current.click()}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white text-sm px-4 py-2 rounded-lg transition">
                    Upload thumbnail
                  </button>
                  <input ref={thumbRef} type="file" accept="image/*" onChange={handleThumb} className="hidden" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Visibility</label>
                  <select value={form.visibility} onChange={e => setForm(p => ({ ...p, visibility: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none">
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
              {/* Music Video toggle */}
              {!form.isShort && (
                <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3 border border-zinc-700">
                  <div>
                    <p className="text-white text-sm font-medium">Music Video</p>
                    <p className="text-gray-500 text-xs">Shows a music note badge on the video card</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, isMusicVideo: !p.isMusicVideo }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.isMusicVideo ? 'bg-purple-600' : 'bg-zinc-600'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isMusicVideo ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3 border border-zinc-700">
                <div>
                  <p className="text-white text-sm font-medium">Disable comments</p>
                  <p className="text-gray-500 text-xs">Nobody can comment on this video</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, commentsDisabled: !p.commentsDisabled }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.commentsDisabled ? 'bg-zinc-400' : 'bg-zinc-600'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.commentsDisabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3 border border-zinc-700">
                <div>
                  <p className="text-white text-sm font-medium">Upload as Short</p>
                  <p className="text-gray-500 text-xs">Vertical video, 3–30 seconds, appears in Shorts feed</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, isShort: !p.isShort }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isShort ? 'bg-red-500' : 'bg-zinc-600'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isShort ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              {form.isShort && videoDuration !== null && videoDuration < 3 && (
                <p className="text-red-400 text-xs px-1">Video is too short ({videoDuration.toFixed(1)}s). Minimum 3 seconds.</p>
              )}
              {form.isShort && videoDuration !== null && videoDuration > 30 && (() => {
                const selDur = (trimEnd ?? videoDuration) - trimStart;
                const fmt = s => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
                return (
                  <div className="bg-zinc-800 rounded-xl p-3 space-y-2 border border-zinc-700">
                    <p className="text-yellow-400 text-xs font-medium">Video is {Math.round(videoDuration)}s — trim to max 30s</p>
                    <video
                      ref={trimVideoRef}
                      src={preview}
                      className="w-full rounded-lg aspect-video object-cover bg-black max-h-32"
                      playsInline muted
                      onTimeUpdate={e => {
                        const el = e.target;
                        if (trimEnd !== null && el.currentTime >= trimEnd) { el.currentTime = trimStart; el.pause(); }
                      }}
                    />
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Start: {fmt(trimStart)}</span>
                        <span>End: {fmt(trimEnd ?? videoDuration)}</span>
                        <span className={selDur > 30 || selDur < 3 ? 'text-red-400' : 'text-green-400'}>{selDur.toFixed(1)}s</span>
                      </div>
                      <label className="text-gray-500 text-xs">Start</label>
                      <input type="range" min={0} max={Math.max(0, (trimEnd ?? videoDuration) - 3)} step={0.1}
                        value={trimStart}
                        onChange={e => {
                          const v = Number(e.target.value);
                          setTrimStart(v);
                          if (trimVideoRef.current) trimVideoRef.current.currentTime = v;
                        }}
                        className="w-full accent-red-500" />
                      <label className="text-gray-500 text-xs">End</label>
                      <input type="range" min={Math.min(videoDuration, trimStart + 3)} max={videoDuration} step={0.1}
                        value={trimEnd ?? videoDuration}
                        onChange={e => setTrimEnd(Number(e.target.value))}
                        className="w-full accent-red-500" />
                    </div>
                    <button
                      type="button"
                      onClick={() => { if (trimVideoRef.current) { trimVideoRef.current.currentTime = trimStart; trimVideoRef.current.play().catch(() => {}); } }}
                      className="text-xs text-white bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded-full transition"
                    >▶ Preview trim</button>
                  </div>
                );
              })()}
              {form.isShort && (
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Sound / Song name</label>
                  <input type="text" value={form.sound} onChange={e => setForm(p => ({ ...p, sound: e.target.value }))}
                    placeholder="e.g. Original sound - @username"
                    className="w-full bg-zinc-800 border border-zinc-600 focus:border-red-500 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none" />
                </div>
              )}
            </div>
            {preview && (
              <div className="w-48 flex-shrink-0">
                <p className="text-gray-400 text-xs mb-2">Preview</p>
                <video src={preview} className="w-full rounded-lg bg-black" controls muted />
                <p className="text-gray-500 text-xs mt-2">{(file?.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            )}
          </div>
        )}

        {/* Uploading */}
        {step === 'uploading' && (
          <div className="p-12 flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="w-full max-w-sm">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Uploading "{form.title}"</span><span>{progress}%</span>
              </div>
              <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white text-xl font-semibold">Upload complete!</p>
            <p className="text-gray-400 text-sm text-center">"{form.title}" has been published.</p>

            {/* Invite collaborators */}
            <div className="w-full max-w-sm mt-2">
              <p className="text-white text-sm font-medium mb-2">Invite collaborators</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                  <input
                    value={collabInput}
                    onChange={e => setCollabInput(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Enter') {
                        if (!collabInput.trim() || !uploadedVideoId) return;
                        try {
                          const { data } = await api.post(`/api/videos/${uploadedVideoId}/collaborators`, { username: collabInput.trim() }, { headers: { Authorization: `Bearer ${token}` } });
                          setCollabMsg(data.message);
                          setCollabInput('');
                        } catch (err) { setCollabMsg(err.response?.data?.message || 'Error'); }
                      }
                    }}
                    placeholder="username"
                    className="w-full bg-zinc-800 border border-zinc-600 focus:border-blue-500 text-white rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!collabInput.trim() || !uploadedVideoId) return;
                    try {
                      const { data } = await api.post(`/api/videos/${uploadedVideoId}/collaborators`, { username: collabInput.trim() }, { headers: { Authorization: `Bearer ${token}` } });
                      setCollabMsg(data.message);
                      setCollabInput('');
                    } catch (err) { setCollabMsg(err.response?.data?.message || 'Error'); }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition"
                >
                  Invite
                </button>
              </div>
              {collabMsg && <p className={`text-xs mt-1.5 ${collabMsg.includes('sent') ? 'text-green-400' : 'text-red-400'}`}>{collabMsg}</p>}
            </div>

            <button onClick={() => { onSuccess?.(); onClose(); }}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition">
              Done
            </button>
          </div>
        )}

        {step === 'details' && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-800">
            <button onClick={onClose} className="px-5 py-2 rounded-full text-white hover:bg-zinc-800 transition text-sm">Cancel</button>
            <button onClick={handleUpload} disabled={!form.title}
              className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition text-sm disabled:opacity-50">
              Upload
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
