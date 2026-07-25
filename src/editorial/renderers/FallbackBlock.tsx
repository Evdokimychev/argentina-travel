type Props = {
  type: string;
  message?: string;
};

/** Safe fallback that never blanks the article when a block fails. */
export default function FallbackBlock({ type, message }: Props) {
  if (process.env.NODE_ENV !== "development") {
    return (
      <div
        className="sr-only"
        data-editorial-fallback={type}
        role="note"
      >
        {message ?? `Блок «${type}» временно недоступен`}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
      data-editorial-fallback={type}
      role="note"
    >
      {message ?? `Не удалось отобразить блок «${type}». Проверьте schema и registry.`}
    </div>
  );
}
