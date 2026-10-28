import { useEffect, useState } from "react";
import { getJson } from "./api";
import type { Complaint, ComplaintStatus, Paginated } from "./types";

export function useComplaints(enabled: boolean) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<ComplaintStatus | "">("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<Paginated<Complaint>>({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (!enabled) return;
    const abort = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      search: debouncedSearch,
      status,
    });
    getJson<Paginated<Complaint>>(`/api/complaints/?${params}`, abort.signal)
      .then((value) => {
        if (abort.signal.aborted) return;
        setData(value);
        setHasLoaded(true);
      })
      .catch((err) => {
        if (!abort.signal.aborted)
          setError(
            err instanceof Error ? err.message : "Unable to load complaints.",
          );
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [enabled, page, debouncedSearch, status, revision]);
  return {
    data,
    error,
    loading: loading || search !== debouncedSearch,
    hasLoaded,
    page,
    setPage,
    refresh: () => setRevision((value) => value + 1),
    filters: {
      search,
      status,
      onSearchChange: (value: string) => setSearch(value),
      onStatusChange: (value: ComplaintStatus | "") => {
        setStatus(value);
        setPage(1);
      },
    },
  };
}
