"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-96 bg-card border border-border rounded-2xl shadow-2xl shadow-foreground/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/icons/icon-192.png"
            alt=""
            className="h-10 w-10 rounded-xl border border-border"
          />
          <div>
            <h3 className="text-sm font-bold text-foreground">Install Way Point Travel</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add the app to your device for quick access.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleInstall}
          className="flex-1 bg-primary text-primary-foreground font-semibold rounded-xl py-2.5 text-sm hover:opacity-90 transition-all cursor-pointer"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="flex-1 bg-muted text-muted-foreground font-semibold rounded-xl py-2.5 text-sm hover:bg-muted/70 transition-all cursor-pointer"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
