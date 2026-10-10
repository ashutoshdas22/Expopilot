import { analyzeClientBrief } from "@/lib/brief-analysis";
import {
  createDefaultExecutionPlan,
  type ExecutionPlan,
} from "@/lib/execution";
import {
  CLIENT_BRIEF_STORAGE_KEY,
  emptyClientBrief,
  type ClientBriefFields,
} from "@/lib/client-brief";
import {
  COSTING_STORAGE_KEY,
  normalizeStoredLine,
  type CostLineItem,
} from "@/lib/costing";
import { createDemoProject, DEMO_PROJECT_ID } from "@/lib/demo-project";
export type QuotationMeta = {
  discountInr: string;
  notes: string;
};

export function quotationMetaEquals(
  a: QuotationMeta,
  b: QuotationMeta,
): boolean {
  return a.discountInr === b.discountInr && a.notes === b.notes;
}

const QUOTATION_META_STORAGE_KEY = "expo-pilot-quotation-meta";

export const PROJECTS_STORAGE_KEY = "expo-pilot-projects-v1";
export const ACTIVE_PROJECT_ID_KEY = "expo-pilot-active-project-id";

export const PROJECTS_CHANGED_EVENT = "expo-pilot-projects-changed";

export type ExpoProject = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  brief: ClientBriefFields;
  costingLines: CostLineItem[];
  quotationMeta: QuotationMeta;
  execution: ExecutionPlan;
};

function nowIso(): string {
  return new Date().toISOString();
}

function newProjectId(): string {
  return `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultProjectName(): string {
  return `Project ${new Date().toLocaleDateString("en-IN")}`;
}

export function createEmptyProject(name?: string): ExpoProject {
  const timestamp = nowIso();
  return {
    id: newProjectId(),
    name: name?.trim() || defaultProjectName(),
    createdAt: timestamp,
    updatedAt: timestamp,
    brief: { ...emptyClientBrief },
    costingLines: [],
    quotationMeta: { discountInr: "", notes: "" },
    execution: createDefaultExecutionPlan(),
  };
}

function hasLegacyStorageData(): boolean {
  return Boolean(
    localStorage.getItem(CLIENT_BRIEF_STORAGE_KEY) ||
      localStorage.getItem(COSTING_STORAGE_KEY) ||
      localStorage.getItem(QUOTATION_META_STORAGE_KEY),
  );
}

function readProjectsRaw(): ExpoProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ExpoProject[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeProject);
  } catch {
    return [];
  }
}

function normalizeProject(raw: ExpoProject): ExpoProject {
  return {
    ...raw,
    brief: { ...emptyClientBrief, ...raw.brief },
    costingLines: Array.isArray(raw.costingLines)
      ? raw.costingLines.map((line) =>
          normalizeStoredLine(line as unknown as Record<string, unknown>),
        )
      : [],
    quotationMeta: {
      discountInr: raw.quotationMeta?.discountInr ?? "",
      notes: raw.quotationMeta?.notes ?? "",
    },
    execution: {
      ...createDefaultExecutionPlan(),
      ...raw.execution,
    },
  };
}

function writeProjects(projects: ExpoProject[]): void {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  emitProjectsChanged();
}

function syncLegacyKeys(project: ExpoProject): void {
  localStorage.setItem(CLIENT_BRIEF_STORAGE_KEY, JSON.stringify(project.brief));
  localStorage.setItem(
    COSTING_STORAGE_KEY,
    JSON.stringify({ lines: project.costingLines }),
  );
  localStorage.setItem(
    QUOTATION_META_STORAGE_KEY,
    JSON.stringify(project.quotationMeta),
  );
}

export function emitProjectsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT));
}

export function ensureProjectsInitialized(): void {
  if (typeof window === "undefined") return;
  let existing = readProjectsRaw();
  if (existing.length > 0) {
    if (!existing.some((p) => p.id === DEMO_PROJECT_ID)) {
      existing = [createDemoProject(), ...existing];
      writeProjects(existing);
    }
    const activeId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
    if (!activeId || !existing.some((p) => p.id === activeId)) {
      localStorage.setItem(ACTIVE_PROJECT_ID_KEY, existing[0].id);
      syncLegacyKeys(existing[0]);
    }
    return;
  }

  const demo = createDemoProject();
  if (hasLegacyStorageData()) {
    const migrated = migrateLegacyProject();
    writeProjects([demo, migrated]);
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, migrated.id);
    syncLegacyKeys(migrated);
  } else {
    writeProjects([demo]);
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, demo.id);
    syncLegacyKeys(demo);
  }
}

export function isDemoProject(project: ExpoProject): boolean {
  return project.id === DEMO_PROJECT_ID;
}

export function openDemoProject(): ExpoProject | null {
  const projects = readProjectsRaw();
  const demo = projects.find((p) => p.id === DEMO_PROJECT_ID);
  if (!demo) return null;
  return setActiveProject(demo.id);
}

function migrateLegacyProject(): ExpoProject {
  const project = createEmptyProject("My exhibition project");
  try {
    const briefRaw = localStorage.getItem(CLIENT_BRIEF_STORAGE_KEY);
    if (briefRaw) {
      project.brief = { ...emptyClientBrief, ...JSON.parse(briefRaw) };
    }
  } catch {
    /* ignore */
  }
  try {
    const costingRaw = localStorage.getItem(COSTING_STORAGE_KEY);
    if (costingRaw) {
      const parsed = JSON.parse(costingRaw) as { lines?: Record<string, unknown>[] };
      if (Array.isArray(parsed.lines) && parsed.lines.length > 0) {
        project.costingLines = parsed.lines.map((line) =>
          normalizeStoredLine(line),
        );
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const metaRaw = localStorage.getItem(QUOTATION_META_STORAGE_KEY);
    if (metaRaw) {
      project.quotationMeta = {
        ...project.quotationMeta,
        ...JSON.parse(metaRaw),
      };
    }
  } catch {
    /* ignore */
  }
  return project;
}

export function listProjects(): ExpoProject[] {
  if (typeof window === "undefined") return [];
  ensureProjectsInitialized();
  return readProjectsRaw().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getActiveProjectId(): string | null {
  if (typeof window === "undefined") return null;
  ensureProjectsInitialized();
  return localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
}

export function getActiveProject(): ExpoProject | null {
  const projects = listProjects();
  const id = getActiveProjectId();
  if (!id) return projects[0] ?? null;
  return projects.find((p) => p.id === id) ?? projects[0] ?? null;
}

export function saveProject(project: ExpoProject): void {
  const projects = readProjectsRaw();
  const index = projects.findIndex((p) => p.id === project.id);
  const next = { ...project, updatedAt: nowIso() };
  if (index >= 0) projects[index] = next;
  else projects.push(next);
  writeProjects(projects);
  if (getActiveProjectId() === next.id) {
    syncLegacyKeys(next);
  }
}

export function updateActiveProject(
  patch: Partial<
    Pick<ExpoProject, "name" | "brief" | "costingLines" | "quotationMeta" | "execution">
  >,
): ExpoProject | null {
  const active = getActiveProject();
  if (!active) return null;

  if (
    patch.quotationMeta &&
    patch.name === undefined &&
    patch.brief === undefined &&
    patch.costingLines === undefined &&
    patch.execution === undefined &&
    quotationMetaEquals(active.quotationMeta, patch.quotationMeta)
  ) {
    return active;
  }

  const updated: ExpoProject = {
    ...active,
    ...patch,
    brief: patch.brief ? { ...active.brief, ...patch.brief } : active.brief,
    execution: patch.execution
      ? { ...active.execution, ...patch.execution }
      : active.execution,
    updatedAt: nowIso(),
  };
  saveProject(updated);
  syncLegacyKeys(updated);
  return updated;
}

export function setActiveProject(id: string): ExpoProject | null {
  const projects = readProjectsRaw();
  const project = projects.find((p) => p.id === id);
  if (!project) return null;
  localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
  syncLegacyKeys(project);
  emitProjectsChanged();
  return project;
}

export function createProject(name?: string): ExpoProject {
  ensureProjectsInitialized();
  const project = createEmptyProject(name);
  const projects = readProjectsRaw();
  projects.push(project);
  writeProjects(projects);
  setActiveProject(project.id);
  return project;
}

export function duplicateProject(id: string): ExpoProject | null {
  const projects = readProjectsRaw();
  const source = projects.find((p) => p.id === id);
  if (!source) return null;
  const copy: ExpoProject = {
    ...JSON.parse(JSON.stringify(source)),
    id: newProjectId(),
    name: `${source.name} (copy)`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  projects.push(copy);
  writeProjects(projects);
  return copy;
}

export function deleteProject(id: string): boolean {
  const projects = readProjectsRaw();
  const next = projects.filter((p) => p.id !== id);
  if (next.length === projects.length) return false;
  if (next.length === 0) {
    const fresh = createEmptyProject();
    writeProjects([fresh]);
    setActiveProject(fresh.id);
    return true;
  }
  writeProjects(next);
  const activeId = getActiveProjectId();
  if (activeId === id) {
    setActiveProject(next[0].id);
  }
  return true;
}

export function saveActiveProjectSnapshot(): ExpoProject | null {
  const active = getActiveProject();
  if (!active) return null;
  saveProject(active);
  syncLegacyKeys(active);
  return active;
}

export function projectDisplayTitle(project: ExpoProject): string {
  if (project.brief.clientName.trim()) {
    return project.brief.clientName.trim();
  }
  return project.name;
}

export function countBriefGaps(project: ExpoProject): number {
  return analyzeClientBrief(project.brief).missing.length;
}

export function loadActiveBrief(): ClientBriefFields {
  return getActiveProject()?.brief ?? { ...emptyClientBrief };
}

export function saveActiveBrief(brief: ClientBriefFields): void {
  updateActiveProject({ brief });
}

export function loadActiveCostingLines(): CostLineItem[] {
  return getActiveProject()?.costingLines ?? [];
}

export function saveActiveCostingLines(lines: CostLineItem[]): void {
  updateActiveProject({ costingLines: lines });
}

export function loadActiveQuotationMeta(): QuotationMeta {
  return (
    getActiveProject()?.quotationMeta ?? { discountInr: "", notes: "" }
  );
}

export function saveActiveQuotationMeta(meta: QuotationMeta): void {
  const active = getActiveProject();
  if (!active) return;
  if (quotationMetaEquals(active.quotationMeta, meta)) return;
  updateActiveProject({ quotationMeta: meta });
}
