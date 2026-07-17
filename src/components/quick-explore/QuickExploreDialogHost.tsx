"use client";

import QuickExploreMapDialog from "@/components/quick-explore/QuickExploreMapDialog";
import { QuickExploreProvider } from "@/context/QuickExploreContext";

export default function QuickExploreDialogHost() {
  return (
    <QuickExploreProvider>
      <QuickExploreMapDialog />
    </QuickExploreProvider>
  );
}
