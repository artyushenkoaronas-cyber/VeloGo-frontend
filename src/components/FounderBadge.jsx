export default function FounderBadge({ size = 16 }) {
  return (
    <svg width={size * 1.8} height={size} viewBox="0 0 36 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', flexShrink: 0 }}>
      {/* Left wing */}
      <path d="M11 10 C8 6, 3 5, 1 8 C3 9, 5 9, 7 11 C8 12, 9 13, 10 12 Z" fill="#f5c542" />
      <path d="M11 10 C9 8, 4 9, 2 12 C4 12, 7 12, 9 13 Z" fill="#e6a800" />
      {/* Right wing */}
      <path d="M25 10 C28 6, 33 5, 35 8 C33 9, 31 9, 29 11 C28 12, 27 13, 26 12 Z" fill="#f5c542" />
      <path d="M25 10 C27 8, 32 9, 34 12 C32 12, 29 12, 27 13 Z" fill="#e6a800" />
      {/* Shield body */}
      <path d="M18 2 L24 5 L24 12 C24 15.5 18 18 18 18 C18 18 12 15.5 12 12 L12 5 Z" fill="#7c3aed" />
      <path d="M18 3.5 L23 6 L23 12 C23 15 18 17 18 17 C18 17 13 15 13 12 L13 6 Z" fill="#9333ea" />
      {/* Shield shine */}
      <path d="M15 6 L18 4.5 L18 10 L15 11 Z" fill="rgba(255,255,255,0.15)" />
      {/* Star/emblem */}
      <path d="M18 7 L18.7 9.2 L21 9.2 L19.2 10.5 L19.9 12.7 L18 11.4 L16.1 12.7 L16.8 10.5 L15 9.2 L17.3 9.2 Z" fill="#fde68a" />
    </svg>
  );
}
