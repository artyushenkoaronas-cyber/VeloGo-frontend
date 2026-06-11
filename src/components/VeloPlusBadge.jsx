export default function VeloPlusBadge({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: 'inline', flexShrink: 0 }}
      aria-label="VeloGo Plus subscriber"
    >
      {/* Hexagon outline */}
      <path
        d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        style={{ color: '#e11d48' }}
      />
      {/* V+ text inside */}
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        fill="#e11d48"
        letterSpacing="-0.5"
      >V+</text>
    </svg>
  );
}
