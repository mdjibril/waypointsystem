"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Briefcase, CheckCircle2, ChevronDown, Globe, Plus, Route, X } from "lucide-react";
import { ServiceRoadmap } from "@/components/ServiceRoadmap";
import { EmptyState } from "@/components/ui";
import { WorkflowRoute, branchSteps, combinedOutcomeLabel, isTerminalStage, routeHasDecision, stageLabel } from "@/lib/workflow";
import { WorkflowStage } from "@/types";

export interface ServiceTypeOption {
  id: number;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
  route: WorkflowRoute;
}

export const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  VISA: "Visa",
  CONSULTATION: "Consultation",
  RELOCATION: "Relocation",
  MEDICAL: "Medical",
  TRAVEL: "Travel",
  STUDY: "Study",
};

const TRAVEL_PURPOSES = ["Tourism", "Business", "Study", "Work", "Family Visit", "Medical", "Relocation", "Transit", "Other"];

const STATUS_STYLES: Record<string, string> = {
  NOT_STARTED: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-primary/10 text-primary",
  BLOCKED: "bg-red-500/10 text-red-600",
  WAITING_FOR_CLIENT: "bg-amber-500/10 text-amber-600",
  COMPLETED: "bg-green-500/10 text-green-600",
};

const inputClass =
  "w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground";

const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Short preview of a route: its steps in order, ending with the decision outcome if it has one
export function RoutePreview({ route }: { route: WorkflowRoute }) {
  const main = branchSteps(route, "MAIN");
  const outcome = routeHasDecision(route) ? combinedOutcomeLabel(route) : null;
  const labels = [...main.map((s) => stageLabel(s, route)), ...(outcome ? [outcome] : [])];
  return (
    <div className="flex flex-wrap items-center gap-1">
      {labels.map((label, i) => (
        <React.Fragment key={label + i}>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">{label}</span>
          {i < labels.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
        </React.Fragment>
      ))}
    </div>
  );
}

// Lets the user pick one of the offered services and shows the route it will put the client on
function ServicePicker({ services, value, onChange }: { services: ServiceTypeOption[]; value: number | null; onChange: (id: number) => void }) {
  const selected = services.find((s) => s.id === value);
  if (services.length === 0) return <p className="text-xs text-muted-foreground">Loading services…</p>;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {services.map((s) => (
          <button
            type="button"
            key={s.id}
            onClick={() => onChange(s.id)}
            className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
              value === s.id ? "border-primary bg-card ring-2 ring-primary/20" : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <p className="text-xs font-bold text-foreground">{s.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {branchSteps(s.route, "MAIN").length + (routeHasDecision(s.route) ? 1 : 0)} steps
            </p>
          </button>
        ))}
      </div>
      {selected && (
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Route for {selected.name}</p>
          <RoutePreview route={selected.route} />
        </div>
      )}
    </div>
  );
}

interface ClientServicesPanelProps {
  clientId: number;
  canAddService: boolean;
  staffUsers: { id: number; name: string; role: string }[];
  defaultStaffId?: number | null;
  onOpenApplication: (applicationId: number) => void;
  onServiceAdded?: () => void;
}

export function ClientServicesPanel({ clientId, canAddService, staffUsers, defaultStaffId, onOpenApplication, onServiceAdded }: ClientServicesPanelProps) {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>([]);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  // New application form
  const [adding, setAdding] = useState(false);
  const [serviceTypeId, setServiceTypeId] = useState<number | null>(null);
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [staffId, setStaffId] = useState("");

  // Next service on an existing application
  const [nextFor, setNextFor] = useState<number | null>(null);
  const [nextServiceId, setNextServiceId] = useState<number | null>(null);

  // Moving an application off the old 15-stage route onto a service
  const [switchFor, setSwitchFor] = useState<number | null>(null);
  const [switchServiceId, setSwitchServiceId] = useState<number | null>(null);
  const [switchStage, setSwitchStage] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/services`);
      const data = await res.json();
      if (res.ok) setApplications(data.services);
    } catch (err) {
      console.error("Failed to load client services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setAdding(false);
    setNextFor(null);
    loadApplications();
  }, [clientId]);

  const ensureServiceTypes = async () => {
    if (serviceTypes.length > 0) return;
    try {
      const res = await fetch("/api/service-types");
      const data = await res.json();
      if (res.ok) setServiceTypes(data.serviceTypes);
    } catch (err) {
      console.error("Failed to load service types:", err);
    }
  };

  const openAddForm = () => {
    setAdding(true);
    setNextFor(null);
    setError(null);
    setServiceTypeId(null);
    setDestination("");
    setPurpose("");
    setTravelDate("");
    setStaffId(defaultStaffId ? String(defaultStaffId) : "");
    ensureServiceTypes();
  };

  const openSwitch = (applicationId: number) => {
    setSwitchFor(applicationId);
    setNextFor(null);
    setAdding(false);
    setError(null);
    setSwitchServiceId(null);
    setSwitchStage("");
    ensureServiceTypes();
  };

  const openNextService = (applicationId: number) => {
    setNextFor(applicationId);
    setSwitchFor(null);
    setAdding(false);
    setError(null);
    setNextServiceId(null);
    ensureServiceTypes();
  };

  const submit = async (url: string, body: object) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add service");
        return;
      }
      setAdding(false);
      setNextFor(null);
      setSwitchFor(null);
      await loadApplications();
      onServiceAdded?.();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceTypeId) return setError("Choose a service first.");
    submit("/api/applications", {
      clientId,
      serviceTypeId,
      destinationCountry: destination,
      travelPurpose: purpose,
      expectedTravelDate: travelDate || undefined,
      assignedStaffId: staffId ? Number(staffId) : undefined,
    });
  };

  const isFinished = (app: any) =>
    app.status === "COMPLETED" || isTerminalStage(app.currentStage as WorkflowStage, app.workflowRoute);

  const selectedType = serviceTypes.find((s) => s.id === serviceTypeId);
  const nextType = serviceTypes.find((s) => s.id === nextServiceId);
  const switchType = serviceTypes.find((s) => s.id === switchServiceId);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Route className="h-4 w-4 text-primary" /> Services &amp; Progress
        </h4>
        {canAddService && !adding && (
          <button
            onClick={openAddForm}
            className="bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl shadow-md shadow-primary/10 hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> New Application
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="mb-6 border border-primary/30 bg-primary/5 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-foreground">Which service does this client need?</p>
            <button type="button" onClick={() => setAdding(false)} className="text-muted-foreground hover:text-foreground cursor-pointer" aria-label="Cancel">
              <X className="h-4 w-4" />
            </button>
          </div>

          <ServicePicker services={serviceTypes} value={serviceTypeId} onChange={setServiceTypeId} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Destination Country *</label>
              <input required value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="United Kingdom" className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Purpose *</label>
              <select required value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputClass}>
                <option value="">Select purpose...</option>
                {TRAVEL_PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Expected Travel Date</label>
              <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Assign Staff</label>
              <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className={inputClass}>
                <option value="">Unassigned</option>
                {staffUsers.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={saving || !serviceTypeId}
            className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-2.5 text-xs hover:opacity-95 shadow-md shadow-primary/10 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? "Starting…" : selectedType ? `Start ${selectedType.name}` : "Choose a service"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-8 flex justify-center items-center">
          <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title="No applications yet"
          description={canAddService ? "Start an application and choose the service the client needs." : "Applications for this client will show here."}
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Stage {app.phase}</p>
                  <p className="text-sm font-bold text-foreground">{app.serviceType}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Globe className="h-3 w-3" /> {app.destinationCountry} · {app.travelPurpose}
                    {app.assignedStaff?.name ? ` · ${app.assignedStaff.name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${STATUS_STYLES[app.status] || STATUS_STYLES.NOT_STARTED}`}>
                    {String(app.status).replace(/_/g, " ")}
                  </span>
                  <button
                    onClick={() => onOpenApplication(app.id)}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Open <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <ServiceRoadmap
                route={app.workflowRoute}
                currentStage={app.currentStage}
                status={app.status}
                decisionStatus={app.decisionStatus}
                history={app.stageHistory}
              />

              {/* Old 15-stage applications can be moved onto a service's route */}
              {app.isLegacyRoute && (
                <div className="mt-4 bg-amber-500/5 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-xs font-bold text-foreground">This application is on the old 15-stage route</p>
                      <p className="text-[11px] text-muted-foreground">It was created before service workflows. Move it to one of the services to continue on that service&apos;s route.</p>
                    </div>
                    {canAddService && switchFor !== app.id && (
                      <button
                        onClick={() => openSwitch(app.id)}
                        className="bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl hover:opacity-90 cursor-pointer flex-shrink-0"
                      >
                        Move to a service
                      </button>
                    )}
                  </div>
                  {switchFor === app.id && (
                    <div className="space-y-3">
                      <ServicePicker services={serviceTypes} value={switchServiceId} onChange={(id) => { setSwitchServiceId(id); setSwitchStage(""); }} />
                      {switchType && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground uppercase">Which step is the client at now? *</label>
                          <select value={switchStage} onChange={(e) => setSwitchStage(e.target.value)} className={inputClass}>
                            <option value="">Select a step...</option>
                            {switchType.route.steps.map((step) => (
                              <option key={step.stage} value={step.stage}>
                                {stageLabel(step.stage, switchType.route)}
                                {step.branch === "APPROVED" ? " (decision: approved)" : step.branch === "REFUSED" ? " (decision: refused)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={() => switchServiceId && switchStage && submit(`/api/applications/${app.id}/switch-service`, { serviceTypeId: switchServiceId, stage: switchStage })}
                          disabled={saving || !switchServiceId || !switchStage}
                          className="flex-1 bg-primary text-primary-foreground font-semibold rounded-xl py-2.5 text-xs hover:opacity-95 cursor-pointer disabled:opacity-50"
                        >
                          {saving ? "Moving…" : switchType ? `Move to ${switchType.name}` : "Choose a service"}
                        </button>
                        <button onClick={() => setSwitchFor(null)} className="px-4 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Next service: available once this route is finished */}
              {canAddService && !app.isLegacyRoute && !isFinished(app) && (
                <div
                  className="mt-4 w-full border border-dashed border-border text-muted-foreground text-xs font-bold py-2.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-not-allowed"
                  title="Finish the current route first"
                >
                  <span className="flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Add next service (Stage {app.phase + 1})</span>
                  <span className="text-[10px] font-normal">Available once {app.serviceType} reaches its last step</span>
                </div>
              )}
              {canAddService && isFinished(app) && nextFor !== app.id && (
                <button
                  onClick={() => openNextService(app.id)}
                  className="mt-4 w-full border border-dashed border-primary/40 text-primary text-xs font-bold py-2.5 rounded-xl hover:bg-primary/5 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add next service (Stage {app.phase + 1})
                </button>
              )}
              {nextFor === app.id && (
                <div className="mt-4 border border-primary/30 bg-primary/5 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">Stage {app.phase + 1}: which service comes next?</p>
                    <button type="button" onClick={() => setNextFor(null)} className="text-muted-foreground hover:text-foreground cursor-pointer" aria-label="Cancel">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <ServicePicker services={serviceTypes} value={nextServiceId} onChange={setNextServiceId} />
                  {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
                  <button
                    onClick={() => nextServiceId && submit(`/api/applications/${app.id}/services`, { serviceTypeId: nextServiceId })}
                    disabled={saving || !nextServiceId}
                    className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-2.5 text-xs hover:opacity-95 shadow-md shadow-primary/10 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {saving ? "Starting…" : nextType ? `Start Stage ${app.phase + 1}: ${nextType.name}` : "Choose a service"}
                  </button>
                </div>
              )}

              {/* Finished stages */}
              {app.completedPhases?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Completed stages</p>
                  {[...app.completedPhases].reverse().map((phase: any) => {
                    const key = `${app.id}-${phase.phase}`;
                    const open = expandedPhase === key;
                    return (
                      <div key={key} className="bg-muted/20 rounded-xl">
                        <button
                          onClick={() => setExpandedPhase(open ? null : key)}
                          className="w-full flex items-center justify-between gap-3 p-3 text-left cursor-pointer"
                        >
                          <span className="flex items-center gap-2 text-xs">
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="font-bold text-foreground">Stage {phase.phase} · {phase.serviceType}</span>
                            <span className="text-muted-foreground">
                              {stageLabel(phase.finalStage, phase.workflowRoute)} · {formatDate(phase.completedAt)}
                            </span>
                          </span>
                          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                        {open && (
                          <div className="px-3 pb-3">
                            <ServiceRoadmap
                              route={phase.workflowRoute}
                              currentStage={phase.finalStage}
                              status="COMPLETED"
                              decisionStatus={phase.decisionStatus}
                              history={phase.stageHistory}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
