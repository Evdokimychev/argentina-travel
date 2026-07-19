---
id: dni-cuil-cuit-putanitsa
type: author_tip
subtype: mistake
title: "CUIL, CUIT, CDI, AFIP/ARCA — путаница в названиях, которая стоит реального времени"
summary: "Часть рутинных ошибок при оформлении документов в Аргентине связана не с сутью процедур, а с тем, что старые статьи и привычки ссылаются на упразднённые названия и не различают похожие коды."
status: published
site_sections: [lichnyy-opyt, dokumenty-i-legalizatsiya]
tags: [документы, налоги]
personal_experience: false
verified_by_ivan: false
extracted_from: "../../Переезд-DNI-и-CUIL-пошагово.md"
related: [dni-cuil, bankovskij-schet]
last_verified: "2026-07-17"
confidence: high
site_ready: true
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 45
sources:
  - id: argentina-arca-creation-decree-953-2024
    title: "Decreto 953/2024 — создание ARCA и прекращение AFIP"
    url: "https://www.argentina.gob.ar/normativa/nacional/decreto-953-2024-405666/texto"
    lang: es
    type: official
    authority: primary
    checked_at: "2026-07-17"
    url_status: verified
    note: "Подтверждает прекращение AFIP, создание ARCA и правопреемство функций."
  - id: anses-cuil-foreign-workers
    title: "ANSES — оформление и объединение CUIL"
    url: "https://www.anses.gob.ar/generacion-de-cuil-solicitud-de-unificacion"
    lang: es
    type: official
    authority: primary
    checked_at: "2026-07-17"
    url_status: verified
    note: "Подтверждает временный CUIL иностранца для работы по найму и последующее объединение после получения DNI."
  - id: arca-cuit-cdi-registration
    title: "ARCA — CUIT и CDI"
    url: "https://www.arca.gob.ar/inscripcion/cuit-cdi/solicitud-cdi.asp"
    lang: es
    type: official
    authority: primary
    checked_at: "2026-07-17"
    url_status: verified
    note: "Подтверждает, что CDI не исчез полностью: ARCA сохраняет действующую процедуру для предусмотренных категорий."
  - id: argentina-foreign-resident-dni
    title: "RENAPER — DNI для иностранцев"
    url: "https://www.argentina.gob.ar/interior/dni/extranjeros"
    lang: es
    type: official
    authority: primary
    checked_at: "2026-07-17"
    url_status: verified
    note: "Подтверждает необходимость действующей временной или постоянной резиденции и правило 60 дней."
claims:
  - id: afip-replaced-by-arca
    text: "Decreto 953/2024 прекратил AFIP, создал ARCA и передал ей соответствующие функции."
    sensitive: true
    source_ids: [argentina-arca-creation-decree-953-2024]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: cdi-remains-available
    text: "ARCA сохраняет процедуру получения CDI для предусмотренных категорий заявителей."
    sensitive: true
    source_ids: [arca-cuit-cdi-registration]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: foreign-worker-cuil-unification
    text: "ANSES предусматривает временный CUIL для иностранного работника и последующее объединение записей после получения DNI."
    sensitive: true
    source_ids: [anses-cuil-foreign-workers]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: foreign-dni-residence-condition
    text: "DNI иностранца требует действующей временной или постоянной резиденции, которая не истекает в ближайшие 60 дней."
    sensitive: true
    source_ids: [argentina-foreign-resident-dni]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Текст

Часть сложностей с аргентинскими документами не в самой бюрократии, а в похожих сокращениях и старых названиях. AFIP действительно прекращена, а её правопреемник называется ARCA. При этом CDI нельзя считать «отменённым»: ARCA по-прежнему публикует процедуру его получения для предусмотренных категорий. Нужный идентификатор зависит от цели и статуса заявителя.

Для иностранца, который собирается работать по трудовому договору, ANSES предусматривает временный CUIL после оформления миграционных документов; после получения DNI оформляют окончательный CUIL и объединяют записи. CUIT относится к регистрации в налоговой системе, а CDI сохраняется для предусмотренных ARCA ситуаций. Требования конкретного банка или сервиса проверяйте непосредственно у этой организации.

DNI иностранца оформляют после получения временной или постоянной резиденции. Если резиденции нет, она истекла или истекает в ближайшие 60 дней, сначала нужно урегулировать статус в Migraciones. Precaria подтверждает законность пребывания во время рассмотрения резиденции, но сама по себе не заменяет одобренную временную или постоянную резиденцию для этого DNI.

## Источники

- [Decreto 953/2024 — создание ARCA](https://www.argentina.gob.ar/normativa/nacional/decreto-953-2024-405666/texto)
- [ANSES — CUIL для иностранцев](https://www.anses.gob.ar/generacion-de-cuil-solicitud-de-unificacion)
- [ARCA — CUIT и CDI](https://www.arca.gob.ar/inscripcion/cuit-cdi/solicitud-cdi.asp)
- [RENAPER — DNI для иностранцев](https://www.argentina.gob.ar/interior/dni/extranjeros)

## Связанные объекты

- [[dni-cuil|DNI и CUIL/CUIT в Аргентине: пошагово для иностранца]] — пошаговый гайд по оформлению DNI и CUIL/CUIT.
- [[bankovskij-schet|Банковский счёт и финансы релоканта в Аргентине]] — банковский счёт, для которого нужны те же коды.
