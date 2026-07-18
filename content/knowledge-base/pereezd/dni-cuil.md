---
id: dni-cuil
type: guide
subtype: immigration
title: "DNI, CUIL и CUIT: что нужно иностранцу"
summary: "DNI удостоверяет личность, CUIL используется в трудовой и социальной системе, а CUIT — в налоговых процедурах. Важно не создавать дубликаты и вовремя объединить временный и окончательный CUIL."
status: published
site_ready: true
site_sections: [dokumenty-i-legalizatsiya, pereezd-v-argentinu]
applies_to: relocant
tags: [DNI, CUIL, CUIT, документы, налоги]
related: [raskhozhdeniya-dni-cuit-cuil, vnzh-argentina, bankovskij-schet]
warnings:
  - "Если CUIL был создан до DNI, после получения DNI может потребоваться объединение записей. Не оформляйте новый номер вместо исправления существующего."
  - "CUIL и CUIT относятся к разным административным задачам; для самостоятельной налоговой деятельности проверяйте требования ARCA."
recommendations:
  - "Сохраните constancia de CUIL и проверяйте точное совпадение имени, даты рождения и номера DNI."
last_verified: "2026-07-17"
confidence: high
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 45
sources:
  - id: renaper-dni-foreigners
    title: "Argentina.gob.ar — DNI para extranjeros"
    url: "https://www.argentina.gob.ar/node/25373"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
  - id: anses-cuil-unification
    title: "ANSES — Generación de CUIL y solicitud de unificación"
    url: "https://www.anses.gob.ar/generacion-de-cuil-solicitud-de-unificacion"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
  - id: anses-cuil-certificate
    title: "ANSES — Cómo obtener la constancia de CUIL"
    url: "https://www.anses.gob.ar/noticias/como-obtener-la-constancia-de-cuil-en-anses-2"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-17"
claims:
  - id: dni-identifies-foreign-residents
    text: "Иностранцы с оформленной аргентинской резиденцией получают DNI по процедуре RENAPER."
    sensitive: true
    source_ids: [renaper-dni-foreigners]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: temporary-cuil-can-be-unified
    text: "ANSES предусматривает объединение временного CUIL иностранца с окончательной записью после получения DNI."
    sensitive: true
    source_ids: [anses-cuil-unification]
    verified_at: "2026-07-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Три разных идентификатора

- **DNI** — аргентинский документ, удостоверяющий личность резидента.
- **CUIL** — трудовой и социальный идентификатор ANSES. Constancia de CUIL можно получить в официальном сервисе.
- **CUIT** — налоговый идентификатор ARCA для тех, кому нужно зарегистрировать налоговую деятельность, например autónomo или monotributo.

Получение одного номера не означает, что данные автоматически исправились во всех ведомствах.

## После получения DNI

Проверьте, какой CUIL связан с новым DNI. Если до DNI у вас уже был временный CUIL по паспорту, ANSES предусматривает процедуру объединения. Её смысл — сохранить одну историю, а не завести второй независимый номер.

Скачайте constancia de CUIL и сравните:

- имя и фамилию;
- дату рождения;
- номер DNI;
- сам номер CUIL.

Если ошибка относится к CUIL, обращайтесь в ANSES. Если речь о CUIT или налоговой регистрации — в ARCA. Подробный разбор исправлений: [[raskhozhdeniya-dni-cuit-cuil|Расхождения в DNI, CUIL и CUIT]].

Тарифы и сроки выпуска документов меняются, поэтому проверяйте их в официальной процедуре непосредственно перед обращением.

## Источники

- [Argentina.gob.ar — DNI для иностранцев](https://www.argentina.gob.ar/node/25373)
- [ANSES — создание и объединение CUIL](https://www.anses.gob.ar/generacion-de-cuil-solicitud-de-unificacion)
- [ANSES — constancia de CUIL](https://www.anses.gob.ar/noticias/como-obtener-la-constancia-de-cuil-en-anses-2)
