export default function VeloPlusBadge({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: 'inline', flexShrink: 0, verticalAlign: 'middle' }}
      aria-label="VeloGo Plus subscriber"
    >
      <rect x="5" y="5" width="14" height="14" rx="2.5" transform="rotate(18 12 12)" fill="#e11d48" />
    </svg>
  );
}
