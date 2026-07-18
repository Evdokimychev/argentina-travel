---
id: sistema-zdravoohraneniya
type: guide
subtype: health
title: "Система здравоохранения Аргентины: público, obra social и prepaga"
summary: "Как различать государственные учреждения, национальные obras sociales и частные prepagas и почему права иностранца на экстренную и плановую помощь нужно проверять отдельно."
status: published
site_ready: false
publication_block_reason: "Федеральная и провинциальная медицина, страховые программы и права иностранцев после Decreto 366/2025 требуют медицинско-правовой проверки по юрисдикциям."
diagnostic:
  code: healthcare-jurisdiction-review-required
  message: "Для публикации нужна медицинско-правовая матрица по типу помощи, миграционному статусу и юрисдикции учреждения."
site_sections: [zhizn-v-strane, pereezd-v-argentinu]
applies_to: both
tags: [медицина, страховка, больницы, релокация]
related: [medicina-i-strahovka, rody-i-beremennost]
warnings:
  - "Не обещайте бесплатную плановую помощь всем иностранцам: экстренная и обычная помощь регулируются по-разному."
  - "Номер 107 относится не ко всей стране; сохраняйте местный номер скорой и национальный 911."
recommendations:
  - "Перед плановым обращением уточняйте стоимость, направление, сеть и предварительное согласование у учреждения и страховщика."
  - "При экстренной ситуации обращайтесь за помощью независимо от миграционного статуса."
last_verified: "2026-07-17"
confidence: medium
seo_slug: "sistema-zdravoohraneniya-argentiny"
provenance:
  schema_version: 1
  mode: diagnostic
  stale_after_days: 45
sources:
  - id: argentina-decree-366-2025-health
    title: "Decreto 366/2025 — atención sanitaria"
    url: "https://www.boletinoficial.gob.ar/detalleAviso/primera/326096/1"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2027-07-17"
    note: "Различает экстренную и плановую помощь иностранцам и положение постоянных резидентов."
  - id: argentina-health-services-regulator
    title: "Superintendencia de Servicios de Salud"
    url: "https://www.argentina.gob.ar/sssalud"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-10-31"
    note: "Регулятор национальных obras sociales и entidades de medicina prepaga."
  - id: argentina-emergency-numbers
    title: "Argentina.gob.ar — экстренные номера"
    url: "https://www.argentina.gob.ar/tema/emergencias"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-10-31"
    note: "Национальный 911 и территориальные пояснения к медицинскому номеру 107."
claims:
  - id: emergency-care-cannot-be-refused
    text: "Decreto 366/2025 запрещает отказывать иностранцу в экстренной медицинской помощи независимо от миграционного статуса."
    sensitive: true
    source_ids: [argentina-decree-366-2025-health]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: sssalud-regulates-national-insurers
    text: "Superintendencia de Servicios de Salud контролирует национальные obras sociales и организации частной медицины prepaga."
    sensitive: true
    source_ids: [argentina-health-services-regulator]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: emergency-number-107-location-dependent
    text: "Официальный справочник указывает 911 как центральный экстренный номер, а 107 — как медицинский номер для CABA и отдельных населённых пунктов."
    sensitive: true
    source_ids: [argentina-emergency-numbers]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Три разных контура

- **Público** — государственные учреждения национального, провинциального или муниципального уровня.
- **Obra social** — страховое покрытие, обычно связанное с системой социальных взносов.
- **Prepaga** — добровольный частный план.

Superintendencia de Servicios de Salud регулирует национальные obras sociales и prepagas, но не превращает все учреждения страны в одну сеть.

## Иностранцы после Decreto 366/2025

Экстренную помощь нельзя отказать иностранцу из-за миграционного статуса. Постоянные резиденты имеют равный доступ к государственной системе. Для других иностранцев обычная помощь в учреждениях, управляемых национальным государством, связана со страховкой или предварительной оплатой. Правила конкретной провинции и учреждения нужно уточнять отдельно.

## Перед обращением

Проверьте сеть полиса, направление, франшизу, согласование и стоимость. Сохраните 911, местный номер скорой и контакт страховой службы помощи. Не используйте 107 как гарантированно единый номер всей страны.

## Источники

- [Decreto 366/2025](https://www.boletinoficial.gob.ar/detalleAviso/primera/326096/1).
- [Superintendencia de Servicios de Salud](https://www.argentina.gob.ar/sssalud).
- [Экстренные номера](https://www.argentina.gob.ar/tema/emergencias).
