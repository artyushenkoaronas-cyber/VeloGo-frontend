export default function OfficialArtistBadge({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: 'inline', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="12" fill="#BF5AF2" />
      {/* music note */}
      <path
        d="M15 7.5v7"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M15 7.5L10 9v6"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="15" r="1.7" fill="white" />
      <circle cx="15" cy="14.5" r="1.7" fill="white" />
    </svg>
  );
}
