export default function VerifiedBadge({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline', flexShrink: 0 }}
    >
      <circle cx="24" cy="24" r="24" fill="#20D5EC" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M37.1213 15.8787C38.2929 17.0503 38.2929 18.9497 37.1213 20.1213L22.2426 35L10.8787 23.6361C9.70711 22.4645 9.70711 20.5651 10.8787 19.3935C12.0503 18.2219 13.9497 18.2219 15.1213 19.3935L22.2426 26.5147L32.8787 15.8787C34.0503 14.7071 35.9497 14.7071 37.1213 15.8787Z"
        fill="white"
      />
    </svg>
  );
}
