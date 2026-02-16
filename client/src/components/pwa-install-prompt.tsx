import { useState, useEffect, useRef, useCallback } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function getPlatform(): string {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Windows/.test(ua)) return "windows";
  if (/Mac/.test(ua)) return "macos";
  if (/Linux/.test(ua)) return "linux";
  return "unknown";
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;
}

export function PwaInstallPrompt() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const platform = getPlatform();
  const isIos = platform === "ios";

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!user || dismissed || isStandalone()) return;
    const alreadyDismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (alreadyDismissed) return;

    timerRef.current = setTimeout(() => {
      if (!isStandalone()) {
        setShow(true);
      }
    }, 60000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, dismissed]);

  const recordInstall = useCallback(async () => {
    try {
      await fetch("/api/pwa-install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          platform: getPlatform(),
          userAgent: navigator.userAgent,
        }),
      });
    } catch {}
  }, []);

  const handleInstall = async () => {
    if (deferredPromptRef.current) {
      await deferredPromptRef.current.prompt();
      const result = await deferredPromptRef.current.userChoice;
      if (result.outcome === "accepted") {
        await recordInstall();
      }
      deferredPromptRef.current = null;
    }
    handleDismiss();
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  useEffect(() => {
    const handler = () => {
      recordInstall();
    };
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, [recordInstall]);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-[9999] max-w-md mx-auto"
          data-testid="panel-pwa-install-prompt"
        >
          <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                    <Download className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Add Afrokaviar</h3>
                    <p className="text-xs text-zinc-400">Get the full app experience</p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-full hover:bg-zinc-800 transition-colors"
                  data-testid="button-pwa-dismiss"
                >
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>

              <p className="text-sm text-zinc-400 mb-4">
                Install Afrokaviar on your device for instant access to TV, radio, music and more — right from your home screen.
              </p>

              {isIos ? (
                <div className="space-y-3">
                  <div className="bg-zinc-800/60 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                        <Share className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <p className="text-xs text-zinc-300">
                        <span className="font-semibold">1.</span> Tap the <span className="font-semibold">Share</span> button in Safari
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                        <Plus className="w-3.5 h-3.5 text-green-400" />
                      </div>
                      <p className="text-xs text-zinc-300">
                        <span className="font-semibold">2.</span> Scroll down and tap <span className="font-semibold">"Add to Home Screen"</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 text-sm font-bold text-zinc-300 hover:bg-zinc-700 transition-colors"
                    data-testid="button-pwa-ios-gotit"
                  >
                    Got it
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-sm font-bold text-zinc-400 hover:bg-zinc-700 transition-colors"
                    data-testid="button-pwa-later"
                  >
                    Later
                  </button>
                  <button
                    onClick={handleInstall}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-sm font-bold text-black hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    data-testid="button-pwa-install"
                  >
                    <Download className="w-4 h-4" />
                    Install
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
