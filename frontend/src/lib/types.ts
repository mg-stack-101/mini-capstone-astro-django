export type ComplaintStatus = "Pending" | "Processing" | "Resolved";
export interface Complaint {
  id: string;
  fullName: string;
  type: string;
  dateFiled: string;
  status: ComplaintStatus;
  description?: string;
  photoUrl?: string;
}
export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
}
export interface SessionUser {
  id: number;
  username: string;
  name: string;
  role: "admin" | "resident";
}
export interface DashboardStats {
  total: number;
  pending: number;
  processing: number;
  resolved: number;
  registeredUsers: number;
}
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
