"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createProject,
  deleteProject,
  duplicateProject,
  ensureProjectsInitialized,
  getActiveProject,
  listProjects,
  openDemoProject,
  PROJECTS_CHANGED_EVENT,
  saveActiveProjectSnapshot,
  setActiveProject,
  type ExpoProject,
} from "@/lib/project-store";

type ProjectContextValue = {
  activeProject: ExpoProject | null;
  projects: ExpoProject[];
  refresh: () => void;
  openProject: (id: string) => void;
  createNewProject: (name?: string) => void;
  saveCurrentProject: () => void;
  duplicateProjectById: (id: string) => void;
  removeProject: (id: string) => boolean;
  loadDemoProject: () => void;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProject, setActiveProjectState] = useState<ExpoProject | null>(
    null,
  );
  const [projects, setProjects] = useState<ExpoProject[]>([]);

  const refresh = useCallback(() => {
    ensureProjectsInitialized();
    setProjects(listProjects());
    setActiveProjectState(getActiveProject());
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(PROJECTS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(PROJECTS_CHANGED_EVENT, onChange);
  }, [refresh]);

  const value = useMemo<ProjectContextValue>(
    () => ({
      activeProject,
      projects,
      refresh,
      openProject: (id: string) => {
        setActiveProject(id);
        refresh();
      },
      createNewProject: (name?: string) => {
        createProject(name);
        refresh();
      },
      saveCurrentProject: () => {
        saveActiveProjectSnapshot();
        refresh();
      },
      duplicateProjectById: (id: string) => {
        const copy = duplicateProject(id);
        if (copy) setActiveProject(copy.id);
        refresh();
      },
      removeProject: (id: string) => {
        const ok = deleteProject(id);
        refresh();
        return ok;
      },
      loadDemoProject: () => {
        openDemoProject();
        refresh();
      },
    }),
    [activeProject, projects, refresh],
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProjects must be used within ProjectProvider");
  }
  return ctx;
}
