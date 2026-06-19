"use client";

import CabinetRouteError from "@/components/cabinet/CabinetRouteError";

export default function ProfileRouteError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <CabinetRouteError
      {...props}
      title="Ошибка в личном кабинете"
      description="Не удалось загрузить страницу. Попробуйте обновить — если ошибка повторится, вернитесь на главную кабинета."
      homeHref="/profile"
      homeLabel="Главная кабинета"
    />
  );
}
