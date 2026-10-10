export type ActiveProject = {
  id: string;
  name: string;
  clientName: string;
  exhibitionName: string;
  stallSize: string;
  openSites: number;
  budgetInr: number;
  quotationValueInr: number;
  progressPercent: number;
  progressLabel: string;
  missingInformation: string[];
};

/** Demo data for the dashboard until project records are wired up. */
export const activeProject: ActiveProject = {
  id: "PRJ-2026-014",
  name: "TechVision India — Main Pavilion",
  clientName: "TechVision India Pvt. Ltd.",
  exhibitionName: "India Expo Mart, Greater Noida",
  stallSize: "6 m × 3 m (18 sq.m)",
  openSites: 2,
  budgetInr: 1850000,
  quotationValueInr: 1725000,
  progressPercent: 58,
  progressLabel: "Costing in review — quotation draft pending approval",
  missingInformation: [
    "Client logo files in print-ready format (CMYK)",
    "Confirmed power load and socket positions on site",
    "Installation window from venue organizer",
  ],
};

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
