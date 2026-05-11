export default function OfficialArtistBadge({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: 'inline', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="12" fill="#9333EA" />
      <path
        d="M9 17V8l9-2v9"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="17" r="2" fill="white" />
      <circle cx="16" cy="15" r="2" fill="white" />
    </svg>
  );
}
