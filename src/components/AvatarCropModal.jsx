import { useEffect, useRef, useState } from 'react';

export default function AvatarCropModal({ file, onSave, onClose }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(new Image());
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const SIZE = 320;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    imgRef.current.onload = () => {
      const img = imgRef.current;
      const s = Math.max(SIZE / img.width, SIZE / img.height);
      scaleRef.current = s;
      setScale(s);
      const ox = (SIZE - img.width * s) / 2;
      const oy = (SIZE - img.height * s) / 2;
      offsetRef.current = { x: ox, y: oy };
      setOffset({ x: ox, y: oy });
    };
    imgRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    draw();
  }, [scale, offset]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    const img = imgRef.current;
    if (!img.complete || !img.naturalWidth) return;
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);
    // dark overlay outside circle
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // circle border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();
  };

  const clampOffset = (ox, oy, s) => {
    const img = imgRef.current;
    const iw = img.width * s;
    const ih = img.height * s;
    return {
      x: Math.min(0, Math.max(SIZE - iw, ox)),
      y: Math.min(0, Math.max(SIZE - ih, oy)),
    };
  };

  const onMouseDown = (e) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    const raw = { x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y };
    const clamped = clampOffset(raw.x, raw.y, scaleRef.current);
    offsetRef.current = clamped;
    setOffset({ ...clamped });
  };
  const onMouseUp = () => { dragging.current = false; };

  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const img = imgRef.current;
    const minScale = Math.max(SIZE / img.width, SIZE / img.height);
    const newScale = Math.max(minScale, Math.min(4, scaleRef.current + delta));
    scaleRef.current = newScale;
    const clamped = clampOffset(offsetRef.current.x, offsetRef.current.y, newScale);
    offsetRef.current = clamped;
    setScale(newScale);
    setOffset({ ...clamped });
  };

  const handleSave = () => {
    const out = document.createElement('canvas');
    out.width = 256;
    out.height = 256;
    const ctx = out.getContext('2d');
    ctx.beginPath();
    ctx.arc(128, 128, 128, 0, Math.PI * 2);
    ctx.clip();
    const img = imgRef.current;
    const ratio = 256 / SIZE;
    ctx.drawImage(img, offset.x * ratio, offset.y * ratio, img.width * scale * ratio, img.height * scale * ratio);
    out.toBlob(blob => {
      const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      onSave(croppedFile);
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-white font-semibold text-lg">Crop avatar</h2>
        <p className="text-gray-400 text-sm">Drag to move · Scroll to zoom</p>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="rounded-xl cursor-grab active:cursor-grabbing"
          style={{ width: SIZE, height: SIZE }}
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
