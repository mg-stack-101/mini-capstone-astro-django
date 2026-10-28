import DashboardShell from "./DashboardShell";
import Icon, { navIcon } from "./Icon";
import { cardClass, PageHeading } from "./ui";
import type { NavigationItem } from "../lib/types";
export default function DashboardOverview({
  adminName = "Administrator",
  links = [
    { label: "Review complaints", href: "/admin_dashboard/#complaints" },
    { label: "Community dashboard", href: "/admin_dashboard/" },
    { label: "Submit a concern", href: "/resident_dashboard/" },
  ],
  demo = false,
}: {
  adminName?: string;
  links?: NavigationItem[];
  demo?: boolean;
}) {
  return (
    <DashboardShell userName={adminName} activeHref="/dashboard/" demo={demo}>
      <PageHeading
        eyebrow="Your workspace"
        title={`Welcome, ${adminName}.`}
        description="Everything you need to keep your community moving forward."
      />
      {demo && (
        <p className="demo-note" style={{ marginBottom: 20 }}>
          Template preview
        </p>
      )}
      <nav className="overview-grid" aria-label="Quick links">
        {links.map((link, i) => (
          <a
            href={link.href}
            key={link.href}
            className={`${cardClass} overview-card`}
          >
            <Icon name={navIcon(link.label)} size={23} />
            <h2>{link.label}</h2>
            <p>
              {
                [
                  "Read resident concerns and follow up on their progress.",
                  "See a clear overview of complaints and community activity.",
                  "Share a new concern with supporting details and evidence.",
                ][i % 3]
              }
            </p>
            <span className="text-link">
              Open
              <Icon name="arrow" size={15} />
            </span>
          </a>
        ))}
      </nav>
    </DashboardShell>
  );
}
