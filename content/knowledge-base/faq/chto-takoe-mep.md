---
id: chto-takoe-mep
type: faq
question: "Что такое dólar MEP в Аргентине и зачем он нужен?"
short_answer: "Dólar MEP — не отдельная валюта и не обменный пункт, а подразумеваемый курс операций с ценными бумагами, которые покупают за песо и продают с расчётом в долларах внутри Аргентины. Для него нужен счёт у зарегистрированного участника рынка, а итог зависит от цены бумаг, комиссий и действующих правил."
topic: dengi
status: published
site_sections: [finansy-i-ekonomika, pereezd-v-argentinu]
tags: [деньги, валюта, MEP, инвестиции]
related: [kak-menyat-valyutu, bankovskij-schet]
last_verified: "2026-08-21"
confidence: high
provenance:
  schema_version: 1
  mode: strict
  stale_after_days: 30
sources:
  - id: cnv-investor-protection-guide
    title: "CNV — руководство по защите инвестора"
    url: "https://www.argentina.gob.ar/sites/default/files/2024.09.06_actualizacion_guia_de_proteccion_al_inversor_-_vf_09.09.24.cleaned.pdf"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-08-21"
    expires_at: "2026-09-20"
  - id: cnv-mep-local-settlement
    title: "CNV — операции с расчётом в иностранной валюте в Аргентине (MEP)"
    url: "https://www.argentina.gob.ar/noticias/eliminacion-del-parking-y-otras-trabas-regulatorias-operaciones-en-el-marco-de-creditos"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-08-21"
    expires_at: "2026-09-20"
  - id: cnv-faq-custody
    title: "CNV — вопросы об инвестиционном счёте и хранении активов"
    url: "https://www.argentina.gob.ar/preguntas-frecuentes-cnv"
    lang: es
    type: official
    authority: primary
    url_status: verified
    checked_at: "2026-08-21"
    expires_at: "2026-09-20"
claims:
  - id: mep-is-securities-operation
    text: "Dólar MEP возникает при операциях с ценными бумагами с расчётом в иностранной валюте внутри Аргентины."
    sensitive: true
    source_ids: [cnv-mep-local-settlement]
    verified_at: "2026-08-21"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: capital-market-account-required
    text: "Для операций на рынке капитала инвестор использует зарегистрированного агента и инвестиционный счёт; агент может взимать публично раскрываемую комиссию."
    sensitive: true
    source_ids: [cnv-investor-protection-guide, cnv-faq-custody]
    verified_at: "2026-08-21"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
  - id: investor-should-verify-agent
    text: "CNV рекомендует проверять регистрацию агента и движения активов по счёту."
    sensitive: true
    source_ids: [cnv-investor-protection-guide, cnv-faq-custody]
    verified_at: "2026-08-21"
    reviewer: { id: "goargentina-editorial", role: "Редакционная проверка источников" }
---

## Ответ

**Dólar MEP** (его также называют dólar bolsa) — это не банкнота и не установленный государством курс. Так называют подразумеваемый курс, который получается, когда ценную бумагу покупают за песо, а затем продают с расчётом в долларах внутри Аргентины. Конкретный инструмент, срок расчёта и доступные действия зависят от текущих правил и выбранного агента.

Для такой операции нужен счёт у участника рынка, зарегистрированного CNV, — обычно его называют cuenta comitente. Потребуются идентификация клиента, подходящие банковские реквизиты и подтверждение происхождения средств; точный набор условий устанавливают регулирование и агент. Комиссия, разница цен покупки и продажи и движение рынка влияют на итог, поэтому кнопка «купить MEP» в приложении не превращает операцию в обмен по гарантированному курсу.

MEP используют люди, уже включённые в аргентинскую банковскую и инвестиционную инфраструктуру. Для туриста без местного счёта и документов это не базовый способ поменять наличные после прилёта. Не переводите деньги человеку, который обещает «сделать MEP через свой аккаунт»: счёт и банковские реквизиты должны принадлежать надлежащему владельцу, а посредника следует проверять в реестре CNV.

Перед операцией запросите у агента четыре значения: ожидаемый итог в долларах, все комиссии, срок расчёта и ограничения, связанные с другими валютными операциями. Затем сравните эффективный курс с легальным обменом через банк или уполномоченный обменный дом. Старые инструкции по MEP быстро устаревают, поэтому экран приложения и правила агента в день сделки важнее статьи или видео прошлых лет.

## Источники

- [CNV — руководство по защите инвестора](https://www.argentina.gob.ar/sites/default/files/2024.09.06_actualizacion_guia_de_proteccion_al_inversor_-_vf_09.09.24.cleaned.pdf).
- [CNV — операции в иностранной валюте с расчётом в Аргентине](https://www.argentina.gob.ar/noticias/eliminacion-del-parking-y-otras-trabas-regulatorias-operaciones-en-el-marco-de-creditos).
- [CNV — вопросы об инвестиционном счёте](https://www.argentina.gob.ar/preguntas-frecuentes-cnv).
