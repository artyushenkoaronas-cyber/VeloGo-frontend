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
  const [form, setForm] = useState({ title: '', description: '', visibility: 'public', category: 'All', isShort: defaultShort, sound: '' });
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
      setStep('details');
    };
    vid.onerror = () => setStep('details');
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
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
      loadFileWithDuration(f);
    }
  };

  const handleUpload = async () => {
    if (form.isShort && videoDuration !== null) {
      if (videoDuration < 3) {
        setError('Shorts must be at least 3 seconds long.');
        return;
      }
      if (videoDuration > 30) {
        setError('Shorts cannot be longer than 30 seconds.');
        return;
      }
    }
    setStep('uploading');
    setError('');
    const fd = new FormData();
    fd.append('video', file);
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('visibility', form.visibility);
    fd.append('category', form.category);
    fd.append('isShort', form.isShort ? 'true' : 'false');
    fd.append('sound', form.sound);
    if (thumb) fd.append('thumbnail', thumb);

    try {
      const { data: uploaded } = await api.post('/api/videos/upload', fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total))
      });
      setUploadedVideoId(uploaded._id);
      setStep('done');
    } catch {
      setError('Upload failed. Try again.');
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
              {form.isShort && videoDuration !== null && (videoDuration < 3 || videoDuration > 30) && (
                <p className="text-red-400 text-xs px-1">
                  {videoDuration < 3
                    ? `Video is too short (${videoDuration.toFixed(1)}s). Shorts must be at least 3 seconds.`
                    : `Video is too long (${Math.round(videoDuration)}s). Shorts cannot exceed 30 seconds.`}
                </p>
              )}
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
