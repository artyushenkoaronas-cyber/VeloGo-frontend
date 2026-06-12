export default function FounderBadge({ size = 18 }) {
  const pad = size * 0.28;
  const r = size * 0.28;
  return (
    <svg
      width={size * 1.6}
      height={size}
      viewBox="0 0 26 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
      aria-label="GUR founder"
    >
      <rect width="26" height="16" rx="4" fill="#4F85F6" />
      <text
        x="13"
        y="11.5"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="800"
        fontFamily="Arial, sans-serif"
        letterSpacing="0.5"
      >
        GUR
      </text>
    </svg>
  );
}
