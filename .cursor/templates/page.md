# Шаблон: новая страница (Next.js App Router)

## Путь

`src/app/[section]/[slug]/page.tsx`

## Чеклист

- [ ] `metadata` / `generateMetadata`
- [ ] Server component по умолчанию
- [ ] Loading: `loading.tsx` при async data
- [ ] Error: `error.tsx` при необходимости
- [ ] Mobile-first layout
- [ ] Breadcrumbs / section nav если уместно
- [ ] Русский текст по editorial-standard

## Скелет

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "…",
  description: "…",
};

export default async function Page() {
  return (
    <main className="container-page">
      {/* content */}
    </main>
  );
}
```

## После создания

- Добавить ссылку в навигацию если нужно
- `npm run audit:quick`
