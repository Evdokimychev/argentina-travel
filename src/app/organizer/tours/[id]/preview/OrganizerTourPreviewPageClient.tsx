"use client";

import { use } from "react";
import AccessGate from "@/components/auth/AccessGate";
import OrganizerTourPreviewView from "@/components/organizer/OrganizerTourPreviewView";
import { useAuth } from "@/context/AuthContext";
import { canAccessOrganizerPanel } from "@/lib/permissions";
import { siteContainerClass } from "@/lib/site-container";

export default function OrganizerTourPreviewPageClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();

  return (
    <AccessGate
      allowed={canAccessOrganizerPanel(user)}
      fallback={
        <div className={`${siteContainerClass} py-24 text-center`}>
          <h1 className="font-display text-2xl font-bold text-charcoal">Нужен доступ организатора</h1>
          <p className="mt-2 text-sm text-slate">Войдите как организатор, чтобы просмотреть тур.</p>
        </div>
      }
    >
      <OrganizerTourPreviewView tourId={id} />
    </AccessGate>
  );
}
