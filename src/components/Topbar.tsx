"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Search,
  ChevronDown,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Workflow,
  ClipboardList
} from "lucide-react";
import { useAuth } from "@/context";

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface TopbarProps {
  currentTab: string;
  onNavigate?: (link: string) => void;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function notificationIcon(type: string) {
  if (type === "TASK_OVERDUE") return <Clock className="h-4.5 w-4.5 text-destructive" />;
  if (type === "TASK_ASSIGNED") return <ClipboardList className="h-4.5 w-4.5 text-primary" />;
  if (type === "STAGE_CHANGED") return <Workflow className="h-4.5 w-4.5 text-primary" />;
  return <AlertCircle className="h-4.5 w-4.5 text-primary" />;
}

export function Topbar({ currentTab, onNavigate }: TopbarProps) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setNotificationsError(null);
      } else {
        setNotificationsError(data.error || "Failed to load notifications");
      }
    } catch {
      setNotificationsError("Failed to load notifications");
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notif.id }),
        });
      } catch {
        fetchNotifications();
      }
    }

    if (notif.link && onNavigate) {
      onNavigate(notif.link);
      setShowNotifications(false);
    }
  };

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
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full ring-2 ring-card"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-2xl shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 pb-2 border-b border-border flex justify-between items-center">
                  <span className="font-bold text-sm text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[10px] text-primary hover:underline font-semibold cursor-pointer">
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="py-8 flex justify-center items-center">
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : notificationsError ? (
                    <p className="text-xs text-destructive text-center py-6 px-4">{notificationsError}</p>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 px-4 text-center">
                      <Bell className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground font-semibold">You&apos;re all caught up</p>
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`px-4 py-3 hover:bg-muted/40 transition-colors flex gap-3 border-b border-border/50 last:border-b-0 cursor-pointer ${
                          !notif.isRead ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="mt-0.5">
                          {!notif.isRead ? notificationIcon(notif.type) : <CheckCircle2 className="h-4.5 w-4.5 text-muted-foreground" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-foreground leading-tight">{notif.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{notif.message}</p>
                          <span className="text-[9px] text-muted-foreground/80 font-medium block mt-1">{timeAgo(notif.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
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
