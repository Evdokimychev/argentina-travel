---
id: bankovskij-schet
type: guide
subtype: finance
title: "Банковский счёт для мигранта в Аргентине"
summary: "Официальная базовая возможность открыть бесплатную caja de ahorro en pesos с документом личности и действующим миграционным статусом, а также различия CBU, CVU и alias."
status: archived
site_ready: false
redirect_to: banki-i-perevody
archive_reason: "Материал объединён с актуальным руководством по банкам и переводам, чтобы не дублировать быстро меняющиеся процедуры."
seo_slug: "bankovskij-schet-argentina"
site_sections: [pereezd-v-argentinu, finansy-i-ekonomika]
applies_to: relocant
tags: [документы, налоги, релокация, бюджетно]
related: [mozhno-li-otkryt-schet-nerezidentu, dni-cuil, banki-i-perevody]
warnings:
  - "Официальная cuenta para migrantes не означает автоматического одобрения любого коммерческого счёта, кредитной карты или финтех-продукта."
  - "Лимиты, доступные операции и проверка происхождения средств зависят от продукта и действующих правил банка."
recommendations:
  - "Просите именно бесплатную caja de ahorro en pesos для мигрантов и показывайте официальный перечень допустимых документов."
  - "До визита уточните у выбранного банка отделение, запись и актуальный комплект документов."
last_verified: "2026-07-17"
confidence: high
long_form_merged: true
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 45
sources:
  - id: argentina-migrant-bank-account
    title: "Argentina.gob.ar — Cuenta para migrantes"
    url: "https://www.argentina.gob.ar/economia/inclusion-financiera/cuenta-para-migrantes"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-10-31"
    note: "Описывает бесплатную caja de ahorro en pesos, допустимые документы для мигрантов и основные возможности счёта."
  - id: bcra-cbu-cvu-education
    title: "BCRA — идентификация банковских и виртуальных счетов"
    url: "https://www.bcra.gob.ar/Pdfs/BCRAyVos/Educ.%20Financiera_agosto_2023.pdf"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2027-01-17"
    note: "Определяет CBU и CVU как 22-значные идентификаторы банковских и виртуальных счетов и объясняет alias."
claims:
  - id: non-mercosur-migrant-account-documents
    text: "Для граждан стран вне MERCOSUR официальная программа перечисляет действующий документ о residencia и DNI digital либо паспорт с применимыми дополнительными условиями."
    sensitive: true
    source_ids: [argentina-migrant-bank-account]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: migrants-can-request-free-peso-savings-account
    text: "Мигранты с перечисленными официальной программой документами могут запросить бесплатную caja de ahorro en pesos."
    sensitive: true
    source_ids: [argentina-migrant-bank-account]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: migrant-account-features
    text: "Программа предусматривает дебетовую карту, переводы, оплату услуг и другие базовые операции без платы за открытие и обслуживание."
    sensitive: true
    source_ids: [argentina-migrant-bank-account]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: cbu-and-cvu-identify-different-account-types
    text: "CBU идентифицирует банковский счёт, CVU — виртуальный счёт; обе claves состоят из 22 цифр, а alias служит удобным именем счёта."
    sensitive: true
    source_ids: [bcra-cbu-cvu-education]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Что доступно по официальной программе

Мигранты могут обратиться за бесплатной **caja de ahorro en pesos**. Для граждан стран вне MERCOSUR официальный перечень предусматривает действующий сертификат residencia precaria, transitoria, temporaria или permanente и DNI digital либо паспорт; в отдельных случаях для паспорта требуется консульская виза.

Счёт не имеет платы за открытие и обслуживание, включает дебетовую карту и позволяет выполнять базовые операции. Это отдельный продукт финансовой инклюзии, а не обещание доступа к кредиту, долларовому счёту, инвестициям или конкретному приложению.

## CBU, CVU и alias

- **CBU** — 22-значный идентификатор банковского счёта.
- **CVU** — 22-значный идентификатор виртуального счёта у поставщика платёжных услуг.
- **Alias** — удобное имя, связанное с CBU или CVU для перевода.

Перед переводом сверяйте имя получателя и назначение платежа. Не передавайте коды подтверждения и не принимайте деньги за неизвестных третьих лиц.

## Как подготовиться к обращению

1. Проверить срок действия миграционного документа и паспорта.
2. Выбрать банк из официального перечня программы.
3. Уточнить порядок записи и отделение непосредственно у банка.
4. Запросить письменные тарифы, лимиты и условия продукта.
5. Для регулярного зарубежного дохода или крупных сумм отдельно согласовать документы о происхождении средств.

## Источники

- [Cuenta para migrantes](https://www.argentina.gob.ar/economia/inclusion-financiera/cuenta-para-migrantes).
- [BCRA: CBU, CVU и alias](https://www.bcra.gob.ar/Pdfs/BCRAyVos/Educ.%20Financiera_agosto_2023.pdf).
