export default function FounderBadge({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
      aria-label="Verified"
    >
      <rect width="18" height="18" rx="4.5" fill="#4F85F6" />
      <path
        d="M5 9.5 L7.5 12 L13 6.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
