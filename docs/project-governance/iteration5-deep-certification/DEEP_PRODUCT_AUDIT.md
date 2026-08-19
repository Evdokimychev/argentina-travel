# Deep Product Audit — Iteration 5 (Passes B, D)

## First-time user (homepage, live SHA `81055b13`)

| Question | Live answer |
|----------|-------------|
| What is this? | Title: «Авторские туры по Аргентине — Патагония, Буэнос-Айрес, Мендоса». H1: «Аргентина — от ледников Патагонии до танго Буэнос-Айреса». |
| Who is it for? | Russian-speaking travelers; copy is coherent without internal jargon. |
| Where to click? | Guide, places, tours, excursions, KB, contacts — chrome is understandable. |
| What can I book? | Marketplace is named; live `/api/tours` and `/api/excursions` are 503. HTML shells still 200. |

Homepage IA is not the bottleneck. Trust is: catalog APIs are down while pages still render.

## Returning user

No dedicated `/search` page (404). Search is a dialog (`SiteSearch` + `/api/search`). Deep links to place/article/tour work as URLs; tour/excursion **details** cannot be proven live because catalogs are 503.

## Public route sample (live)

| URL | Status | Note |
|-----|--------|------|
| `/` | 200 | Shell + editorial |
| `/tours` | 200 | Copy includes «попробуйте»; I4 unavailable-first UI not deployed |
| `/excursions` | 200 | Same |
| `/places` | 200 | |
| `/baza-znaniy` | 200 | |
| `/blog` | 200 | |
| `/guide` | 200 | |
| `/contacts` | 200 | |
| `/mapa-argentina` | 200 | Map objects 192 editorial |
| `/search?q=iguazu` | 404 | No results page — dialog only |
| `/TOURS` | 404 | Case-sensitive |
| `/tours/` | 308 → `/tours` | |
| `/places/USHUAIA` | 200 | Next folds slug; content still Ushuaia |
| `/baza-znaniy/viza-rf-v-argentinu` | 200 | I2 308 not live |
| `/st_location/ushuaia` | 404 | I2 hub redirect not live |
| `/admin` | 307 → sign-in | Gate works |
| `/organizer` | 307 → sign-in | Gate works |
| Apex `goargentina.ru` | 308 → www | |

## Mobile / tablet / large desktop

No Cloud browser session in this pass. Source review: cabinet and catalog already have 390-oriented I2/I4 tests; I5 did not claim visual PASS. Representative CSS risk remains at ~768/820 (tablet) for organizer tables — not treated as P0.

## Dead / misleading CTA

| Surface | Finding |
|---------|---------|
| Search dialog → catalog | «Показать туры в каталоге» goes to `/tours?query=`. Live tours API 503. |
| Search API failure | Pre-I5: chrome silently switched to static index. I5: visible notice. |
| Organizer dashboard | Pre-I5: remote failure → empty list → onboarding «создайте первый тур». I5: alert, no false onboarding. |
| Dormant shop/forum | Launch-clamped; not offered in default nav (I2/S7). |

## Conversion friction

Native booking + partner handoff remain the two commercial paths. Extra steps were not added. Live persist is **NOT_PROVEN**. Do not optimize a checkout that cannot write.

## Trust

- Stale visa FAQ still 200 on production.
- Marketplace counts on live HTML are not trustworthy while APIs 503.
- Map geography 200/192 is editorial and acceptable.
- Search 500 empty body is a trust + conversion defect (fixed in candidate, not live).
