# Шаблон: React компонент

## Путь

`src/components/[feature]/ComponentName.tsx`

## Чеклист

- [ ] `"use client"` только если нужен state/effects
- [ ] Props typed interface
- [ ] States: loading, empty, error
- [ ] Responsive classes (Tailwind)
- [ ] a11y: semantic HTML, aria-labels
- [ ] Русский UI text

## Скелет

```tsx
type Props = {
  title: string;
};

export function ComponentName({ title }: Props) {
  return (
    <section aria-labelledby="section-title">
      <h2 id="section-title">{title}</h2>
    </section>
  );
}
```

## Atomic design

- atoms → `src/components/ui/`
- feature sections → `src/components/[feature]/`
