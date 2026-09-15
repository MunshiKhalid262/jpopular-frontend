import { formatInr } from "@/lib/money";
import type { DashboardData } from "@/features/reporting/types";

/**
 * Seven-day sales bar chart, as inline SVG.
 *
 * NO CHARTING LIBRARY. Recharts and friends are ~100KB of client JavaScript
 * and force the whole panel to become a client component; seven bars do not
 * justify either. This renders on the server, ships no JS at all, and is
 * readable by keyboard and screen reader because each bar carries its own
 * accessible label.
 *
 * Bar heights are computed from the decimal STRINGS as integer paise, so the
 * only floating point involved is the final pixel percentage -- never a money
 * value.
 */
export function SalesTrendChart({ series }: { series: DashboardData["sales_trend"] }) {
  // "1180.50" -> 118050 paise. Exact for any realistic turnover.
  const toPaise = (value: string): number => {
    const [whole, fraction = ""] = value.split(".");
    const paise = Number(whole) * 100 + Number(fraction.slice(0, 2).padEnd(2, "0"));

    return Number.isFinite(paise) ? paise : 0;
  };

  const points = series.map((point) => ({ ...point, paise: toPaise(point.total) }));
  const peak = Math.max(...points.map((p) => p.paise), 0);
  const total = points.reduce((sum, p) => sum + p.paise, 0);

  if (peak === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-[0.8125rem] text-fg-muted">
        No sales in the last 7 days.
      </div>
    );
  }

  return (
    <div>
      <div className="flex h-40 items-end gap-2" role="img" aria-label="Sales for the last seven days">
        {points.map((point) => {
          // A non-zero day always gets a visible sliver, so "a little" never
          // looks identical to "nothing".
          const height = point.paise === 0 ? 0 : Math.max(3, (point.paise / peak) * 100);

          return (
            <div key={point.date} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-primary-600/85"
                  style={{ height: `${height}%` }}
                  title={`${point.label}: ${formatInr(point.total)}`}
                />
              </div>
              <span className="whitespace-nowrap text-[0.6875rem] text-fg-subtle">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* The same figures as text, so the chart is not the only way to read
          them. */}
      <table className="sr-only">
        <caption>Sales for the last seven days</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Sales</th>
            <th>Invoices</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}>
              <td>{point.label}</td>
              <td>{formatInr(point.total)}</td>
              <td>{point.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 border-t border-border pt-2.5 text-xs text-fg-muted">
        7-day total{" "}
        <span className="num font-medium text-fg">
          {formatInr((total / 100).toFixed(2))}
        </span>
      </p>
    </div>
  );
}
