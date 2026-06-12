export default function VeloPlusBadge({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: 'inline', flexShrink: 0, verticalAlign: 'middle' }}
      aria-label="VeloGo Plus subscriber"
    >
      {/* Rounded hexagon background */}
      <path
        d="M12 2.8 L18.2 6.4 Q19.5 7.1 19.5 8.6 L19.5 15.4 Q19.5 16.9 18.2 17.6 L12 21.2 L5.8 17.6 Q4.5 16.9 4.5 15.4 L4.5 8.6 Q4.5 7.1 5.8 6.4 Z"
        fill="#e11d48"
      />
      {/* Spiral inside - white */}
      <path
        d="M15.5 9 A5 5 0 1 1 8 13 A2.8 2.8 0 0 1 13.5 11.5 A1.4 1.4 0 0 1 12 13"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
