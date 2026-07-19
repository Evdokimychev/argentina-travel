import importlib.util
import unittest
from datetime import date
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("build_manifest.py")
SPEC = importlib.util.spec_from_file_location("kb_build_manifest", MODULE_PATH)
BUILD_MANIFEST = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(BUILD_MANIFEST)


def valid_sensitive_entry():
    return {
        "title": "ВНЖ Аргентины",
        "site_sections": ["pereezd-v-argentinu"],
        "confidence": "high",
        "last_verified": "2026-07-10",
        "provenance": {
            "schema_version": 1,
            "mode": "strict",
            "stale_after_days": 45,
        },
        "sources": [
            {
                "id": "dnm-residencias",
                "title": "Dirección Nacional de Migraciones",
                "url": "https://www.argentina.gob.ar/interior/migraciones",
                "type": "official",
                "authority": "primary",
                "url_status": "verified",
                "checked_at": "2026-07-10",
                "expires_at": "2026-12-31",
            }
        ],
        "claims": [
            {
                "id": "residency-process",
                "text": "Заявление рассматривает миграционная служба.",
                "sensitive": True,
                "source_ids": ["dnm-residencias"],
                "verified_at": "2026-07-10",
                "reviewer": {"id": "role-editorial-owner", "role": "editor"},
            }
        ],
    }


class ProvenanceValidationTest(unittest.TestCase):
    def test_generated_timestamp_is_reproducible_without_wall_clock(self):
        entities = {
            "older": {"last_verified": "2026-06-01"},
            "newer": {"last_verified": "2026-07-17"},
        }

        self.assertEqual(
            BUILD_MANIFEST.resolve_generated_at(entities, environ={}),
            "2026-07-17 00:00",
        )

    def test_source_date_epoch_pins_generated_timestamp_in_utc(self):
        self.assertEqual(
            BUILD_MANIFEST.resolve_generated_at(
                {"entry": {"last_verified": "2026-07-17"}},
                environ={"SOURCE_DATE_EPOCH": "0"},
            ),
            "1970-01-01 00:00",
        )

    def test_complete_sensitive_provenance_is_strict_ready(self):
        meta = BUILD_MANIFEST.build_editorial_meta(
            valid_sensitive_entry(), today=date(2026, 7, 17)
        )

        self.assertTrue(meta["sensitive"])
        self.assertTrue(meta["provenance"]["strict_ready"])
        self.assertEqual(meta["provenance"]["issue_codes"], [])

    def test_diagnostic_compatibility_does_not_claim_strict_readiness(self):
        entry = valid_sensitive_entry()
        entry.pop("provenance")
        entry.pop("claims")

        meta = BUILD_MANIFEST.build_editorial_meta(entry, today=date(2026, 7, 17))

        self.assertEqual(meta["provenance"]["mode"], "diagnostic")
        self.assertFalse(meta["provenance"]["declared"])
        self.assertFalse(meta["provenance"]["strict_ready"])
        self.assertIn(
            "missing_sensitive_claim_mapping", meta["provenance"]["issue_codes"]
        )

    def test_broken_source_reference_is_reported(self):
        entry = valid_sensitive_entry()
        entry["claims"][0]["source_ids"] = ["missing-source"]

        meta = BUILD_MANIFEST.build_editorial_meta(entry, today=date(2026, 7, 17))

        self.assertFalse(meta["provenance"]["strict_ready"])
        self.assertIn("broken_claim_source_ref", meta["provenance"]["issue_codes"])
        self.assertIn(
            "sensitive_claim_without_primary_source",
            meta["provenance"]["issue_codes"],
        )

    def test_sensitive_claim_requires_primary_source_date_and_reviewer(self):
        entry = valid_sensitive_entry()
        entry["sources"][0]["authority"] = "secondary"
        entry["claims"][0].pop("text")
        entry["claims"][0].pop("verified_at")
        entry["claims"][0].pop("reviewer")

        meta = BUILD_MANIFEST.build_editorial_meta(entry, today=date(2026, 7, 17))
        codes = meta["provenance"]["issue_codes"]

        self.assertIn("sensitive_claim_without_primary_source", codes)
        self.assertIn("missing_claim_text", codes)
        self.assertIn("sensitive_claim_missing_verified_at", codes)
        self.assertIn("sensitive_claim_missing_reviewer", codes)

    def test_stale_claim_and_url_health_are_reported(self):
        entry = valid_sensitive_entry()
        entry["sources"][0]["checked_at"] = "2026-01-01"
        entry["sources"][0]["expires_at"] = "2026-07-01"
        entry["claims"][0]["verified_at"] = "2026-01-01"

        meta = BUILD_MANIFEST.build_editorial_meta(entry, today=date(2026, 7, 17))
        codes = meta["provenance"]["issue_codes"]

        self.assertIn("stale_source_url_check", codes)
        self.assertIn("expired_source", codes)
        self.assertIn("stale_sensitive_claim", codes)

    def test_release_scope_excludes_intentional_quarantine(self):
        entry = valid_sensitive_entry()
        entry.update({"status": "published", "type": "guide", "site_ready": True})
        meta = BUILD_MANIFEST.build_editorial_meta(
            entry, word_count=180, today=date(2026, 7, 17)
        )
        self.assertTrue(BUILD_MANIFEST.is_release_candidate_sensitive(entry, meta))

        entry["site_ready"] = False
        self.assertFalse(BUILD_MANIFEST.is_release_candidate_sensitive(entry, meta))
        entry["site_ready"] = True
        meta["word_count"] = 80
        self.assertFalse(BUILD_MANIFEST.is_release_candidate_sensitive(entry, meta))
        meta["word_count"] = 180
        meta["missing_sources"] = True
        self.assertFalse(BUILD_MANIFEST.is_release_candidate_sensitive(entry, meta))


if __name__ == "__main__":
    unittest.main()
