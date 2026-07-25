/**
 * Lightweight Zod-compatible schema helpers for editorial blocks.
 * Keeps validation isomorphic without adding a runtime Zod dependency yet.
 * Migration path: replace helpers with `z.object(...)` when zod is adopted.
 */

export type ParseSuccess<T> = { success: true; data: T };
export type ParseFailure = {
  success: false;
  error: { issues: Array<{ path: (string | number)[]; message: string }> };
};
export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

export type Schema<T> = {
  parse: (value: unknown) => T;
  safeParse: (value: unknown) => ParseResult<T>;
};

function fail(message: string, path: (string | number)[] = []): ParseFailure {
  return { success: false, error: { issues: [{ path, message }] } };
}

export function objectSchema<T extends Record<string, unknown>>(
  shape: { [K in keyof T]: (value: unknown, path: (string | number)[]) => ParseResult<T[K]> },
): Schema<T> {
  const safeParse = (value: unknown): ParseResult<T> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return fail("Expected object");
    }
    const record = value as Record<string, unknown>;
    const data = {} as T;
    for (const key of Object.keys(shape) as Array<keyof T>) {
      const result = shape[key](record[key as string], [String(key)]);
      if (!result.success) return result;
      data[key] = result.data;
    }
    return { success: true, data };
  };

  return {
    safeParse,
    parse(value) {
      const result = safeParse(value);
      if (!result.success) {
        throw new Error(result.error.issues.map((i) => i.message).join("; "));
      }
      return result.data;
    },
  };
}

export function stringField(
  opts: { min?: number; max?: number; required?: boolean } = {},
): (value: unknown, path: (string | number)[]) => ParseResult<string> {
  return (value, path) => {
    if (typeof value !== "string") {
      if (opts.required === false && (value === undefined || value === null)) {
        return { success: true, data: "" };
      }
      return fail("Expected string", path);
    }
    if (opts.min != null && value.trim().length < opts.min) {
      return fail(`String shorter than ${opts.min}`, path);
    }
    if (opts.max != null && value.length > opts.max) {
      return fail(`String longer than ${opts.max}`, path);
    }
    return { success: true, data: value };
  };
}

export function optionalString(
  opts: { max?: number } = {},
): (value: unknown, path: (string | number)[]) => ParseResult<string | undefined> {
  return (value, path) => {
    if (value === undefined || value === null || value === "") {
      return { success: true, data: undefined };
    }
    if (typeof value !== "string") return fail("Expected string", path);
    if (opts.max != null && value.length > opts.max) {
      return fail(`String longer than ${opts.max}`, path);
    }
    return { success: true, data: value };
  };
}

export function arrayField<T>(
  item: (value: unknown, path: (string | number)[]) => ParseResult<T>,
  opts: { min?: number; max?: number } = {},
): (value: unknown, path: (string | number)[]) => ParseResult<T[]> {
  return (value, path) => {
    if (!Array.isArray(value)) return fail("Expected array", path);
    if (opts.min != null && value.length < opts.min) {
      return fail(`Array shorter than ${opts.min}`, path);
    }
    if (opts.max != null && value.length > opts.max) {
      return fail(`Array longer than ${opts.max}`, path);
    }
    const items: T[] = [];
    for (let i = 0; i < value.length; i += 1) {
      const result = item(value[i], [...path, i]);
      if (!result.success) return result;
      items.push(result.data);
    }
    return { success: true, data: items };
  };
}

export const photoBlockSchema = objectSchema<{
  type: "photo";
  src: string;
  alt: string;
  caption?: string;
}>({
  type: (value, path) =>
    value === "photo" ? { success: true, data: "photo" as const } : fail("Expected photo", path),
  src: stringField({ min: 1 }),
  alt: stringField({ min: 1, max: 180 }),
  caption: optionalString({ max: 280 }),
});

export const sourcesBlockSchema = objectSchema<{
  type: "sources";
  items: Array<{ title: string; url: string }>;
}>({
  type: (value, path) =>
    value === "sources"
      ? { success: true, data: "sources" as const }
      : fail("Expected sources", path),
  items: arrayField(
    (value, path) => {
      if (!value || typeof value !== "object") return fail("Expected source item", path);
      const record = value as Record<string, unknown>;
      if (typeof record.title !== "string" || !record.title.trim()) {
        return fail("Source title required", [...path, "title"]);
      }
      if (typeof record.url !== "string" || !/^https?:\/\//.test(record.url)) {
        return fail("Source URL must be http(s)", [...path, "url"]);
      }
      return {
        success: true,
        data: { title: record.title, url: record.url },
      };
    },
    { min: 1, max: 40 },
  ),
});

export const calloutBlockSchema = objectSchema<{
  type: "callout";
  title: string;
  body: string;
}>({
  type: (value, path) =>
    value === "callout"
      ? { success: true, data: "callout" as const }
      : fail("Expected callout", path),
  title: stringField({ min: 1, max: 120 }),
  body: stringField({ min: 1, max: 2000 }),
});
