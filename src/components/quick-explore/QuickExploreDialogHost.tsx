"use client";

import QuickExploreMapDialog from "@/components/quick-explore/QuickExploreMapDialog";
import { QuickExploreProvider } from "@/context/QuickExploreContext";

export default function QuickExploreDialogHost({ initialOpen = false }: { initialOpen?: boolean }) {
  return (
    <QuickExploreProvider>
      <QuickExploreMapDialog initialOpen={initialOpen} />
    </QuickExploreProvider>
  );
}
