"use client";

import React, { useState } from "react";
import {
  Search,
  ArrowRight,
} from "lucide-react";
import { ClientJourneyCard, ClientJourneyApplication } from "@/components/ClientJourneyCard";

interface ClientInfo {
  id: number;
  fileNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  applications: ClientJourneyApplication[];
}

export default function ClientPortal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            <ClientJourneyCard key={app.id} app={app} />
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
                  placeholder="WP-20260915-1427 or client@email.com"
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
