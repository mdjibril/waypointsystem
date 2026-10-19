"use client";

import React from "react";
import { Check, Flag } from "lucide-react";
import { RouteStep, WorkflowRoute, branchSteps, isTerminalStage, roadmapPath, stageLabel } from "@/lib/workflow";
import { WorkflowStage } from "@/types";

interface HistoryEntry {
  fromStage: string | null;
  toStage: string;
  createdAt: string | Date;
}

interface ServiceRoadmapProps {
  route: WorkflowRoute;
  currentStage: string;
  status?: string;
  decisionStatus?: string | null;
  history?: HistoryEntry[];
}

const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

// When the application last arrived at a stage
function reachedAt(stage: string, history: HistoryEntry[]): string | Date | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i];
    if (h.toStage === stage && h.fromStage !== stage) return h.createdAt;
  }
  return null;
}

export function ServiceRoadmap({ route, currentStage, status, decisionStatus, history = [] }: ServiceRoadmapProps) {
  const { steps, awaitingDecision } = roadmapPath(route, currentStage);
  const currentIndex = steps.findIndex((s) => s.stage === currentStage);
  const finished = status === "COMPLETED" || (currentIndex >= 0 && isTerminalStage(currentStage as WorkflowStage, route));
  const doneCount = currentIndex < 0 ? 0 : finished ? currentIndex + 1 : currentIndex;
  const percent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const refused = steps.some((s) => s.branch === "REFUSED");
  const nextStep = currentIndex >= 0 && !finished ? steps[currentIndex + 1] : undefined;

  const stateOf = (index: number): "done" | "current" | "upcoming" => {
    if (currentIndex < 0) return "upcoming";
    if (index < currentIndex || (index === currentIndex && finished)) return "done";
    return index === currentIndex ? "current" : "upcoming";
  };

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <p className="text-xs font-semibold text-foreground">
            {currentIndex < 0
              ? "Current stage is not on this service's route"
              : finished
                ? refused ? "Service closed" : "All steps complete"
                : `Step ${currentIndex + 1} of ${steps.length}: ${stageLabel(currentStage, route)}`}
          </p>
          <span className="text-[11px] font-bold text-primary tabular-nums">{percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${refused ? "bg-amber-500" : "bg-primary"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        {nextStep && (
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Up next: <span className="font-semibold text-foreground">{stageLabel(nextStep.stage, route)}</span>
          </p>
        )}
      </div>

      {/* Stepper — scrolls sideways on small screens */}
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <ol className="flex min-w-max">
          {steps.map((step: RouteStep, index) => {
            const state = stateOf(index);
            const date = state !== "upcoming" ? reachedAt(step.stage, history) : null;
            const isOutcomeStart = step.branch !== "MAIN" && steps[index - 1]?.branch === "MAIN";
            return (
              <li key={step.stage} className="flex flex-col items-center w-24 relative">
                {/* connector to previous step */}
                {index > 0 && (
                  <span
                    className={`absolute top-3.5 right-1/2 w-full ${
                      isOutcomeStart && awaitingDecision
                        ? "border-t-2 border-dashed border-border"
                        : `h-0.5 ${state === "upcoming" ? "bg-border" : step.branch === "REFUSED" ? "bg-amber-500" : "bg-primary"}`
                    }`}
                  />
                )}
                <span
                  className={`relative z-10 h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 ${
                    state === "done"
                      ? step.branch === "REFUSED" ? "bg-amber-500 border-amber-500 text-white" : "bg-primary border-primary text-primary-foreground"
                      : state === "current"
                        ? "bg-card border-primary text-primary ring-4 ring-primary/15"
                        : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  {state === "done" ? <Check className="h-3.5 w-3.5" /> : index === steps.length - 1 ? <Flag className="h-3 w-3" /> : index + 1}
                </span>
                <span
                  className={`mt-2 text-[10px] leading-tight text-center px-1 ${
                    state === "current" ? "font-bold text-foreground" : state === "done" ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label || stageLabel(step.stage, route)}
                </span>
                {date && <span className="text-[9px] text-muted-foreground mt-0.5">{formatDate(date)}</span>}
                {isOutcomeStart && (
                  <span
                    className={`mt-1 text-[9px] font-bold uppercase tracking-wide ${
                      step.branch === "REFUSED" ? "text-amber-600" : awaitingDecision ? "text-muted-foreground" : "text-green-600"
                    }`}
                  >
                    {step.branch === "REFUSED" ? "Refused" : awaitingDecision ? (branchSteps(route, "APPROVED").length === 1 ? "Outcome" : "If approved") : decisionStatus === "APPROVED" ? "Approved" : "Approved path"}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
