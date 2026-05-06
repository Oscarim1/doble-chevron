// Banner completo para la pantalla de Login — replica el estilo del logo original
// Fondo terracota, texto crema con contorno oscuro, estrella a la derecha
export default function LogoLogin({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 130"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Doble Chevron"
    >
      {/* Fondo terracota redondeado */}
      <rect width="340" height="130" rx="10" ry="10" fill="#CC4422" />

      {/* Textura sutil — viñeta oscura en bordes */}
      <rect
        width="340"
        height="130"
        rx="10"
        ry="10"
        fill="url(#vignette)"
        opacity="0.25"
      />
      <defs>
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor="#1A0F08" />
        </radialGradient>
      </defs>

      {/* "Doble" — texto crema con contorno café oscuro */}
      <text
        x="18"
        y="68"
        fontFamily="var(--font-lobster), Lobster, cursive"
        fontSize="62"
        fill="#1A0F08"
        stroke="#1A0F08"
        strokeWidth="10"
        strokeLinejoin="round"
        paintOrder="stroke fill"
        letterSpacing="-1"
      >
        Doble
      </text>
      <text
        x="18"
        y="68"
        fontFamily="var(--font-lobster), Lobster, cursive"
        fontSize="62"
        fill="#F2E2B8"
        letterSpacing="-1"
      >
        Doble
      </text>

      {/* "Chevron" — texto crema con contorno café oscuro */}
      <text
        x="18"
        y="122"
        fontFamily="var(--font-lobster), Lobster, cursive"
        fontSize="57"
        fill="#1A0F08"
        stroke="#1A0F08"
        strokeWidth="9"
        strokeLinejoin="round"
        paintOrder="stroke fill"
        letterSpacing="-1"
      >
        Chevron
      </text>
      <text
        x="18"
        y="122"
        fontFamily="var(--font-lobster), Lobster, cursive"
        fontSize="57"
        fill="#F2E2B8"
        letterSpacing="-1"
      >
        Chevron
      </text>

      {/* Estrella 5 puntas centrada en (300, 65) — R=22, r=8.8 */}
      <polygon
        points="300,43 302.76,51.24 311.44,51.24 304.72,56.62 307.48,64.86 300,59.48 292.52,64.86 295.28,56.62 288.56,51.24 297.24,51.24"
        fill="#1A0F08"
      />
      {/* Contorno crema sutil en la estrella */}
      <polygon
        points="300,43 302.76,51.24 311.44,51.24 304.72,56.62 307.48,64.86 300,59.48 292.52,64.86 295.28,56.62 288.56,51.24 297.24,51.24"
        fill="none"
        stroke="#F2E2B8"
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  )
}
