"use client";

import { NativeSelect } from "@/components/ui/native-select";
import type { BlogEditorialDensity } from "@/types/blog-content-blocks";

const DENSITY_OPTIONS: Array<{ value: BlogEditorialDensity; label: string }> = [
  { value: "compact", label: "Компактно" },
  { value: "comfortable", label: "Комфортно" },
  { value: "spacious", label: "Просторно" },
];

type Props = {
  value?: BlogEditorialDensity;
  onChange: (value: BlogEditorialDensity) => void;
  label?: string;
};

export default function DensitySelect({
  value = "comfortable",
  onChange,
  label = "Плотность",
}: Props) {
  return (
    <label className="block space-y-1 text-xs text-slate">
      {label}
      <NativeSelect
        value={value}
        onChange={(e) => onChange(e.target.value as BlogEditorialDensity)}
        aria-label={label}
      >
        {DENSITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}
