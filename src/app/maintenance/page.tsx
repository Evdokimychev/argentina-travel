import MaintenanceComingSoonView from "@/components/maintenance/MaintenanceComingSoonView";
import { resolveMaintenancePageViewModel } from "@/lib/maintenance-page";
import {
  fetchSiteBranding,
  fetchSiteContact,
  fetchSiteMaintenance,
} from "@/lib/site-settings-server";

export const metadata = {
  title: "Сайт на обслуживании",
  robots: { index: false, follow: false },
};

export default async function MaintenancePage() {
  const [maintenance, branding, contact] = await Promise.all([
    fetchSiteMaintenance(),
    fetchSiteBranding(),
    fetchSiteContact(),
  ]);

  const model = resolveMaintenancePageViewModel({ maintenance, branding, contact });

  return <MaintenanceComingSoonView model={model} />;
}
