import { AdminCommunicationsCommerceView } from "@/components/admin/views/AdminCommunicationsCommerceView";
import { getCommunicationsCommerceReadiness } from "@/lib/admin/communications-commerce-readiness";

export default function AdminCommunicationsCommercePage() {
  const readiness = getCommunicationsCommerceReadiness(process.env);

  return <AdminCommunicationsCommerceView readiness={readiness} />;
}
