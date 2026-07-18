---
id: shtrafy-i-scoring
type: guide
subtype: transport
title: "Штрафы, баллы и проверка нарушений за рулём в Аргентине"
summary: "Как проверить дорожные нарушения в национальной и местной системе и как устроен Scoring Nacional с исходными 20 баллами."
status: published
site_ready: true
site_sections: [puteshestviya-po-argentine, zhizn-v-strane, dokumenty-i-legalizatsiya]
applies_to: both
tags: [транспорт, авто, документы, безопасность, штрафы]
related: [arenda-avto-i-vozhdenie, pokupka-avtomobilya, voditelskie-prava, dokumenty-dlya-poezdki-na-avto, gosudarstvennye-prilozheniya]
warnings:
  - "Национальная система не заменяет портал конкретной провинции или муниципалитета. Отсутствие записи в одном окне не доказывает отсутствие всех нарушений."
  - "Размер штрафа и расчётная единица зависят от применимой юрисдикции и даты. Не используйте фиксированные суммы из старых публикаций."
recommendations:
  - "Проверяйте нарушения по документу водителя и номеру автомобиля в национальном сервисе, затем повторяйте проверку в юрисдикции, где произошло нарушение."
  - "Перед покупкой автомобиля отдельно запросите informe de dominio и доступный отчёт о нарушениях: это разные проверки."
  - "Если штраф относится к арендованной машине, запросите у прокатчика копию постановления и основание административного сбора."
last_verified: "2026-07-17"
confidence: high
seo_slug: "shtrafy-scoring-i-zadolzhennost-za-rulem-argentina"
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 45
sources:
  - id: ansv-national-scoring
    title: "ANSV — Scoring Nacional"
    url: "https://www.argentina.gob.ar/transporte/politicas-seguridad-vial/scoring-nacional"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-10-31"
    note: "Официальное описание исходных баллов, последствий их утраты и способов восстановления."
  - id: ansv-national-infractions-query
    title: "ANSV — Consulta de infracciones"
    url: "https://consultainfracciones.seguridadvial.gob.ar/"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-09-30"
    note: "Национальный сервис проверки нарушений для участвующих юрисдикций."
  - id: national-scoring-decree
    title: "Decreto 437/2011 — система баллов водительской лицензии"
    url: "https://www.argentina.gob.ar/normativa/nacional/decreto-437-2011-181142/actualizacion"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2027-07-17"
    note: "Действующий нормативный текст системы баллов."
  - id: caba-infractions-query
    title: "Buenos Aires Ciudad — проверка нарушений"
    url: "https://buenosaires.gob.ar/licenciasdeconducir/consulta-de-infracciones/"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
    expires_at: "2026-09-30"
    note: "Городской сервис проверки нарушений CABA."
claims:
  - id: national-scoring-starts-with-twenty-points
    text: "В Scoring Nacional водитель с Licencia Nacional de Conducir начинает с 20 баллов, которые уменьшаются после вступивших в силу решений о нарушениях."
    sensitive: true
    source_ids: [ansv-national-scoring, national-scoring-decree]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: zero-points-lead-to-disqualification
    text: "Полная утрата баллов ведёт к временному лишению права управления; продолжительность увеличивается при повторных случаях."
    sensitive: true
    source_ids: [ansv-national-scoring]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: points-can-be-restored-under-rules
    text: "Официальная система предусматривает восстановление баллов по времени и через утверждённые курсы с различиями для обычных и профессиональных водителей."
    sensitive: true
    source_ids: [ansv-national-scoring]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: infractions-have-national-and-local-queries
    text: "Нарушения проверяются через национальный сервис ANSV и, при необходимости, через портал конкретной юрисдикции, например CABA."
    sensitive: true
    source_ids: [ansv-national-infractions-query, caba-infractions-query]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Где проверять нарушения

Начните с национального сервиса ANSV. Затем проверьте официальный портал провинции или муниципалитета, где могло быть зафиксировано нарушение. Для CABA действует отдельный городской сервис.

Наличие нескольких систем означает, что пустой результат в одном окне нельзя считать универсальной справкой об отсутствии нарушений.

## Как работает Scoring Nacional

Водитель с `Licencia Nacional de Conducir` получает исходные 20 баллов. Баллы уменьшаются не после любого уведомления или фотографии камеры, а вследствие вступившего в силу решения компетентного административного или судебного органа.

При полной утрате баллов право управления временно приостанавливается. Повторная полная утрата увеличивает срок. Система также предусматривает восстановление баллов через определённый период и утверждённые курсы; правила для профессиональных водителей отличаются.

Перед записью на курс или расчётом срока откройте актуальную инструкцию ANSV: эти детали зависят от истории водителя и действующей редакции правил.

## Почему здесь нет сумм

Размер взыскания, расчётная единица, скидка за добровольную оплату и порядок обжалования зависят от юрисдикции и даты. Универсальная таблица в песо или единицах вводила бы пользователя в заблуждение. Сумму и срок берите только из официального постановления или портала органа, который рассматривает нарушение.

## Арендованный или покупаемый автомобиль

Прокатчик может получить уведомление позже поездки и предъявить водителю штраф вместе с предусмотренным договором сбором. Попросите копию официального документа и расчёт.

При покупке автомобиля запросите `informe de dominio` и доступный отчёт о нарушениях. Informe de dominio показывает юридическое состояние автомобиля, но не заменяет все местные проверки штрафов и налогов.

## Если вы не согласны

Не оплачивайте сообщение из случайного письма или мессенджера. Откройте официальный портал юрисдикции по адресу вручную, проверьте номер производства и используйте указанный там канал обжалования. Сохраните постановление, доказательства и подтверждение подачи обращения.

## Источники

- [ANSV — Scoring Nacional](https://www.argentina.gob.ar/transporte/politicas-seguridad-vial/scoring-nacional)
- [ANSV — Consulta de infracciones](https://consultainfracciones.seguridadvial.gob.ar/)
- [Buenos Aires Ciudad — Consulta de infracciones](https://buenosaires.gob.ar/licenciasdeconducir/consulta-de-infracciones/)
