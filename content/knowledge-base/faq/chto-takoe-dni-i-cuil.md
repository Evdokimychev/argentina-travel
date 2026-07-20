---
id: chto-takoe-dni-i-cuil
type: faq
question: "Что такое DNI, CUIL, CUIT и CDI в Аргентине и зачем они нужны?"
short_answer: "DNI удостоверяет личность резидента, CUIL идентифицирует человека в трудовой системе и ANSES, CUIT — в налоговой системе ARCA. CDI остаётся отдельным идентификатором для некоторых людей без CUIL и CUIT; выбирать номер нужно по цели, а не оформлять все подряд."
topic: dokumenty
status: published
site_sections: [pereezd-v-argentinu, dokumenty-i-legalizatsiya]
tags: [визы, документы, налоги]
related: [dni-cuil]
last_verified: "2026-07-20"
confidence: high
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 45
sources:
  - id: renaper-dni-foreign-residents
    title: "RENAPER — DNI для иностранцев в Аргентине"
    url: "https://www.argentina.gob.ar/interior/dni/extranjeros"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-20"
    expires_at: "2026-09-03"
  - id: anses-obtain-cuil
    title: "ANSES — оформление CUIL"
    url: "https://www.argentina.gob.ar/servicio/obtener-cuil"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-20"
    expires_at: "2026-09-03"
  - id: arca-cuit-registration
    title: "ARCA — оформление CUIT"
    url: "https://www.arca.gob.ar/inscripcion/cuit-cdi/residentes-pais-dni-argentino.asp"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-20"
    expires_at: "2026-09-03"
  - id: arca-obtain-cdi
    title: "ARCA — оформление CDI"
    url: "https://www.argentina.gob.ar/servicio/obtener-la-clave-de-identificacion-cdi"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-20"
    expires_at: "2026-09-03"
claims:
  - id: foreign-resident-dni
    text: "Иностранец с действующей временной или постоянной резиденцией может оформить DNI."
    sensitive: true
    source_ids: [renaper-dni-foreign-residents]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: cuil-purpose
    text: "CUIL используется при работе по найму, получении услуг ANSES и других требующих его процедурах."
    sensitive: true
    source_ids: [anses-obtain-cuil]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: cuit-purpose-and-process
    text: "CUIT нужен для регистрации деятельности и налоговых обязательств в ARCA; способ оформления зависит от документов и статуса заявителя."
    sensitive: true
    source_ids: [arca-cuit-registration]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: cdi-still-available
    text: "CDI продолжает оформляться людям без CUIT и CUIL для отдельных финансовых операций и покупки регистрируемого имущества."
    sensitive: true
    source_ids: [arca-obtain-cdi]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Ответ

Это разные идентификаторы, и один не всегда заменяет другой.

- **DNI** — аргентинское удостоверение личности. Иностранец может оформить его после получения действующей временной или постоянной резиденции. Если резиденции нет, она истекла или заканчивается в ближайшие 60 дней, RENAPER направляет сначала урегулировать статус в Migraciones.
- **CUIL** — номер для трудовой системы. Он нужен при работе по найму, для операций с ANSES и в других организациях, которые запрашивают CUIL. ANSES допускает оформление для некоторых иностранцев ещё без DNI, но потребует подтверждение подходящей резиденции и въезда; туристический статус для этого не подходит.
- **CUIT** — налоговый идентификатор ARCA. Он нужен тому, кто регистрирует самостоятельную экономическую деятельность, налоги или режим вроде monotributo. Получение номера — только первый шаг: затем могут понадобиться регистрация деятельности, налоговый режим и электронный налоговый адрес.
- **CDI** — идентификатор для человека, у которого нет CUIT и CUIL, но которому требуется, например, открыть банковский счёт, провести другую финансовую операцию или купить регистрируемое имущество. Утверждение, что CDI «отменили с 2026 года», неверно: официальный сервис продолжает описывать его оформление.

Практический порядок зависит от задачи. После получения резиденции оформляйте DNI. Для работы по найму проверяйте CUIL, для самостоятельной деятельности — CUIT и нужную налоговую регистрацию. CDI рассматривайте только тогда, когда CUIT и CUIL вам не положены, а конкретная операция требует аргентинский идентификатор. Перед подачей сверяйте список документов на странице соответствующего ведомства: правила для человека с DNI, без DNI и для нерезидента различаются.

## Источники

- [RENAPER — DNI для иностранцев](https://www.argentina.gob.ar/interior/dni/extranjeros).
- [ANSES — оформление CUIL](https://www.argentina.gob.ar/servicio/obtener-cuil).
- [ARCA — оформление CUIT](https://www.arca.gob.ar/inscripcion/cuit-cdi/residentes-pais-dni-argentino.asp).
- [ARCA — оформление CDI](https://www.argentina.gob.ar/servicio/obtener-la-clave-de-identificacion-cdi).
