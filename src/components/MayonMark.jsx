import { COLORS } from '../theme';

// Mayon's near-perfect cone, with the sun rising behind it.
export default function MayonMark({ color = COLORS.siliDeep, sun = COLORS.abaca }) {
  return (
    <svg viewBox="0 0 200 100" aria-hidden="true" style={{ display: 'block', width: '100%', height: 'auto' }}>
      <circle cx="132" cy="44" r="22" fill={sun} />
      <path d="M0 100 C55 96 84 46 96 20 Q100 13 104 20 C116 46 145 96 200 100 Z" fill={color} />
      <path
        d="M99 12 C96 8 101 5 98 1"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}