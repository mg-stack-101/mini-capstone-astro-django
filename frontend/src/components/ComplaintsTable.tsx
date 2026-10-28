import { useEffect, useId, useRef, useState } from "react";
import type { Complaint, ComplaintStatus } from "../lib/types";
import Icon from "./Icon";
import { TableSkeleton, Skeleton } from "./Skeleton";
import { buttonClass, Feedback, inputClass, Spinner, StatusBadge } from "./ui";

export interface RemoteFilters {
  search: string;
  status: ComplaintStatus | "";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ComplaintStatus | "") => void;
}
export interface ComplaintsTableProps {
  complaints?: Complaint[];
  remoteFilters?: RemoteFilters;
  onUpdateStatus?: (id: string, status: ComplaintStatus) => Promise<void>;
  loading?: boolean;
  hasLoaded?: boolean;
  totalCount?: number;
  error?: string;
}
const formatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Manila",
});
function dateLabel(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : formatter.format(date);
}
function shortId(id: string) {
  return id.length > 12 ? id.slice(0, 8).toUpperCase() : id;
}
function StatusEditor({
  row,
  update,
}: {
  row: Complaint;
  update: NonNullable<ComplaintsTableProps["onUpdateStatus"]>;
}) {
  const [status, setStatus] = useState(row.status);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const id = useId();
  useEffect(() => setStatus(row.status), [row.status]);
  return (
    <form
      className="detail-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        setError(false);
        try {
          await update(row.id, status);
          setMessage("The complaint status has been updated.");
        } catch (err) {
          setError(true);
          setMessage(
            err instanceof Error ? err.message : "Unable to update status.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor={id} className="field-label">
        Update complaint status
      </label>
      <div className="detail-editor-row">
        <select
          id={id}
          value={status}
          disabled={busy}
          onChange={(event) => setStatus(event.target.value as ComplaintStatus)}
          className={inputClass}
        >
          <option>Pending</option>
          <option>Processing</option>
          <option>Resolved</option>
        </select>
        <button
          className={buttonClass}
          disabled={busy || status === row.status}
        >
          {busy ? (
            <>
              <Spinner />
              Saving…
            </>
          ) : (
            "Save status"
          )}
        </button>
      </div>
      {message && <Feedback error={error}>{message}</Feedback>}
    </form>
  );
}
export default function ComplaintsTable({
  complaints = [],
  remoteFilters,
  onUpdateStatus,
  loading = false,
  hasLoaded = true,
  totalCount,
  error,
}: ComplaintsTableProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ComplaintStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const activeQuery = remoteFilters?.search ?? query;
  const activeStatus = remoteFilters?.status ?? status;
  const rows = remoteFilters
    ? complaints
    : complaints.filter(
        (row) =>
          `${row.id} ${row.fullName} ${row.type}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (!status || row.status === status),
      );
  const selected = rows.find((row) => row.id === selectedId);
  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
    if (!selected && dialog.current?.open) dialog.current.close();
  }, [selected?.id]);
  const initial = loading && !hasLoaded;
  function view(row: Complaint) {
    setSelectedId(row.id);
  }
  return (
    <div aria-busy={loading}>
      <div className="filters">
        <div className="search-control">
          <label htmlFor={`${uid}-search`} className="filter-label">
            Search complaints
          </label>
          <Icon name="search" size={16} />
          <input
            id={`${uid}-search`}
            type="search"
            className={inputClass}
            value={activeQuery}
            onChange={(event) =>
              remoteFilters
                ? remoteFilters.onSearchChange(event.target.value)
                : setQuery(event.target.value)
            }
            placeholder="Search by name, ID, or type…"
            autoComplete="off"
          />
        </div>
        <div className="filter-status">
          <label htmlFor={`${uid}-status`} className="filter-label">
            Status
          </label>
          <select
            id={`${uid}-status`}
            className={inputClass}
            value={activeStatus}
            onChange={(event) =>
              remoteFilters
                ? remoteFilters.onStatusChange(
                    event.target.value as ComplaintStatus | "",
                  )
                : setStatus(event.target.value as ComplaintStatus | "")
            }
          >
            <option value="">All statuses</option>
            <option>Pending</option>
            <option>Processing</option>
            <option>Resolved</option>
          </select>
        </div>
      </div>
      <div className="table-summary" aria-live="polite">
        {initial ? (
          <>
            <Skeleton style={{ height: 9, width: 110 }} />
            <span className="sr-only">Loading complaints…</span>
          </>
        ) : (
          <>
            {loading ? (
              <>
                <Spinner />
                Updating results…
              </>
            ) : (
              <>
                Showing {rows.length}
                {totalCount !== undefined ? ` of ${totalCount}` : ""} complaint
                {(totalCount ?? rows.length) === 1 ? "" : "s"}
              </>
            )}
          </>
        )}
      </div>
      {initial ? (
        <TableSkeleton />
      ) : rows.length > 0 ? (
        <>
          <div
            className="table-scroll"
            role="region"
            aria-label="Complaints table"
            tabIndex={0}
          >
            <table className="complaint-table">
              <caption className="sr-only">
                Complaints and current status
              </caption>
              <thead>
                <tr>
                  {[
                    "Reference",
                    "Resident",
                    "Complaint type",
                    "Date filed",
                    "Status",
                    "",
                  ].map((label, index) => (
                    <th scope="col" key={index}>
                      {label || <span className="sr-only">Actions</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <code className="table-id" title={row.id}>
                        #{shortId(row.id)}
                      </code>
                    </td>
                    <td>
                      <span className="table-name">{row.fullName}</span>
                    </td>
                    <td>{row.type}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <time dateTime={row.dateFiled}>
                        {dateLabel(row.dateFiled)}
                      </time>
                    </td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td>
                      <button
                        onClick={() => view(row)}
                        className="view-button"
                        aria-label={`View complaint ${shortId(row.id)}`}
                        aria-haspopup="dialog"
                      >
                        View
                        <Icon name="chevron" size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-complaints">
            {rows.map((row) => (
              <article key={row.id} className="complaint-mobile-card">
                <div className="complaint-mobile-top">
                  <code className="table-id" title={row.id}>
                    #{shortId(row.id)}
                  </code>
                  <StatusBadge status={row.status} />
                </div>
                <h3>{row.type}</h3>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginBottom: 9,
                  }}
                >
                  {row.fullName}
                </p>
                <div className="complaint-mobile-meta">
                  <time dateTime={row.dateFiled}>
                    {dateLabel(row.dateFiled)}
                  </time>
                  <button
                    onClick={() => view(row)}
                    className="view-button"
                    aria-label={`View complaint ${shortId(row.id)}`}
                    aria-haspopup="dialog"
                  >
                    View details
                    <Icon name="chevron" size={12} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : !error ? (
        <div className="empty-state">
          <Icon
            name={activeQuery || activeStatus ? "search" : "clipboard"}
            size={29}
          />
          <h3>
            {activeQuery || activeStatus
              ? "No matching complaints."
              : "A fresh start."}
          </h3>
          <p>
            {activeQuery || activeStatus
              ? "Try another search or change the status filter."
              : "Complaints will appear here once they have been submitted."}
          </p>
        </div>
      ) : null}
      <dialog
        ref={dialog}
        className="detail-dialog"
        aria-labelledby={`${uid}-detail-title`}
        onClose={() => setSelectedId(null)}
        onClick={(event) => {
          if (event.target === dialog.current) {
            const rect = dialog.current.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              dialog.current.close();
          }
        }}
      >
        <div className="detail-top">
          <h2 id={`${uid}-detail-title`}>Complaint details</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close complaint details"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        {selected && (
          <>
            <p className="detail-id">Reference #{selected.id}</p>
            <StatusBadge status={selected.status} />
            <h3 className="detail-type">{selected.type}</h3>
            <div className="detail-meta">
              <p>
                <span
                  style={{
                    color: "var(--muted)",
                    display: "inline-block",
                    width: 75,
                  }}
                >
                  Resident
                </span>
                {selected.fullName}
              </p>
              <p>
                <span
                  style={{
                    color: "var(--muted)",
                    display: "inline-block",
                    width: 75,
                  }}
                >
                  Filed on
                </span>
                {dateLabel(selected.dateFiled)}
              </p>
            </div>
            <p className="field-label">Description</p>
            <p className="detail-description">
              {selected.description || "No additional description available."}
            </p>
            {selected.photoUrl && (
              <a
                href={selected.photoUrl}
                className="button button-secondary"
                style={{ marginTop: 23 }}
              >
                <Icon name="download" size={16} />
                Download evidence
              </a>
            )}
            {onUpdateStatus && (
              <StatusEditor
                key={selected.id}
                row={selected}
                update={onUpdateStatus}
              />
            )}
          </>
        )}
      </dialog>
    </div>
  );
}
