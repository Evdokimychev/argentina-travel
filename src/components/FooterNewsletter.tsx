"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="mt-6 text-sm text-gray-400">
        Спасибо! Рассылка скоро будет доступна — мы сохранили ваш интерес локально.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-sm">
      <p className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <Mail className="h-4 w-4 text-sun" strokeWidth={1.75} />
        Подписка на новости
      </p>
      <p className="mt-1 text-xs text-gray-500">Туры, акции и советы по Аргентине</p>
      <div className="mt-3 flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@example.com"
          className="h-10 border-gray-700 bg-charcoal/50 text-white placeholder:text-gray-500 focus:border-sky"
          aria-label="Email для подписки"
        />
        <Button type="submit" size="sm" className="shrink-0">
          OK
        </Button>
      </div>
    </form>
  );
}
