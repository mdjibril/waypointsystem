"use client";

import React, { useState } from "react";
import { 
  Bell, 
  Search, 
  ChevronDown, 
  Sun, 
  Moon,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/context";

interface TopbarProps {
  currentTab: string;
}

export function Topbar({ currentTab }: TopbarProps) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const notifications = [
    { id: 1, title: "New Visa Application", description: "John Doe submitted passport docs.", time: "10m ago", read: false },
    { id: 2, title: "Task Overdue", description: "Eligibility review for Canada visa is past deadline.", time: "1h ago", read: false },
    { id: 3, title: "Payment Received", description: "Invoice #1024 paid in full.", time: "4h ago", read: true }
  ];

  const formatTabName = (tab: string) => {
    return tab
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Page Title & Breadcrumb */}
      <div>
        <h2 className="text-lg font-bold text-foreground">
          {formatTabName(currentTab)}
        </h2>
        <p className="text-[11px] text-muted-foreground font-medium">
          Home / {formatTabName(currentTab)}
        </p>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-6">
        {/* Search Input */}
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients, tasks, invoices..."
            className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all relative"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full ring-2 ring-card"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-2xl shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 pb-2 border-b border-border flex justify-between items-center">
                  <span className="font-bold text-sm text-foreground">Notifications</span>
                  <button className="text-[10px] text-primary hover:underline font-semibold">Mark all as read</button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`px-4 py-3 hover:bg-muted/40 transition-colors flex gap-3 border-b border-border/50 last:border-b-0 cursor-pointer ${
                        !notif.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="mt-0.5">
                        {!notif.read ? (
                          <AlertCircle className="h-4.5 w-4.5 text-primary" />
                        ) : (
                          <CheckCircle2 className="h-4.5 w-4.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground leading-tight">{notif.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{notif.description}</p>
                        <span className="text-[9px] text-muted-foreground/80 font-medium block mt-1">{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile */}
        {user && (
          <div className="flex items-center gap-2 border-l border-border pl-6 cursor-pointer group">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase">
              {user.name.slice(0, 2)}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-bold text-foreground leading-none group-hover:text-primary transition-colors">{user.name}</p>
              <span className="text-[10px] text-muted-foreground font-medium">{user.role}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        )}
      </div>
    </header>
  );
}
