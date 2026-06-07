export default function MazeBadge({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
    >
      {/* Background square with rounded corners */}
      <rect width="100" height="100" rx="18" fill="#2a2a2a" />

      {/* Maze / labyrinth pattern — square spiral (Greek key style) */}
      {/* Outer frame top */}
      <rect x="10" y="10" width="80" height="10" rx="3" fill="#e0e0e0" />
      {/* Outer frame left */}
      <rect x="10" y="10" width="10" height="80" rx="3" fill="#e0e0e0" />
      {/* Outer frame bottom */}
      <rect x="10" y="80" width="80" height="10" rx="3" fill="#e0e0e0" />
      {/* Outer frame right — gap at top-right for entry */}
      <rect x="80" y="30" width="10" height="60" rx="3" fill="#e0e0e0" />

      {/* Second ring top — gap on right */}
      <rect x="20" y="20" width="50" height="10" rx="3" fill="#e0e0e0" />
      {/* Second ring left — gap at bottom */}
      <rect x="20" y="20" width="10" height="50" rx="3" fill="#e0e0e0" />
      {/* Second ring bottom */}
      <rect x="20" y="70" width="60" height="10" rx="3" fill="#e0e0e0" />
      {/* Second ring right */}
      <rect x="70" y="40" width="10" height="30" rx="3" fill="#e0e0e0" />

      {/* Third ring top */}
      <rect x="30" y="30" width="30" height="10" rx="3" fill="#e0e0e0" />
      {/* Third ring right */}
      <rect x="30" y="30" width="10" height="30" rx="3" fill="#e0e0e0" />
      {/* Third ring bottom — gap on left */}
      <rect x="40" y="60" width="30" height="10" rx="3" fill="#e0e0e0" />
      {/* Third ring right side */}
      <rect x="60" y="40" width="10" height="20" rx="3" fill="#e0e0e0" />

      {/* Inner core */}
      <rect x="40" y="40" width="15" height="10" rx="3" fill="#e0e0e0" />
      <rect x="40" y="40" width="10" height="15" rx="3" fill="#e0e0e0" />
    </svg>
  );
}
