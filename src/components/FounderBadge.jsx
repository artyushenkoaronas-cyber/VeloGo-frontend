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
      <rect width="32" height="32" rx="8" fill="#4F85F6" />
      <path
        d="M8 17 L13 22 L24 10"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
