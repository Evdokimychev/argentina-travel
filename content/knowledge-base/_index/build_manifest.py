#!/usr/bin/env python3
"""
Сборщик машиночитаемого индекса базы знаний «Пора в Аргентину».

Запуск (из корня База-знаний/ или из любой директории — путь определяется автоматически):
    python3 _index/build_manifest.py

Что делает:
1. Сканирует все *.md файлы базы (кроме _templates/, README.md, SCHEMA.md, TAXONOMY.md, BACKLOG.md).
2. Парсит YAML frontmatter каждой записи.
3. Строит manifest.json (полный список сущностей с ключевыми полями — для поиска/фильтров/генерации страниц)
   и manifest.csv (для быстрого просмотра в таблице).
4. Проверяет целостность: дубли id, битые ссылки в related/stops/nearest_city/region_id (форвард-ссылки
   на ещё не созданные записи — не ошибка, но выводится в отчёт), пустые обязательные поля.
5. Печатает отчёт о проблемах в консоль и сохраняет его в _index/validation-report.md.

Требует: pyyaml (pip install pyyaml --break-system-packages)
"""
import yaml
import glob
import json
import csv
import os
import re
import sys
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXCLUDE_NAMES = {"README.md", "SCHEMA.md", "TAXONOMY.md", "BACKLOG.md", "AUDIT.md", "ARCHITECTURE.md"}
COMMON_REQUIRED = ["id", "type", "status", "last_verified", "confidence"]
# faq использует question/short_answer вместо title/summary — см. SCHEMA.md §3
TYPE_REQUIRED = {
    "faq": ["question", "short_answer"],
}
DEFAULT_TYPE_REQUIRED = ["title", "summary"]
SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")  # чистый kebab-case id, без кириллицы/пробелов
WIKILINK_RE = re.compile(r"\[\[([^\]]+)\]\]")
WORD_RE = re.compile(r"[A-Za-zА-Яа-яЁё0-9]+")

# Навигационные хабы (точки входа) — исключаются из проверки на «осиротевшие»: сами являются входами
HUBS = {
    "gid-puteshestvennika", "gid-relokanta",
    "gid-po-dengam", "gid-po-dokumentam", "gid-po-zhilyu",
    "gid-po-medicine", "gid-po-transportu", "gid-po-kulture",
}
# Канонические разделы сайта (site_sections) → названия для меню и хлебных крошек
SECTION_TITLES = {
    "puteshestviya-po-argentine": "Путешествия по Аргентине",
    "goroda-i-regiony": "Города и регионы",
    "zhizn-v-strane": "Жизнь в стране",
    "pereezd-v-argentinu": "Переезд в Аргентину",
    "finansy-i-ekonomika": "Финансы и экономика",
    "dokumenty-i-legalizatsiya": "Документы и легализация",
    "lichnyy-opyt": "Личный опыт",
}
SITE_READY_HERO_TYPES = {"city", "national_park", "attraction", "region", "route"}
SENSITIVE_SECTION_IDS = {
    "pereezd-v-argentinu",
    "dokumenty-i-legalizatsiya",
    "finansy-i-ekonomika",
}
SENSITIVE_TEXT_RE = re.compile(
    r"(внж|гражданств|иммиграц|миграц|dni|cuil|cuit|radex|dnu|декрет|виза|"
    r"резиденц|апостил|налог|monotributo|банк|перевод|валют|blue dollar|страхов|"
    r"медицин|безопасн|мошеннич|краж|преступ|полици|motochorro)",
    re.IGNORECASE,
)


def read_body_wikilinks(path):
    """Возвращает множество id из [[вики-ссылок]] в теле статьи (после frontmatter).
    Поддерживает синтаксис [[id|Отображаемый текст]] — берётся часть до '|'."""
    text = open(path, encoding="utf-8").read()
    parts = text.split("---", 2)
    body = parts[2] if len(parts) >= 3 else text
    return set(m.split("|")[0].strip() for m in WIKILINK_RE.findall(body))


def read_body(path):
    text = open(path, encoding="utf-8").read()
    parts = text.split("---", 2)
    return parts[2].strip() if len(parts) >= 3 else text.strip()


def find_entity_files():
    files = glob.glob(os.path.join(BASE_DIR, "**", "*.md"), recursive=True)
    result = []
    for f in files:
        rel = os.path.relpath(f, BASE_DIR)
        if rel.split(os.sep)[0] in ("_templates", "_index", "_istochniki"):
            continue
        if os.path.basename(f) in EXCLUDE_NAMES:
            continue
        result.append(f)
    return sorted(result)


def parse_entity(path):
    text = open(path, encoding="utf-8").read()
    if not text.strip():
        return None, "empty file"
    if not text.startswith("---"):
        return None, "no frontmatter"
    parts = text.split("---", 2)
    if len(parts) < 3:
        return None, "malformed frontmatter"
    try:
        data = yaml.safe_load(parts[1])
    except Exception as e:
        return None, f"YAML error: {e}"
    if not isinstance(data, dict):
        return None, "frontmatter is not a mapping"
    normalize_list_fields(data)
    normalize_structured_fields(data)
    return data, None


def normalize_list_value(value):
    """Мягко чинит частую ошибку импорта: "[a, b]" как строка вместо YAML-списка."""
    if isinstance(value, list):
        return value
    if not isinstance(value, str):
        return value
    text = value.strip()
    if text.startswith("[") and text.endswith("]"):
        inner = text[1:-1].strip()
        if not inner:
            return []
        return [
            item.strip().replace('\\"', '"').strip("\"'")
            for item in inner.split(",")
            if item.strip()
        ]
    return [text] if text else []


def normalize_list_fields(data):
    for key in ("aliases", "tags", "site_sections", "related", "best_time"):
        if key in data:
            data[key] = normalize_list_value(data[key])


def normalize_cost_value(value):
    if value is None or isinstance(value, dict):
        return value
    if not isinstance(value, str):
        return None
    text = value.strip()
    if not text or text == "[object Object]":
        return None
    if text.startswith("{") and text.endswith("}"):
        try:
            parsed = yaml.safe_load(text)
        except Exception:
            return None
        return parsed if isinstance(parsed, dict) else None
    return {"details": text}


def normalize_structured_fields(data):
    if "cost" in data:
        data["cost"] = normalize_cost_value(data["cost"])


def collect_related_ids(data):
    """Собирает все id, на которые ссылается запись, из разных полей."""
    ids = set()
    for key in ("related",):
        v = data.get(key)
        if isinstance(v, list):
            ids.update(str(x) for x in v)
    nc = data.get("nearest_city")
    if isinstance(nc, str) and SLUG_RE.match(nc):
        # проверяем как ссылку, только если это чистый kebab-case slug, а не описательная строка на русском
        ids.add(nc)
    stops = data.get("stops")
    if isinstance(stops, list):
        for s in stops:
            if isinstance(s, dict) and "id" in s and SLUG_RE.match(str(s["id"])):
                ids.add(str(s["id"]))
    rid = data.get("region_id")
    if isinstance(rid, str) and SLUG_RE.match(rid):
        ids.add(rid)
    return ids


def parse_iso_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except ValueError:
        return None


def is_sensitive_entry(data):
    sections = data.get("site_sections") or []
    if any(section in SENSITIVE_SECTION_IDS for section in sections):
        return True
    text = " ".join(
        str(part)
        for part in [
            data.get("title"),
            data.get("question"),
            data.get("summary"),
            data.get("short_answer"),
            data.get("subtype"),
            *(data.get("tags") or []),
        ]
        if part
    )
    return bool(SENSITIVE_TEXT_RE.search(text))


def build_editorial_meta(data, word_count=None):
    sensitive = is_sensitive_entry(data)
    confidence = data.get("confidence")
    policy_days = 45 if sensitive else 30 if confidence == "low" else 90 if confidence == "medium" else 180
    last_verified = parse_iso_date(data.get("last_verified"))
    review_due_at = last_verified + timedelta(days=policy_days) if last_verified else None
    today = datetime.now().date()
    source_count = len(data.get("sources") or [])
    missing_sources = sensitive and source_count == 0
    primary_source_count = sum(
        1 for source in (data.get("sources") or [])
        if str(source.get("type") or "").lower() in {"official", "government", "primary"}
    )
    missing_primary_source = sensitive and primary_source_count == 0
    missing_reviewer = sensitive and not data.get("reviewer")
    hero = (data.get("media") or {}).get("hero") or None
    missing_media_rights = bool(hero) and any(
        not hero.get(field) for field in ("url", "alt", "author", "license", "source_page")
    )
    review_due = review_due_at is None or review_due_at < today
    return {
        "sensitive": sensitive,
        "policy_days": policy_days,
        "review_due_at": review_due_at.isoformat() if review_due_at else None,
        "review_due": review_due,
        "missing_sources": missing_sources,
        "primary_source_count": primary_source_count,
        "missing_primary_source": missing_primary_source,
        "missing_reviewer": missing_reviewer,
        "missing_media_rights": missing_media_rights,
        "source_count": source_count,
        "word_count": word_count,
        "needs_attention": (
            review_due
            or missing_sources
            or missing_primary_source
            or missing_reviewer
            or missing_media_rights
            or confidence == "low"
        ),
    }


def main():
    files = find_entity_files()
    entities = {}
    problems = []
    duplicates = []

    for path in files:
        rel = os.path.relpath(path, BASE_DIR)
        data, err = parse_entity(path)
        if err:
            problems.append(f"[ФАЙЛ] {rel}: {err}")
            continue
        entity_type = data.get("type")
        type_fields = TYPE_REQUIRED.get(entity_type, DEFAULT_TYPE_REQUIRED)
        required = COMMON_REQUIRED + type_fields
        # backlog-заглушки (пустые слоты для будущего личного контента) могут не иметь ещё проверенных фактов
        if data.get("status") == "backlog":
            required = [f for f in required if f not in ("last_verified", "confidence")]
        missing = [f for f in required if f not in data or data[f] in (None, "")]
        if missing:
            problems.append(f"[ПОЛЯ] {rel}: отсутствуют обязательные поля {missing}")
        eid = data.get("id")
        if not eid:
            continue
        if eid in entities:
            duplicates.append(f"[ДУБЛЬ ID] '{eid}' — {rel} и {entities[eid]['_path']}")
            continue
        data["_path"] = rel
        entities[eid] = data

    # Проверка битых/форвардных ссылок
    all_ids = set(entities.keys())
    dangling = []
    for eid, data in entities.items():
        for ref in collect_related_ids(data):
            if ref not in all_ids:
                dangling.append(f"{eid} ({data['_path']}) → '{ref}' (записи с таким id нет — форвард-ссылка либо опечатка)")

    # Битые [[вики-ссылки]] в телах статей + граф входящих ссылок
    broken_wikilinks = []
    body_links = {}
    for eid, data in entities.items():
        wl = read_body_wikilinks(os.path.join(BASE_DIR, data["_path"]))
        body_links[eid] = wl
        for ref in wl:
            if ref not in all_ids:
                broken_wikilinks.append(f"{eid} ({data['_path']}) → [[{ref}]] (нет такой записи)")

    # Осиротевшие записи: 0 входящих ссылок (related + вики-ссылки в теле), кроме хабов и backlog-слотов
    inbound = {eid: 0 for eid in entities}
    for eid, data in entities.items():
        refs = set(collect_related_ids(data)) | body_links.get(eid, set())
        for ref in refs:
            if ref in inbound and ref != eid:
                inbound[ref] += 1
    orphans = [eid for eid, n in sorted(inbound.items())
               if n == 0 and eid not in HUBS and entities[eid].get("status") != "backlog"]
    site_ready_without_hero = [
        eid for eid, data in sorted(entities.items())
        if data.get("site_ready") is True
        and data.get("type") in SITE_READY_HERO_TYPES
        and not ((data.get("media") or {}).get("hero"))
    ]
    short_published = []
    unlocalized_titles = []
    template_import_bodies = []
    editorial_meta_by_id = {}
    editorial_types = {"city", "national_park", "attraction", "region", "route", "guide", "transport"}
    geo_title_types = {"city", "national_park", "attraction", "region", "route"}
    for eid, data in sorted(entities.items()):
        body = read_body(os.path.join(BASE_DIR, data["_path"]))
        word_count = len(WORD_RE.findall(body))
        editorial_meta_by_id[eid] = build_editorial_meta(data, word_count=word_count)
        title = data.get("title") or data.get("question") or ""
        if data.get("status") == "published" and data.get("type") in editorial_types and word_count < 120:
            short_published.append((eid, word_count))
        if data.get("type") in geo_title_types and title and not re.search(r"[А-Яа-яЁё]", str(title)):
            unlocalized_titles.append(eid)
        if "Материал подготовлен на основе официального портала INPROTUR" in body:
            template_import_bodies.append(eid)

    # Манифест
    manifest = []
    for eid, data in sorted(entities.items()):
        editorial_meta = editorial_meta_by_id.get(eid) or build_editorial_meta(data)
        manifest.append({
            "id": eid,
            "type": data.get("type"),
            "subtype": data.get("subtype"),
            "title": data.get("title"),
            "summary": data.get("summary"),
            "status": data.get("status"),
            "region_id": data.get("region_id"),
            "province": data.get("province"),
            "coordinates": data.get("coordinates"),
            "best_time": data.get("best_time"),
            "duration": data.get("duration"),
            "how_to_get_there": data.get("how_to_get_there"),
            "media": data.get("media"),
            "tags": data.get("tags", []),
            "site_sections": data.get("site_sections", []),
            "confidence": data.get("confidence"),
            "last_verified": data.get("last_verified"),
            "reviewer": data.get("reviewer"),
            "long_form_source": data.get("long_form_source"),
            "site_id_map": data.get("site_id_map"),
            "site_ready": data.get("site_ready"),
            "editorial": editorial_meta,
            "path": data.get("_path"),
        })

    out_dir = os.path.join(BASE_DIR, "_index")
    os.makedirs(out_dir, exist_ok=True)

    with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "total_entities": len(manifest),
            "entities": manifest,
        }, f, ensure_ascii=False, indent=2)

    csv_path = os.path.join(out_dir, "manifest.csv")
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow([
            "id", "type", "subtype", "title", "status", "region_id", "confidence",
            "last_verified", "sensitive", "review_due_at", "needs_attention", "word_count", "path",
        ])
        for e in manifest:
            w.writerow([e["id"], e["type"], e.get("subtype") or "", e["title"], e["status"],
                        e.get("region_id") or "", e["confidence"], e["last_verified"],
                        e["editorial"]["sensitive"], e["editorial"]["review_due_at"],
                        e["editorial"]["needs_attention"], e["editorial"]["word_count"], e["path"]])

    # Навигационное дерево для сайта: раздел (site_section) → записи, плюс список хабов.
    # Сайт использует его для меню, хлебных крошек, категорий блога, FAQ-раздела и путеводителя.
    navigation = {"generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
                  "hubs": sorted(h for h in HUBS if h in entities),
                  "sections": {}}
    for eid, data in sorted(entities.items()):
        for sec in (data.get("site_sections") or []):
            navigation["sections"].setdefault(sec, {"title": SECTION_TITLES.get(sec, sec), "entries": []})
            navigation["sections"][sec]["entries"].append({
                "id": eid, "type": data.get("type"), "subtype": data.get("subtype"),
                "title": data.get("title") or data.get("question"),
            })
    with open(os.path.join(out_dir, "navigation.json"), "w", encoding="utf-8") as f:
        json.dump(navigation, f, ensure_ascii=False, indent=2)

    # content.json — полные данные записей (frontmatter + тело markdown) для рендера страниц сайта.
    # Node-сборка сайта читает этот JSON напрямую (в проекте нет runtime-парсера markdown).
    content_entries = []
    for eid, data in sorted(entities.items()):
        editorial_meta = editorial_meta_by_id.get(eid) or build_editorial_meta(data)
        text = open(os.path.join(BASE_DIR, data["_path"]), encoding="utf-8").read()
        parts = text.split("---", 2)
        body = parts[2].strip() if len(parts) >= 3 else ""
        lv = data.get("last_verified")
        content_entries.append({
            "id": eid,
            "type": data.get("type"),
            "subtype": data.get("subtype"),
            "title": data.get("title") or data.get("question"),
            "title_es": data.get("title_es"),
            "summary": data.get("summary") or data.get("short_answer"),
            "aliases": data.get("aliases", []),
            "tags": data.get("tags", []),
            "site_sections": data.get("site_sections", []),
            "topic": data.get("topic"),
            "applies_to": data.get("applies_to"),
            "related": data.get("related", []),
            "warnings": data.get("warnings", []),
            "recommendations": data.get("recommendations", []),
            "sources": data.get("sources", []),
            "media": data.get("media"),
            "status": data.get("status"),
            "confidence": data.get("confidence"),
            "last_verified": str(lv) if lv else None,
            "reviewer": data.get("reviewer"),
            "seo_slug": data.get("seo_slug"),
            "site_ready": data.get("site_ready"),
            "editorial": editorial_meta,
            "coordinates": data.get("coordinates"),
            "region_id": data.get("region_id"),
            "province": data.get("province"),
            "how_to_get_there": data.get("how_to_get_there"),
            "best_time": data.get("best_time"),
            "cost": data.get("cost"),
            "duration": data.get("duration"),
            "body": body,
        })
    with open(os.path.join(out_dir, "content.json"), "w", encoding="utf-8") as f:
        json.dump({"generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
                   "total_entities": len(content_entries),
                   "entities": content_entries}, f, ensure_ascii=False, indent=2)

    # Отчёт
    published_ids = [
        eid for eid, data in sorted(entities.items())
        if data.get("status") == "published"
    ]
    sensitive_entries = [
        eid for eid in published_ids
        if editorial_meta_by_id.get(eid, {}).get("sensitive")
    ]
    sensitive_without_sources = [
        eid for eid in sensitive_entries
        if editorial_meta_by_id.get(eid, {}).get("missing_sources")
    ]
    review_due_entries = [
        eid for eid in published_ids
        if editorial_meta_by_id.get(eid, {}).get("review_due")
    ]
    attention_entries = [
        eid for eid in published_ids
        if editorial_meta_by_id.get(eid, {}).get("needs_attention")
    ]
    low_confidence_entries = [
        eid for eid in published_ids
        if entities[eid].get("confidence") == "low"
    ]
    report_lines = [
        f"# Отчёт валидации базы знаний",
        f"",
        f"Сгенерировано: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"",
        f"Всего валидных записей: **{len(entities)}**",
        f"Проблемных файлов: **{len(problems)}**",
        f"Дублей id: **{len(duplicates)}**",
        f"Форвард-ссылок / потенциальных опечаток в related: **{len(dangling)}**",
        f"Битых [[вики-ссылок]] в телах: **{len(broken_wikilinks)}**",
        f"Осиротевших записей (0 входящих ссылок): **{len(orphans)}**",
        f"Записей `site_ready: true` без hero-фото: **{len(site_ready_without_hero)}**",
        f"Коротких опубликованных записей (<120 слов): **{len(short_published)}**",
        f"Гео-заголовков без русской адаптации: **{len(unlocalized_titles)}**",
        f"Шаблонных импортных текстов INPROTUR: **{len(template_import_bodies)}**",
        f"Чувствительных опубликованных материалов: **{len(sensitive_entries)}**",
        f"Чувствительных материалов без источников: **{len(sensitive_without_sources)}**",
        f"Материалов с наступившей плановой перепроверкой: **{len(review_due_entries)}**",
        f"Материалов с низкой уверенностью: **{len(low_confidence_entries)}**",
        f"Материалов, требующих редакционного внимания: **{len(attention_entries)}**",
        f"",
    ]
    by_type = {}
    for e in manifest:
        by_type[e["type"]] = by_type.get(e["type"], 0) + 1
    report_lines.append("## По типам\n")
    for t, n in sorted(by_type.items()):
        report_lines.append(f"- `{t}`: {n}")
    report_lines.append("")

    if problems:
        report_lines.append("## Проблемы файлов\n")
        report_lines.extend(f"- {p}" for p in problems)
        report_lines.append("")
    if duplicates:
        report_lines.append("## Дубли id\n")
        report_lines.extend(f"- {d}" for d in duplicates)
        report_lines.append("")
    if dangling:
        report_lines.append("## Ссылки без существующей записи (форвард-ссылки или опечатки)\n")
        report_lines.extend(f"- {d}" for d in sorted(dangling))
        report_lines.append("")
    if broken_wikilinks:
        report_lines.append("## Битые [[вики-ссылки]] в телах статей\n")
        report_lines.extend(f"- {d}" for d in sorted(broken_wikilinks))
        report_lines.append("")
    if orphans:
        report_lines.append("## Осиротевшие записи (никто не ссылается — стоит добавить входящую ссылку)\n")
        report_lines.extend(f"- `{o}` ({entities[o].get('type')}, {entities[o]['_path']})" for o in orphans)
        report_lines.append("")
    if site_ready_without_hero:
        report_lines.append("## Готовность к сайту: нет hero-фото\n")
        report_lines.extend(
            f"- `{o}` ({entities[o].get('type')}, {entities[o]['_path']})"
            for o in site_ready_without_hero
        )
        report_lines.append("")
    if short_published:
        report_lines.append("## Редакционный долг: короткие опубликованные записи\n")
        for o, word_count in short_published[:80]:
            report_lines.append(
                f"- `{o}` ({entities[o].get('type')}, {entities[o]['_path']}) — {word_count} слов"
            )
        if len(short_published) > 80:
            report_lines.append(f"- …и ещё {len(short_published) - 80}")
        report_lines.append("")
    if unlocalized_titles:
        report_lines.append("## Редакционный долг: заголовки без русской адаптации\n")
        for o in unlocalized_titles[:80]:
            report_lines.append(
                f"- `{o}` ({entities[o].get('type')}, {entities[o]['_path']}) — {entities[o].get('title')}"
            )
        if len(unlocalized_titles) > 80:
            report_lines.append(f"- …и ещё {len(unlocalized_titles) - 80}")
        report_lines.append("")
    if template_import_bodies:
        report_lines.append("## Редакционный долг: шаблонные импортные тексты INPROTUR\n")
        for o in template_import_bodies[:80]:
            report_lines.append(
                f"- `{o}` ({entities[o].get('type')}, {entities[o]['_path']})"
            )
        if len(template_import_bodies) > 80:
            report_lines.append(f"- …и ещё {len(template_import_bodies) - 80}")
        report_lines.append("")
    if sensitive_without_sources:
        report_lines.append("## Редакционный контроль: чувствительные материалы без источников\n")
        for o in sensitive_without_sources[:80]:
            report_lines.append(
                f"- `{o}` ({entities[o].get('type')}, {entities[o]['_path']}) — {entities[o].get('title') or entities[o].get('question')}"
            )
        if len(sensitive_without_sources) > 80:
            report_lines.append(f"- …и ещё {len(sensitive_without_sources) - 80}")
        report_lines.append("")
    if review_due_entries:
        report_lines.append("## Редакционный контроль: наступила плановая перепроверка\n")
        for o in review_due_entries[:80]:
            meta = editorial_meta_by_id.get(o, {})
            report_lines.append(
                f"- `{o}` ({entities[o].get('type')}, {entities[o]['_path']}) — "
                f"проверить до {meta.get('review_due_at') or 'дата не задана'}"
            )
        if len(review_due_entries) > 80:
            report_lines.append(f"- …и ещё {len(review_due_entries) - 80}")
        report_lines.append("")
    if low_confidence_entries:
        report_lines.append("## Редакционный контроль: низкая уверенность\n")
        for o in low_confidence_entries[:80]:
            report_lines.append(
                f"- `{o}` ({entities[o].get('type')}, {entities[o]['_path']}) — {entities[o].get('title') or entities[o].get('question')}"
            )
        if len(low_confidence_entries) > 80:
            report_lines.append(f"- …и ещё {len(low_confidence_entries) - 80}")
        report_lines.append("")

    report = "\n".join(report_lines)
    with open(os.path.join(out_dir, "validation-report.md"), "w", encoding="utf-8") as f:
        f.write(report)

    print(report)
    print(f"\nmanifest.json и manifest.csv сохранены в {out_dir}")


if __name__ == "__main__":
    main()
