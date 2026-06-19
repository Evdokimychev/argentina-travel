"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type FeatureFlagResponse = {
  key?: string;
  enabled?: boolean;
  error?: string;
};

type UseFeatureFlagOptions = {
  initialValue?: boolean;
  enabled?: boolean;
};

export function useFeatureFlag(
  flagKey: string,
  options: UseFeatureFlagOptions = {}
): {
  enabled: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const normalizedKey = useMemo(() => flagKey.trim(), [flagKey]);
  const shouldLoad = options.enabled !== false && normalizedKey.length > 0;
  const [value, setValue] = useState<boolean>(options.initialValue ?? false);
  const [loading, setLoading] = useState<boolean>(shouldLoad);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!shouldLoad) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/feature-flags?key=${encodeURIComponent(normalizedKey)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as FeatureFlagResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось получить флаг");
      }
      setValue(payload.enabled === true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [normalizedKey, shouldLoad]);

  useEffect(() => {
    setValue(options.initialValue ?? false);
  }, [options.initialValue, normalizedKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    enabled: value,
    loading,
    error,
    refresh,
  };
}
