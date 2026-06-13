export default function FounderBadge({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
      aria-label="Verified"
    >
      {/* Roblox-style verified: blue rounded square */}
      <rect width="24" height="24" rx="7" fill="#4F85F6" />
      {/* Checkmark matching Roblox icon-filled-verified-check */}
      <path
        d="M6 12.5 L9.5 16 L18 8"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
