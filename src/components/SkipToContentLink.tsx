export default function SkipToContentLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-charcoal focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky/40"
    >
      Перейти к содержимому
    </a>
  );
}
