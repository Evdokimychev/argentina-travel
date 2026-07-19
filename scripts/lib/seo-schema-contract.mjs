const SCHEMA_TYPE_EQUIVALENTS = {
  Article: new Set(["Article", "BlogPosting", "NewsArticle", "TechArticle"]),
};

export function hasCompatibleSchemaType(foundTypes, expectedType) {
  const accepted = SCHEMA_TYPE_EQUIVALENTS[expectedType] ?? new Set([expectedType]);
  return [...accepted].some((type) => foundTypes.has(type));
}
