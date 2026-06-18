"use client";

import CabinetRouteError from "@/components/cabinet/CabinetRouteError";

export default function OrganizerRouteError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <CabinetRouteError
      {...props}
      title="Ошибка в кабинете организатора"
      description="Не удалось загрузить страницу. Попробуйте обновить или вернитесь к списку туров."
      homeHref="/organizer"
      homeLabel="Кабинет организатора"
    />
  );
}
