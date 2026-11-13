import type { Kpi } from "../lib/kpis";

export function KpiStrip({ kpis, label }: { kpis: Kpi[]; label: string }) {
  return (
    <section className="kpis" aria-label={label}>
      {kpis.map((k) => (
        <div key={k.id} className="kpi">
          <span className="kpi-label">{k.label}</span>
          <span className="kpi-value">{k.value}</span>
          {k.share !== undefined && (
            <span className="kpi-bar" aria-hidden="true">
              <span
                className={`kpi-fill fill-${k.shareTone ?? "done"}`}
                style={{
                  width: `${Math.max(k.share > 0 ? 3 : 0, Math.round(k.share * 100))}%`,
                }}
              />
            </span>
          )}
          <span className={`kpi-detail ${k.tone ? `tone-${k.tone}` : ""}`}>
            {k.detail}
          </span>
        </div>
      ))}
    </section>
  );
}
