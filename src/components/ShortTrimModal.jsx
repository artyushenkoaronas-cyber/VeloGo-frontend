import { useState, useRef, useEffect } from 'react';
import { mediaUrl } from '../utils/mediaUrl';
import api from '../utils/api';

export default function ShortTrimModal({ short, onClose, onSaved }) {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(short.trimEnd || 30);
  const [start, setStart] = useState(short.trimStart || 0);
  const [end, setEnd] = useState(short.trimEnd || null);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem('velogo_token');

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.onloadedmetadata = () => {
      setDuration(el.duration);
      if (!end) setEnd(Math.min(el.duration, 30));
    };
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onTime = () => {
      const s = start || 0;
      const e = end || el.duration;
      if (el.currentTime < s) el.currentTime = s;
      if (el.currentTime >= e) { el.currentTime = s; el.play().catch(() => {}); }
    };
    el.addEventListener('timeupdate', onTime);
    return () => el.removeEventListener('timeupdate', onTime);
  }, [start, end]);

  const previewStart = () => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = start || 0;
    el.play().catch(() => {});
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const selectedDuration = (end || duration) - (start || 0);

  const handleSave = async () => {
    if (selectedDuration < 3) return alert('Minimum 3 seconds');
    if (selectedDuration > 30) return alert('Maximum 30 seconds');
    setSaving(true);
    try {
      await api.put(`/api/videos/${short._id}`, { trimStart: start, trimEnd: end }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSaved({ ...short, trimStart: start, trimEnd: end });
      onClose();
    } catch { alert('Failed to save'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl p-5 w-80 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Trim Short</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <video
          ref={videoRef}
          src={mediaUrl(short.videoUrl)}
          className="w-full rounded-xl aspect-[9/16] object-cover bg-black"
          playsInline
          muted
        />

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Start: {fmt(start || 0)}</span>
              <span>End: {fmt(end || duration)}</span>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-gray-400 text-xs">Start time</label>
                <input type="range" min={0} max={Math.max(0, (end || duration) - 3)} step={0.1}
                  value={start || 0}
                  onChange={e => { const v = Number(e.target.value); setStart(v); if (videoRef.current) videoRef.current.currentTime = v; }}
                  className="w-full accent-red-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs">End time</label>
                <input type="range" min={Math.min(duration, (start || 0) + 3)} max={duration} step={0.1}
                  value={end || duration}
                  onChange={e => setEnd(Number(e.target.value))}
                  className="w-full accent-red-500" />
              </div>
            </div>
            <p className={`text-xs mt-1 ${selectedDuration > 30 || selectedDuration < 3 ? 'text-red-400' : 'text-green-400'}`}>
              Selected: {selectedDuration.toFixed(1)}s {selectedDuration > 30 ? '(max 30s)' : selectedDuration < 3 ? '(min 3s)' : '✓'}
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={previewStart} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm py-2 rounded-full transition">
              Preview
            </button>
            <button onClick={handleSave} disabled={saving || selectedDuration < 3 || selectedDuration > 30}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm py-2 rounded-full transition">
              {saving ? 'Saving…' : 'Save trim'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
