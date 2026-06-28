# Шаблон: unit test (Vitest)

## Путь

`src/lib/[feature]/[module].test.ts` (рядом с модулем)

## Скелет

```ts
import { describe, it, expect } from "vitest";
import { fnUnderTest } from "./module";

describe("fnUnderTest", () => {
  it("does expected behavior", () => {
    expect(fnUnderTest(input)).toEqual(expected);
  });
});
```

## Запуск

```bash
vitest run src/lib/[feature]/[module].test.ts
```

## Partner / booking

Добавляй regression tests для URL builders, mappers, price logic.
