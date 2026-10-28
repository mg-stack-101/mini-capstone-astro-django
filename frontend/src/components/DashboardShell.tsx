import { useState, type ReactNode } from "react";
import type { NavigationItem } from "../lib/types";
import { postForm, resetClientRequests } from "../lib/api";
import Icon, { navIcon } from "./Icon";
import { Brand } from "./ui";

const defaultItems: NavigationItem[] = [
  { label: "Dashboard", href: "/admin_dashboard/" },
  { label: "Complaints", href: "/admin_dashboard/#complaints" },
  { label: "Quick links", href: "/dashboard/" },
];
export interface DashboardShellProps {
  children: ReactNode;
  activeHref?: string;
  items?: NavigationItem[];
  panelLabel?: string;
  logoutEndpoint?: string;
  csrfToken?: string;
  demo?: boolean;
  userName?: string;
}
export default function DashboardShell({
  children,
  activeHref = "/admin_dashboard/",
  items = defaultItems,
  panelLabel = "Administrator Panel",
  logoutEndpoint = "/api/logout/",
  csrfToken,
  demo = false,
  userName = "My account",
}: DashboardShellProps) {
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const resident = panelLabel.toLowerCase().includes("resident");
  async function logOut() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await postForm(logoutEndpoint, new FormData(), csrfToken);
      resetClientRequests();
      window.location.assign("/login/");
    } catch (err) {
      setLogoutError(err instanceof Error ? err.message : "Unable to log out.");
      setLoggingOut(false);
    }
  }
  const initials = userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <div className="app-shell">
      <div className="mobile-header">
        <Brand />
        <button
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="dashboard-navigation"
          onClick={() => setOpen(!open)}
          className="icon-button"
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand />
          <p className="sidebar-label">
            {resident ? "Resident space" : "Administration"}
          </p>
        </div>
        <nav
          id="dashboard-navigation"
          className={`sidebar-nav ${open ? "open" : ""}`}
          aria-label="Dashboard navigation"
        >
          <p className="nav-section-label">Workspace</p>
          <ul>
            {items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={activeHref === item.href ? "page" : undefined}
                  className={`nav-link ${activeHref === item.href ? "active" : ""}`}
                >
                  <Icon name={navIcon(item.label)} size={17} />
                  <span>{item.label}</span>
                  {activeHref === item.href && (
                    <span className="nav-active-dot" aria-hidden="true" />
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-note">
            A stronger community
            <br />
            starts with a conversation.
          </p>
          {demo ? (
            <a href="/login/" className="logout-button">
              <Icon name="logout" size={17} />
              Exit preview
            </a>
          ) : (
            <button
              onClick={logOut}
              disabled={loggingOut}
              className="logout-button"
            >
              <Icon name="logout" size={17} />
              {loggingOut ? "Signing out…" : "Log out"}
            </button>
          )}
          {logoutError && (
            <p
              role="alert"
              style={{ fontSize: 11, color: "#953c35", lineHeight: 1.7 }}
            >
              {logoutError}
            </p>
          )}
        </div>
      </aside>
      <div className="workspace">
        <header className="workspace-header">
          <p className="header-location">
            <span>Barangay services</span>
            <span aria-hidden="true">/</span>
            <strong>{resident ? "Resident portal" : "Administration"}</strong>
          </p>
          <div className="account-chip">
            <span className="avatar" aria-hidden="true">
              {initials}
            </span>
            <div>
              <p className="account-name">{userName}</p>
              <p className="account-role">
                {resident ? "Resident account" : "Administrator"}
              </p>
            </div>
          </div>
        </header>
        <main id="main" className="workspace-body">
          {children}
          <footer className="workspace-footer">
            <span>Barangay Complaint Monitoring System</span>
            <span>Working together. Moving forward.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
