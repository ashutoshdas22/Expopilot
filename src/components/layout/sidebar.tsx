"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { mainNav } from "@/lib/navigation";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Main">
      {mainNav.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-zinc-900/40 transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!mobileOpen}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-200 bg-zinc-50 transition-transform lg:static lg:z-0 lg:translate-x-0 dark:border-zinc-800 dark:bg-zinc-950 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label="Sidebar"
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4 lg:hidden dark:border-zinc-800">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-200/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="hidden border-b border-zinc-200 px-5 py-5 lg:block dark:border-zinc-800">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
            Navigation
          </p>
        </div>
        <NavLinks onNavigate={onClose} />
      </aside>
    </>
  );
}
