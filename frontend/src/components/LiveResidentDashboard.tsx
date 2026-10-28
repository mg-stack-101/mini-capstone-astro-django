import { useEffect, useState } from "react";
import { useSession } from "../lib/useSession";
import { useComplaints } from "../lib/useComplaints";
import ComplaintForm from "./ComplaintForm";
import ComplaintsTable from "./ComplaintsTable";
import DashboardShell from "./DashboardShell";
import Pagination from "./Pagination";
import SessionLoading from "./SessionLoading";
import Icon from "./Icon";
import { cardClass, Feedback, PageHeading } from "./ui";

export default function LiveResidentDashboard() {
  const { user, error } = useSession();
  const [history, setHistory] = useState(false);
  useEffect(() => {
    const sync = () => setHistory(window.location.hash === "#my-complaints");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  // Do not spend a database request on history until the person opens it.
  const list = useComplaints(history && !!user);
  if (!user) return <SessionLoading error={error} variant="resident" />;
  return (
    <DashboardShell
      userName={user.name}
      panelLabel="Resident Panel"
      activeHref={history ? "#my-complaints" : "#new-complaint"}
      items={[
        { label: "New complaint", href: "#new-complaint" },
        { label: "My complaints", href: "#my-complaints" },
        { label: "Home", href: "/" },
      ]}
    >
      <PageHeading
        eyebrow="Your resident space"
        title={`Hello, ${user.name}.`}
        description="A place to share your concerns and follow their progress."
      />
      <nav className="resident-tabs" aria-label="Resident sections">
        <a
          href="#new-complaint"
          className={`resident-tab ${!history ? "active" : ""}`}
          aria-current={!history ? "page" : undefined}
        >
          <Icon name="plus" size={15} />
          New complaint
        </a>
        <a
          href="#my-complaints"
          className={`resident-tab ${history ? "active" : ""}`}
          aria-current={history ? "page" : undefined}
        >
          <Icon name="clipboard" size={15} />
          My complaints
        </a>
      </nav>
      <div id="new-complaint" hidden={history}>
        <div className="resident-grid">
          <ComplaintForm initialName={user.name} onSubmitted={list.refresh} />
          <aside className="help-card">
            <Icon name="leaf" size={24} />
            <h2>A helpful report goes a long way.</h2>
            <p>
              A little clarity helps the team understand what needs attention.
            </p>
            <ul className="help-list">
              <li>
                <Icon name="message" size={16} />
                <span>
                  Describe what happened, including the date and time.
                </span>
              </li>
              <li>
                <Icon name="home" size={16} />
                <span>Add a clear address or nearby landmark.</span>
              </li>
              <li>
                <Icon name="image" size={16} />
                <span>Attach a photo that helps explain the concern.</span>
              </li>
            </ul>
          </aside>
        </div>
      </div>
      {history && (
        <section
          id="my-complaints"
          className={cardClass}
          aria-labelledby="my-complaints-title"
        >
          <div className="section-heading">
            <div>
              <h2 id="my-complaints-title">
                {user.role === "admin" ? "Complaints" : "My complaints"}
              </h2>
              <p>Every update, in one place.</p>
            </div>
            <button
              type="button"
              onClick={list.refresh}
              className="button button-secondary"
              style={{ minHeight: 35, padding: "7px 12px", fontSize: 10 }}
            >
              <Icon name="refresh" size={13} />
              Refresh
            </button>
          </div>
          <ComplaintsTable
            complaints={list.data.results}
            remoteFilters={list.filters}
            loading={list.loading}
            hasLoaded={list.hasLoaded}
            totalCount={list.data.count}
            error={list.error}
          />
          {list.error && (
            <div className="inline-error">
              <Feedback error>{list.error}</Feedback>
              <button onClick={list.refresh} className="button button-quiet">
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
        </section>
      )}
    </DashboardShell>
  );
}
