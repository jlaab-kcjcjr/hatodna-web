import { COLORS } from '../theme';

// A woven banig strip: alternating diamonds on an abaca ground.
export default function BanigBand({
  height = 12,
  id = 'banig',
  ground = COLORS.abaca,
  first = COLORS.sili,
  second = COLORS.pili,
}) {
  const h = height;
  const half = h / 2;
  return (
    <svg width="100%" height={h} aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width={h * 2} height={h}>
          <rect width={h * 2} height={h} fill={ground} />
          <path d={`M0 ${half} L${half} 0 L${h} ${half} L${half} ${h} Z`} fill={first} />
          <path d={`M${h} ${half} L${h + half} 0 L${h * 2} ${half} L${h + half} ${h} Z`} fill={second} />
        </pattern>
      </defs>
      <rect width="100%" height={h} fill={`url(#${id})`} />
    </svg>
  );
}