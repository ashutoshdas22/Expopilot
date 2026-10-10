import type { ClientBriefFields } from "@/lib/client-brief";
import { computeStallAreas, formatAreaSqM } from "@/lib/client-brief";
import { formatInr } from "@/lib/dashboard-data";

export type OrganizedDetail = {
  label: string;
  value: string;
};

export type OrganizedSection = {
  title: string;
  items: OrganizedDetail[];
};

export type MissingBriefItem = {
  id: string;
  title: string;
  whyItMatters: string;
  askClient: string;
};

export type BriefAnalysisResult = {
  sections: OrganizedSection[];
  missing: MissingBriefItem[];
  readyCount: number;
};

type AnalysisContext = {
  fields: ClientBriefFields;
  text: string;
};

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function fieldPositive(value: string): boolean {
  const n = Number(value.trim());
  return value.trim() !== "" && Number.isFinite(n) && n > 0;
}

function firstMatch(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  if (!match) return null;
  return match[0].trim();
}

function excerptAround(text: string, pattern: RegExp, maxLen = 120): string | null {
  const match = pattern.exec(text);
  if (!match || match.index === undefined) return null;
  const start = Math.max(0, match.index - 20);
  const end = Math.min(text.length, match.index + match[0].length + 40);
  let slice = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) slice = `…${slice}`;
  if (end < text.length) slice = `${slice}…`;
  if (slice.length > maxLen) slice = `${slice.slice(0, maxLen - 1)}…`;
  return slice;
}

const CHECK_IDS = [
  "booth",
  "dimensions",
  "height",
  "power",
  "ledScreen",
  "flexPrint",
  "artwork",
  "furniture",
  "setup",
] as const;

function buildContext(fields: ClientBriefFields): AnalysisContext {
  const parts = [
    fields.pastedRequirements,
    fields.clientName,
    fields.exhibitionName,
    fields.venue,
    fields.boothNumber,
    fields.stallLengthM,
    fields.stallWidthM,
    fields.stallHeightM,
    fields.openSides,
    fields.clientBudget,
    fields.setupDate,
    fields.dismantlingDate,
  ];
  return {
    fields,
    text: parts.join("\n"),
  };
}

const MISSING_BY_ID: Record<
  (typeof CHECK_IDS)[number],
  Omit<MissingBriefItem, "id">
> = {
  booth: {
    title: "Booth number",
    whyItMatters:
      "Without the booth / hall number, your team cannot confirm the plot on the floor plan or coordinate delivery and rigging at the right location.",
    askClient:
      "Could you please share the official booth or stall number (hall + stand code) from the organizer?",
  },
  dimensions: {
    title: "Exact dimensions",
    whyItMatters:
      "Accurate length and width are needed for floor planning, structural design, and material quantities. Guessing leads to costly rework on site.",
    askClient:
      "What are the exact stall dimensions in metres (length × width) as per the organizer’s allotment?",
  },
  height: {
    title: "Height",
    whyItMatters:
      "Maximum build height controls wall panels, hanging structures, and whether you need special permissions or truss.",
    askClient:
      "What is the maximum permissible stall height (in metres) for this exhibition?",
  },
  power: {
    title: "Electrical power",
    whyItMatters:
      "Power load decides cable sizing, distribution, and whether LED, AC, or kitchen equipment can run safely without tripping the venue supply.",
    askClient:
      "How much electrical power is allotted to your booth (kW / amps), and how many socket points are included?",
  },
  ledScreen: {
    title: "LED screen size",
    whyItMatters:
      "Screen size drives rental cost, mounting structure, resolution, and viewing distance for visitors on the aisle.",
    askClient:
      "Do you need an LED screen? If yes, what size or pixel pitch (e.g. P2.5, 55 inch) and where should it be placed?",
  },
  flexPrint: {
    title: "Flex print status",
    whyItMatters:
      "Knowing whether flex / vinyl is approved or still pending avoids production delays and last-minute print rush charges.",
    askClient:
      "What is the status of flex / vinyl branding prints — artwork approved, in print, or not started yet?",
  },
  artwork: {
    title: "Artwork status",
    whyItMatters:
      "Print-ready artwork (correct size, bleed, CMYK) is required before fabrication and graphics can be released to production.",
    askClient:
      "Have you shared final print-ready artwork (AI / PDF / PSD)? If not, when will it be available?",
  },
  furniture: {
    title: "Furniture quantity",
    whyItMatters:
      "Chair, table, and counter counts affect rental, layout, and storage — and must match fire-aisle and venue rules.",
    askClient:
      "How many chairs, tables, counters, or sofas do you need inside the stall?",
  },
  setup: {
    title: "Setup timing",
    whyItMatters:
      "Install windows determine how many labour shifts you need and whether dismantling clashes with show opening or freight deadlines.",
    askClient:
      "What are the setup / installation dates and allowed time slots from the organizer?",
  },
};

function detectPresence(
  ctx: AnalysisContext,
): Record<(typeof CHECK_IDS)[number], boolean> {
  const { fields, text } = ctx;
  const lower = text.toLowerCase();

  const boothInForm = hasText(fields.boothNumber);
  const boothInText =
    /(?:booth|stall|stand)\s*(?:no\.?|number|#)?\s*[:\-]?\s*[a-z0-9][a-z0-9\-\s]*/i.test(
      text,
    ) || /hall\s*\d+[\s,/-]+[a-z]-?\d+/i.test(text);

  const lengthOk = fieldPositive(fields.stallLengthM);
  const widthOk = fieldPositive(fields.stallWidthM);
  const dimInForm = lengthOk && widthOk;
  const dimInText =
    /\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?\s*(?:m|meter|metre|ft|feet)?/i.test(
      text,
    ) ||
    /\d+\s*(?:sq\.?\s*m|square\s*met)/i.test(text) ||
    (/\blength\b/i.test(text) && /\bwidth\b/i.test(text));

  const heightInForm = fieldPositive(fields.stallHeightM);
  const heightInText =
    /(?:max(?:imum)?\s*)?height|clear\s*height|ht\.?\s*[:\-]?\s*\d|\d\s*(?:m|meter|metre)\s*(?:high|height)/i.test(
      text,
    );

  const powerInText =
    /(?:power|electrical|electricity|load|kva|kw|kilowatt|amp|ampere|socket|15\s*a|32\s*a)/i.test(
      text,
    );

  const ledSizeInText =
    /led[\s\S]{0,40}?\d+(?:\.\d+)?\s*(?:inch|inches|"|''|ft|feet|mm|cm|m\b)/i.test(
      text,
    ) ||
    /\d+(?:\.\d+)?\s*(?:inch|inches|")\s*[\s\S]{0,30}?led/i.test(text) ||
    /p[0-9](?:\.[0-9])?/i.test(text) ||
    /videowall|video\s*wall/i.test(text);

  const ledNotRequired =
    /no\s+led|without\s+led|led\s+not\s+required/i.test(lower);

  const flexStatusInText =
    /(?:flex|vinyl|sunboard|fabric\s*print)[\s\S]{0,50}?(?:approved|pending|received|done|ready|wip|in\s*print|not\s*started|shared)/i.test(
      text,
    ) ||
    /(?:approved|pending|received|ready)[\s\S]{0,50}?(?:flex|vinyl)/i.test(
      text,
    );

  const artworkStatusInText =
    /(?:artwork|logo|creative|design\s*file)[\s\S]{0,50}?(?:approved|pending|received|shared|ready|wip|final|not\s*received)/i.test(
      text,
    ) ||
    /(?:print[\s-]?ready|cmky|cmyk|ai\s*file|pdf)[\s\S]{0,40}?(?:yes|received|shared|pending)/i.test(
      text,
    );

  const furnitureQtyInText =
    /\d+\s*(?:nos\.?|units?|pcs?\.?)?\s*(?:chairs?|tables?|sofas?|stools?|counters?)/i.test(
      text,
    ) ||
    /(?:chairs?|tables?|furniture)[\s\S]{0,20}?\d+/i.test(text);

  const setupInForm = hasText(fields.setupDate);
  const setupInText =
    /(?:setup|set[\s-]?up|install(?:ation)?|build[\s-]?up|move[\s-]?in)[\s\S]{0,60}?(?:\d{1,2}[/-]\d{1,2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\s*(?:am|pm))/i.test(
      text,
    ) ||
    /\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*(?:slot|window|timing)/i.test(text);

  return {
    booth: boothInForm || boothInText,
    dimensions: dimInForm || dimInText,
    height: heightInForm || heightInText,
    power: powerInText,
    ledScreen: ledNotRequired || ledSizeInText,
    flexPrint: flexStatusInText,
    artwork: artworkStatusInText,
    furniture: furnitureQtyInText,
    setup: setupInForm || setupInText,
  };
}

function buildOrganizedSections(ctx: AnalysisContext): OrganizedSection[] {
  const { fields, text } = ctx;
  const areas = computeStallAreas(fields);

  const eventItems: OrganizedDetail[] = [];
  if (hasText(fields.clientName)) {
    eventItems.push({ label: "Client", value: fields.clientName.trim() });
  }
  if (hasText(fields.exhibitionName)) {
    eventItems.push({
      label: "Exhibition",
      value: fields.exhibitionName.trim(),
    });
  }
  if (hasText(fields.venue)) {
    eventItems.push({ label: "Venue", value: fields.venue.trim() });
  }
  const booth =
    fields.boothNumber.trim() ||
    excerptAround(text, /(?:booth|stall|stand)\s*(?:no\.?|#)?\s*[:\-]?\s*[a-z0-9][^\n,]{0,30}/i) ||
    firstMatch(text, /hall\s*\d+[\s,/-]+[a-z]-?\d+/i);
  if (booth) eventItems.push({ label: "Booth / stall", value: booth });

  const stallItems: OrganizedDetail[] = [];
  if (fieldPositive(fields.stallLengthM) && fieldPositive(fields.stallWidthM)) {
    stallItems.push({
      label: "Footprint",
      value: `${fields.stallLengthM.trim()} m × ${fields.stallWidthM.trim()} m`,
    });
  } else {
    const dim =
      excerptAround(
        text,
        /\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?\s*(?:m|meter|metre)?/i,
      ) || firstMatch(text, /\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?/i);
    if (dim) stallItems.push({ label: "Dimensions (from notes)", value: dim });
  }
  if (fieldPositive(fields.stallHeightM)) {
    stallItems.push({
      label: "Height",
      value: `${fields.stallHeightM.trim()} m`,
    });
  } else {
    const h = excerptAround(
      text,
      /(?:max(?:imum)?\s*)?height[\s\S]{0,25}?\d+(?:\.\d+)?\s*m?/i,
    );
    if (h) stallItems.push({ label: "Height (from notes)", value: h });
  }
  if (hasText(fields.openSides)) {
    stallItems.push({
      label: "Open sides",
      value: fields.openSides.trim(),
    });
  }
  if (areas.floorAreaSqM !== null) {
    stallItems.push({
      label: "Floor area (calculated)",
      value: formatAreaSqM(areas.floorAreaSqM),
    });
  }

  const techItems: OrganizedDetail[] = [];
  const power = excerptAround(
    text,
    /(?:power|load|kva|kw|amp)[^\n.]{0,50}/i,
  );
  if (power) techItems.push({ label: "Electrical", value: power });
  const led = excerptAround(text, /led[^\n.]{0,60}/i);
  if (led) techItems.push({ label: "LED / display", value: led });

  const graphicsItems: OrganizedDetail[] = [];
  const flex = excerptAround(text, /(?:flex|vinyl)[^\n.]{0,70}/i);
  if (flex) graphicsItems.push({ label: "Flex / vinyl", value: flex });
  const art = excerptAround(text, /(?:artwork|logo|creative)[^\n.]{0,70}/i);
  if (art) graphicsItems.push({ label: "Artwork", value: art });

  const logisticsItems: OrganizedDetail[] = [];
  if (hasText(fields.clientBudget)) {
    const n = Number(fields.clientBudget.replace(/,/g, "").trim());
    if (Number.isFinite(n) && n > 0) {
      logisticsItems.push({ label: "Budget", value: formatInr(n) });
    }
  }
  if (hasText(fields.setupDate)) {
    logisticsItems.push({ label: "Setup date", value: fields.setupDate });
  }
  if (hasText(fields.dismantlingDate)) {
    logisticsItems.push({
      label: "Dismantling date",
      value: fields.dismantlingDate,
    });
  }
  const setupNote = excerptAround(
    text,
    /(?:setup|install)[^\n.]{0,70}/i,
  );
  if (setupNote && !hasText(fields.setupDate)) {
    logisticsItems.push({ label: "Setup (from notes)", value: setupNote });
  }
  const furniture = excerptAround(
    text,
    /(?:furniture|chairs?|tables?)[^\n.]{0,60}/i,
  );
  if (furniture) {
    logisticsItems.push({ label: "Furniture", value: furniture });
  }

  const sections: OrganizedSection[] = [];
  if (eventItems.length) sections.push({ title: "Event & location", items: eventItems });
  if (stallItems.length) sections.push({ title: "Stall size", items: stallItems });
  if (techItems.length) sections.push({ title: "Electrical & AV", items: techItems });
  if (graphicsItems.length)
    sections.push({ title: "Branding & graphics", items: graphicsItems });
  if (logisticsItems.length)
    sections.push({ title: "Budget, furniture & schedule", items: logisticsItems });

  return sections;
}

export function analyzeClientBrief(
  fields: ClientBriefFields,
): BriefAnalysisResult {
  const ctx = buildContext(fields);
  const presence = detectPresence(ctx);
  const sections = buildOrganizedSections(ctx);

  const missing: MissingBriefItem[] = CHECK_IDS.filter(
    (id) => !presence[id],
  ).map((id) => ({
    id,
    ...MISSING_BY_ID[id],
  }));

  return {
    sections,
    missing,
    readyCount: CHECK_IDS.length - missing.length,
  };
}
