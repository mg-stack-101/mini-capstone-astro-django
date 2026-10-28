import { useSession } from "../lib/useSession";
import DashboardOverview from "./DashboardOverview";
import SessionLoading from "./SessionLoading";

export default function LiveDashboardOverview() {
  const { user, error } = useSession("admin");
  return user ? (
    <DashboardOverview adminName={user.name} />
  ) : (
    <SessionLoading error={error} />
  );
}
