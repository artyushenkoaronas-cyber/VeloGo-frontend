export default function FounderBadge({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
      aria-label="Verified"
    >
      {/* Square with very slight rounding like Roblox */}
      <rect width="32" height="32" rx="4" fill="#4F85F6" />
      {/* Tilted checkmark: pivot lower-right, right arm steep upward */}
      <path
        d="M7 18 L14 24 L25 9"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
