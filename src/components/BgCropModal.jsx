import { useEffect, useRef, useState } from 'react';

const W = 800;
const H = 200;

export default function BgCropModal({ file, onSave, onClose }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(new Image());
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    imgRef.current.onload = () => {
      const img = imgRef.current;
      const s = Math.max(W / img.width, H / img.height);
      scaleRef.current = s;
      setScale(s);
      const ox = (W - img.width * s) / 2;
      const oy = (H - img.height * s) / 2;
      offsetRef.current = { x: ox, y: oy };
      setOffset({ x: ox, y: oy });
    };
    imgRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => { draw(); }, [scale, offset]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const img = imgRef.current;
    if (!img.complete || !img.naturalWidth) return;
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);
    // border
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
  };

  const clamp = (ox, oy, s) => {
    const img = imgRef.current;
    return {
      x: Math.min(0, Math.max(W - img.width * s, ox)),
      y: Math.min(0, Math.max(H - img.height * s, oy)),
    };
  };

  const onMouseDown = (e) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    const raw = { x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y };
    const c = clamp(raw.x, raw.y, scaleRef.current);
    offsetRef.current = c;
    setOffset({ ...c });
  };
  const onMouseUp = () => { dragging.current = false; };

  const onWheel = (e) => {
    e.preventDefault();
    const img = imgRef.current;
    const min = Math.max(W / img.width, H / img.height);
    const s = Math.max(min, Math.min(4, scaleRef.current + (e.deltaY < 0 ? 0.05 : -0.05)));
    scaleRef.current = s;
    const c = clamp(offsetRef.current.x, offsetRef.current.y, s);
    offsetRef.current = c;
    setScale(s);
    setOffset({ ...c });
  };

  const handleSave = () => {
    const out = document.createElement('canvas');
    out.width = 1500;
    out.height = 375;
    const ctx = out.getContext('2d');
    const rx = 1500 / W;
    const ry = 375 / H;
    ctx.drawImage(imgRef.current, offset.x * rx, offset.y * ry, imgRef.current.width * scale * rx, imgRef.current.height * scale * ry);
    out.toBlob(blob => {
      onSave(new File([blob], 'background.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-white font-semibold text-lg">Crop background</h2>
        <p className="text-gray-400 text-sm">Drag to move · Scroll to zoom</p>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="rounded-xl cursor-grab active:cursor-grabbing"
          style={{ width: W, height: H }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        />
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded-full text-sm font-medium transition">Cancel</button>
          <button onClick={handleSave} className="flex-1 bg-white hover:bg-gray-100 text-black py-2 rounded-full text-sm font-medium transition">Save</button>
        </div>
      </div>
    </div>
  );
}
