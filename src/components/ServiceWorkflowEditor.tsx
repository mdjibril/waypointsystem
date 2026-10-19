"use client";

import React, { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Route, Trash2 } from "lucide-react";
import { ServiceTypeOption, SERVICE_CATEGORY_LABELS } from "@/components/ClientServicesPanel";
import { ALL_STAGES, DECISION_STAGE, RouteBranch, RouteStep, STAGE_LABELS, validateRoute } from "@/lib/workflow";
import { WorkflowStage } from "@/types";

interface Draft {
  id: number | null;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  steps: RouteStep[];
}

const BRANCH_INFO: Record<RouteBranch, { title: string; hint: string }> = {
  MAIN: { title: "Main steps", hint: "Every client on this service goes through these in order." },
  APPROVED: { title: "If approved", hint: "Steps after a positive decision." },
  REFUSED: { title: "If refused", hint: "Steps after a refusal." },
};

const inputClass =
  "w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground";

const emptyDraft = (): Draft => ({
  id: null,
  name: "",
  description: "",
  category: "VISA",
  isActive: true,
  steps: [{ stage: "CLIENT_INQUIRY", branch: "MAIN" }],
});

export function ServiceWorkflowEditor() {
  const [services, setServices] = useState<ServiceTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [newStage, setNewStage] = useState<Record<RouteBranch, string>>({ MAIN: "", APPROVED: "", REFUSED: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const load = async (selectId?: number) => {
    try {
      const res = await fetch("/api/service-types?all=1");
      const data = await res.json();
      if (res.ok) {
        setServices(data.serviceTypes);
        const pick = data.serviceTypes.find((s: any) => s.id === selectId) ?? (selectId === undefined ? data.serviceTypes[0] : undefined);
        if (pick) selectService(pick);
      }
    } catch (err) {
      console.error("Failed to load service types:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectService = (s: ServiceTypeOption) => {
    setMessage(null);
    setDraft({
      id: s.id,
      name: s.name,
      description: s.description || "",
      category: s.category,
      isActive: s.isActive,
      steps: s.route.steps.map((st) => ({ ...st })),
    });
  };

  if (loading) {
    return (
      <div className="py-8 flex justify-center items-center">
        <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasDecision = !!draft?.steps.some((s) => s.branch === "MAIN" && s.stage === DECISION_STAGE);
  const errors = draft ? validateRoute({ steps: draft.steps }) : [];
  const usedStages = new Set(draft?.steps.map((s) => s.stage));
  const availableStages = ALL_STAGES.filter((s) => !usedStages.has(s));

  const updateSteps = (fn: (steps: RouteStep[]) => RouteStep[]) =>
    setDraft((d) => (d ? { ...d, steps: fn(d.steps) } : d));

  // Moves a step within its own branch
  const moveStep = (stage: WorkflowStage, direction: -1 | 1) =>
    updateSteps((steps) => {
      const step = steps.find((s) => s.stage === stage)!;
      const sameBranch = steps.filter((s) => s.branch === step.branch);
      const i = sameBranch.indexOf(step);
      const j = i + direction;
      if (j < 0 || j >= sameBranch.length) return steps;
      [sameBranch[i], sameBranch[j]] = [sameBranch[j], sameBranch[i]];
      return (["MAIN", "APPROVED", "REFUSED"] as RouteBranch[]).flatMap((b) =>
        b === step.branch ? sameBranch : steps.filter((s) => s.branch === b)
      );
    });

  const removeStep = (stage: WorkflowStage) =>
    updateSteps((steps) => {
      const remaining = steps.filter((s) => s.stage !== stage);
      // Removing the decision removes its outcome branches too
      return stage === DECISION_STAGE ? remaining.filter((s) => s.branch === "MAIN") : remaining;
    });

  const addStep = (branch: RouteBranch) => {
    const stage = newStage[branch] as WorkflowStage;
    if (!stage) return;
    updateSteps((steps) => {
      const of = (b: RouteBranch) => steps.filter((s) => s.branch === b);
      const added: RouteStep = { stage, branch, label: null };
      const main = of("MAIN");
      if (branch === "MAIN") {
        // The decision must stay the last main step, so new steps go before it
        const decisionIndex = main.findIndex((s) => s.stage === DECISION_STAGE);
        if (decisionIndex >= 0) main.splice(decisionIndex, 0, added);
        else main.push(added);
      }
      return [
        ...main,
        ...of("APPROVED"), ...(branch === "APPROVED" ? [added] : []),
        ...of("REFUSED"), ...(branch === "REFUSED" ? [added] : []),
      ];
    });
    setNewStage((n) => ({ ...n, [branch]: "" }));
  };

  const setLabel = (stage: WorkflowStage, label: string) =>
    updateSteps((steps) => steps.map((s) => (s.stage === stage ? { ...s, label } : s)));

  const handleSave = async () => {
    if (!draft || errors.length > 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const body = {
        name: draft.name,
        description: draft.description,
        category: draft.category,
        isActive: draft.isActive,
        route: { steps: draft.steps },
      };
      const res = await fetch(draft.id ? `/api/service-types/${draft.id}` : "/api/service-types", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to save" });
        return;
      }
      await load(data.serviceType.id);
      setMessage({ type: "ok", text: "Saved. New applications for this service will follow this route." });
    } catch {
      setMessage({ type: "error", text: "Connection error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const renderBranch = (branch: RouteBranch) => {
    const steps = draft!.steps.filter((s) => s.branch === branch);
    const options = availableStages.filter((s) => branch === "MAIN" || s !== DECISION_STAGE);
    return (
      <div key={branch} className="space-y-2">
        <div>
          <p className={`text-xs font-bold ${branch === "APPROVED" ? "text-green-600" : branch === "REFUSED" ? "text-amber-600" : "text-foreground"}`}>
            {BRANCH_INFO[branch].title}
          </p>
          <p className="text-[10px] text-muted-foreground">{BRANCH_INFO[branch].hint}</p>
        </div>
        <ol className="space-y-1.5">
          {steps.map((step, i) => (
            <li key={step.stage} className="flex items-center gap-2 p-2 bg-muted/20 border border-border rounded-xl">
              <span className="h-6 w-6 flex-shrink-0 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <input
                  value={step.label || ""}
                  onChange={(e) => setLabel(step.stage, e.target.value)}
                  placeholder={STAGE_LABELS[step.stage]}
                  className="w-full bg-transparent text-xs font-semibold text-foreground placeholder:text-foreground focus:outline-none focus:placeholder:text-muted-foreground"
                  aria-label={`Label for ${STAGE_LABELS[step.stage]}`}
                />
                {step.label && <p className="text-[9px] text-muted-foreground truncate">{STAGE_LABELS[step.stage]}</p>}
              </div>
              <button type="button" onClick={() => moveStep(step.stage, -1)} disabled={i === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer" aria-label="Move up">
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => moveStep(step.stage, 1)} disabled={i === steps.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer" aria-label="Move down">
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => removeStep(step.stage)} className="p-1 text-muted-foreground hover:text-red-500 cursor-pointer" aria-label="Remove step">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ol>
        <div className="flex gap-2">
          <select value={newStage[branch]} onChange={(e) => setNewStage((n) => ({ ...n, [branch]: e.target.value }))} className={inputClass}>
            <option value="">Add a step…</option>
            {options.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
          <button
            type="button"
            onClick={() => addStep(branch)}
            disabled={!newStage[branch]}
            className="bg-secondary text-foreground text-xs font-bold px-3 rounded-xl hover:opacity-90 cursor-pointer disabled:opacity-40 flex items-center gap-1 flex-shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h4 className="font-bold text-sm text-foreground mb-1 flex items-center gap-2">
        <Route className="h-4 w-4 text-primary" /> Service Workflows
      </h4>
      <p className="text-xs text-muted-foreground mb-4">
        Each service has its own route. Clients added to a service follow it step by step. Editing a route only affects services added after you save.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* Service list */}
        <div className="space-y-1">
          <button
            onClick={() => { setMessage(null); setDraft(emptyDraft()); }}
            className={`w-full text-left text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer ${draft && !draft.id ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary/10"}`}
          >
            <Plus className="h-3.5 w-3.5" /> New service
          </button>
          <div className="max-h-[480px] overflow-y-auto space-y-1">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => selectService(s)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs cursor-pointer ${draft?.id === s.id ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted/40"} ${!s.isActive ? "opacity-50" : ""}`}
              >
                {s.name}
                <span className="block text-[10px] font-normal text-muted-foreground">
                  {SERVICE_CATEGORY_LABELS[s.category] || s.category} · {s.route.steps.length} steps{!s.isActive ? " · inactive" : ""}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        {draft ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Service name</label>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  disabled={!!draft.id}
                  placeholder="e.g. Ireland Tourist Visa"
                  className={`${inputClass} disabled:opacity-60`}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Description</label>
                <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Category</label>
                <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inputClass}>
                  {Object.entries(SERVICE_CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground sm:mt-6 cursor-pointer">
                <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />
                Offered to new clients
              </label>
            </div>

            {renderBranch("MAIN")}
            {hasDecision && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {renderBranch("APPROVED")}
                {renderBranch("REFUSED")}
              </div>
            )}
            {!hasDecision && (
              <p className="text-[10px] text-muted-foreground">Add a “{STAGE_LABELS.DECISION}” step to the end of the main steps to give this service approved and refused outcomes.</p>
            )}

            {errors.length > 0 && (
              <ul className="text-xs text-destructive font-semibold space-y-0.5">
                {errors.map((e) => <li key={e}>• {e}</li>)}
              </ul>
            )}
            {message && (
              <p className={`text-xs font-semibold ${message.type === "ok" ? "text-green-600" : "text-destructive"}`}>{message.text}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || errors.length > 0 || !draft.name.trim()}
              className="bg-primary text-primary-foreground font-semibold rounded-xl px-5 py-2.5 text-xs hover:opacity-95 shadow-md shadow-primary/10 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving…" : draft.id ? "Save route" : "Create service"}
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Select a service to edit its route.</p>
        )}
      </div>
    </div>
  );
}
