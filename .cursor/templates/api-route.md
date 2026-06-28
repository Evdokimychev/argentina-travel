# Шаблон: API Route Handler

## Путь

`src/app/api/[resource]/route.ts`

## Чеклист

- [ ] Auth check (если не public)
- [ ] Input validation (zod или явная проверка)
- [ ] Rate limit для public endpoints
- [ ] Typed response
- [ ] Error handling без утечки stack trace
- [ ] Server-only env vars

## Скелет

```ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // ...
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

## Тест

- Unit test для lib logic
- `npm run smoke` если критичный endpoint
