export default function FounderBadge({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
      aria-label="Verified"
    >
      <rect width="20" height="20" rx="5" fill="#5B8CF5" />
      <path
        d="M5.5 10.2 L8.2 13 L14.5 6.5"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
