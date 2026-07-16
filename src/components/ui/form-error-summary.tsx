import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export type FormErrorItem = { fieldId: string; message: string };

export function FormErrorSummary({
  errors,
  title = "Проверьте заполнение",
  className,
}: {
  errors: FormErrorItem[];
  title?: string;
  className?: string;
}) {
  if (!errors.length) return null;

  return (
    <section
      role="alert"
      aria-labelledby="form-error-summary-title"
      className={cn("rounded-card border border-error/30 bg-error-muted p-4 text-error", className)}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <h2 id="form-error-summary-title" className="text-sm font-semibold">{title}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {errors.map((item) => (
              <li key={item.fieldId}>
                <a className="underline decoration-error/40 underline-offset-2 hover:decoration-error" href={`#${item.fieldId}`}>
                  {item.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
