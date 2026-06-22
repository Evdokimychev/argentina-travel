/** Shared marketplace tour card surface tokens (grid / list / map). Sprint 10: ContentCard v2. */
import { contentCardShellClass } from "@/components/content/ContentCard";
import { tokenCardInteractiveClass } from "@/lib/design-tokens";

export const tourCardShellClass = contentCardShellClass({ radius: "card", interactive: false });

export const tourCardShellInteractiveClass = tokenCardInteractiveClass;
