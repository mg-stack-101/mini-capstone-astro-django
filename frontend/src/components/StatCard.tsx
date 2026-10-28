import Icon, { type IconName } from "./Icon";
import { Skeleton } from "./Skeleton";
export default function StatCard({
  label,
  value,
  icon,
  tone = "blue",
  loading = false,
}: {
  label: string;
  value?: number;
  icon: string;
  tone?: "blue" | "orange" | "green" | "red";
  loading?: boolean;
}) {
  const name: IconName =
    icon === "⏳"
      ? "clock"
      : icon === "✅"
        ? "checkCircle"
        : icon === "👥"
          ? "users"
          : "clipboard";
  const note =
    tone === "orange"
      ? "Awaiting review"
      : tone === "green"
        ? "Reviewed and completed"
        : tone === "red"
          ? "Active system accounts"
          : "Across your community";
  return (
    <div className="stat-card" aria-busy={loading}>
      <div className="stat-top">
        <p className="stat-label">{label}</p>
        <span className="stat-icon">
          <Icon name={name} size={16} />
        </span>
      </div>
      {loading ? (
        <Skeleton className="skeleton-value" />
      ) : (
        <p className="stat-value">
          {value === undefined ? "—" : value.toLocaleString("en-US")}
        </p>
      )}
      <p className="stat-note">{note}</p>
    </div>
  );
}
