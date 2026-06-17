"use client";

import { useCallback, useState } from "react";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { normalizeSiteError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";

export function useSiteAction() {
  const feedback = useSiteFeedback();
  const [loading, setLoading] = useState(false);

  const run = useCallback(
    async <T,>(
      task: () => Promise<T>,
      options?: {
        loading?: SiteFeedbackMessage;
        success?: SiteFeedbackMessage | ((value: T) => SiteFeedbackMessage);
        error?: Partial<SiteFeedbackMessage>;
        silent?: boolean;
      }
    ): Promise<{ ok: true; value: T } | { ok: false; error: SiteFeedbackMessage }> => {
      setLoading(true);
      let toastId: string | null = null;

      try {
        if (options?.loading && !options.silent) {
          toastId = feedback.loading(options.loading);
        }

        const value = await task();

        if (toastId) feedback.dismiss(toastId);

        if (options?.success && !options.silent) {
          const message =
            typeof options.success === "function" ? options.success(value) : options.success;
          feedback.success(message);
        }

        return { ok: true, value };
      } catch (err) {
        if (toastId) feedback.dismiss(toastId);

        const normalized = normalizeSiteError(err, options?.error);
        if (!options?.silent) {
          feedback.showError(normalized);
        }

        return { ok: false, error: normalized };
      } finally {
        setLoading(false);
      }
    },
    [feedback]
  );

  return { run, loading };
}
