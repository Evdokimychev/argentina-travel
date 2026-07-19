---
id: gosudarstvennye-prilozheniya
type: guide
subtype: communication
title: "Mi Argentina: государственные цифровые документы"
summary: "Что можно увидеть в Mi Argentina, как работает цифровое водительское удостоверение и где искать документы автомобиля."
status: published
site_ready: true
site_sections: [zhizn-v-strane, pereezd-v-argentinu]
applies_to: relocant
tags: [Mi Argentina, документы, водительские права, автомобиль]
related: [dni-cuil]
warnings:
  - "Набор доступных документов зависит от учётной записи, подтверждения личности и данных государственных реестров."
  - "Перед поездкой проверьте, открыт ли документ в приложении и не требуют ли правила конкретной ситуации бумажный оригинал."
recommendations:
  - "Установите официальное приложение только по ссылкам с Argentina.gob.ar и защитите доступ к телефону."
  - "Откройте QR-код цифровых прав заранее: после загрузки он может проверяться без интернета до 24 часов."
last_verified: "2026-07-17"
confidence: high
seo_slug: "mi-argentina-gosudarstvennye-dokumenty"
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 45
sources:
  - id: argentina-mi-argentina-app
    title: "Argentina.gob.ar — Mi Argentina"
    url: "https://www.argentina.gob.ar/aplicaciones/mi-argentina"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-10-31"
    note: "Официальное описание приложения, профиля гражданина и доступных цифровых credenciales."
  - id: argentina-digital-license-faq
    title: "Mi Argentina — preguntas frecuentes sobre licencia digital"
    url: "https://www.argentina.gob.ar/miargentina/servicios/licencia/preguntas-frecuentes"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-09-30"
    note: "Официальные ответы о действительности цифровых прав и сроке автономной проверки QR-кода."
  - id: argentina-vehicle-documents
    title: "Mi Argentina — Los papeles de tu vehículo"
    url: "https://www.argentina.gob.ar/miargentina/servicios/papeles-del-vehiculo"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-10-31"
    note: "Перечень автомобильных документов, доступных через Mi Argentina."
claims:
  - id: mi-argentina-digital-credentials
    text: "Mi Argentina объединяет профиль гражданина, государственные процедуры и доступные пользователю цифровые credenciales."
    sensitive: true
    source_ids: [argentina-mi-argentina-app]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: digital-license-qr-offline-validity
    text: "После обновления QR-кода цифровое водительское удостоверение может быть предъявлено без подключения к интернету в течение 24 часов."
    sensitive: true
    source_ids: [argentina-digital-license-faq]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: mi-argentina-vehicle-documents
    text: "В Mi Argentina могут отображаться цифровая cédula автомобиля, данные страховки и техосмотра, если они доступны в государственных реестрах."
    sensitive: true
    source_ids: [argentina-vehicle-documents]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Что такое Mi Argentina

Mi Argentina — официальный цифровой профиль для взаимодействия с государственными сервисами. В нём могут отображаться документы и credenciales, связанные с подтверждённой личностью пользователя. Доступный набор зависит от реестров и статуса учётной записи, поэтому приложение не следует описывать как одинаковое для каждого туриста или резидента.

## Водительские права

Если цифровая licencia de conducir доступна в профиле, её проверяют по QR-коду. Официальная справка указывает, что после обновления код можно предъявлять без интернета в течение 24 часов. Перед дорогой откройте приложение и убедитесь, что документ действителен.

## Документы автомобиля

В разделе автомобиля могут отображаться cédula, сведения о страховке и техосмотре. Проверяйте требования конкретной поездки отдельно: цифровой документ в приложении не отменяет иных обязательных документов или правил пересечения границы.

## Источники

- [Официальное приложение Mi Argentina](https://www.argentina.gob.ar/aplicaciones/mi-argentina).
- [Ответы о цифровых водительских правах](https://www.argentina.gob.ar/miargentina/servicios/licencia/preguntas-frecuentes).
- [Документы автомобиля в Mi Argentina](https://www.argentina.gob.ar/miargentina/servicios/papeles-del-vehiculo).
