import { useEffect, useState, type ReactNode } from "react";
import type { Complaint, DashboardStats } from "../lib/types";
import DashboardShell from "./DashboardShell";
import StatCard from "./StatCard";
import ComplaintsTable, { type ComplaintsTableProps } from "./ComplaintsTable";
import Icon from "./Icon";
import { cardClass, PageHeading } from "./ui";

export interface AdminDashboardProps {
  stats?: DashboardStats | null;
  statsLoading?: boolean;
  tableProps?: Omit<ComplaintsTableProps, "complaints">;
  pagination?: ReactNode;
  adminName?: string;
  complaints?: Complaint[];
  registeredUsers?: number;
  demo?: boolean;
  csrfToken?: string;
  logoutEndpoint?: string;
  onRefresh?: () => void;
}
export default function AdminDashboard({
  adminName = "Admin",
  complaints = [],
  registeredUsers = 0,
  demo = false,
  csrfToken,
  logoutEndpoint,
  stats,
  statsLoading = false,
  tableProps,
  pagination,
  onRefresh,
}: AdminDashboardProps) {
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(
      new Intl.DateTimeFormat("en-PH", {
        dateStyle: "long",
        timeZone: "Asia/Manila",
      }).format(new Date()),
    );
  }, []);
  return (
    <DashboardShell
      demo={demo}
      csrfToken={csrfToken}
      logoutEndpoint={logoutEndpoint}
      userName={adminName}
    >
      <PageHeading
        eyebrow="Your community at a glance"
        title={`Welcome, ${adminName}.`}
        description="A little overview of what’s happening in your barangay."
      >
        {date && (
          <p className="date-label">
            <Icon name="clock" size={13} />
            {date}
          </p>
        )}
      </PageHeading>
      {demo && (
        <p className="demo-note" style={{ marginBottom: 22 }}>
          Template preview · the records below are fictional sample data.
        </p>
      )}
      <section
        aria-label="System statistics"
        className="stats-grid"
        aria-busy={statsLoading}
      >
        <StatCard
          label="Total complaints"
          value={
            stats === null ? undefined : (stats?.total ?? complaints.length)
          }
          icon="📋"
          loading={statsLoading && !stats}
        />
        <StatCard
          label="Pending review"
          value={
            stats === null
              ? undefined
              : (stats?.pending ??
                complaints.filter((c) => c.status === "Pending").length)
          }
          icon="⏳"
          tone="orange"
          loading={statsLoading && !stats}
        />
        <StatCard
          label="Resolved"
          value={
            stats === null
              ? undefined
              : (stats?.resolved ??
                complaints.filter((c) => c.status === "Resolved").length)
          }
          icon="✅"
          tone="green"
          loading={statsLoading && !stats}
        />
        <StatCard
          label="Registered users"
          value={
            stats === null
              ? undefined
              : (stats?.registeredUsers ?? registeredUsers)
          }
          icon="👥"
          tone="red"
          loading={statsLoading && !stats}
        />
      </section>
      <section
        id="complaints"
        aria-labelledby="complaints-title"
        className={cardClass}
        style={{ scrollMarginTop: 20 }}
      >
        <div className="section-heading">
          <div>
            <h2 id="complaints-title">Community complaints</h2>
            <p>Review reports and help move concerns forward.</p>
          </div>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="button button-secondary"
              style={{ minHeight: 35, padding: "7px 12px", fontSize: 10 }}
            >
              <Icon name="refresh" size={13} />
              Refresh
            </button>
          ) : (
            <span className="section-label">Latest activity</span>
          )}
        </div>
        <ComplaintsTable complaints={complaints} {...tableProps} />
        {pagination}
      </section>
    </DashboardShell>
  );
}
