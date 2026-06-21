# Image audit report

Generated: 2026-06-21T05:47:53.096Z

## Summary

| Metric | Count |
| --- | ---: |
| Unique image URLs | 145 |
| Total references | 190 |
| Unsplash | 85 |
| Wikimedia | 58 |
| Local /media | 0 |
| Other external | 2 |
| Duplicate URL groups | 26 |

## Recommendations

| Action | URLs |
| --- | ---: |
| KEEP | 56 |
| REPLACE (duplicate or stock) | 25 |
| IMPROVE (migrate to media library) | 62 |
| ADD (missing local asset) | 0 |

## Duplicate URLs

### `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` (5 files)

- **Recommendation:** REVIEW
- **Type:** external
- src/components/guide/hub/DomesticRoutesMap.tsx
- src/components/map/ArgentinaMapCanvas.tsx
- src/components/marketplace/ToursCatalogMap.tsx
- src/components/places/PlaceDetailMap.tsx
- src/components/places/PlacesCatalogMap.tsx

### `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80` (5 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/marketplace-tours.ts
- src/data/organizer-tours.ts
- src/data/tour-details/patagonia.ts
- src/data/tours.ts
- src/lib/bookings-store.ts

### `https://images.unsplash.com/photo-1558980664-1db756751b1a?w=800&q=80` (5 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/marketplace-tours.ts
- src/data/organizer-tours.ts
- src/data/tour-impressions-defaults.ts
- src/data/tours.ts
- src/lib/bookings-store.ts

### `https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&q=80` (5 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/marketplace-tours.ts
- src/data/organizer-tours.ts
- src/data/tour-details/patagonia.ts
- src/data/tours.ts
- src/lib/waitlist-store.ts

### `https://images.unsplash.com/photo-1506377247377-2ecb89819a88?w=800&q=80` (4 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/marketplace-tours.ts
- src/data/organizer-tours.ts
- src/data/tours.ts
- src/lib/bookings-store.ts

### `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80` (3 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/marketplace-tours.ts
- src/data/tour-details/patagonia.ts
- src/data/tours.ts

### `https://images.unsplash.com/photo-1516026672322-bc52c61a55d5?w=800&q=80` (3 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/marketplace-tours.ts
- src/data/tour-impressions-defaults.ts
- src/data/tours.ts

### `https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80` (3 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/marketplace-tours.ts
- src/data/tour-details/patagonia.ts
- src/data/tours.ts

### `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80` (3 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/tour-accommodation-defaults.ts
- src/data/tour-accommodation-seeds.ts
- src/data/tour-details/patagonia.ts

### `https://images.unsplash.com/photo-1589909202800-2f2e1b8a4b8e?w=800&q=80` (3 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/marketplace-tours.ts
- src/data/organizer-tours.ts
- src/data/tours.ts

### `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/marketplace-tours.ts
- src/data/tour-extra.ts

### `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/join-page.ts
- src/data/tour-guides-defaults.ts

### `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/tours.ts
- src/lib/organizer-tour-store.ts

### `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/marketplace-tours.ts
- src/data/tour-extra.ts

### `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/join-page.ts
- src/data/tour-guides-defaults.ts

### `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/marketplace-tours.ts
- src/data/tour-extra.ts

### `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/join-page.ts
- src/data/tour-guides-defaults.ts

### `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/marketplace-tours.ts
- src/data/tour-extra.ts

### `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/marketplace-tours.ts
- src/data/tour-extra.ts

### `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/join-page.ts
- src/data/tour-guides-defaults.ts

### `https://images.unsplash.com/photo-1519682337058-a94d51933763?w=800&q=80` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/tour-details/patagonia.ts
- src/data/tours.ts

### `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/tour-accommodation-seeds.ts
- src/data/tour-details/patagonia.ts

### `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/marketplace-tours.ts
- src/data/tour-extra.ts

### `https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/tour-impressions-defaults.ts
- src/data/tours.ts

### `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/tour-accommodation-seeds.ts
- src/data/tour-details/patagonia.ts

### `https://images.unsplash.com/photo-1589182370481-0de83087320f?w=800&q=80` (2 files)

- **Recommendation:** REPLACE
- **Type:** unsplash
- src/data/tour-details/patagonia.ts
- src/data/tours.ts

## Remaining Unsplash URLs

Migrate these to `src/data/media-library/manifest.json` and `media-resolver`.

- **REPLACE** `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80…` (5 refs)
- **REPLACE** `https://images.unsplash.com/photo-1558980664-1db756751b1a?w=800&q=80…` (5 refs)
- **REPLACE** `https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&q=80…` (5 refs)
- **REPLACE** `https://images.unsplash.com/photo-1506377247377-2ecb89819a88?w=800&q=80…` (4 refs)
- **REPLACE** `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80…` (3 refs)
- **REPLACE** `https://images.unsplash.com/photo-1516026672322-bc52c61a55d5?w=800&q=80…` (3 refs)
- **REPLACE** `https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80…` (3 refs)
- **REPLACE** `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80…` (3 refs)
- **REPLACE** `https://images.unsplash.com/photo-1589909202800-2f2e1b8a4b8e?w=800&q=80…` (3 refs)
- **REPLACE** `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=fac…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=fac…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=fac…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=fac…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1519682337058-a94d51933763?w=800&q=80…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80…` (2 refs)
- **REPLACE** `https://images.unsplash.com/photo-1589182370481-0de83087320f?w=800&q=80…` (2 refs)
- **IMPROVE** `https://images.unsplash.com/photo-${photoId}?w=${width}&q=85&fit=crop&auto=format&fm=jpg…` (1 refs)
- **IMPROVE** `https://images.unsplash.com/photo-1432407692633-884d652312ea?w=800&q=80…` (1 refs)
- **IMPROVE** `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80…` (1 refs)
- **IMPROVE** `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80…` (1 refs)
- **IMPROVE** `https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1200&q=80…` (1 refs)

## All URLs by recommendation

### KEEP (56)

- `https://upload.wikimedia.org/wikipedia/commons/0/05/Vista_a%C3%A9rea_de_Bariloche_y_la_Catedral.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/0/06/Salta-Square1.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/0/0a/Cerro_de_los_siete_colores.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/1/16/Catedral_desde_el_Lago_Nahuel_Huapi_-_panoramio.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/1/1d/Cueva_de_las_Manos.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/1/1d/Escalonadas_Lakes.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/1/1e/153_-_Glacier_Perito_Moreno_-_Grotte_glaciaire_-_Janvier_2010.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/1/1e/Puerto_Madero%2C_Buenos_Aires_%2840689219792%29_%28cropped%29.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/1/1f/SantaCruz-CuevaManos-P2210079b.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/2/2a/Museo_castagnino.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/2/2c/Iguazu_D%C3%A9cembre_2007_-_Panorama_7.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/2/2d/Peninsula_Vald%C3%A9s_STS-68.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/3/33/El_Calafate_%2825825005237%29.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/3/3a/Vista_de_Puerto_Madryn%2C_Argentina.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/4/40/Jujuy-Purmamarca-P3120100.JPG` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/4/45/Asado_argentino.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/4/47/El_Chalt%C3%A9n.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/4/48/Cerro_de_los_7_colores.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/5/53/Downtown_Mendoza.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/5/54/Panor%C3%A1mica_Ciudad_de_Salta.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/5/5c/Perito_Moreno_Glacier_Patagonia_Argentina_Luca_Galuzzi_2005.JPG` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/5/5f/Casa_Beban_%2815952733035%29.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/5/5f/Salta_Cathedral.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/5/5f/Vignoble_Mendoza_Argentine.jpg` — 1 file(s), wikimedia
- `https://upload.wikimedia.org/wikipedia/commons/7/72/Iglesia_San_Francisco%2C_Salta%2C_Argentina_-_panoramio.jpg` — 1 file(s), wikimedia
- … and 31 more

### REPLACE (25)

- `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80` — 5 file(s), unsplash
- `https://images.unsplash.com/photo-1558980664-1db756751b1a?w=800&q=80` — 5 file(s), unsplash
- `https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&q=80` — 5 file(s), unsplash
- `https://images.unsplash.com/photo-1506377247377-2ecb89819a88?w=800&q=80` — 4 file(s), unsplash
- `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80` — 3 file(s), unsplash
- `https://images.unsplash.com/photo-1516026672322-bc52c61a55d5?w=800&q=80` — 3 file(s), unsplash
- `https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80` — 3 file(s), unsplash
- `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80` — 3 file(s), unsplash
- `https://images.unsplash.com/photo-1589909202800-2f2e1b8a4b8e?w=800&q=80` — 3 file(s), unsplash
- `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1519682337058-a94d51933763?w=800&q=80` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80` — 2 file(s), unsplash
- `https://images.unsplash.com/photo-1589182370481-0de83087320f?w=800&q=80` — 2 file(s), unsplash

### IMPROVE (62)

- `https://commons.wikimedia.org/w/api.php` — 1 file(s), wikimedia
- `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title` — 1 file(s), wikimedia
- `https://images.unsplash.com/photo-${photoId}?w=${width}&q=85&fit=crop&auto=format&fm=jpg` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1432407692633-884d652312ea?w=800&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1200&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1441986300917-64676bd600d8?w=1920&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1474722883778-792e2790302b?w=800&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1474722883778-792e7990302f?w=1200&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1483728642387-6bc3bd38dafc?w=1920&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1506377247377-2ccd5a1b6b4a?w=800&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1506377247377-2ccd5a1b6d19?w=1200&q=80` — 1 file(s), unsplash
- `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80` — 1 file(s), unsplash
- … and 37 more

### REVIEW (2)

- `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` — 5 file(s), external
- `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png` — 1 file(s), external
