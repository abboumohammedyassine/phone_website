"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useToastStore, type ToastTone } from "@/lib/toast-store";

const STYLES: Record<ToastTone, { box: string; icon: JSX.Element }> = {
  success: {
    box: "border-green-500/40",
    icon: <CheckCircle2 size={18} className="shrink-0 text-green-400" />,
  },
  error: {
    box: "border-red-500/50",
    icon: <AlertCircle size={18} className="shrink-0 text-red-400" />,
  },
  info: {
    box: "border-cyan-500/40",
    icon: <Info size={18} className="shrink-0 text-cyan-400" />,
  },
};

/** Monté une seule fois dans app/layout.tsx. S'utilise via toast.success("…") de lib/toast-store. */
export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-carbon-900 px-4 py-3 text-sm text-porcelain shadow-2xl shadow-black/50 ${STYLES[t.tone].box}`}
        >
          {STYLES[t.tone].icon}
          <p className="flex-1">{t.message}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Fermer la notification"
            className="rounded p-0.5 text-steel-400 transition hover:text-porcelain"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
