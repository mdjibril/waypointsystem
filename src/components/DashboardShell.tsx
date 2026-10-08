"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface DashboardShellProps {
  children: React.ReactNode;
  defaultTab?: string;
}

export function DashboardShell({ children, defaultTab = "dashboard" }: DashboardShellProps) {
  const [currentTab, setCurrentTab] = useState(defaultTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-background font-sans text-foreground">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 bg-muted/10 overflow-hidden">
        <Topbar currentTab={currentTab} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
