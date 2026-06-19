import Image from "next/image";
import Link from "next/link";
import PlaceCard from "@/components/places/PlaceCard";
import type { PlaceCollection } from "@/types/place";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

export default function CollectionDetailView({ collection }: { collection: PlaceCollection }) {
  return (
    <article className="pb-16">
      <div className="relative aspect-[21/9] min-h-[200px] w-full overflow-hidden bg-charcoal">
        {collection.coverImage ? (
          <Image src={collection.coverImage} alt={collection.title} fill className="object-cover" priority sizes="100vw" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 to-charcoal/20" />
        <div className={cn(siteContainerClass, "relative flex h-full flex-col justify-end pb-8 pt-16")}>
          <Link href="/collections" className="text-sm text-white/70 hover:text-white">
            ← Все подборки
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">{collection.title}</h1>
          {collection.subtitle ? (
            <p className="mt-1 text-lg text-white/85">{collection.subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className={cn(siteContainerClass, "mt-8")}>
        <p className="max-w-3xl text-base leading-relaxed text-charcoal">{collection.description}</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collection.places.map((place) => (
            <PlaceCard key={place.slug} place={place} />
          ))}
        </div>
      </div>
    </article>
  );
}
