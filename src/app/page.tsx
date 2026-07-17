"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { 
  Users, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Search,
  Filter,
  ArrowRight,
  FileCheck2,
  Briefcase,
  UserPlus,
  Shield,
  Check,
  Power,
  KeyRound,
  User as UserIcon,
  Phone
} from "lucide-react";

export default function Home() {
  const { user, login, logout, isAuthenticated, loginError } = useAuth();
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Staff Management State
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [addStaffError, setAddStaffError] = useState<string | null>(null);
  const [addStaffSuccess, setAddStaffSuccess] = useState<string | null>(null);
  const [addStaffLoading, setAddStaffLoading] = useState(false);

  // User Profile Settings State
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Settings State
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Sync profile fields when user is loaded
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone || "");
    }
  }, [user]);

  // Load staff list if Admin selects the Staff Management tab
  const fetchStaff = async () => {
    if (user?.role.toUpperCase() !== "ADMIN") return;
    setStaffLoading(true);
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (res.ok) {
        setStaffUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to load staff list:", err);
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === "staff" && user?.role.toUpperCase() === "ADMIN") {
      fetchStaff();
    }
  }, [currentTab, user]);

  // Enforce role-based access control inside client
  useEffect(() => {
    const adminOnlyTabs = ["payments", "reviews", "reports", "staff"];
    if (user && user.role.toUpperCase() !== "ADMIN" && adminOnlyTabs.includes(currentTab)) {
      setCurrentTab("dashboard");
    }
  }, [currentTab, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStaffLoading(true);
    setAddStaffError(null);
    setAddStaffSuccess(null);

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          phone: newStaffPhone || undefined,
          role: newStaffRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddStaffError(data.error || "Failed to create staff member");
      } else {
        setAddStaffSuccess("Staff member added successfully! Default password is 'password123'.");
        setNewStaffName("");
        setNewStaffEmail("");
        setNewStaffPhone("");
        setNewStaffRole("STAFF");
        fetchStaff();
      }
    } catch (err) {
      setAddStaffError("Connection error. Please try again.");
    } finally {
      setAddStaffLoading(false);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: nextStatus }),
      });
      if (res.ok) {
        fetchStaff();
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const nextRole = currentRole.toUpperCase() === "ADMIN" ? "STAFF" : "ADMIN";
    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: nextRole }),
      });
      if (res.ok) {
        fetchStaff();
      }
    } catch (err) {
      console.error("Failed to toggle role:", err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: profileName,
          phone: profilePhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setProfileError(data.error || "Failed to update profile");
      } else {
        setProfileSuccess("Profile updated successfully!");
        // Update local storage session cache
        const updatedCache = { ...user, name: profileName, phone: profilePhone };
        localStorage.setItem("waypoint_user", JSON.stringify(updatedCache));
      }
    } catch (err) {
      setProfileError("Connection error. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password");
      } else {
        setPasswordSuccess("Password updated successfully! Log in next time with your new password.");
        setNewPassword("");
      }
    } catch (err) {
      setPasswordError("Connection error. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-background font-sans relative overflow-hidden">
        {/* Decorative background grid/mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary)_0%,transparent_60%)] opacity-10 pointer-events-none"></div>
        <div className="absolute -left-48 -bottom-48 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>

        {/* Brand Left Panel */}
        <div className="flex-1 flex flex-col justify-between p-10 md:p-16 bg-gradient-to-br from-card to-background border-r border-border relative">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2.5 rounded-xl text-primary-foreground">
              <Plus className="h-6 w-6 transform rotate-45" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-none tracking-tight text-foreground">WAY POINT</h1>
              <span className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase">Travel Ltd</span>
            </div>
          </div>

          <div className="my-auto py-12 max-w-lg">
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-foreground tracking-tight">
              Smarter Travel & <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Visa Workflows</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
              Experience the premium internal operating platform built for Way Point Travel Limited. 
              Manage clients, automate checklists, track payments, and optimize staff delivery from inquiry to travel.
            </p>
            <div className="mt-8 flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-semibold text-muted-foreground">Secure Core</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-xs font-semibold text-muted-foreground">Next.js & Tailwind 4</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs font-semibold text-muted-foreground">TypeScript Ready</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} Way Point Travel Limited. All rights reserved.
          </p>
        </div>

        {/* Login Right Panel */}
        <div className="flex-1 flex items-center justify-center p-8 md:p-16">
          <div className="w-full max-w-md bg-card/60 backdrop-blur-md border border-border/80 rounded-3xl p-8 md:p-10 shadow-xl shadow-foreground/5 transition-all">
            <div className="text-center md:text-left mb-8">
              <h3 className="text-2xl font-bold text-foreground">Staff Portal</h3>
              <p className="text-sm text-muted-foreground mt-1">Sign in with your assigned credentials to start working.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {loginError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold px-4 py-2.5 rounded-xl">
                  {loginError}
                </div>
              )}

              {/* Demo Accounts helper */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demo Accounts</label>
                <div className="grid grid-cols-2 gap-2 bg-muted/40 p-1.5 rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("admin@waypoint.com");
                      setPassword("password123");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      email === "admin@waypoint.com" 
                        ? "bg-card text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Admin Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("staff@waypoint.com");
                      setPassword("password123");
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      email === "staff@waypoint.com" 
                        ? "bg-card text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Staff Profile
                  </button>
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@waypoint.com"
                  className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="password">Password</label>
                  <a href="#" className="text-xs text-primary hover:underline font-semibold">Forgot?</a>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 text-sm hover:opacity-95 shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In 
                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Logged-in System Layout Shell Mockups
  return (
    <div className="min-h-screen flex bg-background font-sans text-foreground">
      {/* Shared Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-muted/10">
        <Topbar currentTab={currentTab} />

        {/* Scrollable container for tab contents */}
        <main className="flex-1 p-8 overflow-y-auto">
          {currentTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Header Greeting */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-extrabold text-foreground">Welcome back, {user?.name}!</h3>
                  <p className="text-xs text-muted-foreground">Here is the status of your travel applications and workflows today.</p>
                </div>
                <button className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer">
                  <Plus className="h-4 w-4" /> New Client inquiry
                </button>
              </div>

              {/* Status Metric Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500">
                      <Users className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] bg-green-500/10 text-green-600 font-bold px-1.5 py-0.5 rounded">+12%</span>
                  </div>
                  <h4 className="text-2xl font-black mt-4 text-foreground">148</h4>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Active Client Profiles</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] bg-green-500/10 text-green-600 font-bold px-1.5 py-0.5 rounded">+8%</span>
                  </div>
                  <h4 className="text-2xl font-black mt-4 text-foreground">84</h4>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Visa Processing Pipeline</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="bg-yellow-500/10 p-2.5 rounded-xl text-yellow-600">
                      <Clock className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-600 font-bold px-1.5 py-0.5 rounded">Urgent</span>
                  </div>
                  <h4 className="text-2xl font-black mt-4 text-foreground">19</h4>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Pending Quality Reviews</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="bg-red-500/10 p-2.5 rounded-xl text-red-500">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] bg-red-500/10 text-red-500 font-bold px-1.5 py-0.5 rounded">Overdue</span>
                  </div>
                  <h4 className="text-2xl font-black mt-4 text-foreground">7</h4>
                  <p className="text-xs text-muted-foreground font-medium mt-1">Overdue Staff Tasks</p>
                </div>
              </div>

              {/* Core Layout Panels */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Recent Activities Section */}
                <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h4 className="font-bold text-sm text-foreground mb-4">Pipeline Overview</h4>
                  <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-xl bg-muted/10">
                    <div className="text-center max-w-sm px-4">
                      <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                      <p className="text-xs font-bold text-foreground">Interactive Stage board</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Developer 2 is assigned to implement the workflow board visual shell layout.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Task Checklist Panel */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                  <h4 className="font-bold text-sm text-foreground mb-4">My High-Priority Tasks</h4>
                  <div className="space-y-3 flex-1">
                    {[
                      { id: 1, title: "Review UK Visa Docs", client: "David Miller", due: "Today" },
                      { id: 2, title: "Confirm Biometrics booking", client: "Alice Green", due: "Tomorrow" },
                      { id: 3, title: "Draft assessment sheet", client: "Richard Brown", due: "In 2 days" }
                    ].map(t => (
                      <div key={t.id} className="p-3 border border-border/80 rounded-xl hover:border-primary/50 transition-colors flex justify-between items-center group cursor-pointer bg-muted/20">
                        <div>
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{t.title}</p>
                          <span className="text-[10px] text-muted-foreground">{t.client}</span>
                        </div>
                        <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{t.due}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === "clients" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Client Records</h3>
                  <p className="text-xs text-muted-foreground">Manage and filter client files and travel history.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search name, passport..."
                      className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground"
                    />
                  </div>
                  <button className="bg-card border border-border text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 text-foreground hover:bg-secondary">
                    <Filter className="h-3.5 w-3.5" /> Filters
                  </button>
                </div>
              </div>

              {/* Client List Empty State / Mockup */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/25 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-6">File Number</th>
                      <th className="py-3.5 px-6">Client Name</th>
                      <th className="py-3.5 px-6">Passport</th>
                      <th className="py-3.5 px-6">Active Cases</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs">
                    {[
                      { file: "WP-2026-001", name: "Samantha Cooper", passport: "AA8273940", cases: "UK Visa - Inquiry" },
                      { file: "WP-2026-002", name: "David Miller", passport: "BB9281729", cases: "Canada Study Permit - Quality Review" },
                      { file: "WP-2026-003", name: "Alice Green", passport: "CC1928374", cases: "Schengen Tourist - Submission" }
                    ].map((c, idx) => (
                      <tr key={idx} className="hover:bg-muted/10 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-bold text-foreground">{c.file}</td>
                        <td className="py-3.5 px-6 font-semibold text-foreground">{c.name}</td>
                        <td className="py-3.5 px-6 text-muted-foreground">{c.passport}</td>
                        <td className="py-3.5 px-6">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                            {c.cases}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button className="text-primary hover:underline font-semibold text-xs">View File</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentTab === "tasks" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Task Manager</h3>
                  <p className="text-xs text-muted-foreground">Assign, update, and track workload deliverables.</p>
                </div>
                <button className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-primary/10">
                  Create Task
                </button>
              </div>

              {/* Kanban Mockup */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {["To Do", "In Progress", "Completed"].map((col, idx) => (
                  <div key={idx} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col min-h-96">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
                      <span className="font-bold text-xs text-foreground">{col}</span>
                      <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {idx === 0 ? "2" : idx === 1 ? "1" : "3"}
                      </span>
                    </div>
                    <div className="space-y-3 flex-1">
                      {idx === 0 && (
                        <>
                          <div className="bg-muted/30 border border-border p-3 rounded-xl cursor-grab hover:border-primary/50 transition-colors">
                            <p className="text-xs font-bold text-foreground">Draft cover letter</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Client: Samantha Cooper</p>
                          </div>
                          <div className="bg-muted/30 border border-border p-3 rounded-xl cursor-grab hover:border-primary/50 transition-colors">
                            <p className="text-xs font-bold text-foreground">Upload flight itinerary</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Client: Alice Green</p>
                          </div>
                        </>
                      )}
                      {idx === 1 && (
                        <div className="bg-muted/30 border border-border p-3 rounded-xl cursor-grab hover:border-primary/50 transition-colors">
                          <p className="text-xs font-bold text-foreground">Verify passport scans</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Client: David Miller</p>
                        </div>
                      )}
                      {idx === 2 && (
                        <div className="bg-muted/10 border border-border/40 p-3 rounded-xl opacity-60">
                          <p className="text-xs font-bold text-foreground line-through">Payment confirmation</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Completed by Admin</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentTab === "documents" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-foreground">Document Management</h3>
                <p className="text-xs text-muted-foreground">Manage checklists and inspect uploaded client files.</p>
              </div>

              {/* Document Layout Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Checklists template panel */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                  <h4 className="font-bold text-xs text-foreground mb-3 uppercase tracking-wider">Checklist Templates</h4>
                  <div className="space-y-2">
                    {["UK Tourist Visa", "Canada Study Permit", "Schengen Business Visa", "USA Tourism B1/B2"].map((temp, i) => (
                      <button key={i} className="w-full text-left p-2.5 text-xs rounded-lg hover:bg-secondary font-medium transition-colors">
                        {temp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Queue list */}
                <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-xs text-foreground">Uploaded Documents Queue</span>
                    <span className="text-[10px] text-muted-foreground">Showing 3 files</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { file: "passport_main_page.pdf", size: "2.4 MB", client: "David Miller", status: "VERIFIED" },
                      { file: "bank_statement_6m.pdf", size: "8.1 MB", client: "Samantha Cooper", status: "PENDING" },
                      { file: "travel_insurance_certificate.pdf", size: "1.2 MB", client: "Alice Green", status: "REJECTED" }
                    ].map((d, i) => (
                      <div key={i} className="flex justify-between items-center border border-border/60 p-3 rounded-xl hover:border-primary/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted p-2 rounded-lg text-muted-foreground">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">{d.file}</p>
                            <p className="text-[10px] text-muted-foreground">{d.client} • {d.size}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          d.status === "VERIFIED" ? "bg-green-500/10 text-green-600" :
                          d.status === "PENDING" ? "bg-yellow-500/10 text-yellow-600" : "bg-red-500/10 text-red-500"
                        }`}>
                          {d.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Protected: Payments */}
          {currentTab === "payments" && user?.role.toUpperCase() === "ADMIN" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Invoicing & Payments</h3>
                  <p className="text-xs text-muted-foreground">Track transaction history, outstanding balances, and receipt validations.</p>
                </div>
                <button className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-xl shadow-md cursor-pointer">
                  New Invoice
                </button>
              </div>

              {/* Grid of payments */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-muted/10">
                  <CreditCard className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-xs font-bold text-foreground">Invoice Tracking Panel</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Manage service fee invoicing and balances. Accessible to Administrators.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Admin Protected: Quality Review */}
          {currentTab === "reviews" && user?.role.toUpperCase() === "ADMIN" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-foreground">Quality Review Queue</h3>
                <p className="text-xs text-muted-foreground">Final assessment of files before embassy/portal submission.</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-muted/10">
                  <FileCheck2 className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <p className="text-xs font-bold text-foreground">Quality Check & Approvals Queue</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Files cannot be submitted to VFS/embassy until reviewed and approved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Admin Protected: Reports */}
          {currentTab === "reports" && user?.role.toUpperCase() === "ADMIN" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold text-foreground">Business Analytics Reports</h3>
                <p className="text-xs text-muted-foreground">Observe staff workload metrics, stage bottlenecks, and approvals success.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h4 className="font-bold text-xs text-foreground mb-4">Visa Approval Rates By Destination</h4>
                  <div className="h-48 border border-border rounded-xl bg-muted/20 flex items-end justify-between p-4 gap-2">
                    {[
                      { country: "UK", rate: 88, h: "h-[88%]" },
                      { country: "Canada", rate: 72, h: "h-[72%]" },
                      { country: "Schengen", rate: 94, h: "h-[94%]" },
                      { country: "USA", rate: 64, h: "h-[64%]" }
                    ].map((item, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className={`w-full bg-primary/80 hover:bg-primary rounded-t-lg transition-all ${item.h}`}></div>
                        <span className="text-[10px] font-bold text-foreground">{item.country}</span>
                        <span className="text-[9px] text-muted-foreground">{item.rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h4 className="font-bold text-xs text-foreground mb-4">Pipeline Distribution by Stage</h4>
                  <div className="space-y-3">
                    {[
                      { stage: "Consultation Eligibility Check", count: 24, percent: "w-[40%]" },
                      { stage: "Document Collection", count: 32, percent: "w-[54%]" },
                      { stage: "Quality Reviews", count: 12, percent: "w-[20%]" },
                      { stage: "Embassy Submissions", count: 18, percent: "w-[30%]" }
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-foreground">{item.stage}</span>
                          <span className="text-muted-foreground">{item.count} files</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div className={`h-full bg-primary rounded-full ${item.percent}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Protected: Staff Management */}
          {currentTab === "staff" && user?.role.toUpperCase() === "ADMIN" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Staff Management</h3>
                  <p className="text-xs text-muted-foreground">Manage internal users, update roles, and switch access states.</p>
                </div>
                <button 
                  onClick={() => {
                    setIsAddStaffOpen(true);
                    setAddStaffError(null);
                    setAddStaffSuccess(null);
                  }}
                  className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" /> Add Staff Member
                </button>
              </div>

              {/* Add Staff Modal */}
              {isAddStaffOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 animate-[zoom-in_0.2s_ease-out]">
                    <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-primary" /> Add New Staff Member
                      </h4>
                      <button 
                        onClick={() => setIsAddStaffOpen(false)}
                        className="text-muted-foreground hover:text-foreground font-semibold text-xs border border-border rounded-lg px-2 py-1 bg-card hover:bg-secondary cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleAddStaff} className="p-6 space-y-4">
                      {addStaffError && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs font-semibold text-destructive">
                          {addStaffError}
                        </div>
                      )}
                      {addStaffSuccess && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-xs font-semibold text-green-600">
                          {addStaffSuccess}
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Full Name</label>
                        <input
                          type="text"
                          required
                          value={newStaffName}
                          onChange={(e) => setNewStaffName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Email Address</label>
                        <input
                          type="email"
                          required
                          value={newStaffEmail}
                          onChange={(e) => setNewStaffEmail(e.target.value)}
                          placeholder="e.g. john@waypoint.com"
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Phone Number</label>
                        <input
                          type="text"
                          value={newStaffPhone}
                          onChange={(e) => setNewStaffPhone(e.target.value)}
                          placeholder="e.g. +12345678"
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Access Role</label>
                        <select
                          value={newStaffRole}
                          onChange={(e) => setNewStaffRole(e.target.value as any)}
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        >
                          <option value="STAFF">Staff (Standard Access)</option>
                          <option value="ADMIN">Admin (Full System Access)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={addStaffLoading}
                        className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-2.5 text-xs hover:opacity-95 shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {addStaffLoading ? (
                          <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Create Account"
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Staff List Table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                {staffLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/25 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-6">Staff Member</th>
                        <th className="py-3.5 px-6">Access Role</th>
                        <th className="py-3.5 px-6">Phone</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      {staffUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">
                            No staff accounts found in the database.
                          </td>
                        </tr>
                      ) : (
                        staffUsers.map((member) => (
                          <tr key={member.id} className="hover:bg-muted/10 transition-colors">
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase">
                                  {member.name.slice(0, 2)}
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{member.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{member.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-6">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                member.role.toLowerCase() === "admin" 
                                  ? "bg-purple-500/10 text-purple-600 border border-purple-500/20" 
                                  : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                              }`}>
                                {member.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-muted-foreground font-medium">{member.phone || "—"}</td>
                            <td className="py-3.5 px-6">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                member.status === "active" 
                                  ? "bg-green-500/10 text-green-600" 
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {member.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-right space-x-2">
                              <button 
                                onClick={() => handleToggleRole(member.id, member.role)}
                                className="text-[10px] bg-muted hover:bg-secondary font-bold px-2 py-1 rounded-lg border border-border text-foreground transition-all cursor-pointer"
                              >
                                Toggle Role
                              </button>
                              <button 
                                onClick={() => handleToggleStatus(member.id, member.status)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                                  member.status === "active"
                                    ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                                    : "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
                                }`}
                              >
                                {member.status === "active" ? "Deactivate" : "Activate"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {currentTab === "settings" && (
            <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
              <div>
                <h3 className="text-lg font-bold text-foreground">Account & Platform Settings</h3>
                <p className="text-xs text-muted-foreground">Manage your credentials, update your personal profile, and toggle workspace alerts.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Edit Profile Form */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-foreground mb-1 flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-primary" /> Profile Details
                    </h4>
                    <p className="text-xs text-muted-foreground mb-4">Update your name and primary contact number.</p>

                    {profileError && (
                      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs font-semibold text-destructive mb-4 animate-in fade-in">
                        {profileError}
                      </div>
                    )}
                    {profileSuccess && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-xs font-semibold text-green-600 mb-4 animate-in fade-in">
                        {profileSuccess}
                      </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">Email (Read-only)</label>
                        <input
                          type="email"
                          disabled
                          value={user?.email || ""}
                          className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs text-muted-foreground cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase" htmlFor="profName">Display Name</label>
                        <input
                          id="profName"
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase" htmlFor="profPhone">Contact Number</label>
                        <input
                          id="profPhone"
                          type="text"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-2 text-xs hover:opacity-95 shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {profileLoading ? (
                          <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* 2. Change Password Form */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-foreground mb-1 flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-primary" /> Update Password
                    </h4>
                    <p className="text-xs text-muted-foreground mb-4">Ensure your account stays protected by updating credentials regularly.</p>

                    {passwordError && (
                      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-xs font-semibold text-destructive mb-4 animate-in fade-in">
                        {passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-xs font-semibold text-green-600 mb-4 animate-in fade-in">
                        {passwordSuccess}
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase" htmlFor="newPass">New Password</label>
                        <input
                          id="newPass"
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-2 text-xs hover:opacity-95 shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {passwordLoading ? (
                          <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "Change Password"
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* 3. General Platform Preferences */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h4 className="font-bold text-sm text-foreground mb-4">General Platform Preferences</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border/80">
                    <div>
                      <p className="text-xs font-bold text-foreground">Enable in-app notifications</p>
                      <p className="text-[10px] text-muted-foreground">Show reminders on top navbar for task actions.</p>
                    </div>
                    <div className="w-9 h-5 bg-primary rounded-full relative cursor-pointer"><span className="absolute right-0.5 top-0.5 bg-card w-4 h-4 rounded-full"></span></div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/80">
                    <div>
                      <p className="text-xs font-bold text-foreground">Restrict document visibility</p>
                      <p className="text-[10px] text-muted-foreground">Only show document files to assigned staff members.</p>
                    </div>
                    <div className="w-9 h-5 bg-muted rounded-full relative cursor-pointer"><span className="absolute left-0.5 top-0.5 bg-card w-4 h-4 rounded-full"></span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
