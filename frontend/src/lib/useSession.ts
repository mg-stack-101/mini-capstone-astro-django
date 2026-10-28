import { useEffect, useState } from "react";
import { ApiError, getJson, resetClientRequests } from "./api";
import type { SessionUser } from "./types";

export function useSession(requiredRole?: "admin") {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    getJson<{ user: SessionUser }>("/api/me/", abort.signal)
      .then(({ user }) => {
        if (abort.signal.aborted) return;
        if (!user || !["admin", "resident"].includes(user.role))
          throw new Error(
            "We could not verify your account. Please sign in again.",
          );
        if (requiredRole && user.role !== requiredRole) {
          window.location.replace("/resident_dashboard/");
          return;
        }
        setUser(user);
      })
      .catch((err) => {
        if (abort.signal.aborted) return;
        if (err instanceof ApiError && [401, 403].includes(err.status)) {
          resetClientRequests();
          window.location.replace("/login/");
        } else
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your account. Please try again.",
          );
      });
    return () => abort.abort();
  }, [requiredRole]);
  return { user, error };
}
