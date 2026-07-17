import { describe, expect, it } from "vitest";
import { filterAdminNavForMode, isSimpleAdminNavItem } from "@/lib/admin/admin-navigation-mode";
import type { AdminNavItem } from "@/types/admin";

const items: AdminNavItem[] = [
  {
    id: "dashboard",
    section: "dashboard",
    href: "/admin",
    label: "Панель",
    capability: "dashboard.view",
  },
  {
    id: "operations-bookings",
    section: "operations",
    href: "/admin/operations/bookings",
    label: "Бронирования",
    capability: "operations.bookings",
  },
  {
    id: "system-audit",
    section: "system",
    href: "/admin/system/audit",
    label: "Журнал",
    capability: "system.audit",
  },
];

describe("admin navigation mode", () => {
  it("keeps the everyday owner navigation concise", () => {
    expect(filterAdminNavForMode(items, true, "/admin").map((item) => item.id)).toEqual([
      "dashboard",
      "operations-bookings",
    ]);
  });

  it("keeps an opened advanced tool visible", () => {
    expect(
      filterAdminNavForMode(items, true, "/admin/system/audit/events").map((item) => item.id),
    ).toContain("system-audit");
  });

  it("returns every authorized item in professional mode", () => {
    expect(filterAdminNavForMode(items, false, "/admin")).toEqual(items);
  });

  it("classifies core owner destinations explicitly", () => {
    expect(isSimpleAdminNavItem("content-knowledge")).toBe(true);
    expect(isSimpleAdminNavItem("system-api-keys")).toBe(false);
  });
});
