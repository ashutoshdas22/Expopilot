export type ClientBriefFields = {
  pastedRequirements: string;
  clientName: string;
  exhibitionName: string;
  venue: string;
  boothNumber: string;
  stallLengthM: string;
  stallWidthM: string;
  stallHeightM: string;
  openSides: string;
  clientBudget: string;
  setupDate: string;
  dismantlingDate: string;
};

export const CLIENT_BRIEF_STORAGE_KEY = "expo-pilot-client-brief";

export const emptyClientBrief: ClientBriefFields = {
  pastedRequirements: "",
  clientName: "",
  exhibitionName: "",
  venue: "",
  boothNumber: "",
  stallLengthM: "",
  stallWidthM: "",
  stallHeightM: "",
  openSides: "1",
  clientBudget: "",
  setupDate: "",
  dismantlingDate: "",
};

export type StallAreaSummary = {
  floorAreaSqM: number | null;
  /** Back / main wall: stall length × height (e.g. 12 m × 3 m = 36 m²). */
  mainWallAreaSqM: number | null;
  sideWallAreaSqM: number | null;
  /** Sum of closed wall lengths × height, based on open sides. */
  totalWallCladdingSqM: number | null;
  closedWallLengthM: number | null;
};

function parsePositive(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Estimates closed wall run length for a rectangular booth.
 * Open sides are removed starting from the front, then sides, then back.
 */
function closedWallLengthM(
  lengthM: number,
  widthM: number,
  openSides: number,
): number {
  const segments = [lengthM, widthM, lengthM, widthM];
  const removeOrder = [2, 1, 3, 0];
  const toRemove = Math.min(4, Math.max(0, Math.floor(openSides)));
  let total = lengthM * 2 + widthM * 2;
  for (let i = 0; i < toRemove; i++) {
    total -= segments[removeOrder[i]];
  }
  return Math.max(0, total);
}

export function computeStallAreas(fields: ClientBriefFields): StallAreaSummary {
  const lengthM = parsePositive(fields.stallLengthM);
  const widthM = parsePositive(fields.stallWidthM);
  const heightM = parsePositive(fields.stallHeightM);
  const openSidesRaw = parsePositive(fields.openSides);
  const openSides = openSidesRaw === null ? 1 : openSidesRaw;

  const floorAreaSqM =
    lengthM !== null && widthM !== null ? lengthM * widthM : null;

  const mainWallAreaSqM =
    lengthM !== null && heightM !== null ? lengthM * heightM : null;

  const sideWallAreaSqM =
    widthM !== null && heightM !== null ? widthM * heightM : null;

  let totalWallCladdingSqM: number | null = null;
  let closedWallLength: number | null = null;

  if (lengthM !== null && widthM !== null && heightM !== null) {
    closedWallLength = closedWallLengthM(lengthM, widthM, openSides);
    totalWallCladdingSqM = closedWallLength * heightM;
  }

  return {
    floorAreaSqM,
    mainWallAreaSqM,
    sideWallAreaSqM,
    totalWallCladdingSqM,
    closedWallLengthM: closedWallLength,
  };
}

export function formatAreaSqM(value: number | null): string {
  if (value === null) return "—";
  return `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} m²`;
}
