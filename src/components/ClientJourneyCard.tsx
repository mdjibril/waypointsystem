"use client";

import React, { useState } from "react";
import { CheckCircle2, ChevronDown, Circle, Clock, XCircle } from "lucide-react";
import { WorkflowRoute, isTerminalStage, roadmapPath, stageLabel } from "@/lib/workflow";
import { WorkflowStage } from "@/types";

export interface ClientJourneyApplication {
  id: number;
  serviceType: string;
  destinationCountry: string;
  currentStage: string;
  status: string;
  decisionStatus: string | null;
  phase: number;
  createdAt: string;
  workflowRoute: WorkflowRoute;
  stageReachedAt: Record<string, string>;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Client-facing progress for one application. Shows only the route the client is on now and
// where they are on it — never the stage history, so staff moving a file back and forth
// doesn't show up as a list of moves.
export function ClientJourneyCard({ app }: { app: ClientJourneyApplication }) {
  const [open, setOpen] = useState(true);
  const route = app.workflowRoute;
  const { steps } = roadmapPath(route, app.currentStage);
  const currentIndex = steps.findIndex((s) => s.stage === app.currentStage);
  const finished = app.status === "COMPLETED" || (currentIndex >= 0 && isTerminalStage(app.currentStage as WorkflowStage, route));
  const denied = steps[currentIndex]?.branch === "REFUSED";
  const doneCount = currentIndex < 0 ? 0 : finished ? currentIndex + 1 : currentIndex;
  const progress = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const currentLabel = stageLabel(app.currentStage, route);

  const stateOf = (index: number): "completed" | "current" | "upcoming" => {
    if (currentIndex < 0) return "upcoming";
    if (index < currentIndex || (index === currentIndex && finished)) return "completed";
    return index === currentIndex ? "current" : "upcoming";
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            {app.phase > 1 && (
              <p className="text-[10px] font-bold uppercase tracking-wide text-primary mb-0.5">Stage {app.phase}</p>
            )}
            <h3 className="font-bold text-foreground text-base">{app.serviceType}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {app.destinationCountry} · Applied {formatDate(app.createdAt)}
            </p>
          </div>
          {denied ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-red-500/10 text-red-600 border border-red-500/20">
              <XCircle className="h-3 w-3" /> {currentLabel}
            </span>
          ) : finished ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
              <CheckCircle2 className="h-3 w-3" /> {steps[currentIndex]?.branch === "APPROVED" ? currentLabel : "Completed"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              <Clock className="h-3 w-3" /> {currentLabel}
            </span>
          )}
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1.5">
            <span>Overall Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${denied ? "bg-red-500" : finished ? "bg-green-500" : "bg-primary"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Journey */}
      <div className="px-6 py-4">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer mb-3"
        >
          {open ? "Hide" : "View"} Journey Progress
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div>
            {steps.map((step, idx) => {
              const state = stateOf(idx);
              const isLast = idx === steps.length - 1;
              const isDenied = state !== "upcoming" && step.branch === "REFUSED";
              const date = state !== "upcoming" ? app.stageReachedAt[step.stage] : undefined;
              return (
                <div key={step.stage} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mt-0.5 ${
                        isDenied
                          ? "bg-red-500 text-white"
                          : state === "completed"
                            ? "bg-green-500 text-white"
                            : state === "current"
                              ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                              : "bg-muted/30 border-2 border-border text-muted-foreground/40"
                      }`}
                    >
                      {isDenied ? (
                        <XCircle className="h-3.5 w-3.5" />
                      ) : state === "completed" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : state === "current" ? (
                        <Clock className="h-3 w-3" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 min-h-[20px] my-0.5 ${state === "completed" ? "bg-green-500/40" : "bg-border/40"}`} />
                    )}
                  </div>

                  <div className="pb-3">
                    <p
                      className={`text-xs font-semibold leading-tight mt-0.5 ${
                        isDenied ? "text-red-600" : state === "completed" ? "text-foreground" : state === "current" ? "text-primary" : "text-muted-foreground/50"
                      }`}
                    >
                      {step.label || stageLabel(step.stage, route)}
                      {state === "current" && (
                        <span className="ml-2 text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Current</span>
                      )}
                    </p>
                    {date && <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(date)}</p>}
                  </div>
                </div>
              );
            })}
            {denied && (
              <p className="text-xs text-muted-foreground mt-1">
                Please contact your assigned staff member for guidance on next steps and available options.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
