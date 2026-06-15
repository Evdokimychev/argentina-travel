"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import UserAvatar from "@/components/auth/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import {
  ORGANIZER_TOUR_GUIDES_MAX,
  ORGANIZER_TEAM_GUIDES_MAX,
  buildTourAuthorGuide,
  teamGuideFromTourGuide,
} from "@/data/tour-guides-defaults";
import {
  ORGANIZER_PROFILE_UPDATED_EVENT,
  readOrganizerGuideTeam,
  readOrganizerProfile,
  updateOrganizerProfile,
} from "@/lib/organizer-profile-store";
import { cn } from "@/lib/cn";
import type { OrganizerTourGuide } from "@/types/organizer-tour";
import TourGuideCreateModal from "@/components/organizer/TourGuideCreateModal";

function WarningBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-orange-200/80 bg-orange-50/90 px-4 py-3 text-sm leading-relaxed text-charcoal">
      {children}
    </div>
  );
}

function GuideBio({ bio }: { bio: string }) {
  const blocks = bio.split(/\n\n+/).filter(Boolean);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-charcoal">
      {blocks.map((block, index) => {
        const lines = block.split("\n").filter(Boolean);
        const intro = lines.filter((line) => !/^[•\-–]\s/.test(line.trim()));
        const bullets = lines.filter((line) => /^[•\-–]\s/.test(line.trim()));

        if (bullets.length === 0) {
          return <p key={index}>{block}</p>;
        }

        return (
          <div key={index} className="space-y-2">
            {intro.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <ul className="list-disc space-y-1 pl-5">
              {bullets.map((line) => (
                <li key={line}>{line.replace(/^[•\-–]\s*/, "")}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function GuideCard({
  guide,
  onRemove,
}: {
  guide: OrganizerTourGuide;
  onRemove: () => void;
}) {
  const isAuthor = guide.isTourAuthor === true;

  return (
    <article
      className={cn(
        "relative rounded-2xl p-4 sm:p-5",
        isAuthor
          ? "border border-sky/20 bg-gradient-to-br from-sky/5 via-white to-white ring-1 ring-sky/10"
          : "bg-brand-light/45"
      )}
    >
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate transition-colors hover:bg-white/80 hover:text-charcoal"
        aria-label={`Убрать ${guide.name}`}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col gap-4 pr-8 sm:flex-row sm:items-start">
        <UserAvatar
          name={guide.name}
          avatarUrl={guide.avatar}
          className="h-16 w-16 sm:h-20 sm:w-20"
        />
        <div className="min-w-0 flex-1 space-y-3">
          {isAuthor ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-sky/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky">
                Организатор
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                Гид тура
              </span>
            </div>
          ) : null}
          <h3 className="font-heading text-base font-bold text-charcoal sm:text-lg">
            {isAuthor ? guide.name : guide.name}
          </h3>
          {isAuthor ? (
            <p className="text-sm text-slate">
              На странице тура отображается в объединённом блоке «Организатор и гид» вместе с
              профилем и рекомендациями.
            </p>
          ) : null}
          <GuideBio bio={guide.bio} />
        </div>
      </div>
    </article>
  );
}

interface TourGuidesBlockProps {
  guides: OrganizerTourGuide[];
  onChange: (guides: OrganizerTourGuide[]) => void;
}

export default function TourGuidesBlock({ guides, onChange }: TourGuidesBlockProps) {
  const { user } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [teamVersion, setTeamVersion] = useState(0);

  useEffect(() => {
    function handleProfileUpdate() {
      setTeamVersion((value) => value + 1);
    }

    window.addEventListener(ORGANIZER_PROFILE_UPDATED_EVENT, handleProfileUpdate);
    return () => window.removeEventListener(ORGANIZER_PROFILE_UPDATED_EVENT, handleProfileUpdate);
  }, []);

  const resolvedGuides = useMemo(() => {
    if (!user) return guides;

    const profile = readOrganizerProfile(user.id);

    return guides.map((guide) => {
      if (!guide.isTourAuthor || guide.userId !== user.id) return guide;

      return {
        ...guide,
        name: user.fullName || guide.name,
        avatar: user.avatarUrl || guide.avatar,
        bio: profile.extendedDescription.trim() || guide.bio,
      };
    });
  }, [guides, user]);

  const teamGuides = useMemo(() => {
    if (!user) return [];
    return readOrganizerGuideTeam(user.id);
    // teamVersion keeps the list in sync after profile updates
  }, [user, teamVersion]);

  const assignedIds = new Set(guides.map((guide) => guide.id));
  const availableGuides = teamGuides.filter((guide) => !assignedIds.has(guide.id));
  const canAdd = guides.length < ORGANIZER_TOUR_GUIDES_MAX;
  const showAuthorInPicker =
    Boolean(user) &&
    !guides.some((guide) => guide.userId === user?.id) &&
    canAdd;
  const hasTeamOptions = showAuthorInPicker || availableGuides.length > 0;

  function addGuide(guide: Omit<OrganizerTourGuide, "isTourAuthor">) {
    if (guides.length >= ORGANIZER_TOUR_GUIDES_MAX) return;
    onChange([...guides, { ...guide, isTourAuthor: false }]);
    setPickerOpen(false);
  }

  function addCustomGuide(guide: OrganizerTourGuide) {
    if (guides.length >= ORGANIZER_TOUR_GUIDES_MAX) return;

    if (user) {
      const team = readOrganizerGuideTeam(user.id);
      const teamGuide = teamGuideFromTourGuide(guide);
      if (!team.some((item) => item.id === teamGuide.id) && team.length < ORGANIZER_TEAM_GUIDES_MAX) {
        updateOrganizerProfile(user.id, { guides: [...team, teamGuide] });
      }
    }

    onChange([...guides, guide]);
    setPickerOpen(false);
  }

  function openCreateModal() {
    setPickerOpen(false);
    setCreateModalOpen(true);
  }

  function addTourAuthor() {
    if (!user || guides.some((guide) => guide.userId === user.id)) return;

    const profile = readOrganizerProfile(user.id);
    onChange([
      ...guides,
      buildTourAuthorGuide({
        id: `guide-author-${user.id}`,
        name: user.fullName,
        avatar: user.avatarUrl || buildTourAuthorGuide().avatar,
        bio: profile.extendedDescription.trim() || buildTourAuthorGuide().bio,
        userId: user.id,
      }),
    ]);
    setPickerOpen(false);
  }

  function removeGuide(id: string) {
    onChange(guides.filter((guide) => guide.id !== id));
  }

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
          Организатор и гиды тура
        </h2>
        <p className="mt-1 text-sm text-slate">
          Автор тура отображается на странице как организатор и гид. Добавьте других гидов, если
          тур ведёт команда.
        </p>
      </div>

      <WarningBanner>
        Внимание! Путешественники расстраиваются, когда видят другого гида вместо обещанного
      </WarningBanner>

      {resolvedGuides.length ? (
        <div className="space-y-4">
          {resolvedGuides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} onRemove={() => removeGuide(guide.id)} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-slate">
          Добавьте себя как автора тура — так путешественники увидят вас организатором и гидом на
          странице тура.
        </p>
      )}

      {canAdd ? (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand/10 px-4 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/15"
            >
              <Plus className="h-4 w-4" />
              Добавить гида
              <ChevronDown className={cn("h-4 w-4 transition-transform", pickerOpen && "rotate-180")} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(100vw-2rem,320px)] p-2">
            <div className="space-y-1">
              {showAuthorInPicker && user ? (
                <button
                  type="button"
                  onClick={addTourAuthor}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                >
                  <UserAvatar
                    name={user.fullName}
                    avatarUrl={user.avatarUrl}
                    className="h-10 w-10"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-charcoal">Автор тура</p>
                    <p className="truncate text-xs text-slate">{user.fullName}</p>
                  </div>
                </button>
              ) : null}

              {availableGuides.map((guide) => (
                <button
                  key={guide.id}
                  type="button"
                  onClick={() => addGuide(guide)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                >
                  <UserAvatar name={guide.name} avatarUrl={guide.avatar} className="h-10 w-10" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-charcoal">{guide.name}</p>
                    <p className="line-clamp-2 text-xs text-slate">{guide.bio}</p>
                  </div>
                </button>
              ))}

              {!hasTeamOptions ? (
                <p className="px-3 py-2 text-xs leading-relaxed text-slate">
                  Команда пуста.{" "}
                  <Link href="/organizer/settings?tab=guides" className="font-medium text-brand hover:underline">
                    Добавьте гидов в настройках
                  </Link>{" "}
                  или создайте нового ниже.
                </p>
              ) : null}

              {hasTeamOptions ? <div className="my-1 border-t border-gray-100" /> : null}

              <button
                type="button"
                onClick={openCreateModal}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Plus className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-charcoal">Создать нового гида</p>
                  <p className="text-xs text-slate">Добавится в команду и на этот тур</p>
                </div>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <p className="text-sm text-slate">
          Достигнут лимит — не больше {ORGANIZER_TOUR_GUIDES_MAX} гидов на тур.
        </p>
      )}

      <TourGuideCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={addCustomGuide}
      />

      <p className="text-xs text-slate">
        Команду гидов можно редактировать в{" "}
        <Link href="/organizer/settings?tab=guides" className="font-medium text-brand hover:underline">
          настройках профиля
        </Link>
        . Описание автора тура — в разделе «Основное».
      </p>
    </section>
  );
}
