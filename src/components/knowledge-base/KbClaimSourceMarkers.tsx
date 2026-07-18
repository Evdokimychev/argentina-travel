export interface KbPublicSourceReference {
  number: number;
  title: string;
  url: string;
}

export interface KbPublicClaim {
  text: string;
  normalizedText: string;
  sources: KbPublicSourceReference[];
  verifiedAt?: string;
  reviewerRole?: string;
}

export function KbClaimSourceMarkers({ claim }: { claim: KbPublicClaim }) {
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1 align-baseline">
      {claim.sources.map((source) => (
        <a
          key={source.number}
          href={`#kb-source-${source.number}`}
          className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-sky-pale px-1.5 text-2xs font-semibold text-sky-ink no-underline ring-1 ring-inset ring-sky/25 hover:bg-sky/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
          aria-label={`Источник ${source.number}: ${source.title}`}
          title={source.title}
        >
          {source.number}
        </a>
      ))}
    </span>
  );
}
