export default function FounderBadge({ size = 20 }) {
  const w = size * 2.6;
  const h = size;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 52 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
    >
      {/* ── Left wing ── */}
      {/* outer feather sweep */}
      <path d="M22 10 C18 4, 10 1, 2 3 C4 6, 8 7, 12 9 C8 8, 4 9, 1 12 C4 12, 8 11, 12 12 C8 13, 5 15, 3 18 C7 16, 11 14, 14 13 Z" fill="#a855f7"/>
      {/* inner wing highlight */}
      <path d="M22 10 C19 6, 13 4, 7 5 C10 7, 14 8, 17 10 C14 10, 10 11, 7 13 C11 12, 15 12, 18 13 Z" fill="#c084fc"/>
      {/* feather tips */}
      <path d="M2 3 C5 2, 8 3, 10 5 C7 5, 4 4, 2 3Z" fill="#7e22ce"/>
      <path d="M1 12 C4 11, 7 11, 9 13 C6 13, 3 13, 1 12Z" fill="#7e22ce"/>
      <path d="M3 18 C6 16, 9 15, 11 14 C9 16, 6 17, 3 18Z" fill="#7e22ce"/>

      {/* ── Right wing ── */}
      <path d="M30 10 C34 4, 42 1, 50 3 C48 6, 44 7, 40 9 C44 8, 48 9, 51 12 C48 12, 44 11, 40 12 C44 13, 47 15, 49 18 C45 16, 41 14, 38 13 Z" fill="#a855f7"/>
      <path d="M30 10 C33 6, 39 4, 45 5 C42 7, 38 8, 35 10 C38 10, 42 11, 45 13 C41 12, 37 12, 34 13 Z" fill="#c084fc"/>
      <path d="M50 3 C47 2, 44 3, 42 5 C45 5, 48 4, 50 3Z" fill="#7e22ce"/>
      <path d="M51 12 C48 11, 45 11, 43 13 C46 13, 49 13, 51 12Z" fill="#7e22ce"/>
      <path d="M49 18 C46 16, 43 15, 41 14 C43 16, 46 17, 49 18Z" fill="#7e22ce"/>

      {/* ── Shield ── */}
      {/* shadow/depth */}
      <path d="M26 1.5 L33 4.5 L33 12 C33 16.5 26 19.5 26 19.5 C26 19.5 19 16.5 19 12 L19 4.5 Z" fill="#581c87"/>
      {/* main body */}
      <path d="M26 2 L32.5 4.8 L32.5 12 C32.5 16 26 19 26 19 C26 19 19.5 16 19.5 12 L19.5 4.8 Z" fill="#7c3aed"/>
      {/* lighter inner */}
      <path d="M26 3.2 L31.5 5.8 L31.5 12 C31.5 15.2 26 17.8 26 17.8 C26 17.8 20.5 15.2 20.5 12 L20.5 5.8 Z" fill="#9333ea"/>
      {/* shine */}
      <path d="M21.5 6 L26 3.5 L26 11 L21.5 12 Z" fill="rgba(255,255,255,0.12)"/>
      {/* star */}
      <path d="M26 6.5 L27 9.2 L30 9.2 L27.7 10.9 L28.6 13.6 L26 11.9 L23.4 13.6 L24.3 10.9 L22 9.2 L25 9.2 Z" fill="#fde68a"/>
    </svg>
  );
}
