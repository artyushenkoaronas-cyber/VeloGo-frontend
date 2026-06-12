export default function FounderBadge({ size = 16 }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: size * 0.75,
        fontWeight: 800,
        letterSpacing: '0.04em',
        color: '#a855f7',
        verticalAlign: 'middle',
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      GUR
    </span>
  );
}
