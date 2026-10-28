import type { Complaint } from "./types";
/** Fictional records for template previews only. Replace with server data. */
export const demoComplaints: Complaint[] = [
  {
    id: "DEMO-001",
    fullName: "Sample Resident A",
    type: "Noise Disturbance",
    dateFiled: "2026-10-26",
    status: "Pending",
    description:
      "Sample complaint about late-night noise near the community area.",
  },
  {
    id: "DEMO-002",
    fullName: "Sample Resident B",
    type: "Garbage Disposal",
    dateFiled: "2026-10-25",
    status: "Processing",
    description:
      "Sample report about uncollected waste at the designated collection point.",
  },
  {
    id: "DEMO-003",
    fullName: "Sample Resident C",
    type: "Pet Nuisance",
    dateFiled: "2026-10-24",
    status: "Resolved",
    description: "Sample concern reviewed and resolved by barangay staff.",
  },
];
