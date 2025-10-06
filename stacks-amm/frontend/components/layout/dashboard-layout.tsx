"use client";

import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { DashboardNavbar } from "./dashboard-navbar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardNavbar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
