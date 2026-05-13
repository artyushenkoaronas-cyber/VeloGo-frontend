export default function VerifiedBadge({ size = 16, full = false }) {
  if (full) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ display: 'inline', flexShrink: 0, color: '#aaaaaa' }}
      >
        <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm5.707 7.293a1 1 0 010 1.414L10 17.414l-3.707-3.707a1 1 0 111.414-1.414L10 14.586l6.293-6.293a1 1 0 011.414 0Z" />
      </svg>
    );
  }
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
