import { BookOpen, CalendarCheck, Map, UserCircle } from "lucide-react";
import { getOrganizerBookingsForCabinet } from "@/lib/organizer-bookings";
import { getOrganizerTourListingsForUser } from "@/lib/organizer-tour-store";
import { readOrganizerProfile } from "@/lib/organizer-profile-store";
import type { OnboardingStep, TouristOnboardingStepContent } from "@/types/onboarding";

export function isOrganizerProfileComplete(userId: string): boolean {
  const profile = readOrganizerProfile(userId);
  const hasDescription =
    profile.shortDescription.trim().length > 0 || profile.extendedDescription.trim().length > 0;
  const hasContacts =
    profile.contacts.contactEmail.trim().length > 0 ||
    profile.contacts.website.trim().length > 0 ||
    profile.contacts.telegramUrl.trim().length > 0;
  return hasDescription && hasContacts;
}

export function hasOrganizerCreatedTour(userId: string): boolean {
  return getOrganizerTourListingsForUser(userId).some((tour) => !tour.deleted);
}

export function hasOrganizerPublishedTour(userId: string): boolean {
  return getOrganizerTourListingsForUser(userId).some(
    (tour) => !tour.deleted && !tour.archived && tour.status === "published"
  );
}

export function hasOrganizerReceivedBooking(userId: string): boolean {
  return getOrganizerBookingsForCabinet(userId).length > 0;
}

function resolveStepStatus(done: boolean, previousDone: boolean): OnboardingStep["status"] {
  if (done) return "completed";
  if (previousDone) return "current";
  return "pending";
}

export function getOrganizerOnboardingSteps(userId: string): OnboardingStep[] {
  const profileDone = isOrganizerProfileComplete(userId);
  const tourCreated = hasOrganizerCreatedTour(userId);
  const tourPublished = hasOrganizerPublishedTour(userId);
  const bookingReceived = hasOrganizerReceivedBooking(userId);

  const firstDraft = getOrganizerTourListingsForUser(userId).find((tour) => !tour.deleted);

  return [
    {
      id: "profile",
      title: "Заполните профиль",
      description:
        "Добавьте краткое описание и контакты — туристы увидят их на странице тура и в карточке организатора.",
      href: "/organizer/settings",
      actionLabel: "Открыть настройки",
      status: resolveStepStatus(profileDone, true),
      icon: UserCircle,
    },
    {
      id: "first-tour",
      title: "Создайте первый тур",
      description:
        "Редактор проведёт через программу, цены и условия бронирования. На черновик обычно уходит 15–20 минут.",
      href: firstDraft ? `/organizer/tours/${firstDraft.id}/edit` : undefined,
      actionLabel: firstDraft ? "Продолжить редактирование" : "Создать тур",
      status: resolveStepStatus(tourCreated, profileDone),
      icon: Map,
    },
    {
      id: "publish",
      title: "Опубликуйте тур",
      description:
        "Проверьте карточку в предпросмотре и переведите тур в статус «Опубликовано», чтобы он появился в каталоге.",
      href: firstDraft ? `/organizer/tours/${firstDraft.id}/edit` : "/organizer/tours",
      actionLabel: "К публикации",
      status: resolveStepStatus(tourPublished, tourCreated),
      icon: BookOpen,
    },
    {
      id: "first-booking",
      title: "Получите первую заявку",
      description:
        "Когда турист оформит бронирование, заявка появится в разделе «Бронирования». Ответьте в течение суток.",
      href: "/organizer/bookings",
      actionLabel: "Открыть бронирования",
      status: resolveStepStatus(bookingReceived, tourPublished),
      icon: CalendarCheck,
    },
  ];
}

export function isOrganizerOnboardingComplete(userId: string): boolean {
  return getOrganizerOnboardingSteps(userId).every((step) => step.status === "completed");
}

export const TOURIST_ONBOARDING_STEPS: TouristOnboardingStepContent[] = [
  {
    id: "find-tour",
    title: "Найдите тур",
    description:
      "Откройте каталог или пройдите подбор — мы подскажем маршруты по датам, бюджету и интересам.",
    hint: "Сохраняйте понравившиеся туры в избранное, чтобы вернуться к ним позже.",
    href: "/tours",
    actionLabel: "Перейти в каталог",
  },
  {
    id: "submit-booking",
    title: "Оформите заявку",
    description:
      "На странице тура выберите даты, укажите состав группы и отправьте заявку. Оплата и детали согласуются с организатором.",
    hint: "После отправки заявка появится в личном кабинете — организатор свяжется с вами.",
    href: "/podbor",
    actionLabel: "Подобрать тур",
  },
  {
    id: "track-status",
    title: "Отслеживайте статус",
    description:
      "В разделе «Бронирования» видно, на каком этапе заявка: ожидает ответа, подтверждена или завершена.",
    hint: "Там же можно написать организатору и оставить отзыв после поездки.",
    href: "/profile/bookings",
    actionLabel: "Мои бронирования",
  },
];
