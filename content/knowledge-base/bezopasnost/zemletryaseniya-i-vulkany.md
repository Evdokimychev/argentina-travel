---
id: zemletryaseniya-i-vulkany
type: guide
subtype: safety
title: "Землетрясения, вулканы и природные риски Аргентины"
title_es: "Terremotos y volcanes"
aliases: ["землетрясения Аргентина", "вулканы Аргентины", "сейсмика", "почему растут Анды", "Сан-Хуан 1944", "пепел вулкана", "природные катастрофы"]
summary: "Где сосредоточена сейсмическая опасность, как вулканический пепел влияет на Патагонию и какие официальные предупреждения нужны путешественнику."
status: archived
site_ready: false
redirect_to: bezopasnost-argentina
archive_reason: "Короткий обзор природных рисков объединён с проверенным руководством по безопасности."
site_sections: [zhizn-v-strane, puteshestviya-po-argentine]
applies_to: both
tags: [безопасность, природа, землетрясения, вулканы]
media:
  hero:
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/J28_085_Volc%C3%A1n_Lan%C3%ADn.jpg/1920px-J28_085_Volc%C3%A1n_Lan%C3%ADn.jpg"
    alt: "Вулкан Ланин на границе Аргентины и Чили"
    author: "Указан на странице файла Wikimedia Commons"
    license: "CC BY-SA 4.0"
    source_page: "https://commons.wikimedia.org/wiki/File:J28_085_Volc%C3%A1n_Lan%C3%ADn.jpg"
warnings:
  - "Наибольшая сейсмическая опасность сосредоточена на северо-западе и в центрально-западной части страны; низкая опасность не означает её полного отсутствия."
  - "Пепел андских вулканов способен нарушить движение по дорогам и работу аэропортов в Патагонии."
  - "Безопасность здания зависит от проекта, возраста, состояния и соблюдения норм; одной географии недостаточно."
recommendations:
  - "Для поездки использовать сообщения INPRES, SINAGIR, SEGEMAR и местной гражданской защиты."
  - "При вулканической тревоге следовать официальным указаниям и не ехать в закрытую зону."
  - "В сейсмическом регионе заранее знать безопасные места и порядок выхода из здания."
last_verified: "2026-07-17"
confidence: high
seo_slug: "zemletryaseniya-i-vulkany-argentiny"
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 45
sources:
  - id: inpres-argentina-seismicity
    title: "INPRES — сейсмичность Аргентинской Республики"
    url: "https://www.argentina.gob.ar/inpres/docentes-y-alumnos/sismicidad-de-la-republica-argentina"
    lang: es
    type: official
    authority: primary
    checked_at: "2026-07-17"
    url_status: verified
    expires_at: "2027-07-17"
    note: "Описывает распределение сейсмичности, пологую субдукцию плиты Наска и официальные параметры исторических землетрясений."
  - id: inpres-historical-earthquakes
    title: "INPRES — исторические землетрясения Аргентины"
    url: "https://www.argentina.gob.ar/inpres/docentes-y-alumnos/terremotos-historicos-ocurridos-en-la-republica-argentina"
    lang: es
    type: official
    authority: primary
    checked_at: "2026-07-17"
    url_status: verified
    expires_at: "2027-07-17"
    note: "Подтверждает события 1861, 1944 и 1977 годов и их последствия."
  - id: conae-puyehue-2011
    title: "CONAE — извержение Puyehue–Cordón Caulle в 2011 году"
    url: "https://www.argentina.gob.ar/ciencia/conae/educacion-y-formacion-masiva/materiales-educativos/volcan-puyehue-chile-aqua-modis-6-de-junio-de-2011"
    lang: es
    type: official
    authority: primary
    checked_at: "2026-07-17"
    url_status: verified
    expires_at: "2027-07-17"
    note: "Фиксирует перенос пепла через Патагонию и приостановку авиасообщения."
  - id: sinagir-volcanic-eruption-guidance
    title: "SINAGIR — действия при вулканическом извержении"
    url: "https://www.argentina.gob.ar/sinagir/riesgos-frecuentes/que-es-un-volcan/que-hacer-en-caso-de-una-erupcion-volcanica"
    lang: es
    type: official
    authority: primary
    checked_at: "2026-07-17"
    url_status: verified
    expires_at: "2026-10-17"
    note: "Официальные рекомендации до, во время и после извержения."
claims:
  - id: argentina-seismicity-concentrated-west
    text: "INPRES указывает на концентрацию сейсмической активности на северо-западе и в центрально-западной части Аргентины и описывает пологую субдукцию плиты Наска в районе Куйо."
    sensitive: true
    source_ids: [inpres-argentina-seismicity]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: eastern-argentina-lower-seismic-hazard
    text: "INPRES относит восток Аргентины к более низким зонам сейсмической опасности, не исключая землетрясения полностью."
    sensitive: true
    source_ids: [inpres-argentina-seismicity]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: mendoza-earthquake-1861
    text: "INPRES датирует землетрясение в Мендосе 20 марта 1861 года, указывает магнитуду 7,0, интенсивность IX и около 6 000 погибших при населении примерно 18 000 человек."
    sensitive: true
    source_ids: [inpres-historical-earthquakes]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: san-juan-earthquake-1944
    text: "INPRES датирует землетрясение в Сан-Хуане 15 января 1944 года, указывает магнитуду 7,4, интенсивность IX, около 10 000 погибших и разрушение примерно 80% существовавших строений."
    sensitive: true
    source_ids: [inpres-historical-earthquakes]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: caucete-earthquake-1977
    text: "INPRES датирует землетрясение в Каусете 23 ноября 1977 года, указывает магнитуду 7,4, интенсивность IX, 65 погибших и более 300 тяжело раненых."
    sensitive: true
    source_ids: [inpres-historical-earthquakes]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: puyehue-complex-in-chile
    text: "Извержение комплекса Puyehue–Cordón Caulle происходило в Чили, а его пепел переносился на аргентинскую сторону Патагонии."
    sensitive: true
    source_ids: [conae-puyehue-2011]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: puyehue-ash-crossed-patagonia
    text: "CONAE зафиксировала перенос пепла Puyehue–Cordón Caulle через Патагонию и приостановку авиасообщения в 2011 году."
    sensitive: true
    source_ids: [conae-puyehue-2011]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: official-volcanic-eruption-guidance
    text: "SINAGIR рекомендует при вулканической тревоге следовать официальным указаниям, защищать дыхание и глаза от пепла и ограничивать его попадание в помещение."
    sensitive: true
    source_ids: [sinagir-volcanic-eruption-guidance]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Где выше сейсмическая опасность

INPRES указывает, что основная сейсмическая активность сосредоточена на северо-западе и в центрально-западной части Аргентины. В районе Куйо контакт плит Наска и Южноамериканской показывает пологий участок субдукции, связанный с заметной активностью в Сан-Хуане и Мендосе.

Восток страны относится к более низким зонам опасности, но формулировка «землетрясений нет» неверна. Для конкретного адреса используется карта зонирования INPRES, а для здания — данные о проекте и состоянии.

## Исторические землетрясения

- Мендоса, 20 марта 1861 года: магнитуда 7,0, интенсивность IX, около 6 000 погибших при населении примерно 18 000 человек.
- Сан-Хуан, 15 января 1944 года: магнитуда 7,4, интенсивность IX, около 10 000 погибших и разрушение примерно 80% существовавших строений.
- Каусете, 23 ноября 1977 года: магнитуда 7,4, интенсивность IX, 65 погибших и более 300 тяжело раненых.

Эти события объясняют значение сейсмостойкого проектирования, но не позволяют автоматически считать любое современное здание безопасным.

## Вулканы и пепел

Комплекс Puyehue–Cordón Caulle находится в Чили, однако во время его извержения в 2011 году пепел прошёл через аргентинскую Патагонию и привёл к приостановке воздушного движения в разных частях страны.

Пепел ухудшает видимость, влияет на дыхание и воду, повреждает технику и делает дороги опасными. При тревоге используются сообщения официальных служб, а не визуальная оценка путешественника.

## Что делать путешественнику

Перед поездкой в западные провинции и Патагонию полезно сохранить страницы INPRES, SINAGIR и местной гражданской защиты. При предупреждении важнее изменить маршрут, чем пытаться проехать в закрытую зону. При пеплопаде закрывают окна и вентиляцию, защищают дыхание и глаза и выполняют указания властей.

## Другие природные риски

Для пожаров, интенсивных осадков, наводнений, сильного ветра и жары перед каждой поездкой отдельно смотрят актуальные сообщения национальных и местных служб. Одна оценка на всю страну и весь год здесь не подходит.

## Связанные материалы

- [[bezopasnost-argentina|Безопасность в Аргентине]]
- [[klimat-po-regionam|Климат Аргентины по регионам]]
- [[mendoza|Мендоса]]
- [[san-huan|Сан-Хуан]]
