/** Radix dismissable-layer outside events (pointer/focus) and test doubles. */
export type DialogOutsideEvent = {
  target: EventTarget | null;
  preventDefault(): void;
};

/** Portals and partner widgets rendered outside dialog content but still “inside” the flow. */
export function shouldPreventDialogOutsideDismiss(event: DialogOutsideEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return true;

  if (target.closest("[data-radix-popper-content-wrapper]")) return true;
  if (target.closest("[data-radix-select-content]")) return true;
  if (target.closest("[role='listbox']")) return true;
  if (target.closest("#tpwl-modals")) return true;
  if (target.closest(".tpwl-widget, .tpwl-search, .tpwl-tickets")) return true;

  return false;
}

export function composeDialogOutsideHandler<E extends DialogOutsideEvent>(
  userHandler: ((event: E) => void) | undefined,
  event: E,
): void {
  if (shouldPreventDialogOutsideDismiss(event)) {
    event.preventDefault();
    return;
  }
  userHandler?.(event);
}
