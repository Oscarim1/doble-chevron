// Wordmark para TopBar — texto crema con contorno oscuro, fondo transparente
// Diseñado para usarse sobre fondo terracota (#CC4422)
export default function LogoTopBar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 148 46"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Doble Chevron"
    >
      {/* "Doble" — contorno oscuro + relleno crema (efecto retro del logo) */}
      <text
        x="2" y="22"
        fontFamily="var(--font-lobster), Lobster, cursive"
        fontSize="22"
        fill="#1A0F08"
        stroke="#1A0F08"
        strokeWidth="6"
        strokeLinejoin="round"
        paintOrder="stroke fill"
        letterSpacing="0.3"
      >Doble</text>
      <text
        x="2" y="22"
        fontFamily="var(--font-lobster), Lobster, cursive"
        fontSize="22"
        fill="#F2E2B8"
        letterSpacing="0.3"
      >Doble</text>

      {/* "Chevron" — ídem */}
      <text
        x="2" y="44"
        fontFamily="var(--font-lobster), Lobster, cursive"
        fontSize="22"
        fill="#1A0F08"
        stroke="#1A0F08"
        strokeWidth="6"
        strokeLinejoin="round"
        paintOrder="stroke fill"
        letterSpacing="0.3"
      >Chevron</text>
      <text
        x="2" y="44"
        fontFamily="var(--font-lobster), Lobster, cursive"
        fontSize="22"
        fill="#F2E2B8"
        letterSpacing="0.3"
      >Chevron</text>
    </svg>
  )
}
