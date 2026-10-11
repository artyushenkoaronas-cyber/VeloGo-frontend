export default function VerifiedBadge({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="12" fill="#1a1a1a" />
      <path
        d="M6.5 12.5L10 16L17.5 8.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
