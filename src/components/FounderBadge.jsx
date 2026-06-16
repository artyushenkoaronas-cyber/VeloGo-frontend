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
      <rect x="4" y="4" width="28" height="28" rx="4" fill="#4F85F6" transform="rotate(15, 18, 18)" />
      <path
        transform="translate(18, 18) scale(1.1) translate(-16.2, -16.5)"
        d="M21.7071 13.7071C22.0976 13.3166 22.0976 12.6834 21.7071 12.2929C21.3166 11.9024 20.6834 11.9024 20.2929 12.2929L14 18.5858L11.7071 16.2929C11.3166 15.9024 10.6834 15.9024 10.2929 16.2929C9.90237 16.6834 9.90237 17.3166 10.2929 17.7071L13.2929 20.7071C13.6834 21.0976 14.3166 21.0976 14.7071 20.7071L21.7071 13.7071Z"
        fill="white"
      />
    </svg>
  );
}
