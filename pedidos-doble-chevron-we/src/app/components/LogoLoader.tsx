// Emblema circular para el Loading Overlay — ícono compacto y reconocible
// Círculo terracota con estrella crema y monograma DC
export default function LogoLoader({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Doble Chevron"
    >
      {/* Fondo circular terracota */}
      <circle cx="40" cy="40" r="38" fill="#CC4422" />
      {/* Borde interior crema sutil */}
      <circle cx="40" cy="40" r="34" fill="none" stroke="#F2E2B8" strokeWidth="1.5" opacity="0.45" />

      {/* Estrella 5 puntas centrada en (40, 40) — R=17, r=6.8 */}
      <polygon
        points="40,23 42.01,29.24 48.62,29.24 43.3,33.01 45.31,39.25 40,35.48 34.69,39.25 36.7,33.01 31.38,29.24 37.99,29.24"
        fill="#F2E2B8"
      />

      {/* Monograma "DC" debajo de la estrella */}
      <text
        x="40"
        y="58"
        fontFamily="var(--font-lobster), Lobster, cursive"
        fontSize="16"
        fill="#F2E2B8"
        textAnchor="middle"
        letterSpacing="1"
      >
        DC
      </text>
    </svg>
  )
}
