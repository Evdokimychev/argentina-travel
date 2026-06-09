"use client";

import { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { ActivityType } from "@/types";
import { ACTIVITY_TYPE_OPTIONS } from "@/data/activity-icons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { formatActivities } from "@/lib/pluralize";
import { FilterFooter } from "./FilterPopover";

interface ActivityTypesFilterProps {
  selected: ActivityType[];
  onToggle: (type: ActivityType) => void;
  onClear: () => void;
  onApply: () => void;
}

export default function ActivityTypesFilter({
  selected,
  onToggle,
  onClear,
  onApply,
}: ActivityTypesFilterProps) {
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ACTIVITY_TYPE_OPTIONS;
    return ACTIVITY_TYPE_OPTIONS.filter(
      (opt) =>
        opt.type.toLowerCase().includes(q) ||
        opt.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [search]);

  const showHint = focused || search.length > 0;

  return (
    <>
      <div className="space-y-3 p-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input
            placeholder="Поиск по активностям и подборкам"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="h-11 border-gray-200 bg-gray-50 pl-10 focus:bg-white"
          />
        </div>

        {showHint && (
          <p className="rounded-xl bg-sky/10 px-3 py-2.5 text-xs leading-relaxed text-sky">
            {search.trim()
              ? filtered.length
                ? `Найдено ${formatActivities(filtered.length)}`
                : "Ничего не найдено — попробуйте другой запрос"
              : "Введите активности или подборки"}
          </p>
        )}
      </div>

      <div className="px-4 pb-2">
        <p className="text-sm font-semibold text-charcoal">Активности в туре</p>
      </div>

      <div className="max-h-80 overflow-y-auto px-3 pb-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate">Нет подходящих активностей</p>
        ) : (
          <ul className="grid grid-cols-2 gap-1">
            {filtered.map(({ type, icon: Icon }) => {
              const isSelected = selected.includes(type);
              return (
                <li key={type}>
                  <button
                    type="button"
                    onClick={() => onToggle(type)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all duration-150",
                      isSelected
                        ? "bg-gray-100"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <Icon
                      className="h-[18px] w-[18px] shrink-0 stroke-[1.75] text-charcoal"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 text-[13px] font-medium leading-tight text-charcoal">
                      {type}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-charcoal" strokeWidth={2.5} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <FilterFooter onClear={onClear} onApply={onApply} />
    </>
  );
}
