type P = { size?: number };

export function CloseIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.53 4.53a.75.75 0 0 0-1.06-1.06L10 8.94 4.53 3.47a.75.75 0 0 0-1.06 1.06L8.94 10l-5.47 5.47a.75.75 0 1 0 1.06 1.06L10 11.06l5.47 5.47a.75.75 0 1 0 1.06-1.06L11.06 10z"
      />
    </svg>
  );
}

export function ClockIcon({ size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="7.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 5.5V10l3 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ActiveIcon({ size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="5" fill="var(--active)" />
    </svg>
  );
}

export function AwayIcon({ size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="4.25" fill="none" stroke="var(--away)" strokeWidth="1.5" />
    </svg>
  );
}

/** Slack's "notifications snoozed" mark: a crescent with a small z. */
export function SnoozedIcon({ size = 18, active }: P & { active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill={active ? "var(--dnd)" : "var(--away)"}
        d="M9.2 3.6a6.6 6.6 0 1 0 7.2 9.1.6.6 0 0 0-.8-.8 5.2 5.2 0 0 1-6.8-7.5.6.6 0 0 0 .4-.8Z"
      />
      <path
        fill="none"
        stroke={active ? "var(--dnd)" : "var(--away)"}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.3 3.5h3.2l-3.2 3.6h3.2"
      />
    </svg>
  );
}

export function MessageIcon({ size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        d="M4.5 3.75h11a1.75 1.75 0 0 1 1.75 1.75v7a1.75 1.75 0 0 1-1.75 1.75H9l-3.6 2.6a.4.4 0 0 1-.65-.33v-2.27H4.5A1.75 1.75 0 0 1 2.75 12.5v-7A1.75 1.75 0 0 1 4.5 3.75Z"
      />
    </svg>
  );
}

export function HeadphonesIcon({ size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.25 13.5V10a6.75 6.75 0 0 1 13.5 0v3.5M3.25 12.25h1.5a1 1 0 0 1 1 1v2.5a1 1 0 0 1-1 1h-.5a1 1 0 0 1-1-1zM16.75 12.25h-1.5a1 1 0 0 0-1 1v2.5a1 1 0 0 0 1 1h.5a1 1 0 0 0 1-1z"
      />
    </svg>
  );
}

export function KebabIcon({ size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="4.5" r="1.5" fill="currentColor" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <circle cx="10" cy="15.5" r="1.5" fill="currentColor" />
    </svg>
  );
}
