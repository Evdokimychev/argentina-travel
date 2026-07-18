---
id: vnzh-rantye
type: guide
subtype: immigration
title: "Временная резиденция rentista"
summary: "Категория rentista предназначена для человека, который живёт на подтверждаемую зарубежную ренту от собственных активов, а не на оплату личного труда."
status: published
site_ready: true
site_sections: [dokumenty-i-legalizatsiya, pereezd-v-argentinu]
applies_to: relocant
tags: [rentista, резиденция, доход, документы]
related: [vnzh-argentina, viza-cifrovogo-kochevnika]
warnings:
  - "Оплата за личный труд не относится к ренте этой категории."
  - "Минимум привязан к SMVM и меняется; не используйте старый эквивалент в песо или долларах."
recommendations:
  - "До подачи получите подтверждение происхождения дохода и его поступления через финансовые учреждения, принимаемые аргентинскими правилами."
last_verified: "2026-07-17"
confidence: high
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 45
sources:
  - id: dnm-rentista-residence
    title: "Migraciones — residencia temporaria como rentista"
    url: "https://www.argentina.gob.ar/servicio/obtener-una-residencia-temporaria-como-rentista"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
claims:
  - id: rentista-income-from-assets
    text: "Категория rentista требует зарубежного дохода от активов заявителя и исключает вознаграждение за личный труд."
    sensitive: true
    source_ids: [dnm-rentista-residence]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: rentista-threshold-five-smvm
    text: "Официальный минимум составляет эквивалент пяти Salarios Mínimos, Vitales y Móviles, поэтому денежный эквивалент меняется вместе с SMVM."
    sensitive: true
    source_ids: [dnm-rentista-residence]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: rentista-one-year-renewable
    text: "Официальная процедура указывает временную резиденцию на один год с возможностью продления."
    sensitive: true
    source_ids: [dnm-rentista-residence]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Что считается рентой

DNM описывает rentista как человека, который финансирует проживание за счёт законного зарубежного дохода от активов: например, финансовых инструментов, недвижимости или долей в компаниях. Оплата собственной работы в эту категорию не входит.

Заявитель подтверждает источник и стабильность ренты, её размер и поступление средств через разрешённые банковские или финансовые каналы. Минимум привязан к пяти SMVM, поэтому фиксировать сумму в песо или долларах бессмысленно — её нужно считать по действующему SMVM в момент подготовки.

## Порядок

1. Проверьте, является ли доход именно рентой от активов.
2. Подготовьте документы о праве на актив, начислении дохода и движении средств.
3. Сверьте апостиль, легализацию и перевод иностранных документов.
4. Подайте через RaDEX и следуйте уведомлениям DNM.

Официально категория выдаётся на один год и может продлеваться. Решение зависит от доказательств конкретного заявителя; посредник не может его гарантировать.

## Источник

- [Migraciones — residencia temporaria como rentista](https://www.argentina.gob.ar/servicio/obtener-una-residencia-temporaria-como-rentista)
