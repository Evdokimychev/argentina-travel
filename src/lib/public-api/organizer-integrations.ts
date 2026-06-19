import { absoluteUrl } from "@/lib/site-url";

export function buildOrganizerEmbedSnippet(organizerId: string): string {
  const scriptUrl = absoluteUrl("/embed/v1/tours.js");
  return `<div data-pva-tours data-organizer="${organizerId}" data-title="Мои туры"></div>
<script src="${scriptUrl}" async></script>`;
}

export function buildOrganizerApiExample(organizerId: string): string {
  return `curl -H "Authorization: Bearer ВАШ_КЛЮЧ" \\
  "${absoluteUrl("/api/v1/tours")}?organizer=${organizerId}"`;
}
