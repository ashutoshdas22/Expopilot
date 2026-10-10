import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Receipt,
  Wrench,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const mainNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview of active work and key metrics",
  },
  {
    label: "Client Brief",
    href: "/client-brief",
    icon: ClipboardList,
    description: "Capture exhibition requirements and stall specifications",
  },
  {
    label: "Costing",
    href: "/costing",
    icon: Receipt,
    description: "Materials, labor, and fabrication cost breakdowns",
  },
  {
    label: "Quotation",
    href: "/quotation",
    icon: FileText,
    description: "Prepare and manage client quotations",
  },
  {
    label: "Execution",
    href: "/execution",
    icon: Wrench,
    description: "Production, installation, and on-site progress",
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    description: "All exhibition projects in one place",
  },
];
