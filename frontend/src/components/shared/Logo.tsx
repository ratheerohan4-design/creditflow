interface LogoProps {
  className?: string;
  inverted?: boolean;
}

/**
 * The mark is one incoming payment that splits into two outgoing flows —
 * the merchant's share and the lender's share.
 */
const MARK_STROKE = 2.8;

function Mark({ inverted }: { inverted: boolean }) {
  const primary = inverted ? "#FFFFFF" : "#0D2B45";
  const secondary = inverted ? "#FFFFFF" : "#0A4A5C";
  return (
    <g fill="none" strokeLinecap="round">
      <path d="M4 16 H14" stroke={primary} strokeWidth={MARK_STROKE} />
      <path d="M14 16 C18.4 16 18.6 9.4 24 9.4" stroke="#F5A623" strokeWidth={MARK_STROKE} />
      <path d="M24 6 L29.2 9.4 L23.8 12.9 Z" fill="#F5A623" />
      <path d="M14 16 C18.4 16 18.6 22.6 24 22.6" stroke={primary} strokeWidth={MARK_STROKE} />
      <path d="M24 19.2 L29.2 22.6 L23.8 26.1 Z" fill={secondary} />
    </g>
  );
}

export function Logo({ className, inverted = false }: LogoProps) {
  return (
    <svg
      viewBox="0 0 148 32"
      className={className ?? "h-8 w-auto"}
      role="img"
      aria-label="CreditFlow"
    >
      <Mark inverted={inverted} />
      <text
        x="38"
        y="22"
        fontFamily="inherit"
        fontSize="18"
        fontWeight="600"
        letterSpacing="-0.3"
        fill={inverted ? "#FFFFFF" : "#0D2B45"}
      >
        Credit
        <tspan fill={inverted ? "#F5A623" : "#0A4A5C"}>Flow</tspan>
      </text>
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="CreditFlow mark">
      <Mark inverted={false} />
    </svg>
  );
}
