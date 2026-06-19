"use client";

import { useEffect } from "react";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { FAVORITE_SAVED_AFTER_AUTH_EVENT } from "@/context/AuthContext";

export default function FavoriteAuthSuccessListener() {
  const feedback = useSiteFeedback();

  useEffect(() => {
    function handleSaved() {
      feedback.success({
        title: "Тур в избранном",
        description: "Сохранили тур — он уже в вашем списке избранного.",
        action: { label: "Открыть избранное", href: "/profile/favorites" },
      });
    }

    window.addEventListener(FAVORITE_SAVED_AFTER_AUTH_EVENT, handleSaved);
    return () => window.removeEventListener(FAVORITE_SAVED_AFTER_AUTH_EVENT, handleSaved);
  }, [feedback]);

  return null;
}
