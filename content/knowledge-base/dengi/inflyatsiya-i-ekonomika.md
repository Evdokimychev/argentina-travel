---
id: inflyatsiya-i-ekonomika
type: guide
subtype: finance
title: "Инфляция в Аргентине: как читать цены и статистику"
summary: "Практичный способ работать с меняющимися ценами: использовать официальный IPC INDEC, фиксировать месяц и не смешивать инфляцию, валютный курс и стоимость конкретной услуги."
status: archived
site_ready: false
redirect_to: gid-po-dengam
archive_reason: "Короткий обзор экономики объединён с проверенным руководством по деньгам и бюджету."
site_sections: [finansy-i-ekonomika, zhizn-v-strane]
applies_to: both
tags: [бюджетно, документы]
related: [zashchita-nakoplenij-ot-inflyacii, kak-menyat-valyutu]
warnings:
  - "Любая цена без даты быстро теряет смысл. Сверяйте стоимость непосредственно перед оплатой."
  - "Не переводите песо в доллары по случайному курсу и не используйте старую разницу курсов как обещание выгоды."
recommendations:
  - "Для бюджета записывайте цену в ARS, дату, источник и применимый способ оплаты."
  - "Сравнивайте месячный и годовой IPC только с одинаковым периодом и методологией."
last_verified: "2026-07-17"
confidence: high
seo_slug: "inflyatsiya-i-ekonomika-argentiny"
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 45
sources:
  - id: indec-consumer-price-index
    title: "INDEC — Índice de precios al consumidor"
    url: "https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-09-30"
    note: "Официальная публикация национального IPC, его месячных и годовых изменений и методологических материалов."
  - id: bcra-authorized-foreign-exchange
    title: "BCRA — валютные операции через уполномоченные организации"
    url: "https://www.bcra.gob.ar/noticias/el-bcra-aclara-que-no-hay-ningun-cambio-normativo-para-la-compra-de-dolares-por-parte-de-las-personas-humanas/"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-09-30"
    note: "Подтверждает проведение валютных операций через уполномоченные банки и обменные учреждения."
claims:
  - id: indec-publishes-national-cpi
    text: "INDEC публикует национальный индекс потребительских цен и изменения по периодам."
    sensitive: true
    source_ids: [indec-consumer-price-index]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: foreign-exchange-uses-authorized-channels
    text: "BCRA указывает, что валютные операции должны проводиться через уполномоченные организации."
    sensitive: true
    source_ids: [bcra-authorized-foreign-exchange]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Что показывает IPC

INDEC публикует **Índice de precios al consumidor (IPC)** — статистический показатель изменения цен потребительской корзины. Месячное изменение, накопленное изменение с начала года и изменение за двенадцать месяцев отвечают на разные вопросы; их нельзя подменять друг другом.

IPC не сообщает цену вашей квартиры, экскурсии или продуктовой корзины. Для личного бюджета нужны свежие тарифы и реальные предложения по выбранному городу.

## Как считать бюджет

1. Записывайте цену в песо и дату проверки.
2. Отделяйте регулярные расходы от разовых.
3. Для валютного эквивалента указывайте применимый курс и комиссию.
4. Обновляйте аренду, транспорт и страховку перед оплатой.
5. Не используйте одну фиксированную сумму как «среднюю стоимость жизни» для всей страны.

Валюту обменивайте через банки и уполномоченные обменные учреждения. Статистика инфляции не делает неофициальный обмен безопасным или законным.

## Источники

- [INDEC — Índice de precios al consumidor](https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31).
- [BCRA о валютных операциях](https://www.bcra.gob.ar/noticias/el-bcra-aclara-que-no-hay-ningun-cambio-normativo-para-la-compra-de-dolares-por-parte-de-las-personas-humanas/).
