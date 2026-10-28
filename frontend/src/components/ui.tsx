import type { ReactNode } from "react";
import type { ComplaintStatus } from "../lib/types";
import Icon from "./Icon";

export const inputClass = "field-input";
export const buttonClass = "button button-primary";
export const cardClass = "surface";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <a
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="Barangay Complaint Monitoring System home"
    >
      <span className="brand-mark">
        <Icon name="building" size={23} />
      </span>
      <span className="brand-copy">
        Barangay Complaint<span>Monitoring System</span>
      </span>
    </a>
  );
}
export function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="field-group">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
    </div>
  );
}
export function Feedback({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      role={error ? "alert" : "status"}
      className={`feedback ${error ? "feedback-error" : ""}`}
    >
      <Icon name="info" size={18} />
      <div>{children}</div>
    </div>
  );
}
export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}
export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children}
    </header>
  );
}
