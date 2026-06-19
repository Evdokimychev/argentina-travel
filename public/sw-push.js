/* E83 — service worker для web push (VAPID). */

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = {};
  }

  const title =
    typeof payload.title === "string" && payload.title.trim()
      ? payload.title.trim()
      : "Новое уведомление";

  const options = {
    body:
      typeof payload.body === "string" && payload.body.trim()
        ? payload.body.trim()
        : "Откройте личный кабинет для подробностей.",
    icon:
      typeof payload.icon === "string" && payload.icon.trim()
        ? payload.icon.trim()
        : "/icons/pwa-icon.svg",
    badge:
      typeof payload.badge === "string" && payload.badge.trim()
        ? payload.badge.trim()
        : "/icons/pwa-icon.svg",
    tag:
      typeof payload.tag === "string" && payload.tag.trim() ? payload.tag.trim() : undefined,
    data:
      payload && typeof payload.data === "object"
        ? payload.data
        : { url: "/profile#notifications" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data && typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/profile#notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
