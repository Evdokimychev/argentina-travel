"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ListOrdered, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import WaitlistStatusBadge from "@/components/waitlist/WaitlistStatusBadge";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { useAuth } from "@/context/AuthContext";
import { getOrganizerWaitlistForCabinet } from "@/lib/organizer-waitlist";
import { formatBookingTourDates } from "@/lib/booking-display";
import { WAITLIST_UPDATED_EVENT, type WaitlistEntry, type WaitlistStatus } from "@/types/waitlist";
import { WAITLIST_STATUS_LABELS } from "@/data/waitlist-statuses";
import { cn } from "@/lib/cn";
import { cabinetTableHeaderClass, cabinetTableWrapClass } from "@/lib/cabinet-ui";

type WaitlistFilter = "all" | WaitlistStatus;

const ACTIVE_STATUSES: WaitlistStatus[] = ["waiting", "contacted", "offered"];

export default function OrganizerWaitlistView() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("wlStatus") as WaitlistFilter) || "all";

  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WaitlistFilter>(initialStatus);

  useEffect(() => {
    if (!user) return;

    function refresh() {
      setEntries(getOrganizerWaitlistForCabinet(user!.id));
    }

    refresh();
    window.addEventListener(WAITLIST_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(WAITLIST_UPDATED_EVENT, refresh);
  }, [user]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries
      .filter((entry) => {
        if (statusFilter !== "all" && entry.status !== statusFilter) return false;
        if (!query) return true;
        return (
          entry.tourTitle.toLowerCase().includes(query) ||
          entry.contactName.toLowerCase().includes(query) ||
          entry.contactEmail.toLowerCase().includes(query) ||
          entry.contactPhone.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [entries, search, statusFilter]);

  return (
    <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск: тур, имя, email"
              className="pl-10"
            />
          </div>
          <NativeSelect
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as WaitlistFilter)}
          >
            <option value="all">Все статусы</option>
            {ACTIVE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {WAITLIST_STATUS_LABELS[status]}
              </option>
            ))}
            <option value="converted">{WAITLIST_STATUS_LABELS.converted}</option>
            <option value="cancelled">{WAITLIST_STATUS_LABELS.cancelled}</option>
            <option value="declined">{WAITLIST_STATUS_LABELS.declined}</option>
          </NativeSelect>
        </div>

        {filtered.length > 0 ? (
          <div className={cabinetTableWrapClass}>
            <Table className="min-w-[820px] text-left">
              <TableHeader className={cabinetTableHeaderClass}>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Тур</TableHead>
                  <TableHead>Турист</TableHead>
                  <TableHead>Контакты</TableHead>
                  <TableHead>Заявка</TableHead>
                  <TableHead>Даты</TableHead>
                  <TableHead>Гости</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Link
                        href={`/organizer/waitlist/${entry.id}`}
                        className="flex min-w-[200px] items-center gap-3"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <Image
                            src={entry.tourImage}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <span className="line-clamp-2 font-medium text-charcoal transition-colors hover:text-sky">
                          {entry.tourTitle}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-charcoal">{entry.contactName || "—"}</TableCell>
                    <TableCell className="text-slate">
                      <div>{entry.contactEmail}</div>
                      <div className="mt-0.5">{entry.contactPhone || "—"}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate">
                      {formatBookingCreatedAt(entry.createdAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate">
                      {formatBookingTourDates(entry, "Даты по согласованию")}
                    </TableCell>
                    <TableCell className="text-charcoal">{entry.guests}</TableCell>
                    <TableCell>
                      <WaitlistStatusBadge status={entry.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={ListOrdered}
            title="Заявок в листе ожидания нет"
            description="Когда турист не сможет забронировать тур из‑за нехватки мест, заявка появится здесь."
          />
        )}
    </div>
  );
}
