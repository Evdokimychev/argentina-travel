import type { JsonLdGraph } from "@/lib/schema-json-ld";
import { serializeJsonLd } from "@/lib/schema-json-ld";

type Props = {
  data: JsonLdGraph | JsonLdGraph[];
};

export default function JsonLdScript({ data }: Props) {
  const blocks = Array.isArray(data) ? data : [data];

  return (
    <>
      {blocks.map((block, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(block) }}
        />
      ))}
    </>
  );
}
