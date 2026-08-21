---
id: sistema-zdravoohraneniya
type: guide
subtype: health
title: "Система здравоохранения Аргентины: público, obra social и prepaga"
summary: "Как различать государственные учреждения, национальные obras sociales и частные prepagas и почему права иностранца на экстренную и плановую помощь нужно проверять отдельно."
status: published
site_ready: true
site_sections: [zhizn-v-strane, pereezd-v-argentinu]
applies_to: both
tags: [медицина, страховка, больницы, релокация]
related: [medicina-i-strahovka, rody-i-beremennost]
warnings:
  - "Не обещайте бесплатную плановую помощь всем иностранцам: экстренная и обычная помощь регулируются по-разному."
  - "Номер 107 относится не ко всей стране; сохраняйте местный номер скорой и национальный 911."
recommendations:
  - "Перед плановым обращением уточняйте стоимость, направление, сеть и предварительное согласование у учреждения и страховщика."
  - "При экстренной ситуации обращайтесь за помощью независимо от миграционного статуса."
last_verified: "2026-08-17"
confidence: high
seo_slug: "sistema-zdravoohraneniya-argentiny"
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 30
sources:
  - id: argentina-decree-366-2025-health
    title: "Decreto 366/2025 — atención sanitaria"
    url: "https://www.boletinoficial.gob.ar/detalleAviso/primera/326096/1"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-08-21"
    expires_at: "2026-09-16"
    note: "Различает экстренную и плановую помощь иностранцам и положение постоянных резидентов."
  - id: argentina-health-services-regulator
    title: "Superintendencia de Servicios de Salud"
    url: "https://www.argentina.gob.ar/sssalud"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-08-17"
    expires_at: "2026-09-16"
    note: "Регулятор национальных obras sociales и entidades de medicina prepaga."
  - id: argentina-emergency-numbers
    title: "Argentina.gob.ar — экстренные номера"
    url: "https://www.argentina.gob.ar/tema/emergencias"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-08-21"
    expires_at: "2026-09-16"
    note: "Национальный 911 и территориальные пояснения к медицинскому номеру 107."
  - id: argentina-national-obras-sociales
    title: "SSSalud — Qué son las Obras Sociales Nacionales"
    url: "https://www.argentina.gob.ar/sssalud/que-son-las-obras-sociales-nacionales"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-08-17"
    expires_at: "2026-09-16"
  - id: argentina-prepagas
    title: "SSSalud — Qué son las Entidades de Medicina Prepaga"
    url: "https://www.argentina.gob.ar/node/423540"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-08-17"
    expires_at: "2026-09-16"
  - id: argentina-health-user-claims
    title: "SSSalud — Usuarios y reclamos"
    url: "https://www.argentina.gob.ar/sssalud/usuarios"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-08-17"
    expires_at: "2026-09-16"
claims:
  - id: emergency-care-cannot-be-refused
    text: "Decreto 366/2025 запрещает отказывать иностранцу в экстренной медицинской помощи независимо от миграционного статуса."
    sensitive: true
    source_ids: [argentina-decree-366-2025-health]
    verified_at: "2026-08-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: sssalud-regulates-national-insurers
    text: "Superintendencia de Servicios de Salud контролирует национальные obras sociales и организации частной медицины prepaga."
    sensitive: true
    source_ids: [argentina-health-services-regulator]
    verified_at: "2026-08-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: emergency-number-107-location-dependent
    text: "Официальный справочник указывает 911 как центральный экстренный номер, а 107 — как медицинский номер для CABA и отдельных населённых пунктов."
    sensitive: true
    source_ids: [argentina-emergency-numbers]
    verified_at: "2026-08-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: national-obras-sociales-pmo
    text: "Национальные obras sociales финансируются обязательными взносами и должны обеспечивать как минимум Programa Médico Obligatorio."
    sensitive: true
    source_ids: [argentina-national-obras-sociales]
    verified_at: "2026-08-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: prepagas-voluntary-plans
    text: "Частные prepagas продают добровольные планы напрямую или принимают направленные страховые взносы; конкретная сеть зависит от выбранного плана."
    sensitive: true
    source_ids: [argentina-prepagas]
    verified_at: "2026-08-17"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Как устроена система

В Аргентине нет одной кассы и единой для всей страны сети клиник. Одновременно работают три контура: государственные учреждения (*sector público*), система социального страхования (*obras sociales*) и добровольная частная медицина (*prepagas*). Пациент может пользоваться разными контурами в разное время, но правила записи, оплаты и направлений у них не совпадают.

Государственные центры первичной помощи, больницы и экстренные отделения принадлежат Nación, провинции, CABA или муниципалитету. Поэтому опыт в столичной больнице нельзя автоматически переносить на Сальту или Неукен. До планового визита уточните, кто управляет учреждением, принимает ли оно ваш миграционный статус, нужна ли запись и какие документы попросят.

Национальные *obras sociales* финансируются взносами работников, работодателей и отдельных категорий плательщиков. Они должны обеспечивать минимум Programa Médico Obligatorio, но фактическая запись происходит через собственную *cartilla* — перечень врачей, лабораторий, аптек и клиник. Провинциальные страховые системы могут жить по другим правилам и не обязаны быть частью национального реестра.

*Prepaga* — коммерческий добровольный план. Его можно оплачивать напрямую или использовать направленные страховые взносы, если это допускает выбранная схема. Название компании само по себе ничего не говорит о доступе к конкретному санаторию: сеть, доплаты, лимиты и необходимость авторизации зависят от плана.

## Что изменилось для иностранцев

Статья 8 миграционного закона в редакции Decreto 366/2025 разделяет экстренную и обычную помощь. В экстренной ситуации иностранцу нельзя отказать из-за его миграционного статуса. Постоянные резиденты получают доступ к государственной системе на условиях граждан Аргентины. За пределами этих случаев обычная помощь в учреждениях, которыми управляет национальное государство, может требовать медицинской страховки или предварительной оплаты.

Это федеральная норма, но больничная система сильно децентрализована. Она не даёт корректного ответа за каждую провинциальную или муниципальную больницу. Туристу, временному резиденту и человеку с *residencia precaria* нужно заранее спросить конкретное учреждение: *¿Atienden con mi categoría migratoria? ¿La consulta es arancelada?* Сохраните письменный ответ, если речь идёт о плановом лечении или крупной сумме.

Экстренность определяет медицинская ситуация, а не удобство пациента. Не откладывайте обращение при угрозе жизни, тяжёлой травме, нарушении дыхания, потере сознания или другом остром состоянии из-за спора о документах. Административные вопросы решаются после первичной помощи.

## Как выбрать покрытие

Перед оформлением obra social или prepaga сравнивайте не рекламную цену, а маршрут пациента:

- есть ли нужные клиники и лаборатории в вашем городе;
- как записываются к терапевту и профильному специалисту;
- требуется ли направление;
- какие обследования нужно предварительно авторизовать;
- есть ли *copago* — доплата за визит или процедуру;
- покрываются ли лекарства и в какой аптечной сети;
- как устроены экстренная помощь и выезд врача;
- включены ли беременность, психическое здоровье, стоматология и хронические состояния;
- распространяется ли план на поездки по стране.

Попросите действующую *cartilla*, полные условия и стоимость письменно. Фраза менеджера в WhatsApp не заменяет договор. После подключения проверьте себя в реестре SSSalud и установите официальное приложение или сохраните цифровую карточку страховщика.

## Обычный приём, guardia и emergencia

Для планового вопроса ищут *turno* в центре первичной помощи, клинике или у врача из cartilla. *Guardia* — отделение неотложной помощи без обычной записи; очередь определяется тяжестью состояния, а не временем прихода. *Emergencia* — непосредственная угроза жизни или функции организма. Не используйте guardia только потому, что у специалиста нет удобного слота: там могут стабилизировать состояние, но не заменить длительное наблюдение.

Национальный справочник экстренных номеров указывает 911 как центральный номер. Медицинский 107 действует в CABA и ряде других населённых пунктов, но не является гарантированно единым номером страны. По приезде сохраните местный номер скорой, адрес ближайшей guardia и линию помощи страховщика.

## Если покрытие отказало

Сначала запросите письменный отказ с номером обращения и основанием. Сохраните назначение врача, рецепт, результаты исследований, переписку, чеки и условия плана. Для национальной obra social или зарегистрированной prepaga можно подать обращение в Superintendencia de Servicios de Salud через раздел для пользователей. В экстренной ситуации не ждите окончания административного спора: обращайтесь за медицинской помощью и документируйте расходы.

Регулятор не решает споры с каждой провинциальной больницей и не заменяет медицинского специалиста. Если непонятно, кто контролирует учреждение, спросите его службу работы с пациентами: *¿Dónde presento un reclamo formal y cuál es el número de expediente?*

## Минимальный набор на первые недели

Сохраните паспорт и подтверждение миграционного статуса, полис и номер договора, список лекарств по действующему веществу, медицинские выписки и аллергии. Для хронического состояния заранее найдите врача, не дожидаясь окончания запаса препарата. Перевод ключевой выписки на испанский полезнее десятков фотографий анализов без контекста.

## Полезные фразы

- *Necesito un turno con clínica médica* — мне нужна запись к терапевту.
- *¿Está incluido en mi cartilla?* — это входит в мою сеть?
- *¿Necesita autorización previa?* — нужна предварительная авторизация?
- *¿Hay copago?* — есть доплата?
- *Es una urgencia* — это срочная ситуация.
- *Necesito la negativa por escrito* — мне нужен письменный отказ.

## Источники

- [Decreto 366/2025](https://www.boletinoficial.gob.ar/detalleAviso/primera/326096/1) — доступ иностранцев к экстренной и обычной помощи.
- [SSSalud — национальные obras sociales](https://www.argentina.gob.ar/sssalud/que-son-las-obras-sociales-nacionales) — финансирование и обязательный минимум покрытия.
- [SSSalud — частные prepagas](https://www.argentina.gob.ar/node/423540) — типы планов и способы подключения.
- [SSSalud — обращения пользователей](https://www.argentina.gob.ar/sssalud/usuarios) — проверка страховщика и жалобы.
- [Argentina.gob.ar — экстренные номера](https://www.argentina.gob.ar/tema/emergencias) — 911 и территориальное применение 107.
