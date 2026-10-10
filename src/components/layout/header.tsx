"use client";

import { Menu, PanelsTopLeft } from "lucide-react";
import { useProjects } from "@/components/project/project-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { projectDisplayTitle } from "@/lib/project-store";

type HeaderProps = {
  onMenuClick: () => void;
};

export function Header({ onMenuClick }: HeaderProps) {
  const { activeProject } = useProjects();

  return (
    <header
      className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90"
    >
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              aria-hidden
            >
              <PanelsTopLeft className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Expo Pilot
              </p>
              <p className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
                {activeProject
                  ? projectDisplayTitle(activeProject)
                  : "Exhibition stall operations"}
              </p>
            </div>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
