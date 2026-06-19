export function isGuideAssistantPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/guide") ||
    pathname.startsWith("/immigration") ||
    pathname === "/faq"
  );
}
