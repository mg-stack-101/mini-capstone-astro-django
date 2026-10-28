import { useEffect, useState } from "react";
import { getJson, patchJson } from "../lib/api";
import { useSession } from "../lib/useSession";
import { useComplaints } from "../lib/useComplaints";
import type { ComplaintStatus, DashboardStats } from "../lib/types";
import AdminDashboard from "./AdminDashboard";
import Pagination from "./Pagination";
import SessionLoading from "./SessionLoading";
import { Feedback } from "./ui";

export default function LiveAdminDashboard() {
  const { user, error } = useSession("admin");
  // The server enforces ownership/roles. Fetch independent reads concurrently,
  // but never render private records until /me has verified the account.
  const list = useComplaints(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setStatsLoading(true);
    setStatsError("");
    getJson<DashboardStats>("/api/dashboard/", abort.signal)
      .then((value) => {
        if (!abort.signal.aborted) setStats(value);
      })
      .catch((err) => {
        if (!abort.signal.aborted)
          setStatsError(
            err instanceof Error ? err.message : "Unable to load statistics.",
          );
      })
      .finally(() => {
        if (!abort.signal.aborted) setStatsLoading(false);
      });
    return () => abort.abort();
  }, [revision]);
  function refresh() {
    list.refresh();
    setRevision((value) => value + 1);
  }
  async function updateStatus(id: string, status: ComplaintStatus) {
    await patchJson(`/api/complaints/${id}/status/`, { status });
    refresh();
  }
  if (!user) return <SessionLoading error={error} variant="admin" />;
  return (
    <AdminDashboard
      adminName={user.name}
      complaints={list.data.results}
      stats={stats}
      statsLoading={statsLoading}
      onRefresh={refresh}
      tableProps={{
        remoteFilters: list.filters,
        onUpdateStatus: updateStatus,
        loading: list.loading,
        hasLoaded: list.hasLoaded,
        totalCount: list.data.count,
        error: list.error,
      }}
      pagination={
        <>
          {(list.error || statsError) && (
            <div className="inline-error">
              <Feedback error>{list.error || statsError}</Feedback>
              <button
                onClick={refresh}
                className="button button-quiet"
                style={{ marginTop: 8 }}
              >
                Try again
              </button>
            </div>
          )}
          {list.hasLoaded && (
            <Pagination
              page={list.page}
              count={list.data.count}
              hasPrevious={!!list.data.previous}
              hasNext={!!list.data.next}
              disabled={list.loading}
              onPage={list.setPage}
            />
          )}
        </>
      }
    />
  );
}
