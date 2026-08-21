"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { cn } from "@/lib/cn";

type SharePageLinkButtonProps = {
  className?: string;
  label?: string;
  title?: string;
};

export default function SharePageLinkButton({
  className,
  label = "Поделиться",
  title,
}: SharePageLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    const shareTitle = title ?? document.title;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: shareTitle, url });
        return;
      }
    } catch (error) {
      // User cancelled the system sheet — do not fall through with a confusing state.
      if (error instanceof DOMException && error.name === "AbortError") return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked; keep the button label so the user can retry.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-slate transition-colors hover:border-sky/30 hover:bg-sky/5 hover:text-sky",
        className
      )}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" aria-hidden />
          Ссылка скопирована
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4" aria-hidden />
          {label}
        </>
      )}
    </button>
  );
}
