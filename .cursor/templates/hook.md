# Шаблон: custom hook

## Путь

`src/hooks/useFeatureName.ts`

## Скелет

```ts
"use client";

import { useCallback, useState } from "react";

export function useFeatureName() {
  const [state, setState] = useState(/* initial */);

  const action = useCallback(() => {
    // ...
  }, []);

  return { state, action };
}
```

## Правила

- Hooks только в client components
- Extract когда логика повторяется ≥2 раз
- Unit test если non-trivial
