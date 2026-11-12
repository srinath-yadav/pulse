import { HEALTH, type Health } from "../lib/health";

export function HealthShape({ health, size = 10 }: { health: Health; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" className={`shape-${health}`} aria-hidden="true">
      <path d={HEALTH[health].shape} fill="currentColor" />
    </svg>
  );
}

export function HealthBadge({ health }: { health: Health }) {
  return (
    <span className={`badge badge-${health}`}>
      <HealthShape health={health} />
      {HEALTH[health].label}
    </span>
  );
}
