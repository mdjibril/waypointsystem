"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Star,
  AlertTriangle,
  UserCheck,
  BarChart2,
  MessageSquare,
  Target,
  CalendarDays,
  RefreshCw,
  Search,
  LayoutGrid,
  List,
  Eye,
  Clock,
  Users,
  Download,
  FileText,
  TrendingUp,
  Calendar,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  description: string;
  clientRef: string;
  status: "Completed" | "In Progress" | "Pending" | "Escalated";
  timeSpent: string;
  isOffline: boolean;
}

interface SelfRating {
  tatTaskCompletion: number;
  accuracyQuality: number;
  clientService: number;
  productivityOutput: number;
  teamworkCommunication: number;
  punctualityAttendance: number;
}

interface DailyReport {
  id?: number;
  date: string;
  staffId: number;
  staffName: string;
  department: string;
  position: string;
  reportingTime: string;
  closingTime: string;
  tasks: Task[];
  clientsAttended: string;
  visaApplications: string;
  flightBookings: string;
  hotelReservations: string;
  admissionApplications: string;
  customerCalls: string;
  newLeads: string;
  paymentsReceived: string;
  dailyTarget: string;
  actualAchievement: string;
  clientFeedback1: string;
  clientFeedback2: string;
  clientFeedback3: string;
  clientRating: number;
  challenges: string;
  supportNeeded: string;
  supportPriority: "High" | "Medium" | "Low" | "";
  tasksOverdue: string;
  reasonForOverdue: string;
  clientFollowUps: string;
  complaintsEscalations: string;
  nextDayPlans: string;
  selfRating: SelfRating;
  teamLeadReview: string;
  supervisorComment: string;
  supervisorName: string;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED";
  submittedAt?: string;
  reviewedAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Returns the Monday of the week containing `date`
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon…
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6); // Sunday
  return d;
}

function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function getMonthRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

function getYearRange(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

async function apiFetchRange(
  from: string,
  to: string,
  staffId?: number
): Promise<{ reports: DailyReport[]; summaries: StaffRangeSummary[] }> {
  try {
    const params = new URLSearchParams({ from, to });
    if (staffId) params.set("staffId", String(staffId));
    const res = await fetch(`/api/daily-reports/range?${params}`);
    if (!res.ok) return { reports: [], summaries: [] };
    return await res.json();
  } catch {
    return { reports: [], summaries: [] };
  }
}

interface StaffRangeSummary {
  staffId: number;
  staffName: string;
  department: string;
  position: string;
  totalClients: number;
  totalVisas: number;
  totalFlights: number;
  totalHotels: number;
  totalAdmissions: number;
  totalCalls: number;
  totalLeads: number;
  totalRevenue: number;
  daysReported: number;
  reviewedDays: number;
}

// ─── PDF Generator ─────────────────────────────────────────────────────────────

async function generateWeeklyPDF(
  staffSummary: StaffRangeSummary,
  weekReports: DailyReport[],
  weekLabel: string,
  companyName = "Way Point Travel Limited"
) {
  // jsPDF v4 exports named `jsPDF` or inside default object depending on bundler
  const jspdfMod = await import("jspdf");
  const JsPDF: any =
    (jspdfMod as any).jsPDF ||
    (jspdfMod as any).default?.jsPDF ||
    (typeof (jspdfMod as any).default === "function" ? (jspdfMod as any).default : null) ||
    jspdfMod;
  if (!JsPDF) throw new Error("jsPDF constructor not found");

  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const pageH = 297;
  const marginL = 14;
  const marginR = 14;
  const contentW = pageW - marginL - marginR;
  let y = 14;

  function checkPage(needed = 8) {
    if (y + needed > pageH - 14) {
      doc.addPage();
      y = 14;
    }
  }

  function sectionTitle(text: string) {
    checkPage(12);
    doc.setFillColor(99, 102, 241);
    doc.rect(marginL, y, contentW, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(text.toUpperCase(), marginL + 3, y + 5);
    doc.setTextColor(30, 30, 30);
    y += 10;
  }

  function row(label: string, value: string, shade = false) {
    checkPage(7);
    if (shade) {
      doc.setFillColor(248, 249, 250);
      doc.rect(marginL, y - 1, contentW, 7, "F");
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(label, marginL + 2, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(value, marginL + 60, y + 4);
    y += 7;
  }

  function safeFormatDate(dStr?: string) {
    if (!dStr) return "—";
    try {
      const d = new Date(dStr.includes("T") ? dStr : dStr + "T00:00:00");
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
      }
    } catch {}
    return dStr;
  }

  function formatMoney(val?: string | number) {
    if (val === undefined || val === null || val === "") return "₦0";
    const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.]/g, "")) || 0;
    return `₦${num.toLocaleString()}`;
  }

  function kpiScore(rating: any): string {
    if (!rating) return "—";
    const keys = ["tatTaskCompletion","accuracyQuality","clientService","productivityOutput","teamworkCommunication","punctualityAttendance"];
    const weights = [30,20,20,15,10,5];
    const total = keys.reduce((acc,k,i) => acc + ((rating[k]||0)/5)*weights[i], 0);
    return total.toFixed(1) + "%";
  }

  // ── HEADER ──────────────────────────────────────────────────────────────────
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageW, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, marginL, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Weekly Performance Report", marginL, 19);

  doc.setFontSize(8);
  doc.text(weekLabel, marginL, 25);

  // Generated date – right side
  const genDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  doc.setFontSize(7);
  doc.text(`Generated: ${genDate}`, pageW - marginR, 25, { align: "right" });

  doc.setTextColor(30, 30, 30);
  y = 35;

  // ── STAFF INFO ───────────────────────────────────────────────────────────────
  sectionTitle("Staff Information");
  row("Name", staffSummary.staffName, false);
  row("Department", staffSummary.department || "—", true);
  row("Position", staffSummary.position || "Staff", false);
  y += 4;

  // ── WEEKLY PERFORMANCE SUMMARY ───────────────────────────────────────────────
  sectionTitle("Weekly Performance Summary");

  const summaryItems = [
    ["Days Reported", String(staffSummary.daysReported)],
    ["Days Reviewed", String(staffSummary.reviewedDays)],
    ["Clients Attended", String(staffSummary.totalClients)],
    ["Visa Applications", String(staffSummary.totalVisas)],
    ["Flight Bookings", String(staffSummary.totalFlights)],
    ["Hotel Reservations", String(staffSummary.totalHotels)],
    ["Customer Calls", String(staffSummary.totalCalls)],
    ["New Leads", String(staffSummary.totalLeads)],
    ["Revenue Collected (₦)", formatMoney(staffSummary.totalRevenue)],
  ];
  summaryItems.forEach(([label, value], i) => row(label, value, i % 2 === 0));
  y += 4;

  // ── DAILY BREAKDOWN ──────────────────────────────────────────────────────────
  sectionTitle("Daily Breakdown");

  const colW = [22, 20, 78, 18, 18, 18];
  const headers = ["Date", "Hours", "Tasks", "Clients", "Visas", "Revenue"];
  const colX = [marginL, marginL+colW[0], marginL+colW[0]+colW[1], marginL+colW[0]+colW[1]+colW[2], marginL+colW[0]+colW[1]+colW[2]+colW[3], marginL+colW[0]+colW[1]+colW[2]+colW[3]+colW[4]];

  // header row
  doc.setFillColor(240, 240, 250);
  doc.rect(marginL, y - 1, contentW, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  headers.forEach((h, i) => doc.text(h, colX[i] + 1, y + 4));
  doc.setFont("helvetica", "normal");
  y += 7;

  if (weekReports.length === 0) {
    checkPage(8);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("No daily reports submitted for this week.", marginL + 2, y + 4);
    y += 8;
  } else {
    weekReports.forEach((r, idx) => {
      const tasks = (r.tasks || []).filter((t: any) => t.description);
      const taskLines = tasks.length > 0 ? tasks.map((t: any) => `• ${t.description}`) : ["(None)"];
      const lineH = 5;
      const rowH = Math.max(7, taskLines.length * lineH + 3);

      checkPage(rowH + 2);

      if (idx % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(marginL, y - 1, contentW, rowH, "F");
      }

      doc.setFontSize(7.5);
      doc.setTextColor(30, 30, 30);

      const dateStr = safeFormatDate(r.date);
      const hoursStr = r.reportingTime && r.closingTime ? `${r.reportingTime}–${r.closingTime}` : r.reportingTime || "—";
      const revenue = formatMoney(r.paymentsReceived);

      doc.text(dateStr, colX[0] + 1, y + 4);
      doc.text(hoursStr, colX[1] + 1, y + 4, { maxWidth: colW[1] - 2 });
      taskLines.forEach((tl, ti) => {
        doc.text(tl, colX[2] + 1, y + 4 + ti * lineH, { maxWidth: colW[2] - 2 });
      });
      doc.text(r.clientsAttended || "0", colX[3] + 1, y + 4);
      doc.text(r.visaApplications || "0", colX[4] + 1, y + 4);
      doc.text(revenue, colX[5] + 1, y + 4, { maxWidth: colW[5] - 2 });

      doc.setDrawColor(230, 230, 230);
      doc.line(marginL, y + rowH - 1, marginL + contentW, y + rowH - 1);

      y += rowH;
    });
  }
  y += 4;

  // ── KPI SCORECARD ────────────────────────────────────────────────────────────
  sectionTitle("KPI Scorecard (Weekly Average)");

  const kpiDefs = [
    { key: "tatTaskCompletion",     label: "TAT / Task Completion",    weight: 30 },
    { key: "accuracyQuality",       label: "Accuracy / Quality",       weight: 20 },
    { key: "clientService",         label: "Client Service",           weight: 20 },
    { key: "productivityOutput",    label: "Productivity / Output",    weight: 15 },
    { key: "teamworkCommunication", label: "Teamwork / Communication", weight: 10 },
    { key: "punctualityAttendance", label: "Punctuality / Attendance", weight:  5 },
  ];

  // table header
  doc.setFillColor(240, 240, 250);
  doc.rect(marginL, y - 1, contentW, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text("Category", marginL + 2, y + 4);
  doc.text("Weight", marginL + 90, y + 4);
  doc.text("Avg Score", marginL + 118, y + 4);
  doc.text("Weighted", marginL + 150, y + 4);
  y += 7;

  let totalWeighted = 0;
  kpiDefs.forEach(({ key, label, weight }, i) => {
    const reviewed = weekReports.filter((r: any) => r.selfRating?.[key] > 0);
    const avg = reviewed.length ? reviewed.reduce((a: any, r: any) => a + (r.selfRating[key] || 0), 0) / reviewed.length : 0;
    const weighted = (avg / 5) * weight;
    totalWeighted += weighted;

    checkPage(7);
    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(marginL, y - 1, contentW, 7, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);
    doc.text(label, marginL + 2, y + 4);
    doc.text(`${weight}%`, marginL + 90, y + 4);
    doc.text(avg > 0 ? `${avg.toFixed(1)}/5` : "—", marginL + 118, y + 4);
    doc.text(weighted > 0 ? `${weighted.toFixed(1)}%` : "—", marginL + 150, y + 4);
    y += 7;
  });

  // Total row
  checkPage(8);
  doc.setFillColor(99, 102, 241);
  doc.rect(marginL, y - 1, contentW, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("OVERALL KPI SCORE", marginL + 2, y + 5);
  doc.text(`${totalWeighted.toFixed(1)}%`, marginL + 150, y + 5);
  doc.setTextColor(30, 30, 30);
  y += 12;

  // ── SUPERVISOR FEEDBACK ──────────────────────────────────────────────────────
  const commented = weekReports.filter((r: any) => r.supervisorComment || r.supervisorName);
  if (commented.length > 0) {
    sectionTitle("Supervisor Feedback");
    commented.forEach((r: any, i) => {
      const dateStr = safeFormatDate(r.date);
      const comment = r.supervisorComment || "Acknowledged.";
      const lines = doc.splitTextToSize(comment, contentW - 6);
      const blockH = 6 + lines.length * 5;

      checkPage(blockH + 4);

      doc.setFillColor(248, 249, 250);
      doc.rect(marginL, y, contentW, blockH, "F");
      doc.setFillColor(99, 102, 241);
      doc.rect(marginL, y, 2, blockH, "F");

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text(dateStr, marginL + 4, y + 4);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 30, 30);
      lines.forEach((line: string, li: number) => {
        doc.text(line, marginL + 4, y + 9 + li * 5);
      });

      if (r.supervisorName) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(99, 102, 241);
        doc.setFontSize(7);
        doc.text(`— ${r.supervisorName}`, marginL + 4, y + 9 + lines.length * 5);
      }

      doc.setTextColor(30, 30, 30);
      y += blockH + 4;
    });
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(`${companyName} · Confidential · Generated by WayPoint System`, marginL, pageH - 4);
    doc.text(`Page ${p} of ${totalPages}`, pageW - marginR, pageH - 4, { align: "right" });
  }

  const safeName = staffSummary.staffName.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Weekly_Report_${safeName}_${weekLabel.replace(/[^a-zA-Z0-9\-]/g, "_")}.pdf`);
}



async function apiSaveReport(
  data: Partial<DailyReport>,
  status: "DRAFT" | "SUBMITTED"
): Promise<{ report: DailyReport | null; error?: string }> {
  try {
    const res = await fetch("/api/daily-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { report: null, error: json.error || `Server responded with error ${res.status}` };
    }
    return { report: json.report as DailyReport };
  } catch (err: any) {
    return { report: null, error: err?.message || "Network error. Please check your connection." };
  }
}

function getSavedDepartment(userId?: number): string {
  if (typeof window !== "undefined") {
    try {
      const userKey = userId ? localStorage.getItem(`waypoint_department_${userId}`) : null;
      if (userKey && (DEPARTMENTS as readonly string[]).includes(userKey)) return userKey;
      const generalKey = localStorage.getItem("waypoint_department");
      if (generalKey && (DEPARTMENTS as readonly string[]).includes(generalKey)) return generalKey;
    } catch {}
  }
  return "";
}

function saveDepartment(dept: string, userId?: number) {
  if (typeof window !== "undefined" && dept) {
    try {
      if (userId) localStorage.setItem(`waypoint_department_${userId}`, dept);
      localStorage.setItem("waypoint_department", dept);
    } catch {}
  }
}

async function apiFetchTodayReport(
  userId: number,
  date: string
): Promise<{ report: DailyReport | null; latestDepartment?: string }> {
  try {
    const res = await fetch(`/api/daily-reports?date=${date}`);
    if (!res.ok) return { report: null };
    const json = await res.json();
    const reports: DailyReport[] = json.reports || [];
    const report = reports.find((r) => r.staffId === userId) || null;
    return { report, latestDepartment: json.latestDepartment };
  } catch {
    return { report: null };
  }
}

function blankReport(user: any, date: string): DailyReport {
  const rememberedDept = getSavedDepartment(user?.id) || user?.department || "Operations";
  return {
    date,
    staffId: user?.id || 0,
    staffName: user?.name || "",
    department: rememberedDept,
    position: user?.position || user?.role || "Staff",
    reportingTime: "",
    closingTime: "",
    tasks: [
      { description: "", clientRef: "", status: "Completed", timeSpent: "", isOffline: false },
    ],
    clientsAttended: "",
    visaApplications: "",
    flightBookings: "",
    hotelReservations: "",
    admissionApplications: "",
    customerCalls: "",
    newLeads: "",
    paymentsReceived: "",
    dailyTarget: "",
    actualAchievement: "",
    clientFeedback1: "",
    clientFeedback2: "",
    clientFeedback3: "",
    clientRating: 0,
    challenges: "",
    supportNeeded: "",
    supportPriority: "",
    tasksOverdue: "",
    reasonForOverdue: "",
    clientFollowUps: "",
    complaintsEscalations: "",
    nextDayPlans: "",
    selfRating: { tatTaskCompletion: 0, accuracyQuality: 0, clientService: 0, productivityOutput: 0, teamworkCommunication: 0, punctualityAttendance: 0 },
    teamLeadReview: "",
    supervisorComment: "",
    supervisorName: "",
    status: "DRAFT",
  };
}

function normalizeReport(raw: any, user: any, date: string): DailyReport {
  const base = blankReport(user, date);
  if (!raw) return base;
  return {
    ...base,
    id: raw.id ?? undefined,
    date: raw.date ?? date,
    staffId: raw.staffId ?? base.staffId,
    staffName: raw.staffName ?? base.staffName,
    department: raw.department ?? base.department,
    position: raw.position ?? base.position,
    reportingTime: raw.reportingTime ?? "",
    closingTime: raw.closingTime ?? "",
    tasks: Array.isArray(raw.tasks) && raw.tasks.length > 0
      ? raw.tasks.map((t: any) => ({
          description: t?.description ?? "",
          clientRef: t?.clientRef ?? "",
          status: (t?.status ?? "Completed") as any,
          timeSpent: t?.timeSpent ?? "",
          isOffline: Boolean(t?.isOffline),
        }))
      : base.tasks,
    clientsAttended: raw.clientsAttended !== null && raw.clientsAttended !== undefined ? String(raw.clientsAttended) : "",
    visaApplications: raw.visaApplications !== null && raw.visaApplications !== undefined ? String(raw.visaApplications) : "",
    flightBookings: raw.flightBookings !== null && raw.flightBookings !== undefined ? String(raw.flightBookings) : "",
    hotelReservations: raw.hotelReservations !== null && raw.hotelReservations !== undefined ? String(raw.hotelReservations) : "",
    admissionApplications: raw.admissionApplications !== null && raw.admissionApplications !== undefined ? String(raw.admissionApplications) : "",
    customerCalls: raw.customerCalls !== null && raw.customerCalls !== undefined ? String(raw.customerCalls) : "",
    newLeads: raw.newLeads !== null && raw.newLeads !== undefined ? String(raw.newLeads) : "",
    paymentsReceived: raw.paymentsReceived !== null && raw.paymentsReceived !== undefined ? String(raw.paymentsReceived) : "",
    dailyTarget: raw.dailyTarget ?? "",
    actualAchievement: raw.actualAchievement ?? "",
    clientFeedback1: raw.clientFeedback1 ?? "",
    clientFeedback2: raw.clientFeedback2 ?? "",
    clientFeedback3: raw.clientFeedback3 ?? "",
    clientRating: Number(raw.clientRating) || 0,
    challenges: raw.challenges ?? "",
    supportNeeded: raw.supportNeeded ?? "",
    supportPriority: raw.supportPriority ?? "",
    tasksOverdue: raw.tasksOverdue ?? "",
    reasonForOverdue: raw.reasonForOverdue ?? "",
    clientFollowUps: raw.clientFollowUps ?? "",
    complaintsEscalations: raw.complaintsEscalations ?? "",
    nextDayPlans: raw.nextDayPlans ?? "",
    selfRating: {
      tatTaskCompletion: Number(raw.selfRating?.tatTaskCompletion) || 0,
      accuracyQuality: Number(raw.selfRating?.accuracyQuality) || 0,
      clientService: Number(raw.selfRating?.clientService) || 0,
      productivityOutput: Number(raw.selfRating?.productivityOutput) || 0,
      teamworkCommunication: Number(raw.selfRating?.teamworkCommunication) || 0,
      punctualityAttendance: Number(raw.selfRating?.punctualityAttendance) || 0,
    },
    teamLeadReview: raw.teamLeadReview ?? "",
    supervisorComment: raw.supervisorComment ?? "",
    supervisorName: raw.supervisorName ?? "",
    status: raw.status ?? "DRAFT",
    submittedAt: raw.submittedAt,
    reviewedAt: raw.reviewedAt,
  };
}

// ─── Star Rating Widget ───────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`transition-colors ${disabled ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          <Star
            className={`h-4 w-4 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Self Assessment labels ───────────────────────────────────────────────────

// ─── Company Departments ─────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Ticketing & Flights",
  "Visa Processing",
  "Customer Service",
  "Administration",
  "Admission Applications",
  "Marketing",
  "Operations",
] as const;

// ─── Self Assessment labels ───────────────────────────────────────────────────

const SELF_LABELS: { key: keyof SelfRating; label: string; weight: number; measurement: string }[] = [
  { key: "tatTaskCompletion",    label: "TAT / Task Completion",       weight: 30, measurement: "Assigned tasks completed within TAT" },
  { key: "accuracyQuality",      label: "Accuracy / Quality",          weight: 20, measurement: "Errors, omissions, rework and compliance" },
  { key: "clientService",        label: "Client Service",              weight: 20, measurement: "Response time, follow-up and complaint handling" },
  { key: "productivityOutput",   label: "Productivity / Output",       weight: 15, measurement: "Useful work completed and measurable results" },
  { key: "teamworkCommunication",label: "Teamwork / Communication",    weight: 10, measurement: "Handover, escalation and cooperation" },
  { key: "punctualityAttendance",label: "Punctuality / Attendance",    weight:  5, measurement: "Timeliness and attendance" },
];

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  letter,
  title,
  icon: Icon,
}: {
  letter: string;
  title: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="text-left">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
          Section {letter}
        </p>
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
      </div>
    </div>
  );
}

// ─── Admin Overview ───────────────────────────────────────────────────────────

type AdminPeriod = "daily" | "weekly" | "monthly" | "yearly";

function AdminReportsOverview({ user }: { user: any }) {
  const now = new Date();
  const currentMonthName = now.toLocaleDateString("en-US", { month: "long" });
  const currentMonthNum = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentMonthKey = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}`;

  // ── Period switcher
  const [period, setPeriod] = useState<AdminPeriod>("daily");
  const [filterDate, setFilterDate] = useState<string>("");

  // ── Reports view state
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<DailyReport | null>(null);
  const [supervisorComment, setSupervisorComment] = useState("");
  const [supervisorName, setSupervisorName] = useState(user?.name || "");
  const [adminKpiRating, setAdminKpiRating] = useState<SelfRating>({
    tatTaskCompletion: 0,
    accuracyQuality: 0,
    clientService: 0,
    productivityOutput: 0,
    teamworkCommunication: 0,
    punctualityAttendance: 0,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<DailyReport | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"CURRENT_MONTH" | "ALL" | "SUBMITTED" | "REVIEWED">("CURRENT_MONTH");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [reviewSuccessReport, setReviewSuccessReport] = useState<DailyReport | null>(null);

  // ── Weekly view state
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [weekReports, setWeekReports] = useState<DailyReport[]>([]);
  const [weekSummaries, setWeekSummaries] = useState<StaffRangeSummary[]>([]);
  const [weekLoading, setWeekLoading] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState<number | null>(null);

  // ── Monthly view state
  const [monthYear, setMonthYear] = useState(now.getFullYear());
  const [monthMonth, setMonthMonth] = useState(now.getMonth() + 1);
  const [monthSummaries, setMonthSummaries] = useState<StaffRangeSummary[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);

  // ── Yearly view state
  const [yearYear, setYearYear] = useState(now.getFullYear());
  const [yearSummaries, setYearSummaries] = useState<StaffRangeSummary[]>([]);
  const [yearLoading, setYearLoading] = useState(false);

  async function refreshDaily(date?: string) {
    setLoading(true);
    setError(null);
    try {
      const url = date
        ? `/api/daily-reports?date=${date}`
        : `/api/daily-reports?all=true`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setReports(json.reports || []);
      } else {
        setError("Failed to load reports.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshWeek(ws: Date) {
    setWeekLoading(true);
    const from = dateToStr(ws);
    const to = dateToStr(getWeekEnd(ws));
    const { reports: rs, summaries: ss } = await apiFetchRange(from, to);
    setWeekReports(rs);
    setWeekSummaries(ss);
    setWeekLoading(false);
  }

  async function refreshMonth(y: number, m: number) {
    setMonthLoading(true);
    const { from, to } = getMonthRange(y, m);
    const { summaries: ss } = await apiFetchRange(from, to);
    setMonthSummaries(ss);
    setMonthLoading(false);
  }

  async function refreshYear(y: number) {
    setYearLoading(true);
    const { from, to } = getYearRange(y);
    const { summaries: ss } = await apiFetchRange(from, to);
    setYearSummaries(ss);
    setYearLoading(false);
  }

  function reloadCurrentView() {
    if (period === "daily") refreshDaily(filterDate);
    else if (period === "weekly") refreshWeek(weekStart);
    else if (period === "monthly") refreshMonth(monthYear, monthMonth);
    else if (period === "yearly") refreshYear(yearYear);
  }

  useEffect(() => {
    if (period === "daily") refreshDaily(filterDate);
    else if (period === "weekly") refreshWeek(weekStart);
    else if (period === "monthly") refreshMonth(monthYear, monthMonth);
    else if (period === "yearly") refreshYear(yearYear);
  }, [period, filterDate, weekStart, monthYear, monthMonth, yearYear]);

  function openReport(r: DailyReport) {
    setSelected(r);
    setSupervisorComment(r.supervisorComment || "");
    setSupervisorName(r.supervisorName || user?.name || "");
    setAdminKpiRating(
      r.selfRating ?? {
        tatTaskCompletion: 0,
        accuracyQuality: 0,
        clientService: 0,
        productivityOutput: 0,
        teamworkCommunication: 0,
        punctualityAttendance: 0,
      }
    );
    setSaved(false);
    setReviewSuccessReport(null);
  }

  async function handleReview() {
    if (!selected?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/daily-reports/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisorComment, supervisorName, selfRating: adminKpiRating }),
      });
      if (res.ok) {
        const json = await res.json();
        const updated = json.report || selected;
        setSaved(true);
        setSelected(updated);
        reloadCurrentView();
        setReviewSuccessReport(updated);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.error || "Failed to submit review.");
      }
    } catch {
      alert("Network error while submitting review.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!reportToDelete?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/daily-reports/${reportToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selected?.id === reportToDelete.id) {
          setSelected(null);
        }
        setReportToDelete(null);
        setDeleteSuccessMsg("Report deleted successfully.");
        setTimeout(() => setDeleteSuccessMsg(null), 3500);
        reloadCurrentView();
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.error || "Failed to delete report.");
      }
    } catch {
      alert("Network error while deleting report.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownloadWeeklyPDF(summary: StaffRangeSummary) {
    setPdfDownloading(summary.staffId);
    try {
      const staffWeekReports = weekReports.filter(r => r.staffId === summary.staffId);
      const from = dateToStr(weekStart);
      const to = dateToStr(getWeekEnd(weekStart));
      const weekLabel = `${formatDateLong(from)} – ${formatDateLong(to)}`;
      await generateWeeklyPDF(summary, staffWeekReports, weekLabel);
    } catch (e) {
      console.error("PDF generation failed:", e);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfDownloading(null);
    }
  }

  // Summary Metrics
  const totalCount = reports.length;
  const currentMonthReports = reports.filter((r) => r.date?.startsWith(currentMonthKey));
  const currentMonthCount = currentMonthReports.length;
  const pendingReviewCount = reports.filter((r) => r.status === "SUBMITTED").length;
  const reviewedCount = reports.filter((r) => r.status === "REVIEWED").length;

  const totalClients = reports.reduce((acc, r) => acc + (parseInt(r.clientsAttended || "0", 10) || 0), 0);
  const totalVisas = reports.reduce((acc, r) => acc + (parseInt(r.visaApplications || "0", 10) || 0), 0);
  const totalCalls = reports.reduce((acc, r) => acc + (parseInt(r.customerCalls || "0", 10) || 0), 0);
  const totalRevenue = reports.reduce((acc, r) => {
    const num = parseFloat((r.paymentsReceived || "0").replace(/[^0-9.]/g, ""));
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.staffName.toLowerCase().includes(q) ||
      (r.department && r.department.toLowerCase().includes(q)) ||
      (r.position && r.position.toLowerCase().includes(q)) ||
      r.date?.includes(q);

    if (statusFilter === "CURRENT_MONTH") {
      return matchesSearch && r.date?.startsWith(currentMonthKey);
    }

    const matchesStatus =
      statusFilter === "ALL" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const deleteConfirmModal = reportToDelete && (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 text-destructive">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm">Delete Daily Report?</h4>
            <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Are you sure you want to permanently delete the daily report for{" "}
          <span className="font-semibold text-foreground">{reportToDelete.staffName}</span> on{" "}
          <span className="font-semibold text-foreground">{reportToDelete.date}</span>?
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={deleting}
            onClick={() => setReportToDelete(null)}
            className="text-xs font-bold px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={confirmDelete}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {deleting ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Delete Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const reviewSuccessModal = reviewSuccessReport && (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
        <div className="mx-auto h-12 w-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-600">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h4 className="font-bold text-foreground text-base">Reviewed Successfully!</h4>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            The daily report for <span className="font-semibold text-foreground">{reviewSuccessReport.staffName}</span> has been marked as reviewed and your feedback has been recorded.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setReviewSuccessReport(null);
            setSelected(null);
            reloadCurrentView();
          }}
          className="w-full bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          Okay
        </button>
      </div>
    </div>
  );

  if (selected) {
    return (
      <>
        <StaffReportView
          report={selected}
          supervisorComment={supervisorComment}
          setSupervisorComment={setSupervisorComment}
          supervisorName={supervisorName}
          setSupervisorName={setSupervisorName}
          kpiRating={adminKpiRating}
          onKpiChange={(key, v) => setAdminKpiRating((prev) => ({ ...prev, [key]: v }))}
          onReview={handleReview}
          onBack={() => { setSelected(null); reloadCurrentView(); }}
          saving={saving}
          saved={saved}
          isAdmin
          onDelete={() => setReportToDelete(selected)}
        />
        {deleteConfirmModal}
        {reviewSuccessModal}
      </>
    );
  }

  // ── Period labels
  const PERIOD_TABS: { id: AdminPeriod; label: string; icon: React.ElementType }[] = [
    { id: "daily",   label: "Daily",   icon: CalendarDays },
    { id: "weekly",  label: "Weekly",  icon: FileText },
    { id: "monthly", label: "Monthly", icon: Calendar },
    { id: "yearly",  label: "Yearly",  icon: TrendingUp },
  ];

  // Helper renderer for report cards/table
  const renderReportsListSection = (emptyConfig: { title: string; subtitle: string; actionText?: string; onAction?: () => void }) => (
    <div className="space-y-4">
      {/* Search, Filter Pills & View Switcher */}
      <div className="flex flex-col gap-3 bg-card border border-border rounded-2xl p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff name, department, date…"
              className="w-full bg-muted/20 border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>
          <div className="flex items-center bg-muted/30 p-1 rounded-xl border border-border/60 shrink-0">
            <button
              onClick={() => setViewMode("table")}
              title="Table view"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              title="Card grid view"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex items-center bg-muted/30 p-1 rounded-xl border border-border/60 w-max min-w-full">
            {(
              [
                { id: "CURRENT_MONTH", label: `Current Month (${currentMonthName}) (${currentMonthCount})` },
                { id: "ALL", label: `All (${totalCount})` },
                { id: "SUBMITTED", label: `Needs Review (${pendingReviewCount})` },
                { id: "REVIEWED", label: `Reviewed (${reviewedCount})` },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl">
          <span className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground mt-3">Loading reports…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-semibold text-destructive">{error}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-2xl p-6">
          <ClipboardCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-foreground">{emptyConfig.title}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">{emptyConfig.subtitle}</p>
          {emptyConfig.actionText && emptyConfig.onAction && (
            <button
              onClick={emptyConfig.onAction}
              className="mt-4 text-xs font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all cursor-pointer shadow-sm"
            >
              {emptyConfig.actionText}
            </button>
          )}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-2xl p-6">
          <Search className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm font-semibold text-foreground">No reports matching your criteria</p>
          <p className="text-xs text-muted-foreground mt-1">Try clearing your search query or status filter.</p>
          <button
            onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}
            className="mt-3 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-border bg-muted/25 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3 text-center">Tasks</th>
                  <th className="py-3 px-3 text-center">Clients</th>
                  <th className="py-3 px-3 text-center">Visas</th>
                  <th className="py-3 px-3 text-center">Calls</th>
                  <th className="py-3 px-3 text-right">Revenue</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {filteredReports.map((r) => {
                  const tasksCount = r.tasks?.filter((t) => t.description)?.length || 0;
                  return (
                    <tr key={r.id} onClick={() => openReport(r)} className="hover:bg-muted/30 transition-colors cursor-pointer group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs uppercase shrink-0">
                            {r.staffName.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-xs group-hover:text-primary transition-colors">{r.staffName}</p>
                            <p className="text-[10px] text-muted-foreground">{r.position || "Staff"} · {r.department || "Operations"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-[11px] whitespace-nowrap">
                        <div className="font-semibold text-foreground text-xs">{r.date}</div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{r.reportingTime || "—"} – {r.closingTime || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground">
                          {tasksCount} {tasksCount === 1 ? "task" : "tasks"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-foreground">{r.clientsAttended || "0"}</td>
                      <td className="py-3 px-3 text-center font-semibold text-foreground">{r.visaApplications || "0"}</td>
                      <td className="py-3 px-3 text-center font-semibold text-foreground">{r.customerCalls || "0"}</td>
                      <td className="py-3 px-3 text-right font-bold text-foreground">₦{r.paymentsReceived || "0"}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 ${
                          r.status === "REVIEWED" ? "bg-green-500/10 text-green-600 border border-green-500/20"
                          : r.status === "SUBMITTED" ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border"
                        }`}>
                          {r.status === "REVIEWED" && <CheckCircle2 className="h-3 w-3" />}
                          {r.status === "SUBMITTED" ? "Needs Review" : r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button type="button" onClick={() => openReport(r)}
                            className="text-xs font-bold px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {r.status === "SUBMITTED" ? "Review" : "View"}
                          </button>
                          <button type="button" title="Delete" onClick={() => setReportToDelete(r)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((r) => (
            <button key={r.id} onClick={() => openReport(r)}
              className="text-left bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer relative group">
              <div className="flex justify-between items-start gap-2 mb-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm uppercase shrink-0">
                  {r.staffName.slice(0, 2)}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    r.status === "REVIEWED" ? "bg-green-500/10 text-green-600"
                    : r.status === "SUBMITTED" ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                  }`}>{r.status === "SUBMITTED" ? "Needs Review" : r.status}</span>
                  <button type="button" title="Delete" onClick={(e) => { e.stopPropagation(); setReportToDelete(r); }}
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-bold text-foreground">{r.staffName}</p>
              <p className="text-[10px] text-muted-foreground">{r.position || "Staff"} · {r.department || "Operations"}</p>
              <div className="mt-3 flex gap-3 text-[10px] text-muted-foreground">
                <span className="font-semibold text-foreground">📅 {r.date}</span>
                <span>🕐 {r.reportingTime || "—"} – {r.closingTime || "—"}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
                <div className="bg-muted/50 rounded-lg p-1.5 text-center"><p className="font-bold text-foreground">{r.clientsAttended || "0"}</p><p className="text-muted-foreground">Clients</p></div>
                <div className="bg-muted/50 rounded-lg p-1.5 text-center"><p className="font-bold text-foreground">{r.visaApplications || "0"}</p><p className="text-muted-foreground">Visas</p></div>
                <div className="bg-muted/50 rounded-lg p-1.5 text-center"><p className="font-bold text-foreground">₦{r.paymentsReceived || "0"}</p><p className="text-muted-foreground">Revenue</p></div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {deleteConfirmModal}
      {reviewSuccessModal}

      {deleteSuccessMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{deleteSuccessMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-foreground">Staff Reports</h3>
          <p className="text-xs text-muted-foreground">Review, manage, and compile staff productivity reports.</p>
        </div>

        {/* Period switcher */}
        <div className="flex items-center bg-muted/30 p-1 rounded-xl border border-border/60 overflow-x-auto">
          {PERIOD_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPeriod(id)}
              className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                period === id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════ DAILY VIEW ════════════════════════ */}
      {period === "daily" && (
        <>
          {/* Daily KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Reports Logged</p>
                <ClipboardCheck className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-black text-foreground mt-2">{totalCount}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px]">
                {pendingReviewCount > 0 ? (
                  <span className="text-amber-500 font-semibold">{pendingReviewCount} pending review</span>
                ) : (
                  <span className="text-green-600 font-semibold">All reviewed</span>
                )}
                <span className="text-muted-foreground">· {reviewedCount} approved</span>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Clients Attended</p>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-black text-foreground mt-2">{totalClients}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{totalCalls} customer calls logged</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Visas Processed</p>
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-black text-foreground mt-2">{totalVisas}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Logged across staff</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Revenue Collected</p>
                <BarChart2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-foreground mt-2">₦{totalRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Payments recorded</p>
            </div>
          </div>

          {/* Date controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setFilterDate(""); refreshDaily(""); }}
              className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                !filterDate
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card border-border text-foreground hover:bg-secondary"
              }`}
            >
              All Dates
            </button>
            <button
              onClick={() => { setFilterDate(todayStr()); refreshDaily(todayStr()); }}
              className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                filterDate === todayStr()
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card border-border text-foreground hover:bg-secondary"
              }`}
            >
              Today
            </button>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); refreshDaily(e.target.value); }}
              className="bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground shadow-sm"
            />
            <button
              onClick={() => refreshDaily(filterDate)}
              title="Refresh reports"
              className="p-2 border border-border rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            </button>
          </div>

          {/* Reports List with Filter Pills (Current Month, All, Needs Review, Reviewed, Draft) */}
          {renderReportsListSection({
            title: filterDate ? `No reports submitted for ${filterDate}` : `No reports submitted yet`,
            subtitle: filterDate ? "Try selecting another date or click All Dates." : "Staff reports will appear here once saved or submitted.",
          })}
        </>
      )}

      {/* ════════════════════════ WEEKLY VIEW ════════════════════════ */}
      {period === "weekly" && (
        <>
          {/* Week Navigator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const prev = new Date(weekStart);
                  prev.setDate(prev.getDate() - 7);
                  setWeekStart(prev);
                }}
                className="p-2 border border-border rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                ←
              </button>
              <div className="bg-card border border-border rounded-xl px-4 py-2 text-xs font-bold text-foreground">
                {formatDateLong(dateToStr(weekStart))} – {formatDateLong(dateToStr(getWeekEnd(weekStart)))}
              </div>
              <button
                onClick={() => {
                  const next = new Date(weekStart);
                  next.setDate(next.getDate() + 7);
                  setWeekStart(next);
                }}
                className="p-2 border border-border rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                →
              </button>
              <button
                onClick={() => setWeekStart(getWeekStart(new Date()))}
                className="text-xs font-bold px-3 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground transition-all cursor-pointer"
              >
                This Week
              </button>
            </div>
            <button
              onClick={() => refreshWeek(weekStart)}
              className="p-2 border border-border rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${weekLoading ? "animate-spin text-primary" : ""}`} />
            </button>
          </div>

          {/* Context note */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-start gap-3">
            <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">Weekly Performance Reports</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Each Friday the company compiles the week's reports. Download a polished PDF per staff member using the button below each card.
              </p>
            </div>
          </div>

          {weekLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl">
              <span className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground mt-3">Loading weekly data…</p>
            </div>
          ) : weekSummaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-2xl p-6">
              <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-foreground">No reports found for this week</p>
              <p className="text-xs text-muted-foreground mt-1">Staff must submit daily reports during the week for them to appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {weekSummaries.map((s) => {
                const staffDailyReports = weekReports.filter(r => r.staffId === s.staffId);
                const isDownloading = pdfDownloading === s.staffId;
                return (
                  <div key={s.staffId} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 hover:border-primary/30 transition-colors">
                    {/* Staff header */}
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm uppercase shrink-0">
                        {s.staffName.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{s.staffName}</p>
                        <p className="text-[10px] text-muted-foreground">{s.position || "Staff"} · {s.department || "—"}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {s.daysReported} {s.daysReported === 1 ? "day" : "days"} reported · {s.reviewedDays} reviewed
                        </p>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {[
                        { label: "Clients",  value: s.totalClients },
                        { label: "Visas",    value: s.totalVisas },
                        { label: "Flights",  value: s.totalFlights },
                        { label: "Calls",    value: s.totalCalls },
                      ].map(m => (
                        <div key={m.label} className="bg-muted/40 rounded-lg p-2">
                          <p className="font-bold text-foreground text-sm">{m.value}</p>
                          <p className="text-muted-foreground">{m.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Revenue highlight */}
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Week Revenue</p>
                        <p className="text-base font-black text-emerald-600">₦{s.totalRevenue.toLocaleString()}</p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>

                    {/* Daily pills */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Days Submitted</p>
                      <div className="flex flex-wrap gap-1">
                        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, idx) => {
                          const dayDate = new Date(weekStart);
                          dayDate.setDate(dayDate.getDate() + idx);
                          const dayStr = dateToStr(dayDate);
                          const found = staffDailyReports.find(r => r.date === dayStr);
                          return (
                            <span key={d} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              !found ? "bg-muted text-muted-foreground/50"
                              : found.status === "REVIEWED" ? "bg-green-500/15 text-green-600"
                              : found.status === "SUBMITTED" ? "bg-primary/15 text-primary"
                              : "bg-amber-500/15 text-amber-600"
                            }`}>
                              {d}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Download PDF button */}
                    <button
                      onClick={() => handleDownloadWeeklyPDF(s)}
                      disabled={isDownloading}
                      className="w-full flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/10 hover:opacity-90 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {isDownloading ? (
                        <><span className="h-3.5 w-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Generating PDF…</>
                      ) : (
                        <><Download className="h-3.5 w-3.5" /> Download Weekly PDF</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════ MONTHLY VIEW ════════════════════════ */}
      {period === "monthly" && (
        <>
          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (monthMonth === 1) { setMonthYear(y => y - 1); setMonthMonth(12); }
                else setMonthMonth(m => m - 1);
              }}
              className="p-2 border border-border rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >←</button>
            <div className="bg-card border border-border rounded-xl px-4 py-2 text-xs font-bold text-foreground">
              {new Date(monthYear, monthMonth - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </div>
            <button
              onClick={() => {
                if (monthMonth === 12) { setMonthYear(y => y + 1); setMonthMonth(1); }
                else setMonthMonth(m => m + 1);
              }}
              className="p-2 border border-border rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >→</button>
            <button
              onClick={() => { setMonthYear(now.getFullYear()); setMonthMonth(now.getMonth() + 1); }}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground transition-all cursor-pointer"
            >This Month</button>
            <button onClick={() => refreshMonth(monthYear, monthMonth)}
              className="p-2 border border-border rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <RefreshCw className={`h-3.5 w-3.5 ${monthLoading ? "animate-spin text-primary" : ""}`} />
            </button>
          </div>

          {monthLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl">
              <span className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground mt-3">Loading monthly data…</p>
            </div>
          ) : monthSummaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-2xl p-6">
              <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-foreground">No reports for this month</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Monthly Aggregate — {monthSummaries.length} staff</p>
                <span className="text-xs text-muted-foreground">
                  Total revenue: <span className="font-bold text-foreground">₦{monthSummaries.reduce((a, s) => a + s.totalRevenue, 0).toLocaleString()}</span>
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/25 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-3 text-center">Days</th>
                      <th className="py-3 px-3 text-center">Clients</th>
                      <th className="py-3 px-3 text-center">Visas</th>
                      <th className="py-3 px-3 text-center">Flights</th>
                      <th className="py-3 px-3 text-center">Calls</th>
                      <th className="py-3 px-3 text-center">Leads</th>
                      <th className="py-3 px-3 text-right">Revenue</th>
                      <th className="py-3 px-3 text-center">Reviewed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs">
                    {monthSummaries.sort((a, b) => b.totalRevenue - a.totalRevenue).map((s) => (
                      <tr key={s.staffId} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-[10px] uppercase shrink-0">
                              {s.staffName.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-xs">{s.staffName}</p>
                              <p className="text-[10px] text-muted-foreground">{s.department || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-foreground">{s.daysReported}</td>
                        <td className="py-3 px-3 text-center font-semibold text-foreground">{s.totalClients}</td>
                        <td className="py-3 px-3 text-center font-semibold text-foreground">{s.totalVisas}</td>
                        <td className="py-3 px-3 text-center font-semibold text-foreground">{s.totalFlights}</td>
                        <td className="py-3 px-3 text-center font-semibold text-foreground">{s.totalCalls}</td>
                        <td className="py-3 px-3 text-center font-semibold text-foreground">{s.totalLeads}</td>
                        <td className="py-3 px-3 text-right font-bold text-foreground">₦{s.totalRevenue.toLocaleString()}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.reviewedDays === s.daysReported ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
                          }`}>{s.reviewedDays}/{s.daysReported}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/20 font-bold text-xs">
                      <td className="py-3 px-4 text-foreground">Totals</td>
                      <td className="py-3 px-3 text-center text-foreground">{monthSummaries.reduce((a, s) => a + s.daysReported, 0)}</td>
                      <td className="py-3 px-3 text-center text-foreground">{monthSummaries.reduce((a, s) => a + s.totalClients, 0)}</td>
                      <td className="py-3 px-3 text-center text-foreground">{monthSummaries.reduce((a, s) => a + s.totalVisas, 0)}</td>
                      <td className="py-3 px-3 text-center text-foreground">{monthSummaries.reduce((a, s) => a + s.totalFlights, 0)}</td>
                      <td className="py-3 px-3 text-center text-foreground">{monthSummaries.reduce((a, s) => a + s.totalCalls, 0)}</td>
                      <td className="py-3 px-3 text-center text-foreground">{monthSummaries.reduce((a, s) => a + s.totalLeads, 0)}</td>
                      <td className="py-3 px-3 text-right text-emerald-600">₦{monthSummaries.reduce((a, s) => a + s.totalRevenue, 0).toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════ YEARLY VIEW ════════════════════════ */}
      {period === "yearly" && (
        <>
          {/* Year Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setYearYear(y => y - 1)}
              className="p-2 border border-border rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >←</button>
            <div className="bg-card border border-border rounded-xl px-4 py-2 text-xs font-bold text-foreground">
              {yearYear}
            </div>
            <button
              onClick={() => setYearYear(y => y + 1)}
              className="p-2 border border-border rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >→</button>
            <button
              onClick={() => setYearYear(now.getFullYear())}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground transition-all cursor-pointer"
            >This Year</button>
            <button onClick={() => refreshYear(yearYear)}
              className="p-2 border border-border rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <RefreshCw className={`h-3.5 w-3.5 ${yearLoading ? "animate-spin text-primary" : ""}`} />
            </button>
          </div>

          {yearLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl">
              <span className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground mt-3">Loading yearly data…</p>
            </div>
          ) : yearSummaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-2xl p-6">
              <TrendingUp className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-foreground">No reports for {yearYear}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Yearly KPI Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Total Reports", value: yearSummaries.reduce((a,s) => a + s.daysReported, 0), icon: ClipboardCheck, color: "text-primary" },
                  { label: "Total Clients", value: yearSummaries.reduce((a,s) => a + s.totalClients, 0), icon: Users, color: "text-sky-500" },
                  { label: "Total Visas", value: yearSummaries.reduce((a,s) => a + s.totalVisas, 0), icon: CheckCircle2, color: "text-emerald-500" },
                  { label: "Total Revenue", value: `₦${yearSummaries.reduce((a,s) => a + s.totalRevenue, 0).toLocaleString()}`, icon: BarChart2, color: "text-amber-500" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <p className="text-2xl font-black text-foreground mt-2">{value}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{yearYear} total</p>
                  </div>
                ))}
              </div>

              {/* Per-staff yearly table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border">
                  <p className="text-sm font-bold text-foreground">Year {yearYear} — Per-Staff Breakdown ({yearSummaries.length} staff)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/25 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Staff Member</th>
                        <th className="py-3 px-3 text-center">Days</th>
                        <th className="py-3 px-3 text-center">Clients</th>
                        <th className="py-3 px-3 text-center">Visas</th>
                        <th className="py-3 px-3 text-center">Flights</th>
                        <th className="py-3 px-3 text-center">Calls</th>
                        <th className="py-3 px-3 text-center">Leads</th>
                        <th className="py-3 px-3 text-right">Revenue</th>
                        <th className="py-3 px-3 text-center">Reviewed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      {yearSummaries.sort((a, b) => b.totalRevenue - a.totalRevenue).map((s) => (
                        <tr key={s.staffId} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-[10px] uppercase shrink-0">
                                {s.staffName.slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-foreground text-xs">{s.staffName}</p>
                                <p className="text-[10px] text-muted-foreground">{s.department || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-foreground">{s.daysReported}</td>
                          <td className="py-3 px-3 text-center font-semibold text-foreground">{s.totalClients}</td>
                          <td className="py-3 px-3 text-center font-semibold text-foreground">{s.totalVisas}</td>
                          <td className="py-3 px-3 text-center font-semibold text-foreground">{s.totalFlights}</td>
                          <td className="py-3 px-3 text-center font-semibold text-foreground">{s.totalCalls}</td>
                          <td className="py-3 px-3 text-center font-semibold text-foreground">{s.totalLeads}</td>
                          <td className="py-3 px-3 text-right font-bold text-foreground">₦{s.totalRevenue.toLocaleString()}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              s.reviewedDays === s.daysReported ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
                            }`}>{s.reviewedDays}/{s.daysReported}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border bg-muted/20 font-bold text-xs">
                        <td className="py-3 px-4 text-foreground">Totals</td>
                        <td className="py-3 px-3 text-center text-foreground">{yearSummaries.reduce((a, s) => a + s.daysReported, 0)}</td>
                        <td className="py-3 px-3 text-center text-foreground">{yearSummaries.reduce((a, s) => a + s.totalClients, 0)}</td>
                        <td className="py-3 px-3 text-center text-foreground">{yearSummaries.reduce((a, s) => a + s.totalVisas, 0)}</td>
                        <td className="py-3 px-3 text-center text-foreground">{yearSummaries.reduce((a, s) => a + s.totalFlights, 0)}</td>
                        <td className="py-3 px-3 text-center text-foreground">{yearSummaries.reduce((a, s) => a + s.totalCalls, 0)}</td>
                        <td className="py-3 px-3 text-center text-foreground">{yearSummaries.reduce((a, s) => a + s.totalLeads, 0)}</td>
                        <td className="py-3 px-3 text-right text-emerald-600">₦{yearSummaries.reduce((a, s) => a + s.totalRevenue, 0).toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Read-Only / Admin Review View ────────────────────────────────────────────

function StaffReportView({
  report,
  supervisorComment,
  setSupervisorComment,
  supervisorName,
  setSupervisorName,
  kpiRating,
  onKpiChange,
  onReview,
  onBack,
  saving,
  saved,
  isAdmin,
  onDelete,
}: {
  report: DailyReport;
  supervisorComment: string;
  setSupervisorComment: (v: string) => void;
  supervisorName: string;
  setSupervisorName: (v: string) => void;
  kpiRating: SelfRating;
  onKpiChange: (key: keyof SelfRating, v: number) => void;
  onReview: () => void;
  onBack: () => void;
  saving: boolean;
  saved: boolean;
  isAdmin?: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-xs font-bold text-muted-foreground hover:text-foreground border border-border rounded-xl px-3 py-1.5 bg-card hover:bg-secondary transition-colors cursor-pointer shrink-0">
            ← Back
          </button>
          <div>
            <h3 className="text-base font-bold text-foreground">{report.staffName}&apos;s Daily Report</h3>
            <p className="text-xs text-muted-foreground">{report.date} · {report.status}</p>
          </div>
        </div>
        {isAdmin && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs font-bold text-destructive hover:bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-1.5 transition-colors cursor-pointer flex items-center gap-1.5 sm:self-auto self-start"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Report
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Clients Attended", value: report.clientsAttended || "0" },
          { label: "Visas Processed", value: report.visaApplications || "0" },
          { label: "Calls Made", value: report.customerCalls || "0" },
          { label: "Revenue (₦)", value: report.paymentsReceived || "0" },
        ].map((s) => (
          <div key={s.label} className="bg-muted/20 border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Tasks Completed</p>
        {report.tasks.filter((t) => t.description).map((t, i) => (
          <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">{t.description}</p>
              <p className="text-muted-foreground">
                {t.clientRef && `Client: ${t.clientRef} · `}Status: {t.status}{t.timeSpent && ` · Time: ${t.timeSpent}`}{t.isOffline && " · 🔌 Offline"}
              </p>
            </div>
          </div>
        ))}
        {report.tasks.filter((t) => t.description).length === 0 && (
          <p className="text-xs text-muted-foreground">No tasks logged.</p>
        )}
      </div>

      {/* Productivity Details */}
      {(report.tasksOverdue || report.reasonForOverdue || report.clientFollowUps || report.complaintsEscalations) && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Productivity Details</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Tasks Overdue</p>
              <p className="text-sm font-bold text-foreground">{report.tasksOverdue || "0"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Client Follow-ups Completed</p>
              <p className="text-sm font-bold text-foreground">{report.clientFollowUps || "0"}</p>
            </div>
          </div>
          {report.reasonForOverdue && (
            <div className="mb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Reason for Overdue Task</p>
              <p className="text-xs text-foreground whitespace-pre-wrap">{report.reasonForOverdue}</p>
            </div>
          )}
          {report.complaintsEscalations && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Complaints / Escalations</p>
              <p className="text-xs text-foreground whitespace-pre-wrap">{report.complaintsEscalations}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Challenges</p>
          <p className="text-xs text-foreground whitespace-pre-wrap">{report.challenges || "None reported."}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Support Needed
            {report.supportPriority && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                report.supportPriority === "High" ? "bg-red-500/10 text-red-500"
                : report.supportPriority === "Medium" ? "bg-amber-500/10 text-amber-600"
                : "bg-muted text-muted-foreground"
              }`}>{report.supportPriority}</span>
            )}
          </p>
          <p className="text-xs text-foreground whitespace-pre-wrap">{report.supportNeeded || "None."}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tomorrow&apos;s Plan</p>
        <p className="text-xs text-foreground whitespace-pre-wrap">{report.nextDayPlans || "Not specified."}</p>
      </div>



      {isAdmin && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 shadow-sm space-y-4">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">Supervisor Review (Section K)</p>
          {saved && (
            <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Review saved successfully.
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">Supervisor Name</label>
            <input
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">Supervisor Comment</label>
            <textarea
              rows={4}
              value={supervisorComment}
              onChange={(e) => setSupervisorComment(e.target.value)}
              placeholder="Leave your feedback, KPI score notes, or acknowledgement..."
              className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-none"
            />
          </div>

          {/* KPI Scorecard — filled by admin/supervisor */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">KPI Scorecard</label>
              <span className="text-[10px] text-muted-foreground">1 = Poor · 5 = Excellent</span>
            </div>
            <div className="bg-muted/10 border border-border/60 rounded-xl p-3 space-y-3">
              {SELF_LABELS.map(({ key, label, weight, measurement }) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{label}</span>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{weight}%</span>
                    </div>
                    <StarRating
                      value={kpiRating[key]}
                      onChange={(v) => onKpiChange(key, v)}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{measurement}</p>
                </div>
              ))}
              <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Weight</span>
                <span className="text-[10px] font-bold text-primary">100%</span>
              </div>
            </div>
          </div>

          <button
            onClick={onReview}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-primary/10 flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving
              ? <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              : <><CheckCircle2 className="h-3.5 w-3.5" /> Mark as Reviewed</>}
          </button>
        </div>
      )}

      {!isAdmin && report.status === "REVIEWED" && (
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Supervisor Feedback</p>
          <p className="text-xs font-semibold text-foreground">{report.supervisorName}</p>
          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{report.supervisorComment || "Acknowledged."}</p>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground";
const readonlyCls = "w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground cursor-not-allowed";
const labelCls = "text-[11px] font-bold text-muted-foreground uppercase";

// ─── Collapsible Section Component ───────────────────────────────────────────

function Sec({
  letter,
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  letter: string;
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <SectionHeader letter={letter} title={title} icon={icon} />
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-border/50 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function DailyReportTab({ user }: { user: any; staffUsers?: any[] }) {
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  const [todayReport, setTodayReport] = useState<DailyReport | null>(null);
  const [form, setForm] = useState<DailyReport>(blankReport(user, todayStr()));
  const [loadingInitial, setLoadingInitial] = useState(!isAdmin);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    A: true, B: true, C: true, D: true, E: false, F: false, G: false, H: false,
  });

  useEffect(() => {
    if (!isAdmin && user?.id) {
      let isMounted = true;
      setLoadingInitial(true);
      apiFetchTodayReport(user.id, todayStr())
        .then(({ report: existing, latestDepartment }) => {
          if (!isMounted) return;
          if (latestDepartment) {
            saveDepartment(latestDepartment, user.id);
          }
          if (existing) {
            if (existing.department) {
              saveDepartment(existing.department, user.id);
            }
            const normalized = normalizeReport(existing, user, todayStr());
            setTodayReport(normalized);
            setForm(normalized);
            if (existing.status !== "DRAFT") setSubmitDone(true);
          } else {
            const fresh = blankReport(user, todayStr());
            fresh.reportingTime = nowTime();
            const remembered = getSavedDepartment(user.id) || latestDepartment;
            if (remembered) {
              fresh.department = remembered;
            }
            setForm(fresh);
          }
        })
        .catch((err) => {
          console.error("Failed to load today's report:", err);
        })
        .finally(() => {
          if (isMounted) setLoadingInitial(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [user, isAdmin]);

  function toggleSection(s: string) {
    setExpandedSections((prev) => ({ ...prev, [s]: !prev[s] }));
  }

  function updateTask(i: number, field: keyof Task, value: string | boolean) {
    const tasks = [...form.tasks];
    tasks[i] = { ...tasks[i], [field]: value };
    setForm({ ...form, tasks });
  }

  function addTask() {
    if (form.tasks.length >= 5) return;
    setForm({
      ...form,
      tasks: [...form.tasks, { description: "", clientRef: "", status: "Completed", timeSpent: "", isOffline: false }],
    });
  }

  function removeTask(i: number) {
    const tasks = form.tasks.filter((_, idx) => idx !== i);
    setForm({ ...form, tasks });
  }

  async function handleSaveDraft() {
    setSaving(true);
    setErrorMessage(null);
    if (form.department) {
      saveDepartment(form.department, user?.id);
    }
    try {
      const res = await apiSaveReport({ ...form, status: "DRAFT" }, "DRAFT");
      if (res.report) {
        const normalized = normalizeReport(res.report, user, todayStr());
        setTodayReport(normalized);
        setForm(normalized);
        setDraftSavedToast(true);
        setTimeout(() => setDraftSavedToast(false), 3000);
      } else {
        setErrorMessage(res.error || "Failed to save draft. Please check your connection.");
      }
    } catch {
      setErrorMessage("Failed to save draft.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    if (form.department) {
      saveDepartment(form.department, user?.id);
    }
    try {
      const res = await apiSaveReport(
        {
          ...form,
          closingTime: form.closingTime || nowTime(),
        },
        "SUBMITTED"
      );
      if (res.report) {
        const normalized = normalizeReport(res.report, user, todayStr());
        setTodayReport(normalized);
        setForm(normalized);
        setSubmitDone(true);
      } else {
        setErrorMessage(res.error || "Failed to submit report. Please try again.");
      }
    } catch {
      setErrorMessage("Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isAdmin) {
    return <AdminReportsOverview user={user} />;
  }

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground mt-3">Loading daily report…</p>
      </div>
    );
  }

  if (submitDone && todayReport && todayReport.status !== "DRAFT") {
    return (
      <div className="max-w-3xl space-y-6 animate-in fade-in duration-200">
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 flex items-start gap-4">
          <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-foreground">Report Submitted Successfully</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your daily productivity report for {todayReport.date} has been sent to management.
            </p>
            {todayReport.status === "REVIEWED" && (
              <p className="text-xs text-green-600 font-semibold mt-1">✓ Reviewed by supervisor</p>
            )}
          </div>
        </div>
        <StaffReportView
          report={todayReport}
          supervisorComment={todayReport.supervisorComment}
          setSupervisorComment={() => {}}
          supervisorName={todayReport.supervisorName}
          setSupervisorName={() => {}}
          kpiRating={todayReport.selfRating ?? {
            tatTaskCompletion: 0, accuracyQuality: 0, clientService: 0,
            productivityOutput: 0, teamworkCommunication: 0, punctualityAttendance: 0,
          }}
          onKpiChange={() => {}}
          onReview={() => {}}
          onBack={() => {
            setSubmitDone(false);
            setTodayReport(null);
            const fresh = blankReport(user, todayStr());
            const remembered = getSavedDepartment(user?.id);
            if (remembered) fresh.department = remembered;
            setForm(fresh);
          }}
          saving={false}
          saved={false}
          isAdmin={false}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">Daily Productivity Report</h3>
          <p className="text-xs text-muted-foreground">Way Point Travel Limited · {todayStr()}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/10 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            {submitting ? "Submitting…" : "Submit to Management"}
          </button>
        </div>
      </div>

      {draftSavedToast && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Draft saved successfully. You can continue editing anytime today.</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SECTION A */}
      <Sec letter="A" title="Staff Details" icon={UserCheck} isOpen={expandedSections.A} onToggle={() => toggleSection("A")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelCls}>Full Name</label>
            <input readOnly value={form.staffName ?? ""} className={readonlyCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Department</label>
            <select
              value={form.department ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setForm({ ...form, department: val });
                saveDepartment(val, user?.id);
              }}
              className={inputCls}
            >
              <option value="">— Select Department —</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Position</label>
            <input value={form.position ?? ""} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="e.g. Visa Officer" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Date</label>
            <input readOnly value={form.date ?? ""} className={readonlyCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Reporting Time</label>
            <input type="time" value={form.reportingTime ?? ""} onChange={(e) => setForm({ ...form, reportingTime: e.target.value })} className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Closing Time</label>
            <input type="time" value={form.closingTime ?? ""} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} className={inputCls} />
          </div>
        </div>
      </Sec>

      {/* SECTION B */}
      <Sec letter="B" title="Daily Tasks Completed" icon={CheckCircle2} isOpen={expandedSections.B} onToggle={() => toggleSection("B")}>
        <div className="space-y-3">
          {form.tasks.map((task, i) => (
            <div key={i} className="border border-border/60 rounded-xl p-3 space-y-2 bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Task {i + 1}</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(task.isOffline)}
                      onChange={(e) => updateTask(i, "isOffline", e.target.checked)}
                      className="accent-primary"
                    />
                    Offline / External
                  </label>
                  {form.tasks.length > 1 && (
                    <button type="button" onClick={() => removeTask(i)} className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <input
                value={task.description ?? ""}
                onChange={(e) => updateTask(i, "description", e.target.value)}
                placeholder="Task description (e.g. Processed UK visa for Mr. Adam)"
                className={inputCls}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  value={task.clientRef ?? ""}
                  onChange={(e) => updateTask(i, "clientRef", e.target.value)}
                  placeholder="Client / Reference"
                  className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
                <select
                  value={task.status ?? "Completed"}
                  onChange={(e) => updateTask(i, "status", e.target.value)}
                  className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option>Completed</option>
                  <option>In Progress</option>
                  <option>Pending</option>
                  <option>Escalated</option>
                </select>
                <input
                  value={task.timeSpent ?? ""}
                  onChange={(e) => updateTask(i, "timeSpent", e.target.value)}
                  placeholder="Time spent (e.g. 2 hrs)"
                  className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
            </div>
          ))}
          {form.tasks.length < 5 && (
            <button type="button" onClick={addTask} className="flex items-center gap-2 text-xs font-bold text-primary hover:underline cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Add Task (max 5)
            </button>
          )}

          {/* Extra Productivity Fields */}
          <div className="border-t border-border/50 mt-4 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>Tasks Overdue</label>
              <input
                type="number"
                min="0"
                value={form.tasksOverdue ?? ""}
                onChange={(e) => setForm({ ...form, tasksOverdue: e.target.value })}
                placeholder="0"
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Client Follow-ups Completed</label>
              <input
                type="number"
                min="0"
                value={form.clientFollowUps ?? ""}
                onChange={(e) => setForm({ ...form, clientFollowUps: e.target.value })}
                placeholder="0"
                className={inputCls}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className={labelCls}>Reason for Overdue Task</label>
              <textarea
                rows={2}
                value={form.reasonForOverdue ?? ""}
                onChange={(e) => setForm({ ...form, reasonForOverdue: e.target.value })}
                placeholder="Explain why any task(s) were not completed on time..."
                className={`${inputCls} resize-none`}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className={labelCls}>Complaints / Escalations</label>
              <textarea
                rows={2}
                value={form.complaintsEscalations ?? ""}
                onChange={(e) => setForm({ ...form, complaintsEscalations: e.target.value })}
                placeholder="Any complaints received or issues escalated today..."
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        </div>
      </Sec>

      {/* SECTION C */}
      <Sec letter="C" title="Sales & Client Performance" icon={BarChart2} isOpen={expandedSections.C} onToggle={() => toggleSection("C")}>
        <p className="text-[10px] text-muted-foreground mb-3">Include both CRM-tracked and offline/external activities (digits only)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Clients Attended To", key: "clientsAttended" },
            { label: "Visa Applications", key: "visaApplications" },
            { label: "Flight Bookings", key: "flightBookings" },
            { label: "Hotel Reservations", key: "hotelReservations" },
            { label: "Admission Applications", key: "admissionApplications" },
            { label: "Customer Calls Made", key: "customerCalls" },
            { label: "New Leads Generated", key: "newLeads" },
            { label: "Payments Received (₦)", key: "paymentsReceived" },
          ].map(({ label, key }) => (
            <div key={key} className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">{label}</label>
              <input
                type="number"
                min="0"
                value={(form as any)[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder="0"
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </Sec>

      {/* SECTION D */}
      <Sec letter="D" title="Daily Target vs Achievement" icon={Target} isOpen={expandedSections.D} onToggle={() => toggleSection("D")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelCls}>Daily Target</label>
            <textarea
              rows={3}
              value={form.dailyTarget ?? ""}
              onChange={(e) => setForm({ ...form, dailyTarget: e.target.value })}
              placeholder="What was your target for today?"
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Actual Achievement</label>
            <textarea
              rows={3}
              value={form.actualAchievement ?? ""}
              onChange={(e) => setForm({ ...form, actualAchievement: e.target.value })}
              placeholder="What did you actually achieve?"
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
      </Sec>

      {/* SECTION E */}
      <Sec letter="E" title="Customer Feedback" icon={MessageSquare} isOpen={expandedSections.E} onToggle={() => toggleSection("E")}>
        <div className="space-y-3">
          {[
            { label: "Client Name & Feedback 1", key: "clientFeedback1" },
            { label: "Client Name & Feedback 2", key: "clientFeedback2" },
            { label: "Client Name & Feedback 3", key: "clientFeedback3" },
          ].map(({ label, key }) => (
            <div key={key} className="space-y-1">
              <label className={labelCls}>{label}</label>
              <input
                value={(form as any)[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder="e.g. Mr. John — Very satisfied with the service"
                className={inputCls}
              />
            </div>
          ))}
          <div className="space-y-2">
            <label className={labelCls}>Overall Client Rating (1 Poor → 5 Excellent)</label>
            <StarRating value={Number(form.clientRating) || 0} onChange={(v) => setForm({ ...form, clientRating: v })} />
          </div>
        </div>
      </Sec>

      {/* SECTION F */}
      <Sec letter="F" title="Challenges Faced Today" icon={AlertTriangle} isOpen={expandedSections.F} onToggle={() => toggleSection("F")}>
        <textarea
          rows={4}
          value={form.challenges ?? ""}
          onChange={(e) => setForm({ ...form, challenges: e.target.value })}
          placeholder="Describe any blockers, delays, or difficulties you faced today..."
          className={`${inputCls} resize-none`}
        />
      </Sec>

      {/* SECTION G */}
      <Sec letter="G" title="Support Needed from Management" icon={AlertTriangle} isOpen={expandedSections.G} onToggle={() => toggleSection("G")}>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className={labelCls}>What support do you need?</label>
            <textarea
              rows={3}
              value={form.supportNeeded ?? ""}
              onChange={(e) => setForm({ ...form, supportNeeded: e.target.value })}
              placeholder="Describe the support or resources you need from management..."
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Priority Level</label>
            <div className="flex gap-2">
              {(["High", "Medium", "Low"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, supportPriority: form.supportPriority === p ? "" : p })}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    form.supportPriority === p
                      ? p === "High" ? "bg-red-500 text-white border-red-500"
                        : p === "Medium" ? "bg-amber-500 text-white border-amber-500"
                        : "bg-muted text-foreground border-border"
                      : "bg-card border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Sec>

      {/* SECTION H */}
      <Sec letter="H" title="Tomorrow's Plan" icon={CalendarDays} isOpen={expandedSections.H} onToggle={() => toggleSection("H")}>
        <textarea
          rows={4}
          value={form.nextDayPlans ?? ""}
          onChange={(e) => setForm({ ...form, nextDayPlans: e.target.value })}
          placeholder={"1. Follow up on Mr. Adam's visa\n2. Submit documents for Mrs. Bello\n3. Call 10 new leads\n4. Complete pending applications"}
          className={`${inputCls} resize-none`}
        />
      </Sec>



      {/* Sticky Submit bar */}
      <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-border py-3 flex flex-col sm:flex-row justify-end gap-2 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving}
          className="text-xs font-bold px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary transition-all cursor-pointer disabled:opacity-50 sm:w-auto w-full"
        >
          {saving ? "Saving…" : "Save Draft"}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="text-xs font-bold px-6 py-2.5 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/10 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 sm:w-auto w-full"
        >
          <Send className="h-3.5 w-3.5" />
          {submitting ? "Submitting…" : "Submit to Management"}
        </button>
      </div>
    </form>
  );
}
