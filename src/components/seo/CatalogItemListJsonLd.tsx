import JsonLdScript from "@/components/seo/JsonLdScript";

type Props = {
  data: Record<string, unknown>;
};

export default function CatalogItemListJsonLd({ data }: Props) {
  const list = data.itemListElement;
  if (!Array.isArray(list) || list.length === 0) return null;

  return <JsonLdScript data={data as never} />;
}
