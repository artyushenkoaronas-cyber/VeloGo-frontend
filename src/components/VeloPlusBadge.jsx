export default function VeloPlusBadge({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}>
      <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" fill="#1a1a2e" stroke="#7c3aed" strokeWidth="1.5"/>
      <path d="M18 5L29.5 11.5V24.5L18 31L6.5 24.5V11.5L18 5Z" fill="url(#vpGrad)"/>
      <text x="18" y="23" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial, sans-serif">V+</text>
      <defs>
        <linearGradient id="vpGrad" x1="6" y1="5" x2="30" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed"/>
          <stop offset="100%" stopColor="#4f46e5"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
