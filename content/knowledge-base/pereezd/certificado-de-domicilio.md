---
id: certificado-de-domicilio
type: guide
subtype: immigration
title: "Как подтвердить адрес в Аргентине"
summary: "В Аргентине нет одной справки об адресе для всех случаев: сначала уточните, какой документ принимает конкретное ведомство."
status: archived
site_ready: false
redirect_to: gid-po-dokumentam
archive_reason: "Карточка объединена с единым руководством по документам и подтверждению адреса."
site_sections: [dokumenty-i-legalizatsiya, pereezd-v-argentinu]
applies_to: relocant
tags: [документы, адрес, DNI, миграция]
related: [dni-cuil, vnzh-argentina]
warnings:
  - "Certificación de Domicilio RENAPER подтверждает адрес, заявленный при оформлении последнего DNI; она не заменяет любую справку, которую может потребовать другое ведомство."
recommendations:
  - "Скопируйте точное испанское название документа из официального перечня вашей процедуры."
  - "Проверьте, чтобы адрес был записан одинаково во всех формах и подтверждениях."
last_verified: "2026-07-17"
confidence: high
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 45
sources:
  - id: renaper-digital-certifications
    title: "RENAPER — Certificaciones digitales"
    url: "https://www.argentina.gob.ar/interior/renaper/certificaciones-digitales"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
  - id: renaper-certifications-service
    title: "Argentina.gob.ar — Solicitar certificaciones de RENAPER"
    url: "https://www.argentina.gob.ar/servicio/certificaciones"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
claims:
  - id: renaper-certifies-last-dni-address
    text: "Certificación de Domicilio RENAPER подтверждает адрес, указанный при оформлении последнего DNI."
    sensitive: true
    source_ids: [renaper-digital-certifications, renaper-certifications-service]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Как понять, что именно нужно

Фраза «подтверждение адреса» может означать разные документы. Для обладателя DNI RENAPER выдаёт цифровую Certificación de Domicilio: она подтверждает адрес, который был заявлен при оформлении последнего документа. Но Migraciones, банк, местный орган или учебное заведение могут принять иной документ либо потребовать собственную форму.

Перед оформлением уточните три вещи:

- точное название справки в официальном перечне;
- кто должен её выдать;
- насколько свежим должен быть документ.

## Практический порядок

1. Откройте требования принимающего ведомства.
2. Если указан RENAPER, используйте официальный сервис certificaciones.
3. Если указана справка местной полиции, registro civil или иной документ, следуйте правилам своей провинции или города.
4. Сверьте адрес до отправки: улицу, номер дома, этаж, квартиру, населённый пункт и провинцию.

Не заказывайте «универсальную справку» по совету из чата: документ может быть действительным, но не подходить для вашей процедуры. Стоимость и срок также проверяйте в официальном сервисе в день оформления.

## Источники

- [RENAPER — цифровые сертификаты](https://www.argentina.gob.ar/interior/renaper/certificaciones-digitales)
- [Argentina.gob.ar — оформление certificaciones RENAPER](https://www.argentina.gob.ar/servicio/certificaciones)
