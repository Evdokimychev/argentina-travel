---
id: gid-po-dengam
type: guide
subtype: finance
title: "Деньги в Аргентине: обмен, карты, банки и бюджет"
title_es: "Dinero en Argentina: guía temática"
aliases: ["всё про деньги Аргентина", "финансы гид", "деньги для туриста и релоканта", "точка входа деньги", "как устроены финансы"]
summary: "Финансовая карта для туриста и резидента: безопасный обмен, резервные способы оплаты, местный счёт, бюджет, налоги и защита от мошенничества."
status: published
site_ready: true
site_sections: [finansy-i-ekonomika]
applies_to: both
tags: [навигация, деньги, финансы, точка входа]
related: [kak-menyat-valyutu, bankovskij-schet, stoimost-zhizni-ba, byudzhet-poezdki, nalogi-i-monotributo]
warnings:
  - "Курс, комиссии, лимиты и налоговые пороги меняются: проверяйте первичный источник в день операции."
  - "Не используйте уличного посредника, Telegram-обменник или криптоперевод незнакомцу как единственный способ получить наличные."
recommendations:
  - "Соберите минимум два независимых платёжных канала, проведите тестовые операции и держите аварийный резерв отдельно."
last_verified: "2026-07-20"
seo_slug: "gid-po-dengam-argentina"
confidence: high
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 30
sources:
  - id: bcra-authorized-fx
    title: "BCRA — operaciones de cambio por entidades autorizadas"
    url: "https://www.bcra.gob.ar/noticias/el-bcra-aclara-que-no-hay-ningun-cambio-normativo-para-la-compra-de-dolares-por-parte-de-las-personas-humanas/"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-20"
    expires_at: "2026-08-19"
  - id: visa-russia-suspension
    title: "Visa — suspension of Russia operations"
    url: "https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.18871.html"
    lang: en
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-20"
    expires_at: "2026-08-19"
  - id: bcra-migrant-account
    title: "BCRA — Cuenta gratuita para inmigrantes"
    url: "https://www.bcra.gob.ar/noticias/cuenta-gratuita-inmigrantes.asp"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-20"
    expires_at: "2026-08-19"
  - id: arca-monotributo-categories
    title: "ARCA — categorías de monotributo"
    url: "https://arca.gob.ar/monotributo/categorias.asp"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-20"
    expires_at: "2026-08-19"
  - id: indec-ipc
    title: "INDEC — Índice de precios al consumidor"
    url: "https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-07-20"
    expires_at: "2026-08-19"
claims:
  - id: authorized-fx-channels
    text: "BCRA указывает банки и уполномоченные обменные организации как легальные каналы валютных операций."
    sensitive: true
    source_ids: [bcra-authorized-fx]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: russian-visa-abroad-disabled
    text: "Карты Visa, выпущенные в России, не работают за пределами страны после приостановки российских операций платёжной системой."
    sensitive: true
    source_ids: [visa-russia-suspension]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: migrant-basic-account
    text: "BCRA публикует возможность бесплатного базового счёта для мигрантов, включая заявителей с precaria при выполнении требований банка."
    sensitive: true
    source_ids: [bcra-migrant-account]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: monotributo-values-change
    text: "Категории и суммы monotributo публикует ARCA; их нужно проверять по действующей таблице, а не фиксировать бессрочно."
    sensitive: true
    source_ids: [arca-monotributo-categories]
    verified_at: "2026-07-20"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Главный принцип: не искать один «лучший» способ

Финансовая среда Аргентины меняется быстрее привычного: курс песо, банковские лимиты, комиссии, налоговые значения и доступность продуктов нельзя считать постоянными. Устойчивый план строится не вокруг одного сервиса, а вокруг нескольких независимых каналов и проверки итоговой суммы перед каждой важной операцией.

Туристу нужны оплата, обмен и резерв. Переезжающему дополнительно понадобятся местный счёт, доказуемое происхождение денег, бюджет в песо и понимание налогового статуса. Не смешивайте эти задачи.

## Обмен валюты

Начните с [[kak-menyat-valyutu|гайда по курсам и обмену]]. В Аргентине одновременно обсуждают официальный курс, *blue*, MEP и карточную конвертацию, но это не взаимозаменяемые «цены доллара».

MEP — операция с ценными бумагами, а не касса с гарантированным мгновенным обменом: [[chto-takoe-mep|что такое MEP]]. Наличный *blue* отражает неформальный рынок; его актуальную роль разбирает [[aktualen-li-blue-dollar|отдельный FAQ]]. Для безопасной валютной операции BCRA направляет к банкам и уполномоченным обменным организациям.

Перед обменом спросите курс покупки вашей купюры, комиссию и итог в песо. Пересчитайте деньги у кассы, заберите чек и не передавайте наличные уличному посреднику ради небольшого выигрыша.

## Оплата без российских карт

Visa официально приостановила российские операции, поэтому выпущенную в России Visa нельзя считать рабочим способом оплаты в Аргентине. Аналогичное ограничение действует для российских Mastercard и разобрано в [[kak-platit-esli-karta-rf-ne-rabotaet|практическом плане оплаты]].

Соберите комбинацию:

- законно оформленная иностранная карта, если эмитент разрешает операции в Аргентине;
- разумный запас наличных, разделённый между безопасными местами;
- проверяемый денежный перевод, доступность которого подтверждена именно для страны отправления;
- предоплата ключевых бронирований через продавца с понятными условиями возврата.

До поездки проведите малую тестовую операцию каждым цифровым способом. Сохраните контакты банков и провайдеров не только в телефоне. Криптовалюта и P2P не являются автоматической гарантией выгоды или безопасности: проверяйте контрагента, сеть, комиссию, курс, законность и налоговые последствия.

## Местный счёт и кошелёк

Подробный маршрут — в [[banki-i-perevody|гиде по банковскому счёту]]. BCRA публикует базовый бесплатный счёт для мигрантов, включая заявителей с precaria при выполнении условий банка. Это не обещание любого продукта в любом приложении и не гарантия кредитного лимита.

Перед открытием уточните:

- какой документ и миграционный статус принимает конкретный банк;
- стоимость обслуживания и переводов;
- лимиты, подтверждение происхождения средств и доступ к валютным операциям;
- кто владелец CBU/CVU или alias перед переводом;
- как восстановить доступ без старой SIM-карты.

Не открывайте второй CUIL или CUIT ради обхода ошибки: сначала исправьте или объедините записи в соответствующем ведомстве.

## Как считать бюджет

Не переносите чужую сумму «на месяц в Буэнос-Айресе» на себя. Используйте [[stoimost-zhizni-ba|живую методику бюджета]], [[stoimost-zhizni-semya-i-para|сценарии пары и семьи]] или [[byudzhet-poezdki|смету путешествия]].

Считайте отдельно жильё и депозит, коммунальные услуги, еду, транспорт, связь, медицину, документы, досуг и резерв. Цены пересматривайте в текущей валюте расчёта. Для сравнения месяцев используйте официальный индекс потребительских цен INDEC, но не подменяйте им реальные предложения по вашему району и профилю расходов.

## Доход и налоги

Получение денег и налоговая обязанность — разные вопросы. Для удалённой работы начните с [[udalyonnaya-rabota-i-oplata|гайда по оплате]], для самостоятельной деятельности — с [[nalogi-i-monotributo|monotributo]] и [[otkrytie-biznesa|бизнеса]]. ARCA обновляет категории и суммы; проверяйте таблицу на дату регистрации и recategorización.

Если доход приходит из-за рубежа, не делайте вывод о валютном или налоговом режиме по совету платёжного сервиса. Фактическое место деятельности, резидентство, вид услуги и способ зачисления могут иметь разные последствия. Для значимых сумм нужна индивидуальная консультация аргентинского contador.

## Сбережения и крупные покупки

[[zashchita-nakoplenij-ot-inflyacii|Защита накоплений]] и [[pokupka-nedvizhimosti|недвижимость]] — не список гарантированно доходных инструментов. До сделки проверяйте ликвидность, комиссию, налоги, происхождение средств и риск контрагента. Не переводите крупную сумму на личный счёт менеджера, если договор заключён с компанией.

Минимальная финансовая гигиена: два независимых канала, тестовая операция, письменные условия, сверка получателя, резерв вне телефона и остановка при давлении «оплатить прямо сейчас».

## Источники

- [BCRA — уполномоченные валютные каналы](https://www.bcra.gob.ar/noticias/el-bcra-aclara-que-no-hay-ningun-cambio-normativo-para-la-compra-de-dolares-por-parte-de-las-personas-humanas/)
- [Visa — приостановка российских операций](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.18871.html)
- [BCRA — бесплатный счёт для мигрантов](https://www.bcra.gob.ar/noticias/cuenta-gratuita-inmigrantes.asp)
- [ARCA — категории monotributo](https://arca.gob.ar/monotributo/categorias.asp)
- [INDEC — индекс потребительских цен](https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31)
