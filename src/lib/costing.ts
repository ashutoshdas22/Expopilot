export type CostCalculationType =
  | "area"
  | "running_meter"
  | "quantity"
  | "fixed";

export type CostLineItem = {
  id: string;
  serviceKey?: string;
  description: string;
  type: CostCalculationType;
  dimensionAM: string;
  dimensionBM: string;
  quantity: string;
  internalRate: string;
  sellingRate: string;
};

export type ComputedCostLine = {
  measure: number | null;
  measureLabel: string;
  unitLabel: string;
  internalAmount: number | null;
  sellingAmount: number | null;
};

export type CostingTotals = {
  internalTotal: number;
  sellingTotal: number;
  profit: number;
  marginPercent: number | null;
};

export type ExhibitionServiceTemplate = {
  key: string;
  label: string;
  type: CostCalculationType;
  defaultInternalRate: number;
  defaultSellingRate: number;
};

export const EXHIBITION_SERVICES: ExhibitionServiceTemplate[] = [
  {
    key: "flex_print",
    label: "Flex print",
    type: "area",
    defaultInternalRate: 280,
    defaultSellingRate: 450,
  },
  {
    key: "vinyl",
    label: "Vinyl",
    type: "area",
    defaultInternalRate: 320,
    defaultSellingRate: 520,
  },
  {
    key: "wooden_wall",
    label: "Wooden wall",
    type: "area",
    defaultInternalRate: 1800,
    defaultSellingRate: 2600,
  },
  {
    key: "carpet",
    label: "Carpet",
    type: "area",
    defaultInternalRate: 350,
    defaultSellingRate: 550,
  },
  {
    key: "wooden_flooring",
    label: "Wooden flooring",
    type: "area",
    defaultInternalRate: 900,
    defaultSellingRate: 1350,
  },
  {
    key: "lights",
    label: "Lights",
    type: "quantity",
    defaultInternalRate: 2500,
    defaultSellingRate: 3800,
  },
  {
    key: "chairs",
    label: "Chairs",
    type: "quantity",
    defaultInternalRate: 450,
    defaultSellingRate: 750,
  },
  {
    key: "tables",
    label: "Tables",
    type: "quantity",
    defaultInternalRate: 1200,
    defaultSellingRate: 1800,
  },
  {
    key: "socket",
    label: "Socket",
    type: "quantity",
    defaultInternalRate: 800,
    defaultSellingRate: 1200,
  },
  {
    key: "transport",
    label: "Transport",
    type: "fixed",
    defaultInternalRate: 12000,
    defaultSellingRate: 18000,
  },
  {
    key: "installation",
    label: "Installation",
    type: "fixed",
    defaultInternalRate: 25000,
    defaultSellingRate: 38000,
  },
  {
    key: "dismantling",
    label: "Dismantling",
    type: "fixed",
    defaultInternalRate: 15000,
    defaultSellingRate: 22000,
  },
];

export const COSTING_STORAGE_KEY = "expo-pilot-costing";

export type CostingSheet = {
  lines: CostLineItem[];
};

export function parseCostNumber(value: string): number | null {
  const trimmed = value.replace(/,/g, "").trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Round money to 2 decimal places for stable totals (stored amounts are INR). */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function getEffectiveMeasure(line: CostLineItem): number | null {
  const manualQty = parseCostNumber(line.quantity);
  const dimA = parseCostNumber(line.dimensionAM);
  const dimB = parseCostNumber(line.dimensionBM);

  switch (line.type) {
    case "area":
      if (manualQty !== null) return manualQty;
      if (dimA !== null && dimB !== null) return dimA * dimB;
      return null;
    case "running_meter":
      return manualQty ?? dimA;
    case "quantity":
      return manualQty;
    case "fixed":
      return 1;
    default:
      return null;
  }
}

export function computeLineCost(line: CostLineItem): ComputedCostLine {
  const internalRate = parseCostNumber(line.internalRate);
  const sellingRate = parseCostNumber(line.sellingRate);
  const measure = getEffectiveMeasure(line);
  const dimA = parseCostNumber(line.dimensionAM);
  const dimB = parseCostNumber(line.dimensionBM);

  let measureLabel = "";
  let unitLabel = "";

  switch (line.type) {
    case "area": {
      const autoArea =
        dimA !== null && dimB !== null ? dimA * dimB : null;
      measureLabel =
        autoArea !== null
          ? `${dimA} m × ${dimB} m = ${formatMeasure(autoArea)} m²`
          : "Enter length × width or height";
      unitLabel = "m²";
      break;
    }
    case "running_meter":
      measureLabel =
        dimA !== null
          ? `${formatMeasure(dimA)} running m`
          : "Enter length in metres";
      unitLabel = "r.m.";
      break;
    case "quantity":
      measureLabel =
        measure !== null
          ? `${formatMeasure(measure)} nos`
          : "Enter quantity";
      unitLabel = "nos";
      break;
    case "fixed":
      measureLabel = "Fixed lump sum";
      unitLabel = "job";
      break;
  }

  if (line.type === "fixed") {
    return {
      measure: 1,
      measureLabel,
      unitLabel,
      internalAmount:
        internalRate !== null ? roundMoney(internalRate) : null,
      sellingAmount:
        sellingRate !== null ? roundMoney(sellingRate) : null,
    };
  }

  return {
    measure,
    measureLabel,
    unitLabel,
    internalAmount:
      measure !== null && internalRate !== null
        ? roundMoney(measure * internalRate)
        : null,
    sellingAmount:
      measure !== null && sellingRate !== null
        ? roundMoney(measure * sellingRate)
        : null,
  };
}

export function formatMeasure(value: number): string {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function computeCostingTotals(lines: CostLineItem[]): CostingTotals {
  let internalTotal = 0;
  let sellingTotal = 0;

  for (const line of lines) {
    const { internalAmount, sellingAmount } = computeLineCost(line);
    internalTotal += internalAmount ?? 0;
    sellingTotal += sellingAmount ?? 0;
  }

  const profit = sellingTotal - internalTotal;
  const marginPercent =
    sellingTotal > 0 ? (profit / sellingTotal) * 100 : null;

  return { internalTotal, sellingTotal, profit, marginPercent };
}

function newLineId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `line-${Date.now().toString(36)}`;
}

export function createEmptyLine(
  partial?: Partial<CostLineItem>,
): CostLineItem {
  return {
    id: newLineId(),
    description: "",
    type: "area",
    dimensionAM: "",
    dimensionBM: "",
    quantity: "",
    internalRate: "",
    sellingRate: "",
    ...partial,
  };
}

export function createLineFromService(
  service: ExhibitionServiceTemplate,
  partial?: Partial<CostLineItem>,
): CostLineItem {
  return createEmptyLine({
    serviceKey: service.key,
    description: service.label,
    type: service.type,
    internalRate: String(service.defaultInternalRate),
    sellingRate: String(service.defaultSellingRate),
    ...partial,
  });
}

export const CALCULATION_TYPE_LABELS: Record<CostCalculationType, string> = {
  area: "Area (m²)",
  running_meter: "Running meter",
  quantity: "Quantity (nos)",
  fixed: "Fixed price",
};

/** @deprecated Use computeCostingTotals — kept for any legacy import */
export function sumLineAmounts(lines: CostLineItem[]): number {
  return computeCostingTotals(lines).sellingTotal;
}

export function normalizeStoredLine(
  raw: Record<string, unknown>,
): CostLineItem {
  const legacyRate =
    typeof raw.rate === "string" ? raw.rate : undefined;
  return {
    id: typeof raw.id === "string" ? raw.id : newLineId(),
    serviceKey:
      typeof raw.serviceKey === "string" ? raw.serviceKey : undefined,
    description: typeof raw.description === "string" ? raw.description : "",
    type: (raw.type as CostCalculationType) ?? "area",
    dimensionAM: typeof raw.dimensionAM === "string" ? raw.dimensionAM : "",
    dimensionBM: typeof raw.dimensionBM === "string" ? raw.dimensionBM : "",
    quantity: typeof raw.quantity === "string" ? raw.quantity : "",
    internalRate:
      typeof raw.internalRate === "string"
        ? raw.internalRate
        : legacyRate ?? "",
    sellingRate:
      typeof raw.sellingRate === "string"
        ? raw.sellingRate
        : legacyRate ?? "",
  };
}

export function loadCostingSheet(): CostingSheet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COSTING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lines?: Record<string, unknown>[] };
    if (!Array.isArray(parsed.lines)) return null;
    return {
      lines: parsed.lines.map((line) => normalizeStoredLine(line)),
    };
  } catch {
    return null;
  }
}

export function saveCostingSheet(sheet: CostingSheet): void {
  localStorage.setItem(COSTING_STORAGE_KEY, JSON.stringify(sheet));
}
