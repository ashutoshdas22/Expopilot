"use client";

import { Copy, FolderOpen, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { useProjects } from "@/components/project/project-provider";
import { NextStepCard } from "@/components/workflow/next-step-card";
import { WorkflowStrip } from "@/components/workflow/workflow-strip";
import {
  isDemoProject,
  projectDisplayTitle,
  updateActiveProject,
} from "@/lib/project-store";

export function ProjectsManager() {
  const {
    projects,
    activeProject,
    createNewProject,
    openProject,
    saveCurrentProject,
    duplicateProjectById,
    removeProject,
    refresh,
    loadDemoProject,
  } = useProjects();
  const [newName, setNewName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function handleCreate() {
    createNewProject(newName.trim() || undefined);
    setNewName("");
  }

  function handleSave() {
    if (!activeProject) return;
    if (renameName.trim()) {
      updateActiveProject({ name: renameName.trim() });
      refresh();
    }
    saveCurrentProject();
    setSaveMessage("Project saved on this device.");
    window.setTimeout(() => setSaveMessage(null), 2500);
  }

  function handleDelete(id: string, name: string) {
    const ok = window.confirm(
      `Delete “${name}”? This cannot be undone. All brief, costing, and execution data for this project will be removed.`,
    );
    if (!ok) return;
    removeProject(id);
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Projects
        </h1>
        <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
          Create, save, and reopen exhibition jobs. Everything is stored in your
          browser — refreshing will not erase your work.
        </p>
      </header>

      <WorkflowStrip />
      <NextStepCard />

      <section
        className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20"
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Demo project
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Open the sample TechVision pavilion with brief, costing (12 m × 3 m flex
          @ ₹70 / ₹100 per m²), quotation, and execution stages.
        </p>
        <button
          type="button"
          onClick={loadDemoProject}
          className="mt-3 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Open demo project
        </button>
      </section>

      <section
        className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          New project
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            placeholder="Project name (optional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create project
          </button>
        </div>
      </section>

      {activeProject ? (
        <section
          className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Current project
          </h2>
          <p className="mt-1 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {projectDisplayTitle(activeProject)}
          </p>
          <p className="text-xs text-zinc-500">{activeProject.name}</p>
          <input
            type="text"
            className="mt-3 w-full max-w-md rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            placeholder="Rename project (optional)"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
          />
          <button
            type="button"
            onClick={handleSave}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <Save className="h-4 w-4" aria-hidden />
            Save current project
          </button>
          {saveMessage ? (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400" role="status">
              {saveMessage}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          All projects
        </h2>
        {projects.map((project) => {
          const isActive = activeProject?.id === project.id;
          return (
            <article
              key={project.id}
              className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                isActive
                  ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/50"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {projectDisplayTitle(project)}
                  {isDemoProject(project) ? (
                    <span
                      className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                    >
                      Demo
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-zinc-500">
                  {project.name} · Updated{" "}
                  {new Date(project.updatedAt).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!isActive ? (
                  <button
                    type="button"
                    onClick={() => openProject(project.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    Open
                  </button>
                ) : (
                  <span className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                    Active
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => duplicateProjectById(project.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(project.id, projectDisplayTitle(project))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-900/50 dark:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
