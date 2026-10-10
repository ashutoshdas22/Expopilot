import { emptyClientBrief } from "@/lib/client-brief";
import { createLineFromService, EXHIBITION_SERVICES } from "@/lib/costing";
import { createDefaultExecutionPlan, type ExecutionPlan } from "@/lib/execution";
import type { ExpoProject } from "@/lib/project-store";

export const DEMO_PROJECT_ID = "demo-techvision-pavilion";

export function createDemoProject(): ExpoProject {
  const timestamp = new Date().toISOString();
  const flex = EXHIBITION_SERVICES.find((s) => s.key === "flex_print")!;
  const installation = EXHIBITION_SERVICES.find((s) => s.key === "installation")!;
  const transport = EXHIBITION_SERVICES.find((s) => s.key === "transport")!;

  const execution: ExecutionPlan = {
    ...createDefaultExecutionPlan(),
    design_approval: "completed",
    artwork_received: "completed",
    material_planning: "in_progress",
    printing: "pending",
  };

  return {
    id: DEMO_PROJECT_ID,
    name: "DEMO — TechVision Pavilion (sample)",
    createdAt: timestamp,
    updatedAt: timestamp,
    brief: {
      ...emptyClientBrief,
      pastedRequirements:
        "Need premium stall for Auto Expo. Main flex branding on back wall 12m × 3m. Power 5 kW. Setup 14 Mar, show opens 16 Mar.",
      clientName: "TechVision India Pvt. Ltd.",
      exhibitionName: "Auto Expo 2026",
      venue: "India Expo Mart, Greater Noida",
      boothNumber: "Hall 5 — Stall B-142",
      stallLengthM: "12",
      stallWidthM: "6",
      stallHeightM: "3",
      openSides: "1",
      clientBudget: "1850000",
      setupDate: "2026-03-14",
      dismantlingDate: "2026-03-19",
    },
    costingLines: [
      createLineFromService(flex, {
        dimensionAM: "12",
        dimensionBM: "3",
        internalRate: "70",
        sellingRate: "100",
      }),
      createLineFromService(installation, {
        internalRate: "25000",
        sellingRate: "38000",
      }),
      createLineFromService(transport, {
        internalRate: "12000",
        sellingRate: "18000",
      }),
    ],
    quotationMeta: {
      discountInr: "5000",
      notes:
        "Quotation valid for 15 days. Scope includes fabrication and installation as per approved design.",
    },
    execution,
  };
}
