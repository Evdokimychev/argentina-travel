/**
 * Shared surface shells for Card, cabinet panels and table wrappers (E50).
 * Import here — not duplicate class strings in cabinet-ui or components.
 * E49: backed by design tokens (src/styles/tokens.css).
 */

import {
  tokenCardInteractiveClass,
  tokenCardSurfaceClass,
} from "@/lib/design-tokens";

/** Публичный каталог, формы на лендинге */
export const uiCardPublicClass = tokenCardSurfaceClass;

/** Кабинеты туриста и организатора */
export const uiCardCabinetClass =
  "rounded-panel border border-border-subtle bg-surface-elevated shadow-card";

/** Админ-панель — те же радиусы, что в кабинете */
export const uiCardAdminClass = uiCardCabinetClass;

/** Герой-блок в кабинете */
export const uiCardHeroClass =
  "rounded-panel border border-border-subtle bg-gradient-to-br from-surface-elevated via-surface-elevated to-sky/[0.06] shadow-card";

/** KPI / stat tile в кабинете */
export const uiCardStatClass =
  "rounded-panel border border-border-subtle bg-surface-elevated shadow-card transition-[border-color,box-shadow] hover:border-sky/30 hover:shadow-elevated motion-reduce:transition-none";

/** Обёртка таблицы в кабинете / админке */
export const uiTableWrapCabinetClass =
  "overflow-x-auto rounded-panel border border-border-subtle";

/** Обёртка таблицы на публичной стороне */
export const uiTableWrapPublicClass =
  "overflow-x-auto rounded-card border border-border-subtle";

/** Заголовок строк таблицы в кабинете */
export const uiTableHeaderMutedClass = "bg-surface-muted/70";

/** Интерактивная карточка каталога (hover elevation) */
export const uiCardInteractiveClass = tokenCardInteractiveClass;
