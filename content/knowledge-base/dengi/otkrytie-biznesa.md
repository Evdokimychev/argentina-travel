---
id: otkrytie-biznesa
type: guide
subtype: finance
title: "Открытие бизнеса в Аргентине: выбор формы и проверка требований"
title_es: "Abrir un negocio"
aliases: ["открыть бизнес Аргентина", "самозанятость", "SAS", "SRL", "регистрация компании"]
summary: "Безопасный порядок выбора между личной деятельностью и компанией, с учётом юрисдикции регистрации, миграционного статуса, налогов и банковской проверки."
status: published
site_ready: false
publication_block_reason: "Учредительство иностранца, органы компании, капитал, сроки и налоговый режим зависят от формы, провинции и статуса; нужен совместный review contador и корпоративного юриста."
diagnostic:
  code: business-formation-legal-review-required
  message: "Для публикации нужен сценарный review по организационной форме, юрисдикции, миграционному статусу и налоговому режиму."
site_sections: [finansy-i-ekonomika, pereezd-v-argentinu]
applies_to: relocant
tags: [бизнес, самозанятость, налоги, документы]
related: [nalogi-i-monotributo, bankovskij-schet]
warnings:
  - "Не регистрируйте SAS, SRL или SA только по обещанию фиксированного срока и цены: требования и регистр зависят от юрисдикции."
  - "Регистрация компании не создаёт автоматически миграционное право работать, банковский счёт или налоговую льготу."
recommendations:
  - "До оплаты услуг письменно определите деятельность, собственников, управление, юрисдикцию, налоги и банковский маршрут."
  - "Проверяйте полномочия посредника и просите официальный номер процедуры."
last_verified: "2026-07-17"
confidence: medium
seo_slug: "otkrytie-biznesa-v-argentine"
provenance:
  schema_version: 1
  mode: diagnostic
  stale_after_days: 45
sources:
  - id: igj-sas-preparation
    title: "IGJ — что учесть перед созданием SAS"
    url: "https://www.argentina.gob.ar/justicia/igj/lo-que-tenes-que-tener-en-cuenta-antes-de-crear-una-sas"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-10-31"
    note: "Официальные требования IGJ к органам и процедуре SAS в её юрисдикции."
  - id: igj-urgent-company-registration
    title: "IGJ — срочная регистрация SA, SAU и SRL"
    url: "https://www.argentina.gob.ar/justicia/igj/sociedades-urgentes"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-10-31"
    note: "Описывает отдельный срочный режим IGJ и условие отсутствия замечаний."
  - id: arca-monotributo-categories-2026
    title: "ARCA — действующие категории monotributo"
    url: "https://arca.gob.ar/monotributo/categorias.asp"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-08-31"
    note: "Текущие параметры упрощённого режима для сравнения с корпоративной формой."
claims:
  - id: igj-sas-requires-defined-roles
    text: "Официальная инструкция IGJ для SAS требует заранее определить участников, администратора, юридический адрес и иные данные процедуры."
    sensitive: true
    source_ids: [igj-sas-preparation]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: igj-urgent-process-is-conditional
    text: "Срочная процедура IGJ для SA, SAU и SRL применяется в её юрисдикции и зависит от отсутствия замечаний к документам."
    sensitive: true
    source_ids: [igj-urgent-company-registration]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Сначала определите деятельность

Форма зависит от того, что вы делаете, где находятся клиенты, нужны ли партнёры и сотрудники, кто несёт ответственность и как распределяется прибыль. Monotributo, autónomo и юридическое лицо — не взаимозаменяемые названия одного режима.

## Что проверять

1. Миграционное право работать и занимать выбранную роль.
2. Регистр, применимый к юрисдикции компании.
3. Органы управления, адрес, капитал и конечных бенефициаров.
4. CUIT, счета, бухгалтерию и налоги.
5. Банковские документы и происхождение средств.
6. Лицензии для регулируемой деятельности.

IGJ публикует процедуры SAS и срочной регистрации некоторых обществ в своей юрисдикции. Эти страницы нельзя превращать в обещание регистрации «за один день» по всей Аргентине. Перед решением получите письменную схему от contador и корпоративного юриста.

## Источники

- [IGJ — подготовка к SAS](https://www.argentina.gob.ar/justicia/igj/lo-que-tenes-que-tener-en-cuenta-antes-de-crear-una-sas).
- [IGJ — срочная регистрация обществ](https://www.argentina.gob.ar/justicia/igj/sociedades-urgentes).
- [ARCA — категории monotributo](https://arca.gob.ar/monotributo/categorias.asp).
