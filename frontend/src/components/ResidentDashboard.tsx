import ComplaintForm, { type ComplaintFormProps } from "./ComplaintForm";
import DashboardShell from "./DashboardShell";
import { PageHeading } from "./ui";
export default function ResidentDashboard(
  props: ComplaintFormProps & { logoutEndpoint?: string },
) {
  return (
    <DashboardShell
      demo={props.demo}
      csrfToken={props.csrfToken}
      logoutEndpoint={props.logoutEndpoint}
      panelLabel="Resident Panel"
      userName={props.initialName || "Resident"}
      activeHref="/resident_dashboard/"
      items={[
        { label: "New complaint", href: "/resident_dashboard/" },
        { label: "Home", href: "/" },
      ]}
    >
      <PageHeading
        eyebrow="Your resident space"
        title="Let’s make things better."
        description="Share your concern with the barangay team."
      />
      <div style={{ maxWidth: 790 }}>
        <ComplaintForm {...props} />
      </div>
    </DashboardShell>
  );
}
