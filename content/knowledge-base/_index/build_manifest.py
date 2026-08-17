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
from collections import Counter
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

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
SOURCE_ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
CLAIM_ID_RE = SOURCE_ID_RE
PROVENANCE_SCHEMA_VERSION = 1
PROVENANCE_MODES = {"diagnostic", "strict"}
SOURCE_AUTHORITIES = {"primary", "secondary", "community"}


def atomic_write_json(path, payload):
    """Publish generated indexes atomically so readers never observe half-written JSON."""
    temporary_path = f"{path}.tmp-{os.getpid()}"
    try:
        with open(temporary_path, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temporary_path, path)
    finally:
        if os.path.exists(temporary_path):
            os.unlink(temporary_path)


def atomic_write_text(path, value):
    temporary_path = f"{path}.tmp-{os.getpid()}"
    try:
        with open(temporary_path, "w", encoding="utf-8") as handle:
            handle.write(value)
        os.replace(temporary_path, path)
    finally:
        if os.path.exists(temporary_path):
            os.unlink(temporary_path)
SOURCE_URL_STATUSES = {"verified", "redirected", "unreachable", "unchecked"}
EDITORIAL_TYPES = {"city", "national_park", "attraction", "region", "route", "guide", "transport"}
MIN_WORDS_BY_TYPE = {
    "attraction": 500,
    "national_park": 500,
    "city": 500,
    "region": 800,
    "route": 800,
    "transport": 600,
    "guide": 600,
    "faq": 120,
    "author_tip": 250,
}


def minimum_words_for(data):
    return MIN_WORDS_BY_TYPE.get(data.get("type"), 400)


def optional_fields(data, *keys):
    return {key: data.get(key) for key in keys if data.get(key) is not None}


def resolve_generated_at(entities, environ=None):
    """Return a reproducible timestamp for tracked generated indexes.

    CI/release tooling may pin the value with SOURCE_DATE_EPOCH. Local runs fall
    back to the newest editorial verification date, so rebuilding unchanged
    content never dirties the candidate solely because wall-clock time passed.
    """
    environ = os.environ if environ is None else environ
    source_date_epoch = environ.get("SOURCE_DATE_EPOCH")
    if source_date_epoch:
        try:
            timestamp = int(source_date_epoch)
        except (TypeError, ValueError) as error:
            raise SystemExit("SOURCE_DATE_EPOCH должен быть целым числом секунд Unix") from error
        return datetime.fromtimestamp(timestamp, tz=timezone.utc).strftime("%Y-%m-%d %H:%M")

    verified_dates = [
        parsed
        for data in entities.values()
        if (parsed := parse_iso_date(data.get("last_verified"))) is not None
    ]
    if verified_dates:
        return f"{max(verified_dates).isoformat()} 00:00"
    return "1970-01-01 00:00"

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


def source_output(source):
    if not isinstance(source, dict):
        return source
    result = dict(source)
    for key in ("checked_at", "expires_at"):
        if result.get(key) is not None:
            result[key] = str(result[key])
    return result


def claim_output(claim):
    if not isinstance(claim, dict):
        return claim
    result = dict(claim)
    if result.get("verified_at") is not None:
        result["verified_at"] = str(result["verified_at"])
    return result


def editorial_output(editorial):
    """Не отдаёт внутренние диагностические сообщения в публичный индекс."""
    result = dict(editorial)
    provenance = dict(result.get("provenance") or {})
    provenance.pop("details", None)
    if provenance.get("applicable") or provenance.get("declared"):
        result["provenance"] = provenance
    else:
        result.pop("provenance", None)
    return result


def provenance_config_output(data):
    config = data.get("provenance")
    if not isinstance(config, dict):
        return None
    return {
        "schema_version": config.get("schema_version"),
        "mode": config.get("mode"),
        "stale_after_days": config.get("stale_after_days"),
    }


def reviewer_is_present(value):
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, dict):
        return bool(str(value.get("id") or "").strip())
    return False


def add_provenance_issue(issues, details, code, message):
    issues.add(code)
    details.append({"code": code, "message": message})


def build_provenance_meta(data, sensitive, policy_days, today=None):
    """Проверяет claim-level provenance без сетевых запросов.

    URL health является редакционным свидетельством: генератор проверяет формат,
    дату и заявленный результат последней внешней проверки, но не подменяет её.
    """
    today = today or datetime.now().date()
    config = data.get("provenance")
    declared = isinstance(config, dict)
    schema_version = config.get("schema_version") if declared else PROVENANCE_SCHEMA_VERSION
    mode = config.get("mode") if declared else "diagnostic"
    stale_after_days = config.get("stale_after_days") if declared else policy_days
    issues = set()
    details = []

    if schema_version != PROVENANCE_SCHEMA_VERSION:
        add_provenance_issue(
            issues,
            details,
            "unsupported_provenance_schema",
            f"ожидалась версия {PROVENANCE_SCHEMA_VERSION}, получено {schema_version!r}",
        )
    if mode not in PROVENANCE_MODES:
        add_provenance_issue(
            issues,
            details,
            "invalid_provenance_mode",
            f"режим {mode!r} не поддерживается",
        )
        mode = "diagnostic"
    if not isinstance(stale_after_days, int) or isinstance(stale_after_days, bool) or stale_after_days < 1:
        add_provenance_issue(
            issues,
            details,
            "invalid_stale_after_days",
            "stale_after_days должен быть положительным целым числом",
        )
        stale_after_days = policy_days

    sources = data.get("sources") or []
    source_by_id = {}
    for index, source in enumerate(sources):
        if not isinstance(source, dict):
            add_provenance_issue(
                issues, details, "invalid_source", f"sources[{index}] должен быть объектом"
            )
            continue
        source_id = str(source.get("id") or "").strip()
        label = source_id or f"sources[{index}]"
        if not source_id:
            add_provenance_issue(
                issues, details, "missing_source_id", f"{label}: нет стабильного id источника"
            )
        elif not SOURCE_ID_RE.match(source_id):
            add_provenance_issue(
                issues, details, "invalid_source_id", f"{label}: id должен быть kebab-case"
            )
        elif source_id in source_by_id:
            add_provenance_issue(
                issues, details, "duplicate_source_id", f"{label}: id источника повторяется"
            )
        else:
            source_by_id[source_id] = source

        url = str(source.get("url") or "").strip()
        parsed_url = urlparse(url)
        if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
            add_provenance_issue(
                issues, details, "invalid_source_url", f"{label}: нужен абсолютный http(s) URL"
            )
        authority = source.get("authority")
        if authority not in SOURCE_AUTHORITIES:
            add_provenance_issue(
                issues,
                details,
                "missing_source_authority",
                f"{label}: authority должен быть primary, secondary или community",
            )
        url_status = source.get("url_status")
        if url_status not in SOURCE_URL_STATUSES:
            add_provenance_issue(
                issues,
                details,
                "missing_source_url_health",
                f"{label}: нет допустимого url_status",
            )
        elif url_status != "verified":
            add_provenance_issue(
                issues,
                details,
                "unhealthy_source_url",
                f"{label}: url_status={url_status}",
            )
        checked_at = parse_iso_date(source.get("checked_at"))
        if checked_at is None:
            add_provenance_issue(
                issues, details, "missing_source_checked_at", f"{label}: нет корректной checked_at"
            )
        elif checked_at + timedelta(days=stale_after_days) < today:
            add_provenance_issue(
                issues, details, "stale_source_url_check", f"{label}: URL давно не проверялся"
            )
        expires_at_value = source.get("expires_at")
        if expires_at_value:
            expires_at = parse_iso_date(expires_at_value)
            if expires_at is None:
                add_provenance_issue(
                    issues, details, "invalid_source_expiry", f"{label}: некорректная expires_at"
                )
            elif expires_at < today:
                add_provenance_issue(
                    issues, details, "expired_source", f"{label}: срок пригодности источника истёк"
                )

    claims = data.get("claims") or []
    if not isinstance(claims, list):
        add_provenance_issue(
            issues, details, "invalid_claim_registry", "claims должен быть списком"
        )
        claims = []
    if sensitive and not claims:
        add_provenance_issue(
            issues,
            details,
            "missing_sensitive_claim_mapping",
            "для чувствительного материала не описаны проверяемые утверждения",
        )

    claim_ids = set()
    sensitive_claim_count = 0
    for index, claim in enumerate(claims):
        if not isinstance(claim, dict):
            add_provenance_issue(
                issues, details, "invalid_claim", f"claims[{index}] должен быть объектом"
            )
            continue
        claim_id = str(claim.get("id") or "").strip()
        label = claim_id or f"claims[{index}]"
        if not claim_id:
            add_provenance_issue(
                issues, details, "missing_claim_id", f"{label}: нет стабильного id утверждения"
            )
        elif not CLAIM_ID_RE.match(claim_id):
            add_provenance_issue(
                issues, details, "invalid_claim_id", f"{label}: id должен быть kebab-case"
            )
        elif claim_id in claim_ids:
            add_provenance_issue(
                issues, details, "duplicate_claim_id", f"{label}: id утверждения повторяется"
            )
        else:
            claim_ids.add(claim_id)

        if not str(claim.get("text") or "").strip():
            add_provenance_issue(
                issues,
                details,
                "missing_claim_text",
                f"{label}: нет краткой формулировки проверяемого утверждения",
            )

        source_ids = claim.get("source_ids") or []
        if not isinstance(source_ids, list) or not source_ids:
            add_provenance_issue(
                issues,
                details,
                "claim_without_sources",
                f"{label}: нет списка source_ids",
            )
            source_ids = []
        mapped_sources = []
        for source_id in source_ids:
            source_id = str(source_id)
            source = source_by_id.get(source_id)
            if source is None:
                add_provenance_issue(
                    issues,
                    details,
                    "broken_claim_source_ref",
                    f"{label}: source_id {source_id!r} не найден",
                )
            else:
                mapped_sources.append(source)

        claim_sensitive = claim.get("sensitive")
        if claim_sensitive is None:
            claim_sensitive = sensitive
        if bool(claim_sensitive):
            sensitive_claim_count += 1
            if not any(source.get("authority") == "primary" for source in mapped_sources):
                add_provenance_issue(
                    issues,
                    details,
                    "sensitive_claim_without_primary_source",
                    f"{label}: нет связанного primary-источника",
                )
            verified_at = parse_iso_date(claim.get("verified_at"))
            if verified_at is None:
                add_provenance_issue(
                    issues,
                    details,
                    "sensitive_claim_missing_verified_at",
                    f"{label}: нет корректной verified_at",
                )
            elif verified_at + timedelta(days=stale_after_days) < today:
                add_provenance_issue(
                    issues, details, "stale_sensitive_claim", f"{label}: проверка устарела"
                )
            if not reviewer_is_present(claim.get("reviewer")):
                add_provenance_issue(
                    issues,
                    details,
                    "sensitive_claim_missing_reviewer",
                    f"{label}: не указан ответственный проверяющий",
                )

    if sensitive and claims and sensitive_claim_count == 0:
        add_provenance_issue(
            issues,
            details,
            "missing_sensitive_claim_mapping",
            "в чувствительном материале ни одно утверждение не помечено sensitive",
        )

    issue_codes = sorted(issues)
    return {
        "schema_version": PROVENANCE_SCHEMA_VERSION,
        "applicable": sensitive,
        "declared": declared,
        "mode": mode,
        "strict_ready": sensitive and declared and not issue_codes,
        "issue_count": len(details),
        "issue_codes": issue_codes,
        "source_count": len(sources),
        "identified_source_count": len(source_by_id),
        "claim_count": len(claims),
        "sensitive_claim_count": sensitive_claim_count,
        "stale_after_days": stale_after_days,
        "details": details,
    }


def build_editorial_meta(data, word_count=None, today=None):
    sensitive = is_sensitive_entry(data)
    confidence = data.get("confidence")
    policy_days = 45 if sensitive else 30 if confidence == "low" else 90 if confidence == "medium" else 180
    last_verified = parse_iso_date(data.get("last_verified"))
    review_due_at = last_verified + timedelta(days=policy_days) if last_verified else None
    today = today or datetime.now().date()
    source_count = sum(
        1
        for source in (data.get("sources") or [])
        if isinstance(source, dict)
        and re.match(r"^https?://\S+$", str(source.get("url") or "").strip(), re.IGNORECASE)
    )
    missing_sources = sensitive and source_count == 0
    review_due = review_due_at is None or review_due_at < today
    provenance = build_provenance_meta(data, sensitive, policy_days, today=today)
    return {
        "sensitive": sensitive,
        "policy_days": policy_days,
        "review_due_at": review_due_at.isoformat() if review_due_at else None,
        "review_due": review_due,
        "missing_sources": missing_sources,
        "source_count": source_count,
        "word_count": word_count,
        "needs_attention": review_due or missing_sources or confidence == "low" or (
            sensitive and not provenance["strict_ready"]
        ),
        "provenance": provenance,
    }


def is_release_candidate_sensitive(data, editorial_meta):
    """Совпадает с базовой областью публичного gate, исключая карантин."""
    return (
        data.get("status") == "published"
        and editorial_meta.get("sensitive") is True
        and data.get("site_ready") is not False
        and not editorial_meta.get("missing_sources")
        and (
            data.get("type") not in EDITORIAL_TYPES
            or (editorial_meta.get("word_count") or 0) >= minimum_words_for(data)
        )
    )


def main():
    supported_args = {"--diagnostic", "--strict-provenance"}
    unknown_args = [arg for arg in sys.argv[1:] if arg not in supported_args]
    if unknown_args:
        raise SystemExit(f"Неизвестные аргументы: {', '.join(unknown_args)}")
    strict_provenance_gate = "--strict-provenance" in sys.argv[1:]

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

    # Архив — это SEO-контракт, а не просто статус. Каждый старый URL обязан
    # вести напрямую на живой канонический материал, без цепочек и циклов.
    for eid, data in entities.items():
        if data.get("status") != "archived":
            continue
        redirect_to = str(data.get("redirect_to") or "").strip()
        archive_reason = str(data.get("archive_reason") or "").strip()
        if data.get("site_ready") is not False:
            problems.append(
                f"[АРХИВ] {data['_path']}: site_ready должен быть false"
            )
        if not archive_reason:
            problems.append(
                f"[АРХИВ] {data['_path']}: нет archive_reason"
            )
        if not redirect_to:
            problems.append(
                f"[АРХИВ] {data['_path']}: нет redirect_to"
            )
            continue
        if redirect_to == eid:
            problems.append(
                f"[АРХИВ] {data['_path']}: redirect_to ссылается на саму запись"
            )
            continue
        target = entities.get(redirect_to)
        if target is None:
            problems.append(
                f"[АРХИВ] {data['_path']}: redirect_to '{redirect_to}' не существует"
            )
        elif target.get("status") != "published":
            problems.append(
                f"[АРХИВ] {data['_path']}: redirect_to '{redirect_to}' должен вести прямо на published, сейчас {target.get('status')!r}"
            )

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
    # Архивные карточки намеренно исключены из публичной навигации. Не считаем их
    # осиротевшими: это создавало ложный редакционный долг после консолидации.
    orphans = [eid for eid, n in sorted(inbound.items())
               if n == 0 and eid not in HUBS and entities[eid].get("status") == "published"]
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
    geo_title_types = {"city", "national_park", "attraction", "region", "route"}
    for eid, data in sorted(entities.items()):
        body = read_body(os.path.join(BASE_DIR, data["_path"]))
        word_count = len(WORD_RE.findall(body))
        editorial_meta_by_id[eid] = build_editorial_meta(data, word_count=word_count)
        title = data.get("title") or data.get("question") or ""
        minimum_words = minimum_words_for(data)
        if data.get("status") == "published" and word_count < minimum_words:
            short_published.append((eid, word_count, minimum_words))
        if (data.get("status") == "published"
                and data.get("type") in geo_title_types
                and title
                and not re.search(r"[А-Яа-яЁё]", str(title))):
            unlocalized_titles.append(eid)
        if (data.get("status") == "published"
                and "Материал подготовлен на основе официального портала INPROTUR" in body):
            template_import_bodies.append(eid)

    published_sensitive_ids = [
        eid for eid, data in sorted(entities.items())
        if data.get("status") == "published"
        and editorial_meta_by_id[eid]["sensitive"]
    ]
    release_candidate_sensitive_ids = [
        eid for eid in published_sensitive_ids
        if is_release_candidate_sensitive(entities[eid], editorial_meta_by_id[eid])
    ]
    strict_ready_release_candidate_ids = [
        eid for eid in release_candidate_sensitive_ids
        if editorial_meta_by_id[eid]["provenance"]["strict_ready"]
    ]
    provenance_issue_counts = Counter(
        code
        for eid in release_candidate_sensitive_ids
        for code in editorial_meta_by_id[eid]["provenance"]["issue_codes"]
    )
    # validation_mode in written artifacts is always the corpus snapshot label.
    # CLI --strict-provenance only affects the process exit code / stdout, so
    # release-gate does not dirty the candidate tree by flipping this field.
    editorial_readiness = {
        "provenance_schema_version": PROVENANCE_SCHEMA_VERSION,
        "validation_mode": "diagnostic",
        "published_sensitive_count": len(published_sensitive_ids),
        "release_candidate_sensitive_count": len(release_candidate_sensitive_ids),
        "strict_ready_release_candidate_count": len(strict_ready_release_candidate_ids),
        "strict_ready": (
            len(strict_ready_release_candidate_ids) == len(release_candidate_sensitive_ids)
        ),
        "issue_counts": dict(sorted(provenance_issue_counts.items())),
    }
    generated_at = resolve_generated_at(entities)

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
            "long_form_source": data.get("long_form_source"),
            "site_id_map": data.get("site_id_map"),
            "site_ready": data.get("site_ready"),
            **optional_fields(
                data,
                "author_name",
                "personal_experience",
                "verified_by_ivan",
                "redirect_to",
                "archive_reason",
            ),
            "editorial": editorial_output(editorial_meta),
            "path": data.get("_path"),
        })

    # Не заменяем последний согласованный набор индексов данными, которые уже
    # не прошли обязательный gate. Иначе атомарность отдельного файла всё равно
    # оставляет потребителям новый, но заведомо некорректный снимок.
    structural_problem_count = (
        len(problems) + len(duplicates) + len(dangling) + len(broken_wikilinks)
    )
    if structural_problem_count:
        raise SystemExit(
            "Структурная проверка базы знаний не пройдена: "
            f"{structural_problem_count} проблем файлов, id или ссылок"
        )
    if strict_provenance_gate and not editorial_readiness["strict_ready"]:
        raise SystemExit(
            "Строгая claim-level проверка не пройдена: "
            f"готово {len(strict_ready_release_candidate_ids)}/"
            f"{len(release_candidate_sensitive_ids)} чувствительных кандидатов публикации"
        )

    out_dir = os.path.join(BASE_DIR, "_index")
    os.makedirs(out_dir, exist_ok=True)

    atomic_write_json(os.path.join(out_dir, "manifest.json"), {
        "generated_at": generated_at,
        "total_entities": len(manifest),
        "editorial_readiness": editorial_readiness,
        "entities": manifest,
    })

    csv_path = os.path.join(out_dir, "manifest.csv")
    csv_temporary_path = f"{csv_path}.tmp-{os.getpid()}"
    try:
        with open(csv_temporary_path, "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f, lineterminator="\n")
            w.writerow([
                "id", "type", "subtype", "title", "status", "region_id", "confidence",
                "last_verified", "sensitive", "review_due_at", "needs_attention", "word_count",
                "strict_provenance_ready", "provenance_issue_count", "path",
            ])
            for e in manifest:
                w.writerow([e["id"], e["type"], e.get("subtype") or "", e["title"], e["status"],
                            e.get("region_id") or "", e["confidence"], e["last_verified"],
                            e["editorial"]["sensitive"], e["editorial"]["review_due_at"],
                            e["editorial"]["needs_attention"], e["editorial"]["word_count"],
                            (e["editorial"].get("provenance") or {}).get("strict_ready", ""),
                            (e["editorial"].get("provenance") or {}).get("issue_count", ""), e["path"]])
        os.replace(csv_temporary_path, csv_path)
    finally:
        if os.path.exists(csv_temporary_path):
            os.unlink(csv_temporary_path)

    # Навигационное дерево для сайта: раздел (site_section) → записи, плюс список хабов.
    # Сайт использует его для меню, хлебных крошек, категорий блога, FAQ-раздела и путеводителя.
    navigation = {"generated_at": generated_at,
                  "hubs": sorted(h for h in HUBS if h in entities),
                  "sections": {}}
    for eid, data in sorted(entities.items()):
        for sec in (data.get("site_sections") or []):
            navigation["sections"].setdefault(sec, {"title": SECTION_TITLES.get(sec, sec), "entries": []})
            navigation["sections"][sec]["entries"].append({
                "id": eid, "type": data.get("type"), "subtype": data.get("subtype"),
                "title": data.get("title") or data.get("question"),
            })
    atomic_write_json(os.path.join(out_dir, "navigation.json"), navigation)

    # content.json — полные данные записей (frontmatter + тело markdown) для рендера страниц сайта.
    # Node-сборка сайта читает этот JSON напрямую (в проекте нет runtime-парсера markdown).
    content_entries = []
    for eid, data in sorted(entities.items()):
        editorial_meta = editorial_meta_by_id.get(eid) or build_editorial_meta(data)
        text = open(os.path.join(BASE_DIR, data["_path"]), encoding="utf-8").read()
        parts = text.split("---", 2)
        body = parts[2].strip() if len(parts) >= 3 else ""
        lv = data.get("last_verified")
        provenance_fields = {}
        if data.get("claims"):
            provenance_fields["claims"] = [claim_output(claim) for claim in data["claims"]]
        if isinstance(data.get("provenance"), dict):
            provenance_fields["provenance"] = provenance_config_output(data)
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
            "sources": [source_output(source) for source in (data.get("sources") or [])],
            **provenance_fields,
            "media": data.get("media"),
            "status": data.get("status"),
            "confidence": data.get("confidence"),
            "last_verified": str(lv) if lv else None,
            "seo_slug": data.get("seo_slug"),
            "site_ready": data.get("site_ready"),
            **optional_fields(
                data,
                "author_name",
                "author_slug",
                "author_avatar",
                "author_bio",
                "personal_experience",
                "verified_by_ivan",
                "redirect_to",
                "archive_reason",
            ),
            "editorial": editorial_output(editorial_meta),
            "coordinates": data.get("coordinates"),
            "region_id": data.get("region_id"),
            "province": data.get("province"),
            "how_to_get_there": data.get("how_to_get_there"),
            "best_time": data.get("best_time"),
            "cost": data.get("cost"),
            "duration": data.get("duration"),
            "body": body,
        })
    atomic_write_json(os.path.join(out_dir, "content.json"), {
        "generated_at": generated_at,
        "total_entities": len(content_entries),
        "editorial_readiness": editorial_readiness,
        "entities": content_entries,
    })

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
    status_counts = Counter(data.get("status") or "unknown" for data in entities.values())
    report_lines = [
        f"# Отчёт валидации базы знаний",
        f"",
        f"Сгенерировано: {generated_at}",
        f"",
        f"Всего валидных записей: **{len(entities)}**",
        f"Опубликовано: **{status_counts.get('published', 0)}**; архивировано с сохранением истории: **{status_counts.get('archived', 0)}**; backlog: **{status_counts.get('backlog', 0)}**",
        f"Проблемных файлов: **{len(problems)}**",
        f"Дублей id: **{len(duplicates)}**",
        f"Форвард-ссылок / потенциальных опечаток в related: **{len(dangling)}**",
        f"Битых [[вики-ссылок]] в телах: **{len(broken_wikilinks)}**",
        f"Осиротевших опубликованных записей (0 входящих ссылок): **{len(orphans)}**",
        f"Записей `site_ready: true` без hero-фото: **{len(site_ready_without_hero)}**",
        f"Опубликованных записей короче минимума своего формата: **{len(short_published)}**",
        f"Опубликованных гео-заголовков без русской адаптации: **{len(unlocalized_titles)}**",
        f"Опубликованных шаблонных импортных текстов INPROTUR: **{len(template_import_bodies)}**",
        f"Чувствительных опубликованных материалов: **{len(sensitive_entries)}**",
        f"Чувствительных материалов без источников: **{len(sensitive_without_sources)}**",
        f"Чувствительных кандидатов публичного gate: **{len(release_candidate_sensitive_ids)}**",
        f"Кандидатов, готовых по строгой claim-level проверке: **{len(strict_ready_release_candidate_ids)}/{len(release_candidate_sensitive_ids)}**",
        f"Строгий сигнал редакционной готовности: **{'PASS' if editorial_readiness['strict_ready'] else 'FAIL'}**",
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

    report_lines.append("## Claim-level происхождение фактов\n")
    report_lines.append(
        "Снимок корпуса диагностический: публичный набор не снимается с публикации автоматически. "
        "Релизный gate: `python3 content/knowledge-base/_index/build_manifest.py --strict-provenance` "
        "(завершится ошибкой при редакционном долге)."
    )
    report_lines.append("")
    if provenance_issue_counts:
        for code, count in sorted(provenance_issue_counts.items()):
            report_lines.append(f"- `{code}`: {count}")
    else:
        report_lines.append("- Нарушений нет.")
    report_lines.append("")

    provenance_not_ready = [
        eid for eid in release_candidate_sensitive_ids
        if not editorial_meta_by_id[eid]["provenance"]["strict_ready"]
    ]
    if provenance_not_ready:
        report_lines.append("### Чувствительные материалы, не готовые к строгой публикации\n")
        for eid in provenance_not_ready[:80]:
            codes = ", ".join(editorial_meta_by_id[eid]["provenance"]["issue_codes"])
            report_lines.append(f"- `{eid}` — {codes}")
        if len(provenance_not_ready) > 80:
            report_lines.append(f"- …и ещё {len(provenance_not_ready) - 80}")
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
        report_lines.append("## Осиротевшие опубликованные записи (никто не ссылается — стоит добавить входящую ссылку)\n")
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
        for o, word_count, minimum_words in short_published[:80]:
            report_lines.append(
                f"- `{o}` ({entities[o].get('type')}, {entities[o]['_path']}) — "
                f"{word_count} слов при минимуме {minimum_words}"
            )
        if len(short_published) > 80:
            report_lines.append(f"- …и ещё {len(short_published) - 80}")
        report_lines.append("")
    if unlocalized_titles:
        report_lines.append("## Редакционный долг: опубликованные заголовки без русской адаптации\n")
        for o in unlocalized_titles[:80]:
            report_lines.append(
                f"- `{o}` ({entities[o].get('type')}, {entities[o]['_path']}) — {entities[o].get('title')}"
            )
        if len(unlocalized_titles) > 80:
            report_lines.append(f"- …и ещё {len(unlocalized_titles) - 80}")
        report_lines.append("")
    if template_import_bodies:
        report_lines.append("## Редакционный долг: опубликованные шаблонные импортные тексты INPROTUR\n")
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
    atomic_write_text(os.path.join(out_dir, "validation-report.md"), report)

    print(report)
    print(f"\nmanifest.json и manifest.csv сохранены в {out_dir}")
    if strict_provenance_gate:
        print(
            "\n[strict-provenance] OK: claim-level gate passed; "
            "written indexes keep validation_mode=diagnostic so CI candidate trees stay clean."
        )


if __name__ == "__main__":
    main()
