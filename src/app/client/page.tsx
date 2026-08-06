"use client";

import React, { useState } from "react";
import {
  Search,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronDown,
} from "lucide-react";

interface ClientInfo {
  id: number;
  fileNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  applications: {
    id: number;
    serviceType: string;
    destinationCountry: string;
    currentStage: string;
    status: string;
    decisionStatus: string | null;
    createdAt: string;
    stageHistory: {
      id: number;
      toStage: string;
      fromStage: string | null;
      note: string | null;
      createdAt: string;
    }[];
  }[];
}

const STAGE_LABELS: Record<string, string> = {
  CLIENT_INQUIRY: "Client Inquiry",
  CUSTOMER_SERVICE_REGISTRATION: "Registration",
  INITIAL_CONSULTATION: "Initial Consultation",
  PAYMENT_SERVICE_AGREEMENT: "Payment & Agreement",
  DOCUMENT_COLLECTION_VERIFICATION: "Document Collection",
  VISA_PROCESSING: "Visa Processing",
  QUALITY_REVIEW: "Quality Review",
  APPLICATION_SUBMISSION: "Application Submission",
  APPLICATION_TRACKING: "Application Tracking",
  DECISION: "Decision",
  FLIGHT_BOOKING: "Flight Booking",
  PRE_DEPARTURE_BRIEFING: "Pre-Departure Briefing",
  CLIENT_TRAVELS: "Client Travels",
  FOLLOW_UP: "Follow-up & Testimonials",
  VISA_REFUSED_PATH: "Visa Refused",
};

export default function ClientPortal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedApp, setExpandedApp] = useState<number | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setClient(null);

    try {
      const res = await fetch(`/api/client-portal?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (res.ok && data.client) {
        setClient(data.client);
      } else {
        setError(data.error || "No client found matching that file number or email.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (client) {
    return (
      <div className="min-h-screen font-sans text-foreground">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/company-noBG.png" alt="Way Point Travel Limited" className="h-20 w-auto object-contain" />
          </div>
          <button
            onClick={() => { setClient(null); setSearchQuery(""); setError(null); }}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ← Look Up Another
          </button>
        </header>

        <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
          {/* Client Info Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-foreground">
              {client.firstName} {client.lastName}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">File Number</p>
                <p className="font-mono font-semibold text-primary">{client.fileNumber}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Email</p>
                <p className="font-semibold">{client.email}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Phone</p>
                <p className="font-semibold">{client.phone}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Applications</p>
                <p className="font-semibold">{client.applications.length}</p>
              </div>
            </div>
          </div>

          {/* Application Cards */}
          {client.applications.map((app) => (
            <div key={app.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-bold text-foreground">{app.serviceType}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{app.destinationCountry}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                    {STAGE_LABELS[app.currentStage] || app.currentStage}
                  </span>
                  {app.decisionStatus && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      app.decisionStatus === "APPROVED" ? "bg-green-500/10 text-green-600" :
                      app.decisionStatus === "REFUSED" ? "bg-red-500/10 text-red-600" :
                      "bg-yellow-500/10 text-yellow-600"
                    }`}>
                      {app.decisionStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1.5">
                  <span>Application Progress</span>
                  <span>
                    {app.status === "COMPLETED" ? "Completed" : "In Progress"}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      app.status === "COMPLETED" ? "bg-green-500" :
                      app.currentStage === "DECISION" ? "bg-primary" :
                      app.currentStage === "FLIGHT_BOOKING" || app.currentStage === "PRE_DEPARTURE_BRIEFING" ||
                      app.currentStage === "CLIENT_TRAVELS" || app.currentStage === "FOLLOW_UP"
                        ? "bg-green-500/80" :
                      app.currentStage === "VISA_REFUSED_PATH" ? "bg-red-500/80" :
                      "bg-primary/70"
                    }`}
                    style={{
                      width: app.status === "COMPLETED" ? "100%" :
                        app.currentStage === "CLIENT_INQUIRY" ? "7%" :
                        app.currentStage === "FOLLOW_UP" ? "100%" :
                        app.currentStage === "VISA_REFUSED_PATH" ? "85%" :
                        app.currentStage === "DECISION" ? "70%" : "50%"
                    }}
                  />
                </div>
              </div>

              {/* Stage History Toggle */}
              <div className="mt-4">
                <button
                  onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  {expandedApp === app.id ? "Hide" : "View"} Stage History
                  <ChevronDown className={`h-3 w-3 transition-transform ${expandedApp === app.id ? "rotate-180" : ""}`} />
                </button>
                {expandedApp === app.id && (
                  <div className="mt-3 space-y-2 border-l-2 border-border/60 pl-4 ml-1">
                    {app.stageHistory.map((h) => (
                      <div key={h.id} className="relative">
                        <div className="absolute -left-[23px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                        <p className="text-xs font-semibold text-foreground">
                          {h.fromStage
                            ? `${STAGE_LABELS[h.fromStage] || h.fromStage} → ${STAGE_LABELS[h.toStage] || h.toStage}`
                            : `Started: ${STAGE_LABELS[h.toStage] || h.toStage}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(h.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="text-center text-[11px] text-muted-foreground pb-8">
            <p>© {new Date().getFullYear()} Way Point Travel Limited. All rights reserved.</p>
            <p className="mt-1">For questions, contact your assigned staff member or our office.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <img src="/company-noBG.png" alt="Way Point Travel Limited" className="h-44 w-auto object-contain mx-auto" />
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-foreground text-center mb-1">Track Your Application</h2>
          <p className="text-xs text-muted-foreground text-center mb-6">
            Enter your file reference number or email to check your application status.
          </p>

          <form onSubmit={handleLookup} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="search">
                File Number or Email
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="WP-2026-0001 or client@email.com"
                  className="w-full bg-muted/20 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 text-sm hover:opacity-95 shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Look Up Application
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6">
          © {new Date().getFullYear()} Way Point Travel Limited
        </p>
      </div>
    </div>
  );
}
