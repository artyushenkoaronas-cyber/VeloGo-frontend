export default function VerifiedBadge({ size = 12 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="currentColor"
      style={{ display: 'inline', flexShrink: 0, color: '#aaaaaa' }}
    >
      <path d="M9.896 2.896 4.25 8.543 2.103 6.396l-.078-.064a.5.5 0 00-.629.771L4.25 9.957l6.354-6.354a.5.5 0 10-.708-.707Z" />
    </svg>
  );
}
