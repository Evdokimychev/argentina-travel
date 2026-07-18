---
id: kak-poluchit-prava-v-argentine
type: guide
subtype: immigration
title: "Как получить водительские права в Аргентине: иностранные, обмен и получение с нуля"
summary: "Какие иностранные права признаются временно, кому доступен обмен и как иностранцу подготовиться к получению местной лицензии на примере CABA."
status: published
site_ready: true
site_sections: [dokumenty-i-legalizatsiya, pereezd-v-argentinu, puteshestviya-po-argentine]
applies_to: both
tags: [документы, вождение, транспорт, релокация, туризм]
related: [voditelskie-prava, arenda-avto-i-vozhdenie, pokupka-avtomobilya, dni-cuil, apostil-i-perevod-dokumentov, certificado-de-legalidad-prav]
warnings:
  - "Россия не указана в опубликованном ANSV перечне соглашений об обмене. Российские права нельзя считать автоматически обмениваемыми без экзаменов."
  - "Порядок выдачи местной лицензии зависит от юрисдикции проживания. Требования CABA нельзя автоматически применять в другой провинции или муниципалитете."
recommendations:
  - "Туристу: возите паспорт с подтверждением въезда, оригинал национальных прав и международное удостоверение, если оно требуется применимыми правилами или прокатчиком."
  - "Резиденту: запросите список документов в своём центре выдачи до апостиля и перевода иностранной лицензии."
  - "В CABA certificado de legalidad иностранной лицензии помогает подтвердить предыдущую habilitación и избежать автоматического статуса начинающего водителя."
last_verified: "2026-07-17"
confidence: high
seo_slug: "kak-poluchit-voditelskie-prava-v-argentine"
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 45
sources:
  - id: ansv-foreign-driving-licences
    title: "ANSV — иностранные и международные водительские удостоверения"
    url: "https://www.argentina.gob.ar/node/377747"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-10-31"
    note: "Определяет условия признания иностранных лицензий и предельный период их использования по международным конвенциям."
  - id: ansv-driving-licence-agreements
    title: "ANSV — международные соглашения о признании и обмене водительских удостоверений"
    url: "https://www.argentina.gob.ar/seguridadvial/licencianacional/consulta-sobre-los-acuerdos-internacionales-de-licencias-de-conducir"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-10-31"
    note: "Официальный перечень соглашений с Боливией, Чили, Колумбией, Испанией и Италией."
  - id: ansv-national-licence-procedure-manual
    title: "ANSV — Sistema Nacional de Licencia de Conducir"
    url: "https://www.argentina.gob.ar/normativa/192523_disp54_pdf/archivo"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-10-31"
    note: "Действующая национальная процедура для иностранцев и резидентов, включая certificado de legalidad и перевод."
  - id: caba-driving-licence-grant
    title: "Buenos Aires Ciudad — получение водительской лицензии"
    url: "https://buenosaires.gob.ar/tramites/otorgamiento-de-licencia-de-conducir"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-10-31"
    note: "Актуальная городская процедура и документы для первоначальной выдачи."
  - id: caba-foreign-applicants
    title: "Buenos Aires Ciudad — документы иностранных заявителей"
    url: "https://buenosaires.gob.ar/gcaba_historico/tramites/otorgamiento-de-licencia-de-conducir/casosespeciales/extranjeros"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-10-31"
    note: "Документы по миграционному статусу и адресу для иностранцев с местом жительства в CABA."
claims:
  - id: eligible-foreign-licences-valid-up-to-one-year
    text: "Иностранные национальные удостоверения государств — участников применимых Женевской или Венской конвенций признаются в Аргентине максимум один год с даты въезда."
    sensitive: true
    source_ids: [ansv-foreign-driving-licences]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: residents-obtain-local-licence
    text: "После окончания периода признания иностранной лицензии резидент оформляет аргентинскую лицензию на общих основаниях; иностранный документ используется для подтверждения прежнего стажа."
    sensitive: true
    source_ids: [ansv-national-licence-procedure-manual]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: exchange-agreements-have-limited-country-list
    text: "Официальный перечень соглашений о признании или обмене включает Боливию, Чили, Колумбию, Испанию и Италию; России в опубликованном перечне нет."
    sensitive: true
    source_ids: [ansv-driving-licence-agreements]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: caba-uses-address-and-migration-documents
    text: "Иностранный заявитель в CABA подтверждает личность, адрес в городе и действующий миграционный статус по сценарию своей residencia."
    sensitive: true
    source_ids: [caba-foreign-applicants]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: caba-foreign-certificate-avoids-beginner-status
    text: "CABA запрашивает certificado de legalidad иностранной лицензии для подтверждения предыдущей habilitación и оценки статуса начинающего водителя."
    sensitive: true
    source_ids: [caba-driving-licence-grant]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Турист с иностранными правами

ANSV признаёт иностранные национальные удостоверения, выданные государствами — участниками применимых международных конвенций. Максимальный период, указанный официальным порталом, — один год с даты въезда.

Это не универсальная гарантия для любого документа. Проверьте срок действия, категорию и применимую конвенцию. Возите паспорт с подтверждением въезда и оригинал прав. Международное водительское удостоверение предъявляется вместе с национальным, а не вместо него. Прокатчик и страховщик могут устанавливать дополнительные договорные условия.

## Резиденту нужны местные права

Национальная процедура предусматривает, что резиденты оформляют `Licencia Nacional de Conducir` на общих основаниях. Иностранная лицензия и подтверждение её легальности могут использоваться для подтверждения прежнего водительского стажа, но не отменяют назначенные местной юрисдикцией проверки и экзамены.

Обращаться нужно в центр выдачи по месту зарегистрированного проживания. Поэтому сначала уточните требования муниципалитета или города, затем заказывайте документы и перевод.

## Кому доступен обмен

На странице ANSV опубликованы соглашения с Боливией, Чили, Колумбией, Испанией и Италией. Условия различаются по странам и категориям. Россия в этом перечне не указана, поэтому российское удостоверение нельзя считать автоматически обмениваемым.

## Пример CABA

Иностранный заявитель с адресом в CABA подтверждает личность, адрес и миграционный статус. Конкретный комплект зависит от вида и состояния residencia: постоянной, временной или precaria.

Основная городская процедура включает предварительную регистрацию, проверку документов, обучение или подтверждение требуемых знаний, психофизическую оценку и назначенные экзамены. Актуальная последовательность отображается в официальной инструкции после выбора категории.

Если ранее были иностранные права, CABA запрашивает `certificado de legalidad`. Он нужен для подтверждения прежней habilitación и вопроса о статусе начинающего водителя. Допустимую форму сертификата, апостиль и перевод проверяйте до заказа документов.

## Порядок действий

1. Определите юрисдикцию по адресу проживания.
2. Проверьте, есть ли соглашение с государством выдачи прав.
3. Запросите у центра выдачи актуальный список документов.
4. Подготовьте удостоверение личности, миграционные документы и подтверждение адреса.
5. При необходимости получите certificado de legalidad, апостиль и перевод.
6. Пройдите только те этапы и экзамены, которые назначила ваша юрисдикция.

## Источники

- [ANSV — иностранные водительские удостоверения](https://www.argentina.gob.ar/node/377747)
- [ANSV — соглашения об обмене](https://www.argentina.gob.ar/seguridadvial/licencianacional/consulta-sobre-los-acuerdos-internacionales-de-licencias-de-conducir)
- [ANSV — национальная процедура](https://www.argentina.gob.ar/normativa/192523_disp54_pdf/archivo)
- [Buenos Aires Ciudad — получение лицензии](https://buenosaires.gob.ar/tramites/otorgamiento-de-licencia-de-conducir)
- [Buenos Aires Ciudad — иностранные заявители](https://buenosaires.gob.ar/gcaba_historico/tramites/otorgamiento-de-licencia-de-conducir/casosespeciales/extranjeros)
