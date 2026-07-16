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

  return (
    <div className="min-h-screen flex bg-background font-sans text-foreground">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-muted/10">
        <Topbar currentTab={currentTab} />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
