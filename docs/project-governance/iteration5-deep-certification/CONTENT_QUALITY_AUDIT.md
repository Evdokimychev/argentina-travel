# Content Quality Audit — Iteration 5

## Inventory (source, not a full CMS dump)

Public content types: Guide, Knowledge Base, Blog, Places, Destinations, static landings. CMS cutover flags default false — production HTML is largely static/reviewed overlay.

Live visa FAQ `/baza-znaniy/viza-rf-v-argentinu` still **200** with title «Нужна ли виза в Аргентину гражданам России?». Canonical in candidate is `/baza-znaniy/viza-i-granica-dlya-rossiyan` (I2 308). This is temporal-sensitivity content served as current on the old SHA.

## Automated markers in repo

Editorial readiness already rejects TODO/TBD/lorem in guide/blog/KB publication quality. I5 TODO pass found **1** product TODO (`organizer-canonical-stats.ts` — move stats to CMS) and **4** test fixtures. No new security TODO.

## Architecture split

| Section | Intended use | I5 note |
|---------|--------------|---------|
| Guide | How to travel / prepare | Keep practical, dated where rules change |
| KB | Fact cards, visas, money | High temporal sensitivity |
| Blog | Narrative / seasonal | Optional catalog embeds fail soft (I4) |
| Places | Geography SSOT | Map 192 objects live from editorial |

No mass rewrite. I5 did not move articles between sections.

## Freshness

I4 already renewed three BNA money FAQ windows after a live URL 200. I5 re-confirms: visa archive redirect is **still not live**. Do not treat old visa FAQ as timeless truth after deploy of I2+.

## Media

No live broken-media crawl of every asset (egress/account). Representative map objects use `/media/places/.../hero.jpg`. Image semantic mismatches need a healthy catalog + visual pass after deploy.

## Internal links

Search dialog recommendations (guide, KB, destinations, places) are intent-based, not keyword-stuffed. I5 did not add SEO blocks.
