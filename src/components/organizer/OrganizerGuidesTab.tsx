"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import UserAvatar from "@/components/auth/UserAvatar";
import TourGuideCreateModal from "@/components/organizer/TourGuideCreateModal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ORGANIZER_TEAM_GUIDES_MAX,
  teamGuideFromTourGuide,
} from "@/data/tour-guides-defaults";
import {
  ORGANIZER_PROFILE_UPDATED_EVENT,
  readOrganizerGuideTeam,
  updateOrganizerProfile,
} from "@/lib/organizer-profile-store";
import { cn } from "@/lib/cn";
import type { OrganizerTeamGuide } from "@/types/organizer-profile";
import type { OrganizerTourGuide } from "@/types/organizer-tour";

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-sky/10 px-4 py-3 text-sm leading-relaxed text-charcoal">
      {children}
    </div>
  );
}

function GuideTeamCard({
  guide,
  onEdit,
  onDelete,
}: {
  guide: OrganizerTeamGuide;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="absolute right-3 top-3 flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
          aria-label={`Редактировать ${guide.name}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label={`Удалить ${guide.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-4 pr-16 sm:flex-row sm:items-start">
        <UserAvatar
          name={guide.name}
          avatarUrl={guide.avatar}
          className="h-16 w-16 sm:h-20 sm:w-20"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="font-display text-base font-bold text-charcoal sm:text-lg">{guide.name}</h3>
          <p className="line-clamp-4 text-sm leading-relaxed text-slate">{guide.bio}</p>
        </div>
      </div>
    </article>
  );
}

interface OrganizerGuidesTabProps {
  userId: string;
}

export default function OrganizerGuidesTab({ userId }: OrganizerGuidesTabProps) {
  const [guides, setGuides] = useState<OrganizerTeamGuide[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<OrganizerTeamGuide | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadGuides = useCallback(() => {
    setGuides(readOrganizerGuideTeam(userId));
  }, [userId]);

  useEffect(() => {
    reloadGuides();
  }, [reloadGuides]);

  useEffect(() => {
    function handleProfileUpdate() {
      reloadGuides();
    }

    window.addEventListener(ORGANIZER_PROFILE_UPDATED_EVENT, handleProfileUpdate);
    return () => window.removeEventListener(ORGANIZER_PROFILE_UPDATED_EVENT, handleProfileUpdate);
  }, [reloadGuides]);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(timer);
  }, [saved]);

  function persistGuides(nextGuides: OrganizerTeamGuide[]) {
    const result = updateOrganizerProfile(userId, { guides: nextGuides });
    if ("error" in result) {
      setError(result.error);
      return false;
    }

    setGuides(result.profile.guides);
    setError(null);
    setSaved(true);
    return true;
  }

  function openCreateModal() {
    setEditingGuide(null);
    setModalOpen(true);
  }

  function openEditModal(guide: OrganizerTeamGuide) {
    setEditingGuide(guide);
    setModalOpen(true);
  }

  function handleSaveGuide(guide: OrganizerTourGuide) {
    const teamGuide = teamGuideFromTourGuide(guide);

    if (editingGuide) {
      const next = guides.map((item) => (item.id === editingGuide.id ? teamGuide : item));
      persistGuides(next);
    } else {
      if (guides.length >= ORGANIZER_TEAM_GUIDES_MAX) {
        setError(`Не больше ${ORGANIZER_TEAM_GUIDES_MAX} гидов в команде`);
        return;
      }
      persistGuides([...guides, teamGuide]);
    }

    setModalOpen(false);
    setEditingGuide(null);
  }

  function handleDeleteGuide(id: string) {
    persistGuides(guides.filter((guide) => guide.id !== id));
  }

  const canAdd = guides.length < ORGANIZER_TEAM_GUIDES_MAX;

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand" />
              <h2 className="font-display text-lg font-bold text-charcoal sm:text-xl">Команда гидов</h2>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate">
              Добавьте гидов, с которыми вы работаете. Их можно будет быстро выбирать при
              редактировании туров.
            </p>
          </div>

          {canAdd ? (
            <Button type="button" onClick={openCreateModal} className="shrink-0">
              <Plus className="h-4 w-4" />
              Добавить гида
            </Button>
          ) : null}
        </div>

        <InfoBox>
          Гиды из этой команды появляются в редакторе тура в разделе «Гиды этого тура». Автора тура
          можно добавить отдельно — его описание берётся из{" "}
          <Link href="/organizer/settings" className="font-medium text-brand hover:underline">
            настроек профиля
          </Link>
          .
        </InfoBox>

        {saved ? (
          <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
            Изменения сохранены
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {guides.length ? (
          <div className="space-y-4">
            {guides.map((guide) => (
              <GuideTeamCard
                key={guide.id}
                guide={guide}
                onEdit={() => openEditModal(guide)}
                onDelete={() => handleDeleteGuide(guide.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="Пока нет гидов"
            description="Добавьте первого гида — фото, имя и описание. Потом их можно назначать на конкретные туры."
            action={canAdd ? { label: "Добавить гида", onClick: openCreateModal } : undefined}
          />
        )}

        {!canAdd ? (
          <p className="text-sm text-slate">
            Достигнут лимит — не больше {ORGANIZER_TEAM_GUIDES_MAX} гидов в команде.
          </p>
        ) : null}
      </div>

      <TourGuideCreateModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingGuide(null);
        }}
        initialGuide={editingGuide ?? undefined}
        onSave={handleSaveGuide}
      />
    </div>
  );
}
