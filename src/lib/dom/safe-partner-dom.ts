/** Remove an element only when it is still attached to the document. */
export function safeRemoveElement(el: Element | null | undefined): void {
  if (el?.parentElement) el.remove();
}

/** Clear partner-injected content from a mount node React does not own. */
export function safeClearElementContent(el: HTMLElement | null | undefined): void {
  if (!el) return;
  el.innerHTML = "";
}
