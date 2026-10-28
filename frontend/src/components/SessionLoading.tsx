import { useEffect, useState } from "react";
import { Brand, buttonClass, Feedback } from "./ui";
import { DashboardSkeleton } from "./Skeleton";
import Icon from "./Icon";

export default function SessionLoading({
  error,
  variant = "admin",
}: {
  error: string;
  variant?: "admin" | "resident" | "overview";
}) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(timer);
  }, []);
  if (error)
    return (
      <main id="main" className="error-page">
        <Brand />
        <h1>Let’s try that again.</h1>
        <Feedback error>{error}</Feedback>
        <button
          onClick={() => window.location.reload()}
          className={buttonClass}
        >
          <Icon name="refresh" size={16} />
          Retry
        </button>
      </main>
    );
  return (
    <>
      <DashboardSkeleton variant={variant} />
      {slow && (
        <p
          role="status"
          className="loading-hint"
          style={{
            position: "fixed",
            bottom: 16,
            left: 24,
            zIndex: 21,
            background: "white",
            padding: "10px 15px",
            border: "1px solid var(--line)",
            borderRadius: 6,
            maxWidth: "calc(100% - 85px)",
          }}
        >
          This is taking a little longer than usual. Thanks for waiting.
        </p>
      )}
    </>
  );
}
