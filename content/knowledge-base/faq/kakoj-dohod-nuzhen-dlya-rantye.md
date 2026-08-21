---
id: kakoj-dohod-nuzhen-dlya-rantye
type: faq
question: "Какой доход нужен для временной резиденции rentista в Аргентине?"
short_answer: "Официальный минимум — не фиксированная сумма в долларах, а доход не ниже пяти действующих Salarios Mínimos, Vitales y Móviles. Это должна быть подтверждаемая зарубежная рента от ваших активов, а не оплата личного труда; старые эквиваленты вроде 1300 или 2000 долларов использовать нельзя."
topic: visa
status: published
site_ready: false
editorial_hold_reason: "I7 карантин: просрочена claim-level проверка (stale_sensitive_claim / stale_source_url_check / expired_source). Даты не обновлялись без фактчека; нужна повторная сверка источников."
site_sections: [pereezd-v-argentinu, dokumenty-i-legalizatsiya]
tags: [визы, документы, rentista, доход]
related: [vnzh-argentina, vnzh-rantye]
last_verified: "2026-07-20"
confidence: high
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 30
sources:
  - id: dnm-rentista-income-faq
    title: "Migraciones — временная резиденция rentista"
    url: "https://www.argentina.gob.ar/servicio/obtener-una-residencia-temporaria-como-rentista"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-20"
    expires_at: "2026-08-20"
claims:
  - id: rentista-five-smvm-faq
    text: "Минимальная рента должна быть эквивалентна как минимум пяти действующим SMVM."
    sensitive: true
    source_ids: [dnm-rentista-income-faq]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: rentista-assets-not-work-faq
    text: "Рента должна происходить из зарубежных активов заявителя; вознаграждение за личный труд в категорию rentista не входит."
    sensitive: true
    source_ids: [dnm-rentista-income-faq]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: rentista-authorized-funds-entry
    text: "Заявитель должен показать поступление средств через банковские или финансовые организации, уполномоченные BCRA."
    sensitive: true
    source_ids: [dnm-rentista-income-faq]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: rentista-one-year-faq
    text: "Категория предоставляет временную резиденцию на один год с возможностью продления."
    sensitive: true
    source_ids: [dnm-rentista-income-faq]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Ответ

Порог привязан не к доллару, а к аргентинскому показателю **SMVM — Salario Mínimo, Vital y Móvil**. На дату подачи подтверждаемая рента должна быть не ниже пяти действующих SMVM. Поэтому старые советы «нужно 1300 долларов» или «юристы рекомендуют 2000» быстро устаревают и не являются официальным критерием.

Не менее важен вид дохода. DNM описывает rentista как человека, который оплачивает проживание за счёт дохода от собственных зарубежных активов: финансовых инструментов, недвижимости, долей в компаниях или другого принятого ведомством источника. Оплата вашей личной работы, включая удалённые услуги клиентам, в эту категорию не входит.

Готовьте не одну банковскую выписку, а доказательную цепочку:

1. документ о вашем праве на актив;
2. договор или основание начисления ренты;
3. историю регулярных начислений;
4. выписки, связывающие источник с вашим счётом;
5. подтверждение ввода средств в Аргентину через уполномоченные BCRA банковские или финансовые организации.

Иностранные документы могут потребовать апостиль или консульскую легализацию и перевод аргентинским публичным переводчиком. DNM вправе запросить дополнительные доказательства, поэтому сумма выше минимального порога сама по себе не исправит неподходящий или непрозрачный источник.

Категория выдаётся как временная резиденция на один год и может продлеваться. Перед подготовкой пересчитайте пять SMVM по официальному значению на дату подачи и запросите у DNM подтверждение, что ваш тип дохода подходит. Посредник не может гарантировать одобрение и не должен заменять официальную квитанцию или уведомление RaDEX.

## Источник

- [Migraciones — residencia temporaria como rentista](https://www.argentina.gob.ar/servicio/obtener-una-residencia-temporaria-como-rentista).
