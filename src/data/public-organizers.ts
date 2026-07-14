import { DEFAULT_ORGANIZER_OWNER_ID } from "@/types/user";

export interface PublicOrganizerIdentity {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  createdAt: string;
}

/** Verified public identities. Authentication credentials never belong in this catalog. */
export const PUBLIC_ORGANIZERS: PublicOrganizerIdentity[] = [
  {
    id: DEFAULT_ORGANIZER_OWNER_ID,
    firstName: "Иван",
    lastName: "Евдокимычев",
    avatar: null,
    createdAt: "2023-01-01T00:00:00.000Z",
  },
];

export function getPublicOrganizerIdentity(id: string): PublicOrganizerIdentity | null {
  return PUBLIC_ORGANIZERS.find((organizer) => organizer.id === id) ?? null;
}
