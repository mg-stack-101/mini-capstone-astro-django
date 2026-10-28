import type { CSSProperties } from "react";
import { Brand } from "./ui";

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div aria-hidden="true" className={`skeleton ${className}`} style={style} />
  );
}
export function TableSkeleton() {
  return (
    <div aria-hidden="true" className="table-skeleton">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 20,
            padding: "20px 10px",
            borderTop: "1px solid var(--line)",
          }}
        >
          <Skeleton className="skeleton-cell" style={{ width: "12%" }} />
          <Skeleton className="skeleton-cell" style={{ width: "24%" }} />
          <Skeleton className="skeleton-cell" style={{ width: "23%" }} />
          <Skeleton className="skeleton-cell" style={{ width: "16%" }} />
          <Skeleton className="skeleton-cell" style={{ width: "13%" }} />
        </div>
      ))}
    </div>
  );
}
export function FormSkeleton() {
  return (
    <div aria-hidden="true" className="surface skeleton-form">
      <Skeleton className="skeleton-heading" />
      <Skeleton className="skeleton-line" style={{ width: "70%" }} />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i}>
          <Skeleton className="skeleton-form-label" />
          <Skeleton className="skeleton-input" />
        </div>
      ))}
      <Skeleton style={{ height: 130 }} />
      <Skeleton style={{ height: 44, width: 160 }} />
    </div>
  );
}
export function DashboardSkeleton({
  variant = "admin",
}: {
  variant?: "admin" | "resident" | "overview";
}) {
  return (
    <div
      className="app-shell"
      aria-busy="true"
      aria-label="Loading your account"
    >
      <div className="mobile-header">
        <Brand />
        <Skeleton style={{ width: 40, height: 38 }} />
      </div>
      <aside className="sidebar loading-sidebar" aria-hidden="true" inert>
        <div className="sidebar-brand">
          <Brand />
        </div>
        <div className="sidebar-nav" style={{ display: "block" }}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="skeleton-nav" />
          ))}
        </div>
      </aside>
      <div className="workspace">
        <div className="workspace-header" aria-hidden="true">
          <Skeleton className="skeleton-line" style={{ width: 150 }} />
          <Skeleton className="skeleton-avatar" />
        </div>
        <main id="main" className="workspace-body">
          <span role="status" className="sr-only">
            Loading your account…
          </span>
          <div style={{ marginBottom: 30 }}>
            <Skeleton
              className="skeleton-line"
              style={{ width: 130, marginBottom: 14 }}
            />
            <Skeleton className="skeleton-heading" />
            <Skeleton className="skeleton-line" style={{ width: "65%" }} />
          </div>
          {variant === "resident" ? (
            <div className="resident-grid">
              <FormSkeleton />
              <Skeleton style={{ height: 300 }} />
            </div>
          ) : (
            <>
              <div className="stats-grid">
                {Array.from({ length: 4 }, (_, i) => (
                  <div className="stat-card" key={i}>
                    <Skeleton
                      className="skeleton-line"
                      style={{ width: "65%" }}
                    />
                    <Skeleton className="skeleton-value" />
                    <Skeleton
                      className="skeleton-line"
                      style={{ width: "45%", marginTop: 14 }}
                    />
                  </div>
                ))}
              </div>
              <div className="surface">
                <Skeleton
                  className="skeleton-line"
                  style={{ width: 150, marginBottom: 25 }}
                />
                <Skeleton
                  className="skeleton-input"
                  style={{ marginBottom: 20 }}
                />
                <TableSkeleton />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
