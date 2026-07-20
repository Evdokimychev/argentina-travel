---
id: raskhozhdeniya-dni-cuit-cuil
type: guide
subtype: immigration
title: "Расхождения в DNI, CUIL и CUIT: куда обращаться"
summary: "Ошибки исправляют в ведомстве, которое ведёт конкретную запись: CUIL и персональные данные — через ANSES, CUIT и налоговые данные — через ARCA."
status: archived
site_ready: false
redirect_to: gid-po-dokumentam
archive_reason: "Частный сценарий объединён с проверенным руководством по документам и административным обращениям."
site_sections: [dokumenty-i-legalizatsiya, pereezd-v-argentinu]
applies_to: relocant
tags: [DNI, CUIL, CUIT, ANSES, ARCA]
related: [dni-cuil, bankovskij-schet]
warnings:
  - "Не создавайте второй CUIL или CUIT, чтобы обойти ошибку: дубликат усложняет трудовую, банковскую и налоговую историю."
recommendations:
  - "Сохраните скриншот ошибки и подготовьте DNI, паспорт, constancia и подтверждения корректных данных."
last_verified: "2026-07-17"
confidence: high
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 45
sources:
  - id: anses-cuil-unification
    title: "ANSES — Generación de CUIL y solicitud de unificación"
    url: "https://www.anses.gob.ar/generacion-de-cuil-solicitud-de-unificacion"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
  - id: anses-personal-data
    title: "ANSES — Acreditación de datos personales y familiares"
    url: "https://www.anses.gob.ar/tramite/acreditacion-de-datos-personales-y-familiares"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
  - id: arca-person-data-update
    title: "ARCA — actualización y corrección de datos registrales"
    url: "https://www.arca.gob.ar/presentaciones-digitales/documentos/actualizacion-y-correccion-de-datos-registrales.pdf"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
claims:
  - id: anses-handles-cuil-data
    text: "ANSES ведёт процедуры объединения CUIL и подтверждения персональных данных."
    sensitive: true
    source_ids: [anses-cuil-unification, anses-personal-data]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: arca-handles-tax-data
    text: "Корректировка налоговых регистрационных данных CUIT направляется в ARCA через предусмотренные сервисы."
    sensitive: true
    source_ids: [arca-person-data-update]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Сначала найдите источник ошибки

Сравните DNI, constancia de CUIL, данные ARCA, банковский профиль и трудовые документы. Запишите, где именно отличаются имя, дата рождения, номер документа или сам идентификатор.

- **CUIL, объединение временного и окончательного номера, персональные данные ANSES** — зона ANSES.
- **CUIT, налоговый адрес и регистрационные данные налогоплательщика** — зона ARCA.
- **Ошибка в самом DNI** — сначала уточняйте исправление документа в RENAPER.

## Безопасный порядок

1. Не создавайте новый номер.
2. Соберите документ, где данные верны, и constancia с ошибкой.
3. Подайте запрос в ответственное ведомство по его официальной процедуре.
4. После исправления снова скачайте constancia и отдельно проверьте банки, работодателя и налоговый профиль.

Синхронизация между системами не всегда происходит одновременно. Храните подтверждение обращения и не считайте ошибку закрытой, пока корректные данные не появились в сервисе, который вам нужен.

## Источники

- [ANSES — создание и объединение CUIL](https://www.anses.gob.ar/generacion-de-cuil-solicitud-de-unificacion)
- [ANSES — подтверждение персональных данных](https://www.anses.gob.ar/tramite/acreditacion-de-datos-personales-y-familiares)
- [ARCA — корректировка регистрационных данных](https://www.arca.gob.ar/presentaciones-digitales/documentos/actualizacion-y-correccion-de-datos-registrales.pdf)
