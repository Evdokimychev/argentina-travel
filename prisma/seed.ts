import { PrismaClient } from "@prisma/client";
import {
  COLLECTIONS_SEED,
  ITINERARIES_SEED,
  PLACES_SEED,
} from "../src/data/places-seed";
import { placeCategoryToPrisma, placeSourceToPrisma } from "../src/lib/places-mapper";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding places knowledge base…");

  for (const place of PLACES_SEED) {
    await prisma.place.upsert({
      where: { slug: place.slug },
      create: {
        slug: place.slug,
        name: place.name,
        shortDescription: place.shortDescription,
        fullDescription: place.fullDescription,
        category: placeCategoryToPrisma(place.category),
        region: place.region,
        province: place.province,
        city: place.city,
        latitude: place.latitude,
        longitude: place.longitude,
        gallery: place.gallery,
        coverImage: place.coverImage,
        tags: place.tags,
        rating: place.rating,
        visitDuration: place.visitDuration,
        season: place.season,
        ticketPrice: place.ticketPrice,
        website: place.website,
        source: placeSourceToPrisma(place.source),
        popularity: place.popularity,
      },
      update: {
        name: place.name,
        shortDescription: place.shortDescription,
        fullDescription: place.fullDescription,
        popularity: place.popularity,
      },
    });
  }

  const placeIdBySlug = new Map(
    (await prisma.place.findMany({ select: { id: true, slug: true } })).map((p) => [
      p.slug,
      p.id,
    ]),
  );

  for (const col of COLLECTIONS_SEED) {
    const collection = await prisma.collection.upsert({
      where: { slug: col.slug },
      create: {
        slug: col.slug,
        title: col.title,
        subtitle: col.subtitle,
        description: col.description,
        coverImage: col.coverImage,
        tags: col.tags,
      },
      update: {
        title: col.title,
        description: col.description,
      },
    });

    await prisma.collectionPlace.deleteMany({ where: { collectionId: collection.id } });

    for (let i = 0; i < col.placeSlugs.length; i++) {
      const placeId = placeIdBySlug.get(col.placeSlugs[i]);
      if (!placeId) continue;
      await prisma.collectionPlace.create({
        data: {
          collectionId: collection.id,
          placeId,
          sortOrder: i,
        },
      });
    }
  }

  for (const it of ITINERARIES_SEED) {
    const itinerary = await prisma.itinerary.upsert({
      where: { slug: it.slug },
      create: {
        slug: it.slug,
        title: it.title,
        subtitle: it.subtitle,
        description: it.description,
        coverImage: it.coverImage,
        durationDays: it.durationDays,
        season: it.season,
        difficulty: it.difficulty,
        tags: it.tags,
      },
      update: {
        title: it.title,
        description: it.description,
      },
    });

    await prisma.itineraryStop.deleteMany({ where: { itineraryId: itinerary.id } });

    for (const stop of it.stops) {
      await prisma.itineraryStop.create({
        data: {
          itineraryId: itinerary.id,
          placeId: stop.placeSlug ? placeIdBySlug.get(stop.placeSlug) : undefined,
          dayNumber: stop.dayNumber,
          sortOrder: stop.sortOrder,
          title: stop.title,
          description: stop.description,
        },
      });
    }
  }

  console.log(`Seeded ${PLACES_SEED.length} places, ${COLLECTIONS_SEED.length} collections, ${ITINERARIES_SEED.length} itineraries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
