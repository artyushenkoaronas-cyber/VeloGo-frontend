export default function FounderBadge({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
      aria-label="Verified"
    >
      {/* Square rotated 15deg */}
      <rect x="4" y="4" width="28" height="28" rx="4" fill="#4F85F6" transform="rotate(15, 18, 18)" />
      {/* Checkmark stays straight (not rotated) */}
      <path
        d="M25.7071 17.7071C26.0976 17.3166 26.0976 16.6834 25.7071 16.2929C25.3166 15.9024 24.6834 15.9024 24.2929 16.2929L18 22.5858L15.7071 20.2929C15.3166 19.9024 14.6834 19.9024 14.2929 20.2929C13.9024 20.6834 13.9024 21.3166 14.2929 21.7071L17.2929 24.7071C17.6834 25.0976 18.3166 25.0976 18.7071 24.7071L25.7071 17.7071Z"
        fill="white"
      />
    </svg>
  );
}
