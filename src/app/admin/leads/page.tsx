import { redirect } from "next/navigation";

/** Legacy URL — redirect to new operations section. */
export default function AdminLeadsLegacyRedirect() {
  redirect("/admin/operations/leads");
}
