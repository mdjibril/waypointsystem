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
  attendance: number;
  taskCompletion: number;
  customerService: number;
  teamwork: number;
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

async function apiSaveReport(
  data: Partial<DailyReport>,
  status: "DRAFT" | "SUBMITTED"
): Promise<DailyReport | null> {
  try {
    const res = await fetch("/api/daily-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, status }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.report as DailyReport;
  } catch {
    return null;
  }
}

async function apiFetchTodayReport(
  userId: number,
  date: string
): Promise<DailyReport | null> {
  try {
    const res = await fetch(`/api/daily-reports?date=${date}`);
    if (!res.ok) return null;
    const json = await res.json();
    const reports: DailyReport[] = json.reports || [];
    return reports.find((r) => r.staffId === userId) || null;
  } catch {
    return null;
  }
}

function blankReport(user: any, date: string): DailyReport {
  return {
    date,
    staffId: user?.id || 0,
    staffName: user?.name || "",
    department: user?.department || "Operations",
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
    nextDayPlans: "",
    selfRating: { attendance: 0, taskCompletion: 0, customerService: 0, teamwork: 0 },
    teamLeadReview: "",
    supervisorComment: "",
    supervisorName: "",
    status: "DRAFT",
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

const SELF_LABELS: { key: keyof SelfRating; label: string }[] = [
  { key: "attendance", label: "Attendance & Punctuality" },
  { key: "taskCompletion", label: "Task Completion" },
  { key: "customerService", label: "Customer Service" },
  { key: "teamwork", label: "Teamwork" },
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

function AdminReportsOverview({ user }: { user: any }) {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [filterDate, setFilterDate] = useState(todayStr());
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<DailyReport | null>(null);
  const [supervisorComment, setSupervisorComment] = useState("");
  const [supervisorName, setSupervisorName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<DailyReport | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

  async function refresh(date: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/daily-reports?date=${date}`);
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

  useEffect(() => {
    refresh(filterDate);
  }, [filterDate]);

  function openReport(r: DailyReport) {
    setSelected(r);
    setSupervisorComment(r.supervisorComment || "");
    setSupervisorName(r.supervisorName || user?.name || "");
    setSaved(false);
  }

  async function handleReview() {
    if (!selected?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/daily-reports/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisorComment, supervisorName }),
      });
      if (res.ok) {
        const json = await res.json();
        setSaved(true);
        setSelected(json.report);
        refresh(filterDate);
      }
    } catch {
      // silently fail
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
        refresh(filterDate);
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

  if (selected) {
    return (
      <>
        <StaffReportView
          report={selected}
          supervisorComment={supervisorComment}
          setSupervisorComment={setSupervisorComment}
          supervisorName={supervisorName}
          setSupervisorName={setSupervisorName}
          onReview={handleReview}
          onBack={() => { setSelected(null); refresh(filterDate); }}
          saving={saving}
          saved={saved}
          isAdmin
          onDelete={() => setReportToDelete(selected)}
        />
        {deleteConfirmModal}
      </>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {deleteConfirmModal}

      {deleteSuccessMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{deleteSuccessMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">Staff Daily Reports</h3>
          <p className="text-xs text-muted-foreground">Review and acknowledge staff end-of-day submissions.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
          <button onClick={() => refresh(filterDate)} className="p-2 border border-border rounded-xl bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground mt-3">Loading reports…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-semibold text-destructive">{error}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No reports submitted for this date</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Staff reports will appear here once submitted.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => openReport(r)}
              className="text-left bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer relative group"
            >
              <div className="flex justify-between items-start gap-2 mb-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm uppercase shrink-0">
                  {r.staffName.slice(0, 2)}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    r.status === "REVIEWED"
                      ? "bg-green-500/10 text-green-600"
                      : r.status === "SUBMITTED"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {r.status}
                  </span>
                  <button
                    type="button"
                    title="Delete report"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReportToDelete(r);
                    }}
                    className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-bold text-foreground">{r.staffName}</p>
              <p className="text-[10px] text-muted-foreground">{r.position} · {r.department}</p>
              <div className="mt-3 flex gap-3 text-[10px] text-muted-foreground">
                <span>🕐 {r.reportingTime || "—"} – {r.closingTime || "—"}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
                <div className="bg-muted/50 rounded-lg p-1.5 text-center">
                  <p className="font-bold text-foreground">{r.clientsAttended || "0"}</p>
                  <p className="text-muted-foreground">Clients</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-1.5 text-center">
                  <p className="font-bold text-foreground">{r.visaApplications || "0"}</p>
                  <p className="text-muted-foreground">Visas</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-1.5 text-center">
                  <p className="font-bold text-foreground">₦{r.paymentsReceived || "0"}</p>
                  <p className="text-muted-foreground">Revenue</p>
                </div>
              </div>
            </button>
          ))}
        </div>
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
  onReview: () => void;
  onBack: () => void;
  saving: boolean;
  saved: boolean;
  isAdmin?: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-xs font-bold text-muted-foreground hover:text-foreground border border-border rounded-xl px-3 py-1.5 bg-card hover:bg-secondary transition-colors cursor-pointer">
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
            className="text-xs font-bold text-destructive hover:bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-1.5 transition-colors cursor-pointer flex items-center gap-1.5"
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

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Self Assessment</p>
        <div className="space-y-2">
          {SELF_LABELS.map(({ key, label }) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-xs text-foreground">{label}</span>
              <StarRating value={report.selfRating[key]} onChange={() => {}} disabled />
            </div>
          ))}
        </div>
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
    A: true, B: true, C: true, D: true, E: false, F: false, G: false, H: false, I: false,
  });

  useEffect(() => {
    if (!isAdmin && user?.id) {
      let isMounted = true;
      setLoadingInitial(true);
      apiFetchTodayReport(user.id, todayStr())
        .then((existing) => {
          if (!isMounted) return;
          if (existing) {
            setTodayReport(existing);
            setForm(existing);
            if (existing.status !== "DRAFT") setSubmitDone(true);
          } else {
            const fresh = blankReport(user, todayStr());
            fresh.reportingTime = nowTime();
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
    try {
      const saved = await apiSaveReport({ ...form, status: "DRAFT" }, "DRAFT");
      if (saved) {
        setTodayReport(saved);
        setForm(saved);
        setDraftSavedToast(true);
        setTimeout(() => setDraftSavedToast(false), 3000);
      } else {
        setErrorMessage("Failed to save draft. Please check your connection.");
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
    try {
      const submitted = await apiSaveReport(
        {
          ...form,
          closingTime: form.closingTime || nowTime(),
        },
        "SUBMITTED"
      );
      if (submitted) {
        setTodayReport(submitted);
        setForm(submitted);
        setSubmitDone(true);
      } else {
        setErrorMessage("Failed to submit report. Please try again.");
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
          onReview={() => {}}
          onBack={() => {
            setSubmitDone(false);
            setTodayReport(null);
            setForm(blankReport(user, todayStr()));
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">Daily Productivity Report</h3>
          <p className="text-xs text-muted-foreground">Way Point Travel Limited · {todayStr()}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="text-xs font-bold px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/10 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
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
            <input readOnly value={form.staffName} className={readonlyCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Department</label>
            <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Operations" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Position</label>
            <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="e.g. Visa Officer" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Date</label>
            <input readOnly value={form.date} className={readonlyCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Reporting Time</label>
            <input type="time" value={form.reportingTime} onChange={(e) => setForm({ ...form, reportingTime: e.target.value })} className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Closing Time</label>
            <input type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} className={inputCls} />
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
                      checked={task.isOffline}
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
                value={task.description}
                onChange={(e) => updateTask(i, "description", e.target.value)}
                placeholder="Task description (e.g. Processed UK visa for Mr. Adam)"
                className={inputCls}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  value={task.clientRef}
                  onChange={(e) => updateTask(i, "clientRef", e.target.value)}
                  placeholder="Client / Reference"
                  className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
                <select
                  value={task.status}
                  onChange={(e) => updateTask(i, "status", e.target.value)}
                  className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option>Completed</option>
                  <option>In Progress</option>
                  <option>Pending</option>
                  <option>Escalated</option>
                </select>
                <input
                  value={task.timeSpent}
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
                value={(form as any)[key]}
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
              value={form.dailyTarget}
              onChange={(e) => setForm({ ...form, dailyTarget: e.target.value })}
              placeholder="What was your target for today?"
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Actual Achievement</label>
            <textarea
              rows={3}
              value={form.actualAchievement}
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
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder="e.g. Mr. John — Very satisfied with the service"
                className={inputCls}
              />
            </div>
          ))}
          <div className="space-y-2">
            <label className={labelCls}>Overall Client Rating (1 Poor → 5 Excellent)</label>
            <StarRating value={form.clientRating} onChange={(v) => setForm({ ...form, clientRating: v })} />
          </div>
        </div>
      </Sec>

      {/* SECTION F */}
      <Sec letter="F" title="Challenges Faced Today" icon={AlertTriangle} isOpen={expandedSections.F} onToggle={() => toggleSection("F")}>
        <textarea
          rows={4}
          value={form.challenges}
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
              value={form.supportNeeded}
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
          value={form.nextDayPlans}
          onChange={(e) => setForm({ ...form, nextDayPlans: e.target.value })}
          placeholder={"1. Follow up on Mr. Adam's visa\n2. Submit documents for Mrs. Bello\n3. Call 10 new leads\n4. Complete pending applications"}
          className={`${inputCls} resize-none`}
        />
      </Sec>

      {/* SECTION I */}
      <Sec letter="I" title="Self Productivity Assessment" icon={Star} isOpen={expandedSections.I} onToggle={() => toggleSection("I")}>
        <p className="text-[10px] text-muted-foreground mb-3">Rate yourself honestly (1 = Poor, 5 = Excellent)</p>
        <div className="space-y-4">
          {SELF_LABELS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">{label}</span>
              <StarRating
                value={form.selfRating[key]}
                onChange={(v) => setForm({ ...form, selfRating: { ...form.selfRating, [key]: v } })}
              />
            </div>
          ))}
        </div>
      </Sec>

      {/* Sticky Submit bar */}
      <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-border py-3 flex justify-end gap-2 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving}
          className="text-xs font-bold px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Draft"}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="text-xs font-bold px-6 py-2.5 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/10 hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          {submitting ? "Submitting…" : "Submit to Management"}
        </button>
      </div>
    </form>
  );
}
