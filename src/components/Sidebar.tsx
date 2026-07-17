"use client";

import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  FileText, 
  CreditCard, 
  ShieldCheck, 
  BarChart3, 
  Settings, 
  PlaneTakeoff,
  LogOut
} from "lucide-react";
import { useAuth } from "@/context";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function Sidebar({ currentTab, setCurrentTab }: SidebarProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "STAFF"] },
    { id: "clients", name: "Clients", icon: Users, roles: ["ADMIN", "STAFF"] },
    { id: "tasks", name: "Tasks", icon: CheckSquare, roles: ["ADMIN", "STAFF"] },
    { id: "documents", name: "Documents", icon: FileText, roles: ["ADMIN", "STAFF"] },
    { id: "payments", name: "Payments", icon: CreditCard, roles: ["ADMIN"] },
    { id: "reviews", name: "Quality Review", icon: ShieldCheck, roles: ["ADMIN"] },
    { id: "reports", name: "Reports", icon: BarChart3, roles: ["ADMIN"] },
    { id: "staff", name: "Staff Management", icon: Users, roles: ["ADMIN"] },
    { id: "settings", name: "Settings", icon: Settings, roles: ["ADMIN", "STAFF"] },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col justify-between h-screen sticky top-0">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Logo Section */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <PlaneTakeoff className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none tracking-tight text-foreground">WAY POINT</h1>
            <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">Travel Ltd</span>
          </div>
        </div>

        {/* User Badge */}
        {user && (
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm uppercase">
                {user.name.slice(0, 2)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate text-foreground">{user.name}</p>
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                }`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="h-4.5 w-4.5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
