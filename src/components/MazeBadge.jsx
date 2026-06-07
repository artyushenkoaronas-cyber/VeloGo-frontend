export default function MazeBadge({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
    >
      {/* Outer glow ring */}
      <circle cx="10" cy="10" r="9.5" fill="#581c87" />
      <circle cx="10" cy="10" r="9" fill="#7c3aed" />
      <circle cx="10" cy="10" r="8.2" fill="#6d28d9" />

      {/* Maze pattern inside */}
      {/* Outer maze border segments */}
      <rect x="3" y="3" width="14" height="1.2" rx="0.4" fill="#e9d5ff" />
      <rect x="3" y="15.8" width="14" height="1.2" rx="0.4" fill="#e9d5ff" />
      <rect x="3" y="3" width="1.2" height="14" rx="0.4" fill="#e9d5ff" />
      <rect x="15.8" y="3" width="1.2" height="14" rx="0.4" fill="#e9d5ff" />

      {/* Inner maze walls */}
      {/* Top-left block */}
      <rect x="5" y="5" width="3.5" height="1" rx="0.3" fill="#c4b5fd" />
      <rect x="5" y="5" width="1" height="4" rx="0.3" fill="#c4b5fd" />

      {/* Top-right area */}
      <rect x="11.5" y="5" width="3.5" height="1" rx="0.3" fill="#c4b5fd" />
      <rect x="14" y="5" width="1" height="3.5" rx="0.3" fill="#c4b5fd" />

      {/* Middle cross */}
      <rect x="7" y="8.5" width="6" height="1" rx="0.3" fill="#fde68a" />
      <rect x="9.5" y="7" width="1" height="6" rx="0.3" fill="#fde68a" />

      {/* Bottom-left */}
      <rect x="5" y="11.5" width="1" height="3.5" rx="0.3" fill="#c4b5fd" />
      <rect x="5" y="14" width="3.5" height="1" rx="0.3" fill="#c4b5fd" />

      {/* Bottom-right */}
      <rect x="14" y="11.5" width="1" height="4" rx="0.3" fill="#c4b5fd" />
      <rect x="11.5" y="14" width="3.5" height="1" rx="0.3" fill="#c4b5fd" />

      {/* Center dot */}
      <circle cx="10" cy="10" r="1" fill="#fde68a" />

      {/* Shine */}
      <path d="M5 4 Q8 3.5 9 5 Q7 5 5 4Z" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}
