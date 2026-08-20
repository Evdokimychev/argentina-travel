---
id: mozhno-li-otkryt-schet-nerezidentu
type: faq
question: "Можно ли иностранцу открыть банковский счёт в Аргентине без DNI или постоянной резиденции?"
short_answer: "Да, постоянная резиденция и пластиковый DNI не всегда обязательны: официальная cuenta para migrantes доступна с действующей precaria, transitoria, temporaria или permanente и подходящим документом личности. Но обычный турист без миграционного сертификата под этот официальный продукт не подпадает."
topic: dengi
status: published
site_ready: false
editorial_hold_reason: "I7 карантин: просрочена claim-level проверка (stale_sensitive_claim / stale_source_url_check / expired_source). Даты не обновлялись без фактчека; нужна повторная сверка источников."
site_sections: [finansy-i-ekonomika, pereezd-v-argentinu]
tags: [деньги, банковский счёт, мигранты, документы]
related: [bankovskij-schet, dni-cuil]
last_verified: "2026-07-20"
confidence: high
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 30
sources:
  - id: argentina-migrant-account-faq
    title: "Argentina.gob.ar — cuenta para migrantes"
    url: "https://www.argentina.gob.ar/economia/inclusion-financiera/cuenta-para-migrantes"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-20"
    expires_at: "2026-08-20"
claims:
  - id: migrant-account-with-residence-certificates
    text: "Официальная программа допускает мигрантов с сертификатом residencia precaria, transitoria, temporaria или permanente."
    sensitive: true
    source_ids: [argentina-migrant-account-faq]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: non-mercosur-migrant-documents
    text: "Для граждан стран вне MERCOSUR перечень предусматривает DNI digital или паспорт, при необходимости с аргентинской консульской визой."
    sensitive: true
    source_ids: [argentina-migrant-account-faq]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: free-peso-savings-account
    text: "Cuenta para migrantes представляет собой бесплатную caja de ahorro en pesos с дебетовой картой и базовыми операциями."
    sensitive: true
    source_ids: [argentina-migrant-account-faq]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Ответ

Нужно разделить три ситуации. **Постоянная резиденция не обязательна**, и ждать пластиковый DNI тоже не всегда нужно. Официальная программа cuenta para migrantes допускает человека с действующим сертификатом residencia precaria, transitoria, temporaria или permanente и подходящим документом личности.

Для граждан стран вне MERCOSUR, включая Россию, официальный перечень называет DNI digital либо паспорт страны происхождения; если применимо, паспорт должен иметь аргентинскую консульскую визу. Миграционный сертификат при этом остаётся частью основания. Обычный турист, у которого нет ни одного из перечисленных статусов, под эту программу не подпадает — это точнее, чем обещание «открыть финтех по паспорту».

Продукт представляет собой бесплатную **caja de ahorro en pesos**: без платы за открытие и обслуживание, с дебетовой картой, переводами и базовыми платежами. Это не гарантирует кредитную карту, долларовый счёт, покупку MEP, высокий лимит или доступ к конкретному приложению. Банк всё равно проводит идентификацию и может запросить документы о происхождении средств для выбранных операций.

Практический порядок:

1. проверьте срок действия миграционного сертификата и паспорта;
2. выберите банк, который работает с программой, и уточните отделение;
3. просите именно caja de ahorro en pesos para migrantes;
4. возьмите распечатку официальной страницы, если сотрудник не знает продукта;
5. запросите тарифы, лимиты и список документов письменно.

Старые рекомендации открыть Ualá, Brubank или Mercado Pago «ещё без документов» убраны: требования конкретного сервиса меняются и не заменяют официальный банковский маршрут. Не используйте чужой счёт и не принимайте переводы за неизвестных людей ради обхода проверки.

## Источник

- [Argentina.gob.ar — cuenta para migrantes](https://www.argentina.gob.ar/economia/inclusion-financiera/cuenta-para-migrantes).
