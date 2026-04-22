"use client";

import { FileText, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { getPaperSignedUrl } from "@/app/actions/sessions";

type Props = {
  pdfPath: string;
  label?: string;
};

export function PaperViewButton({ pdfPath, label = "View PDF" }: Props) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function handleClick() {
    if (busy || pending) return;
    setBusy(true);
    startTransition(async () => {
      try {
        const res = await getPaperSignedUrl(pdfPath);
        if (res.url) {
          window.open(res.url, "_blank", "noopener,noreferrer");
        } else {
          toast.error(res.message ?? "Unable to open PDF.");
        }
      } finally {
        setBusy(false);
      }
    });
  }

  const loading = pending || busy;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <FileText className="h-3 w-3" />
      )}
      {label}
    </button>
  );
}
