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
from datetime import datetime

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


def read_body_wikilinks(path):
    """Возвращает множество id из [[вики-ссылок]] в теле статьи (после frontmatter).
    Поддерживает синтаксис [[id|Отображаемый текст]] — берётся часть до '|'."""
    text = open(path, encoding="utf-8").read()
    parts = text.split("---", 2)
    body = parts[2] if len(parts) >= 3 else text
    return set(m.split("|")[0].strip() for m in WIKILINK_RE.findall(body))


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
    return data, None


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

    # Манифест
    manifest = []
    for eid, data in sorted(entities.items()):
        manifest.append({
            "id": eid,
            "type": data.get("type"),
            "subtype": data.get("subtype"),
            "title": data.get("title"),
            "summary": data.get("summary"),
            "status": data.get("status"),
            "region_id": data.get("region_id"),
            "tags": data.get("tags", []),
            "site_sections": data.get("site_sections", []),
            "confidence": data.get("confidence"),
            "last_verified": data.get("last_verified"),
            "long_form_source": data.get("long_form_source"),
            "site_id_map": data.get("site_id_map"),
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
        w = csv.writer(f)
        w.writerow(["id", "type", "subtype", "title", "status", "region_id", "confidence", "last_verified", "path"])
        for e in manifest:
            w.writerow([e["id"], e["type"], e.get("subtype") or "", e["title"], e["status"],
                        e.get("region_id") or "", e["confidence"], e["last_verified"], e["path"]])

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
            "seo_slug": data.get("seo_slug"),
            "body": body,
        })
    with open(os.path.join(out_dir, "content.json"), "w", encoding="utf-8") as f:
        json.dump({"generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
                   "total_entities": len(content_entries),
                   "entities": content_entries}, f, ensure_ascii=False, indent=2)

    # Отчёт
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

    report = "\n".join(report_lines)
    with open(os.path.join(out_dir, "validation-report.md"), "w", encoding="utf-8") as f:
        f.write(report)

    print(report)
    print(f"\nmanifest.json и manifest.csv сохранены в {out_dir}")


if __name__ == "__main__":
    main()
