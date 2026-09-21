#!/usr/bin/env python3
"""
Generate the content migrations from the JSON question banks.

Usage:
    python scripts/restore-banks.py          # once, if src/data/exam/ is empty
    python scripts/generate-content-migrations.py

Writes:
    supabase/migrations/011_content_catalogue.sql   PMP tracks, types, configs, breaks, exams
    supabase/migrations/012_question_banks.sql      PMP questions, choices, exam_questions
    supabase/migrations/017_rmp_content.sql         the RMP track's config and banks

All come out of one pass so they cannot disagree: exams.question_count, the
number written into each exam's description, and the exam_questions rows are all
the same count, computed once.

011 and 012 are regenerated on every run and are byte-identical each time. That
is deliberate — it means running this script to refresh 017 cannot silently
change a migration that has already been applied somewhere. Check `git diff`
after a run: anything other than 017 moving is a signal, not noise.

Replaces supabase/legacy/generate-question-seed.py, which emitted only the bank
half and then reconciled question_count afterwards with an UPDATE. Nothing to
reconcile now — the catalogue is generated from the same counts.

EXCLUDED_EXAM_IDS holds back the exams whose Arabic and English banks disagree.
Exclusion is per EXAM, not per question: exams 1, 3 and 5 share no question with
any other exam, so dropping them removes all eight conflicts and costs nothing
else. When the conflicts are resolved, take the ids out of the set, re-run, and
commit the result as a NEW migration — do not edit one that has been applied.

Re-run whenever the banks change, and commit the result.
"""

import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BANK_DIR = ROOT / "src" / "data" / "exam"
MIGRATIONS = ROOT / "supabase" / "migrations"
CATALOGUE_PATH = MIGRATIONS / "011_content_catalogue.sql"
BANKS_PATH = MIGRATIONS / "012_question_banks.sql"
RMP_PATH = MIGRATIONS / "017_rmp_content.sql"
LANGS = ("ar", "en")
ROWS_PER_INSERT = 200

# Exams held back because their ar/en banks disagree. See docs/specs/bank-conflicts.md
# and src/data/bank-conflicts.pdf.
EXCLUDED_EXAM_IDS = {1, 3, 5}

# Asserted after generation. A mismatch means the banks changed under the script.
EXPECTED = {"questions": 2613, "choices": 10566, "exam_questions": 3340}
# 1841, not 459*4: five questions in RMP exam 4 are multi-select and carry five
# choices. Eight questions across the set have more than one correct answer.
EXPECTED_RMP = {"questions": 459, "choices": 1841, "exam_questions": 459}

# RMP question ids are REMAPPED, and this is the only place that decides it.
#
# The RMP bank files number themselves 3138-3596, continuing straight on from the
# PMP banks' highest id. That is collision-free on its own: PMP ids run 0..3137
# with 525 holes, every hole belonging to held-out exam 1, 3 or 5, and nothing
# above 3137. So base 3137 (= no remap, ids land exactly where the banks say)
# is correct and keeps bank id == database id for every exam in the product.
#
# Base 4000 was chosen instead, leaving 3138..4000 as headroom. The cost is that
# for RMP alone, a question's id in src/data/exam/ is 863 lower than its id in
# the database. Set this to 3137 to remove the remap.
#
# Changing it after a deploy is not a config change: exam_attempts stores
# question ids in an integer[] snapshot with no foreign key, so old attempts
# would keep pointing at ids that now mean different questions, and nothing in
# the schema would notice.
RMP_QUESTION_ID_BASE = 4000

PMP_TRACK = "33333333-3333-4333-8333-333333333333"
RMP_TRACK = "44444444-4444-4444-8444-444444444444"

TRACKS = [
    {
        "id": PMP_TRACK,
        "name_en": "Project Management Professional",
        "name_ar": "محترف إدارة المشاريع (PMP)",
        "description_en": "Practice exams and domain drills for the PMI Project Management Professional certification.",
        "description_ar": "امتحانات تجريبية وتدريبات مجالية لشهادة محترف إدارة المشاريع من PMI.",
        "enrollment_duration_days": 180,
    },
    {
        "id": RMP_TRACK,
        "name_en": "Risk Management Professional",
        "name_ar": "محترف إدارة المخاطر (RMP)",
        "description_en": "Practice exams and domain drills for the PMI Risk Management Professional certification.",
        "description_ar": "امتحانات تجريبية وتدريبات مجالية لشهادة محترف إدارة المخاطر من PMI.",
        "enrollment_duration_days": 180,
    },
]

EXAM_TYPES = [
    {"id": 1, "key": "full", "name_ar": "امتحان كامل", "name_en": "Full Exam", "colour": "primary"},
    {"id": 2, "key": "domain", "name_ar": "امتحان مجال (مصنف)", "name_en": "Domain Exam", "colour": "secondary"},
]

# exam_duration_minutes NULL = untimed. The domain config is a study mode, not a
# sitting: answers are revealed as you go, so a clock on it meant nothing.
EXAM_CONFIGS = [
    {
        "id": 1,
        "key": "full",
        "name_ar": "امتحان PMP الكامل",
        "name_en": "PMP Full Exam",
        "exam_duration_minutes": 240,
        "passing_rate": "75.00",
        "can_reveal_answers": False,
        "allow_retry_wrong": True,
        "breaks": [(60, 10), (120, 10)],
        "tracks": [PMP_TRACK],
        "scope_en": "across the three PMP domains",
        "scope_ar": "يغطي مجالات PMP الثلاثة",
    },
    {
        "id": 2,
        "key": "domain",
        "name_ar": "امتحان PMP المصنف",
        "name_en": "PMP Domain Exam",
        "exam_duration_minutes": None,
        "passing_rate": "85.00",
        "can_reveal_answers": True,
        "allow_retry_wrong": False,
        "breaks": [],
        "tracks": [PMP_TRACK],
        "scope_en": None,
        "scope_ar": None,
    },
]

# The RMP config is deliberately NOT in EXAM_CONFIGS. 011 is generated from that
# list and must keep coming out byte-identical; the RMP catalogue is a separate
# migration because its banks arrived after 011 had been written.
#
# passing_rate and the break's duration_minutes were not specified and follow
# PMP Full. Both are one-line changes here if that is wrong.
RMP_CONFIG = {
    "id": 3,
    "key": "full",
    "name_ar": "امتحان RMP الكامل",
    "name_en": "RMP Full Exam",
    "exam_duration_minutes": 150,
    "passing_rate": "75.00",
    "can_reveal_answers": False,
    "allow_retry_wrong": True,
    "breaks": [(58, 10)],
    "tracks": [RMP_TRACK],
    "scope_en": "spanning the PMI-RMP exam content outline",
    "scope_ar": "يغطي محتوى امتحان PMI-RMP",
}

# Bank file stem -> catalogue row. exam ids continue from PMP's 43, and
# display_order from PMP's 42 — 8, 10 and 12 stay reserved for exams 1, 3 and 5.
RMP_EXAMS = [
    {"id": 44, "display_order": 43, "stem": "pmi_rmp_exam_1", "name_en": "RMP Exam 1", "name_ar": "اختبار RMP 1"},
    {"id": 45, "display_order": 44, "stem": "pmi_rmp_exam_2", "name_en": "RMP Exam 2", "name_ar": "اختبار RMP 2"},
    {"id": 46, "display_order": 45, "stem": "pmi_rmp_exam_3", "name_en": "RMP Exam 3", "name_ar": "اختبار RMP 3"},
    {"id": 47, "display_order": 46, "stem": "pmi_rmp_exam_4", "name_en": "RMP Exam 4", "name_ar": "اختبار RMP 4"},
]
RMP_LANG_SUFFIX = {"ar": "arabic", "en": "english"}

EN_NUMBER_WORDS = {1: "one", 2: "two", 3: "three", 4: "four"}


def sql_string(value):
    """Postgres literal. standard_conforming_strings is on, so only quotes need doubling."""
    if "\x00" in value:
        raise ValueError("NUL byte in bank text")
    return "'" + value.replace("'", "''") + "'"


def sql_nullable_int(value):
    return "NULL" if value is None else str(value)


# Arabic tamyiz: which form a counted noun takes, and whether the numeral is
# written at all. Agreement is governed by the LAST element of a compound number,
# so 178 agrees like 78 and 200 like a bare hundred.
#
#   1            singular, numeral dropped   سؤال
#   2            dual, numeral dropped       سؤالان  (the form already means two)
#   3-10         plural                      3 أسئلة
#   11-99        accusative singular         18 سؤالًا
#   exact 100s   genitive singular           200 سؤال
ARABIC_FORMS = ("singular", "dual", "plural", "accusative", "genitive")
SILENT_NUMERAL = ("singular", "dual")

QUESTION_NOUN = {
    "singular": "سؤال",
    "dual": "سؤالان",
    "plural": "أسئلة",
    "accusative": "سؤالًا",
    "genitive": "سؤال",
}
HOUR_NOUN = {
    "singular": "ساعة",
    "dual": "ساعتين",
    "plural": "ساعات",
    "accusative": "ساعة",
    "genitive": "ساعة",
}
BREAK_NOUN = {
    "singular": "استراحة",
    "dual": "استراحتين",
    "plural": "استراحات",
    "accusative": "استراحة",
    "genitive": "استراحة",
}


def arabic_form(count):
    remainder = count % 100
    if remainder == 0:
        return "genitive"
    if remainder == 1:
        return "singular"
    if remainder == 2:
        return "dual"
    if 3 <= remainder <= 10:
        return "plural"
    return "accusative"


def arabic_counted(count, noun):
    form = arabic_form(count)
    if form in SILENT_NUMERAL:
        return noun[form]
    return f"{count} {noun[form]}"


def arabic_questions(count):
    return arabic_counted(count, QUESTION_NOUN)


def duration_en(minutes):
    """'4 hours', '2 hours 30 minutes', '45 minutes'."""
    hours, rest = divmod(minutes, 60)
    parts = []
    if hours:
        parts.append(f"{hours} hour" + ("" if hours == 1 else "s"))
    if rest:
        parts.append(f"{rest} minutes")
    return " ".join(parts)


def duration_ar(minutes):
    """Arabic duration. A half hour is said 'ونصف', not as a minute count —
    'ساعتين ونصف', never 'ساعتين و30 دقيقة'."""
    hours, rest = divmod(minutes, 60)
    if hours and rest == 30:
        return f"{arabic_counted(hours, HOUR_NOUN)} ونصف"
    if hours and rest == 0:
        return arabic_counted(hours, HOUR_NOUN)
    raise SystemExit(
        f"No Arabic wording for a {minutes}-minute duration - extend duration_ar()"
    )


def describe(exam_type_key, count, config):
    """Both descriptions for one exam, derived from its config so they cannot drift."""
    if exam_type_key == "full":
        minutes = config["exam_duration_minutes"]
        if minutes is None:
            raise SystemExit(f"Full-exam config {config['id']} is untimed - the description says it is not")
        breaks = len(config["breaks"])
        if breaks not in EN_NUMBER_WORDS:
            raise SystemExit(f"No wording for {breaks} breaks - extend describe()")

        # "one scheduled break", not "one scheduled breaks".
        break_en = f"{EN_NUMBER_WORDS[breaks]} scheduled break" + ("" if breaks == 1 else "s")
        en = (
            f"{count} questions {config['scope_en']}, "
            f"timed at {duration_en(minutes)} with {break_en}."
        )
        # Phrased as "a full exam OF n questions" so the verb agrees with the exam,
        # not with the counted noun - whose form changes with the count.
        ar = (
            f"امتحان كامل من {arabic_questions(count)} {config['scope_ar']}، "
            f"بمدة {duration_ar(minutes)} و{arabic_counted(breaks, BREAK_NOUN)}."
        )
        return ar, en

    if config["exam_duration_minutes"] is not None:
        raise SystemExit(f"Domain config {config['id']} is timed - the description says it is not")

    en = f"{count} untimed practice questions, with the correct answer and explanation shown after each one."
    # Same reason: "a drill OF n questions" needs no adjective agreeing with the count.
    ar = (
        f"تدريب من {arabic_questions(count)} بدون توقيت، "
        "مع عرض الإجابة الصحيحة والشرح بعد كل سؤال."
    )
    return ar, en


def load_banks():
    """The PMP banks, which are named <exam id>.json.

    Only numeric stems. The RMP banks live in the same two directories under
    descriptive names and are loaded separately by load_rmp_banks() - globbing
    *.json here and calling int() on the stem raises ValueError on them.
    """
    exam_ids = sorted(
        int(path.stem) for path in (BANK_DIR / "ar").glob("*.json") if path.stem.isdigit()
    )
    if not exam_ids:
        sys.exit("src/data/exam/ is empty - run scripts/restore-banks.py first")
    return {
        exam_id: {
            lang: json.loads((BANK_DIR / lang / f"{exam_id}.json").read_text(encoding="utf-8"))
            for lang in LANGS
        }
        for exam_id in exam_ids
    }


def load_rmp_banks():
    """The RMP banks, keyed by the catalogue exam id they become."""
    banks = {}
    for row in RMP_EXAMS:
        langs = {}
        for lang in LANGS:
            path = BANK_DIR / lang / f"{row['stem']}_{RMP_LANG_SUFFIX[lang]}.json"
            if not path.exists():
                sys.exit(f"Missing RMP bank: {path.relative_to(ROOT)}")
            langs[lang] = json.loads(path.read_text(encoding="utf-8"))
        banks[row["id"]] = langs
    return banks


def correct_set(question):
    return frozenset(i for i, choice in enumerate(question["choices"]) if choice["correct"])


def find_conflicts(banks):
    """Mirrors scripts/analyze-banks.py. Duplicated deliberately: this script must not
    generate a seed on the strength of a report file that may be stale."""
    conflicts = defaultdict(set)
    for exam_id, langs in banks.items():
        if len(langs["ar"]) != len(langs["en"]):
            raise SystemExit(f"ar/en length mismatch in exam {exam_id}")
        for ar, en in zip(langs["ar"], langs["en"]):
            if ar["id"] != en["id"]:
                raise SystemExit(f"ar/en id parity break in exam {exam_id}")
            if len(ar["choices"]) != len(en["choices"]) or correct_set(ar) != correct_set(en):
                conflicts[exam_id].add(ar["id"])
    return conflicts


def collect(banks, kept_ids, id_offset=0):
    """Returns (questions, choices, exam_questions) for the kept exams only.

    id_offset shifts every question id by a constant. It is 0 for the PMP banks,
    whose ids are used as-is; see RMP_QUESTION_ID_BASE for why RMP shifts. The
    offset is applied in exactly one place - deriving question_id here - so the
    choices and exam_questions rows built from it cannot drift out of step.
    """
    questions = {}
    choices = {}
    exam_questions = []

    for exam_id in sorted(kept_ids):
        ar_bank, en_bank = banks[exam_id]["ar"], banks[exam_id]["en"]
        for index, (ar, en) in enumerate(zip(ar_bank, en_bank)):
            question_id = ar["id"] + id_offset
            exam_questions.append((exam_id, index, question_id))

            if question_id in questions:
                continue

            pairs = list(zip(ar["choices"], en["choices"]))
            questions[question_id] = (
                question_id,
                en["type"],
                ar["text"],
                en["text"],
                ar["explanation"],
                en["explanation"],
                sum(1 for _ar_choice, en_choice in pairs if en_choice["correct"]),
            )
            choices[question_id] = [
                (question_id, position, ar_choice["text"], en_choice["text"], en_choice["correct"])
                for position, (ar_choice, en_choice) in enumerate(pairs)
            ]

    choice_rows = [row for question_id in sorted(choices) for row in choices[question_id]]
    return [questions[key] for key in sorted(questions)], choice_rows, exam_questions


def render_inserts(table, columns, rows, render_row):
    lines = []
    for start in range(0, len(rows), ROWS_PER_INSERT):
        batch = rows[start : start + ROWS_PER_INSERT]
        lines.append(f"INSERT INTO public.{table} ({', '.join(columns)}) VALUES")
        lines += [f"  ({render_row(row)})," for row in batch[:-1]]
        lines.append(f"  ({render_row(batch[-1])});")
        lines.append("")
    return lines


def render_catalogue(exam_rows, counts):
    configs_by_key = {config["key"]: config for config in EXAM_CONFIGS}
    kept = [row for row in exam_rows if row["id"] not in EXCLUDED_EXAM_IDS]

    lines = [
        "-- =============================================================================",
        "-- Migration 011: track and exam catalogue",
        "--",
        "-- GENERATED by scripts/generate-content-migrations.py - do not edit by hand.",
        "--",
        "-- Content, not test data, and therefore a migration rather than a seed:",
        "--   1. 013's config_snapshot backfill joins public.exams and public.exam_config.",
        "--      Seeds run AFTER migrations, so with these rows in a seed the backfill",
        "--      matches nothing and its SET NOT NULL fails on any database holding",
        "--      attempts.",
        "--   2. exam_questions (012) has a foreign key to public.exams. A seed cannot",
        "--      satisfy a foreign key declared by a migration.",
        "--",
        f"-- EXAMS {', '.join(str(i) for i in sorted(EXCLUDED_EXAM_IDS))} ARE ABSENT: their Arabic and English banks disagree",
        "-- on the correct answer for eight questions. They share no question with any",
        "-- other exam, so holding the whole exam back costs nothing else. Their",
        "-- display_order values are left as gaps so they slot back into position when",
        "-- a later migration restores them. See docs/specs/bank-conflicts.md.",
        "--",
        f"--   tracks  {len(TRACKS)}    exam_type  {len(EXAM_TYPES)}    exam_config  {len(EXAM_CONFIGS)}    exams  {len(kept)}",
        "-- =============================================================================",
        "",
        "",
        "-- ---------------------------------------------------------------------",
        "-- tracks",
        "--",
        "-- The RMP track has no exams yet. It is created here so enrollments can",
        "-- reference it and the UI can show it; its catalogue arrives in a later",
        "-- migration alongside its banks.",
        "-- ---------------------------------------------------------------------",
        "INSERT INTO public.tracks (id, name_ar, name_en, description_ar, description_en, enrollment_duration_days)",
        "VALUES",
    ]
    lines += [
        "  ("
        + ", ".join(
            [
                sql_string(track["id"]),
                sql_string(track["name_ar"]),
                sql_string(track["name_en"]),
                sql_string(track["description_ar"]),
                sql_string(track["description_en"]),
                str(track["enrollment_duration_days"]),
            ]
        )
        + ")"
        + ("," if index < len(TRACKS) - 1 else "")
        for index, track in enumerate(TRACKS)
    ]
    lines += ["ON CONFLICT (id) DO NOTHING;", "", ""]

    lines += [
        "-- ---------------------------------------------------------------------",
        "-- exam_type",
        "-- ---------------------------------------------------------------------",
        "INSERT INTO public.exam_type (id, name_ar, name_en, colour)",
        "VALUES",
    ]
    lines += [
        "  ("
        + ", ".join(
            [str(t["id"]), sql_string(t["name_ar"]), sql_string(t["name_en"]), sql_string(t["colour"])]
        )
        + ")"
        + ("," if index < len(EXAM_TYPES) - 1 else "")
        for index, t in enumerate(EXAM_TYPES)
    ]
    lines += [
        "ON CONFLICT (id) DO NOTHING;",
        "",
        "SELECT setval(pg_get_serial_sequence('public.exam_type', 'id'), coalesce((SELECT max(id) FROM public.exam_type), 1));",
        "",
        "",
        "-- ---------------------------------------------------------------------",
        "-- exam_config",
        "--",
        "-- exam_duration_minutes NULL = untimed. The domain config reveals answers as",
        "-- the student goes, which makes it a study mode rather than a sitting, so it",
        "-- carries no clock.",
        "-- ---------------------------------------------------------------------",
        "INSERT INTO public.exam_config (id, name_ar, name_en, exam_duration_minutes, passing_rate, can_reveal_answers, allow_retry_wrong)",
        "VALUES",
    ]
    lines += [
        "  ("
        + ", ".join(
            [
                str(c["id"]),
                sql_string(c["name_ar"]),
                sql_string(c["name_en"]),
                sql_nullable_int(c["exam_duration_minutes"]),
                c["passing_rate"],
                str(c["can_reveal_answers"]).lower(),
                str(c["allow_retry_wrong"]).lower(),
            ]
        )
        + ")"
        + ("," if index < len(EXAM_CONFIGS) - 1 else "")
        for index, c in enumerate(EXAM_CONFIGS)
    ]
    lines += [
        "ON CONFLICT (id) DO NOTHING;",
        "",
        "SELECT setval(pg_get_serial_sequence('public.exam_config', 'id'), coalesce((SELECT max(id) FROM public.exam_config), 1));",
        "",
        "",
        "-- ---------------------------------------------------------------------",
        "-- allowed_config",
        "-- ---------------------------------------------------------------------",
        "INSERT INTO public.allowed_config (track_id, config_id)",
        "VALUES",
    ]
    pairs = [(track, config["id"]) for config in EXAM_CONFIGS for track in config["tracks"]]
    lines += [
        f"  ({sql_string(track)}, {config_id})" + ("," if index < len(pairs) - 1 else "")
        for index, (track, config_id) in enumerate(pairs)
    ]
    lines += ["ON CONFLICT (track_id, config_id) DO NOTHING;", "", ""]

    break_rows = [(c["id"], at, minutes) for c in EXAM_CONFIGS for at, minutes in c["breaks"]]
    lines += [
        "-- ---------------------------------------------------------------------",
        "-- breaks",
        "--",
        "-- Inserted BEFORE exams, and the order is load-bearing: breaks_check_index",
        "-- scans exams for a conflicting question_count, and exams_check_break_index",
        "-- scans breaks. Inserting exams first would validate each break against exams",
        "-- that already exist, which is the case that raises.",
        "-- ---------------------------------------------------------------------",
        "INSERT INTO public.breaks (config_id, show_at_index, duration_minutes)",
        "VALUES",
    ]
    lines += [
        f"  ({config_id}, {at}, {minutes})" + ("," if index < len(break_rows) - 1 else "")
        for index, (config_id, at, minutes) in enumerate(break_rows)
    ]
    lines += ["ON CONFLICT (config_id, show_at_index) DO NOTHING;", "", ""]

    lines += [
        "-- ---------------------------------------------------------------------",
        "-- exams",
        "--",
        "-- display_order follows src/data/exam/exams.json, which is the order the",
        f"-- list is meant to read in. {', '.join(str(i) for i in sorted(EXCLUDED_EXAM_IDS))} are skipped, leaving their positions free.",
        "-- question_count is counted from the banks, not copied from exams.json, and",
        "-- is the same number the description quotes.",
        "-- ---------------------------------------------------------------------",
        "INSERT INTO public.exams (id, track_id, config_id, type_id, display_order, name_ar, name_en, description_ar, description_en, question_count)",
        "VALUES",
    ]
    for index, row in enumerate(kept):
        config = configs_by_key[row["type"]]
        count = counts[row["id"]]
        description_ar, description_en = describe(row["type"], count, config)
        values = ", ".join(
            [
                str(row["id"]),
                sql_string(PMP_TRACK),
                str(config["id"]),
                str(next(t["id"] for t in EXAM_TYPES if t["key"] == row["type"])),
                str(row["display_order"]),
                sql_string(row["name_ar"]),
                sql_string(row["name_en"]),
                sql_string(description_ar),
                sql_string(description_en),
                str(count),
            ]
        )
        lines.append(f"  ({values})" + ("," if index < len(kept) - 1 else ""))
    lines += [
        "ON CONFLICT (id) DO NOTHING;",
        "",
        "SELECT setval(pg_get_serial_sequence('public.exams', 'id'), coalesce((SELECT max(id) FROM public.exams), 1));",
        "SELECT setval(pg_get_serial_sequence('public.exams', 'display_order'), coalesce((SELECT max(display_order) FROM public.exams), 1));",
        "",
    ]
    return "\n".join(lines)


def render_rmp(questions, choices, exam_questions, counts, offset):
    """017: the RMP track's config, exams and banks, in one migration.

    Ordering inside the file is load-bearing in three places and each is
    commented where it happens: exam_config before allowed_config and breaks,
    breaks before exams, and the answer_count trigger already exists (created by
    012) so questions must carry a correct answer_count on insert.
    """
    config = RMP_CONFIG
    lines = [
        "-- =============================================================================",
        "-- Migration 017: RMP track content",
        "--",
        "-- GENERATED by scripts/generate-content-migrations.py - do not edit by hand.",
        "--",
        "-- The RMP track row itself already exists (011). This adds everything that",
        "-- hangs off it: one exam_config, its break, the track/config permission row,",
        f"-- {len(RMP_EXAMS)} exams and their banks.",
        "--",
        "-- Source: src/data/exam/{ar,en}/pmi_rmp_exam_<n>_{arabic,english}.json.",
        "--",
        f"-- QUESTION IDS ARE SHIFTED BY +{offset}. The bank files number themselves",
        f"-- 3138-3596; in the database these rows are {3138 + offset}-{3596 + offset}. The shift is",
        "-- RMP_QUESTION_ID_BASE in the generator. PMP ids occupy 0-3137 with no row",
        "-- above 3137, so the two ranges cannot meet - including after held-out exams",
        "-- 1, 3 and 5 return, whose ids are holes inside 0-3137.",
        "--",
        f"--   exam_config  1    breaks  {len(config['breaks'])}    exams  {len(RMP_EXAMS)}",
        f"--   questions       {len(questions):>6,}",
        f"--   choices         {len(choices):>6,}",
        f"--   exam_questions  {len(exam_questions):>6,}",
        "-- =============================================================================",
        "",
        "",
        "-- ---------------------------------------------------------------------",
        "-- exam_config",
        "--",
        "-- Timed, unlike the PMP domain config. can_reveal_answers is false because",
        "-- this is a sitting, not a study mode; allow_retry_wrong is true so a",
        "-- finished attempt can be retried against the questions it got wrong.",
        "-- ---------------------------------------------------------------------",
        "INSERT INTO public.exam_config (id, name_ar, name_en, exam_duration_minutes, passing_rate, can_reveal_answers, allow_retry_wrong)",
        "VALUES",
        "  ("
        + ", ".join(
            [
                str(config["id"]),
                sql_string(config["name_ar"]),
                sql_string(config["name_en"]),
                sql_nullable_int(config["exam_duration_minutes"]),
                config["passing_rate"],
                str(config["can_reveal_answers"]).lower(),
                str(config["allow_retry_wrong"]).lower(),
            ]
        )
        + ")",
        "ON CONFLICT (id) DO NOTHING;",
        "",
        "SELECT setval(pg_get_serial_sequence('public.exam_config', 'id'), coalesce((SELECT max(id) FROM public.exam_config), 1));",
        "",
        "",
        "-- ---------------------------------------------------------------------",
        "-- allowed_config",
        "-- ---------------------------------------------------------------------",
        "INSERT INTO public.allowed_config (track_id, config_id)",
        "VALUES",
        f"  ({sql_string(RMP_TRACK)}, {config['id']})",
        "ON CONFLICT (track_id, config_id) DO NOTHING;",
        "",
        "",
        "-- ---------------------------------------------------------------------",
        "-- breaks",
        "--",
        "-- Before exams, for the same reason as in 011: breaks_check_index scans",
        "-- exams for a conflicting question_count and exams_check_break_index scans",
        "-- breaks, so whichever goes second is the one that gets validated.",
        "--",
        f"-- show_at_index {config['breaks'][0][0]} is a 0-based position, so the break is offered after",
        f"-- question {config['breaks'][0][0] + 1}. The shortest RMP exam has {min(counts.values())} questions, which is what the",
        "-- trigger checks it against.",
        "-- ---------------------------------------------------------------------",
        "INSERT INTO public.breaks (config_id, show_at_index, duration_minutes)",
        "VALUES",
    ]
    lines += [
        f"  ({config['id']}, {at}, {minutes})" + ("," if index < len(config["breaks"]) - 1 else "")
        for index, (at, minutes) in enumerate(config["breaks"])
    ]
    lines += [
        "ON CONFLICT (config_id, show_at_index) DO NOTHING;",
        "",
        "",
        "-- ---------------------------------------------------------------------",
        "-- exams",
        "--",
        "-- display_order continues from the PMP catalogue's 42. 8, 10 and 12 stay",
        "-- free for held-out exams 1, 3 and 5.",
        "--",
        "-- question_count is counted from the banks, not assumed: exam 4 has 114",
        "-- questions where the others have 115.",
        "-- ---------------------------------------------------------------------",
        "INSERT INTO public.exams (id, track_id, config_id, type_id, display_order, name_ar, name_en, description_ar, description_en, question_count)",
        "VALUES",
    ]
    full_type_id = next(t["id"] for t in EXAM_TYPES if t["key"] == "full")
    for index, row in enumerate(RMP_EXAMS):
        count = counts[row["id"]]
        description_ar, description_en = describe(config["key"], count, config)
        values = ", ".join(
            [
                str(row["id"]),
                sql_string(RMP_TRACK),
                str(config["id"]),
                str(full_type_id),
                str(row["display_order"]),
                sql_string(row["name_ar"]),
                sql_string(row["name_en"]),
                sql_string(description_ar),
                sql_string(description_en),
                str(count),
            ]
        )
        lines.append(f"  ({values})" + ("," if index < len(RMP_EXAMS) - 1 else ""))
    lines += [
        "ON CONFLICT (id) DO NOTHING;",
        "",
        "SELECT setval(pg_get_serial_sequence('public.exams', 'id'), coalesce((SELECT max(id) FROM public.exams), 1));",
        "SELECT setval(pg_get_serial_sequence('public.exams', 'display_order'), coalesce((SELECT max(display_order) FROM public.exams), 1));",
        "",
        "",
        "-- ---------------------------------------------------------------------------",
        "-- sync_answer_count_on_choices is SUSPENDED for the bulk load below.",
        "--",
        "-- 012 sidesteps this by creating the trigger after its own load. 017 cannot:",
        "-- the trigger already exists and is live. It fires per choice row and rewrites",
        "-- questions.answer_count to the number of correct choices present AT THAT",
        "-- MOMENT, so the first choice of a question whose correct answer has not been",
        "-- inserted yet sets answer_count = 0 and trips chk_answer_count_positive.",
        "-- Ordering the choices correct-first would only hide it.",
        "--",
        "-- While it is off, the answer_count shipped with each question row is the only",
        "-- thing maintaining the column. The assertion at the bottom of this file is",
        "-- what proves that was right, and it runs after the trigger is back on.",
        "--",
        "-- DDL is transactional in Postgres: if this migration fails anywhere below,",
        "-- the disable rolls back with it and the trigger is never left off.",
        "-- ---------------------------------------------------------------------------",
        "ALTER TABLE public.choices DISABLE TRIGGER sync_answer_count_on_choices;",
        "",
        "",
        "-- questions -----------------------------------------------------------------",
        "",
    ]
    lines += render_inserts(
        "questions",
        ("id", "type", "text_ar", "text_en", "explanation_ar", "explanation_en", "answer_count"),
        questions,
        lambda row: ", ".join(
            [str(row[0])] + [sql_string(value) for value in row[1:6]] + [str(row[6])]
        ),
    )
    lines += [
        "SELECT setval(",
        "  pg_get_serial_sequence('public.questions', 'id'),",
        "  (SELECT max(id) FROM public.questions)",
        ");",
        "",
        "",
        "-- choices -------------------------------------------------------------------",
        "",
    ]
    lines += render_inserts(
        "choices",
        ("question_id", "position", "text_ar", "text_en", "is_correct"),
        choices,
        lambda row: ", ".join(
            [str(row[0]), str(row[1]), sql_string(row[2]), sql_string(row[3]), str(row[4]).lower()]
        ),
    )
    lines += [
        "-- ---------------------------------------------------------------------------",
        "-- Bulk load done - the trigger goes back on before anything asserts anything.",
        "-- ---------------------------------------------------------------------------",
        "ALTER TABLE public.choices ENABLE TRIGGER sync_answer_count_on_choices;",
        "",
        "",
        "-- exam_questions ------------------------------------------------------------",
        "--",
        "-- The four RMP exams share no question, so these rows are 1:1 with questions.",
        "",
    ]
    lines += render_inserts(
        "exam_questions",
        ("exam_id", "question_index", "question_id"),
        exam_questions,
        lambda row: ", ".join(str(value) for value in row),
    )
    lines += [
        "-- ---------------------------------------------------------------------------",
        "-- Assertions, mirroring 012's. A migration that half-applied is not the same",
        "-- thing as a generator that ran.",
        "-- ---------------------------------------------------------------------------",
        "DO $$",
        "DECLARE",
        "  v_bad INTEGER;",
        "BEGIN",
        "  SELECT count(*) INTO v_bad",
        "    FROM public.exams x",
        "   WHERE x.track_id = " + sql_string(RMP_TRACK),
        "     AND NOT EXISTS (SELECT 1 FROM public.exam_questions q WHERE q.exam_id = x.id);",
        "  IF v_bad > 0 THEN",
        "    RAISE EXCEPTION 'Migration 017: % RMP exam(s) have no questions', v_bad;",
        "  END IF;",
        "",
        "  SELECT count(*) INTO v_bad",
        "    FROM public.exams x",
        "   WHERE x.track_id = " + sql_string(RMP_TRACK),
        "     AND x.question_count <> (SELECT count(*) FROM public.exam_questions q WHERE q.exam_id = x.id);",
        "  IF v_bad > 0 THEN",
        "    RAISE EXCEPTION 'Migration 017: % RMP exam(s) disagree with their exam_questions count', v_bad;",
        "  END IF;",
        "",
        "  -- A question nobody can get right. The banks were checked for this before",
        "  -- generation; this is the same check against what landed.",
        "  SELECT count(*) INTO v_bad",
        "    FROM public.questions q",
        f"   WHERE q.id > {offset}",
        "     AND NOT EXISTS (SELECT 1 FROM public.choices c WHERE c.question_id = q.id AND c.is_correct);",
        "  IF v_bad > 0 THEN",
        "    RAISE EXCEPTION 'Migration 017: % RMP question(s) have no correct choice', v_bad;",
        "  END IF;",
        "",
        "  SELECT count(*) INTO v_bad",
        "    FROM public.questions q",
        f"   WHERE q.id > {offset}",
        "     AND q.answer_count <> (SELECT count(*) FROM public.choices c WHERE c.question_id = q.id AND c.is_correct);",
        "  IF v_bad > 0 THEN",
        "    RAISE EXCEPTION 'Migration 017: % RMP question(s) have a stale answer_count', v_bad;",
        "  END IF;",
        "END $$;",
        "",
    ]
    return "\n".join(lines)


def render_banks(questions, choices, exam_questions):
    lines = [
        "-- =============================================================================",
        "-- Migration 012: question bank content",
        "--",
        "-- GENERATED by scripts/generate-content-migrations.py - do not edit by hand.",
        "--",
        "-- Source: src/data/exam/{ar,en}/<exam id>.json. 11.json does not exist; that is",
        "-- a fact about the banks, not a gap.",
        "--",
        f"-- Exams {', '.join(str(i) for i in sorted(EXCLUDED_EXAM_IDS))} are absent - see 011 and docs/specs/bank-conflicts.md.",
        "--",
        f"--   questions       {len(questions):>6,}",
        f"--   choices         {len(choices):>6,}",
        f"--   exam_questions  {len(exam_questions):>6,}",
        "-- =============================================================================",
        "",
        "",
        "-- questions -----------------------------------------------------------------",
        "--",
        "-- answer_count ships with the row rather than being backfilled afterwards.",
        "-- The trigger that keeps it true is created at the bottom of this file, once",
        "-- the choices are in - creating it first would fire it once per choice insert.",
        "",
    ]
    lines += render_inserts(
        "questions",
        ("id", "type", "text_ar", "text_en", "explanation_ar", "explanation_en", "answer_count"),
        questions,
        lambda row: ", ".join(
            [str(row[0])] + [sql_string(value) for value in row[1:6]] + [str(row[6])]
        ),
    )

    lines += [
        "-- The ids above come from the banks, so the identity sequence has never been",
        "-- advanced. Without this a question authored later collides with a seeded id.",
        "SELECT setval(",
        "  pg_get_serial_sequence('public.questions', 'id'),",
        "  (SELECT max(id) FROM public.questions)",
        ");",
        "",
        "",
        "-- choices -------------------------------------------------------------------",
        "",
    ]
    lines += render_inserts(
        "choices",
        ("question_id", "position", "text_ar", "text_en", "is_correct"),
        choices,
        lambda row: ", ".join(
            [str(row[0]), str(row[1]), sql_string(row[2]), sql_string(row[3]), str(row[4]).lower()]
        ),
    )

    lines += [
        "-- exam_questions ------------------------------------------------------------",
        "--",
        "-- question_index is 0..n-1 with no gaps. Exclusion is per exam, so no kept",
        "-- exam has a hole in it - and breaks.show_at_index is a position in the exam,",
        "-- which a hole would shift.",
        "",
    ]
    lines += render_inserts(
        "exam_questions",
        ("exam_id", "question_index", "question_id"),
        exam_questions,
        lambda row: ", ".join(str(value) for value in row),
    )

    lines += [
        "-- ---------------------------------------------------------------------------",
        "-- Assertions. The generator checked all of this before writing the file; these",
        "-- repeat it against what actually landed, because a migration that half-applied",
        "-- is not the same thing as a generator that ran.",
        "-- ---------------------------------------------------------------------------",
        "DO $$",
        "DECLARE",
        "  v_bad INTEGER;",
        "BEGIN",
        "  -- Every exam in the catalogue must have questions. An exam with none would",
        "  -- violate question_count > 0 and is a generation failure, not a data state.",
        "  SELECT count(*) INTO v_bad",
        "    FROM public.exams x",
        "   WHERE NOT EXISTS (SELECT 1 FROM public.exam_questions q WHERE q.exam_id = x.id);",
        "  IF v_bad > 0 THEN",
        "    RAISE EXCEPTION 'Migration 012: % exam(s) have no questions', v_bad;",
        "  END IF;",
        "",
        "  -- question_count must equal the rows that exist. 011 wrote it from the same",
        "  -- count, so a mismatch means the two files came from different runs.",
        "  SELECT count(*) INTO v_bad",
        "    FROM public.exams x",
        "   WHERE x.question_count <> (",
        "           SELECT count(*) FROM public.exam_questions q WHERE q.exam_id = x.id",
        "         );",
        "  IF v_bad > 0 THEN",
        "    RAISE EXCEPTION 'Migration 012: % exam(s) disagree with their question_count - regenerate 011 and 012 together', v_bad;",
        "  END IF;",
        "",
        "  -- A question with no correct choice is unwinnable: grading compares the",
        "  -- student's selections against array_agg(position) FILTER (is_correct), which",
        "  -- is NULL, and NULL = anything is NULL - so it grades wrong whatever is picked.",
        "  SELECT count(*) INTO v_bad",
        "    FROM public.questions q",
        "   WHERE NOT EXISTS (",
        "           SELECT 1 FROM public.choices c WHERE c.question_id = q.id AND c.is_correct",
        "         );",
        "  IF v_bad > 0 THEN",
        "    RAISE EXCEPTION 'Migration 012: % question(s) have no correct choice', v_bad;",
        "  END IF;",
        "",
        "  -- answer_count shipped with the rows; prove it matches before the trigger",
        "  -- below takes over responsibility for keeping it true.",
        "  SELECT count(*) INTO v_bad",
        "    FROM public.questions q",
        "   WHERE q.answer_count <> (",
        "           SELECT count(*) FROM public.choices c WHERE c.question_id = q.id AND c.is_correct",
        "         );",
        "  IF v_bad > 0 THEN",
        "    RAISE EXCEPTION 'Migration 012: % question(s) have a stale answer_count', v_bad;",
        "  END IF;",
        "END $$;",
        "",
        "",
        "-- ---------------------------------------------------------------------------",
        "-- sync_question_answer_count - keeps answer_count equal to count(is_correct)",
        "-- whenever a question's choices change (an admin correcting a wrong answer key,",
        "-- adding or removing a choice).",
        "--",
        "-- Created here, after the inserts above, so the bulk load does not fire it once",
        "-- per choice row.",
        "--",
        "-- FOR EACH ROW rather than statement-level: a bulk write to choices fires this",
        "-- once per affected row and lands on the correct final count per question either",
        "-- way. On a DELETE that cascades from removing the question itself, the UPDATE",
        "-- simply matches zero rows - the parent is already gone.",
        "-- ---------------------------------------------------------------------------",
        "CREATE OR REPLACE FUNCTION public.sync_question_answer_count()",
        "RETURNS TRIGGER",
        "LANGUAGE plpgsql",
        "SECURITY DEFINER",
        "SET search_path = ''",
        "AS $$",
        "DECLARE",
        "  v_question_id INTEGER := COALESCE(NEW.question_id, OLD.question_id);",
        "BEGIN",
        "  UPDATE public.questions",
        "     SET answer_count = (",
        "           SELECT count(*) FROM public.choices",
        "            WHERE question_id = v_question_id AND is_correct",
        "         )",
        "   WHERE id = v_question_id;",
        "",
        "  RETURN NULL;",
        "END;",
        "$$;",
        "",
        "CREATE TRIGGER sync_answer_count_on_choices",
        "  AFTER INSERT OR UPDATE OF is_correct OR DELETE ON public.choices",
        "  FOR EACH ROW",
        "  EXECUTE FUNCTION public.sync_question_answer_count();",
        "",
    ]
    return "\n".join(lines)


def write(path, body):
    # newline="" disables Windows \n -> \r\n translation. Without it every newline
    # INSIDE a quoted bank string is rewritten too, and the text lands in Postgres
    # carrying carriage returns it never had.
    with path.open("w", encoding="utf-8", newline="") as handle:
        handle.write(body)


def main():
    banks = load_banks()
    catalogue = json.loads((BANK_DIR / "exams.json").read_text(encoding="utf-8"))

    exam_rows = [
        {
            "id": entry["id"],
            "type": entry["type"],
            "name_ar": entry["name"]["ar"],
            "name_en": entry["name"]["en"],
            "display_order": position,
        }
        for position, entry in enumerate(catalogue, start=1)
    ]

    listed = {row["id"] for row in exam_rows}
    if listed != set(banks):
        sys.exit(
            "exams.json and the bank files disagree.\n"
            f"  in exams.json only: {sorted(listed - set(banks))}\n"
            f"  bank files only:    {sorted(set(banks) - listed)}"
        )

    # The exclusion is justified by the conflicts being confined to those exams.
    # If one ever appears in an exam we ship, the justification is gone.
    conflicts = find_conflicts(banks)
    leaked = {exam: ids for exam, ids in conflicts.items() if exam not in EXCLUDED_EXAM_IDS}
    if leaked:
        print("REFUSING TO GENERATE - ar/en conflicts in an exam that is being shipped.", file=sys.stderr)
        for exam, ids in sorted(leaked.items()):
            print(f"  exam {exam}: question ids {sorted(ids)}", file=sys.stderr)
        print("  Resolve them in src/data/exam/, or add the exam to EXCLUDED_EXAM_IDS.", file=sys.stderr)
        return 1

    clean = sorted(exam for exam in EXCLUDED_EXAM_IDS if not conflicts.get(exam))
    if clean:
        print(f"REFUSING TO GENERATE - exam(s) {clean} are excluded but no longer conflict.", file=sys.stderr)
        print("  Remove them from EXCLUDED_EXAM_IDS, update EXPECTED, and re-run.", file=sys.stderr)
        return 1

    kept_ids = listed - EXCLUDED_EXAM_IDS
    questions, choices, exam_questions = collect(banks, kept_ids)

    counts = defaultdict(int)
    for exam_id, _index, _question_id in exam_questions:
        counts[exam_id] += 1

    actual = {
        "questions": len(questions),
        "choices": len(choices),
        "exam_questions": len(exam_questions),
    }
    if actual != EXPECTED:
        print(f"REFUSING TO GENERATE - volumes changed.\n  expected {EXPECTED}\n  actual   {actual}", file=sys.stderr)
        print("  Update EXPECTED if this is intended.", file=sys.stderr)
        return 1

    # --- RMP -----------------------------------------------------------------
    # Held to the same standard as the PMP banks: a disagreement between the
    # Arabic and English file about which choice is correct is the defect that
    # cost exams 1, 3 and 5 their place in the catalogue, and there is no
    # exclusion list here to absorb one.
    rmp_banks = load_rmp_banks()
    rmp_conflicts = find_conflicts(rmp_banks)
    if rmp_conflicts:
        print("REFUSING TO GENERATE - ar/en conflicts in the RMP banks.", file=sys.stderr)
        for exam, ids in sorted(rmp_conflicts.items()):
            print(f"  exam {exam}: question ids {sorted(ids)}", file=sys.stderr)
        return 1

    offset = RMP_QUESTION_ID_BASE - 3137
    if offset < 0:
        print(
            f"REFUSING TO GENERATE - RMP_QUESTION_ID_BASE {RMP_QUESTION_ID_BASE} is below the",
            file=sys.stderr,
        )
        print("  highest PMP question id (3137); the ranges would overlap.", file=sys.stderr)
        return 1

    rmp_questions, rmp_choices, rmp_exam_questions = collect(
        rmp_banks, set(rmp_banks), id_offset=offset
    )

    # The two ranges must not meet. Asserted rather than reasoned about, because
    # the PMP side of it is a property of the bank files, not of this script.
    pmp_ids = {row[0] for row in questions}
    rmp_ids = {row[0] for row in rmp_questions}
    if pmp_ids & rmp_ids:
        print(
            f"REFUSING TO GENERATE - {len(pmp_ids & rmp_ids)} question id(s) collide between",
            file=sys.stderr,
        )
        print(f"  the PMP and RMP banks: {sorted(pmp_ids & rmp_ids)[:10]}", file=sys.stderr)
        return 1

    rmp_counts = defaultdict(int)
    for exam_id, _index, _question_id in rmp_exam_questions:
        rmp_counts[exam_id] += 1

    # Every break index must be inside the SHORTEST exam on the config, not just
    # the first one. The trigger checks each exam as it is inserted, so an exam
    # shorter than the break index would fail mid-migration.
    shortest = min(rmp_counts.values())
    for at, _minutes in RMP_CONFIG["breaks"]:
        if at >= shortest:
            print(
                f"REFUSING TO GENERATE - break index {at} is not less than the shortest",
                file=sys.stderr,
            )
            print(f"  RMP exam's question_count ({shortest}).", file=sys.stderr)
            return 1

    rmp_actual = {
        "questions": len(rmp_questions),
        "choices": len(rmp_choices),
        "exam_questions": len(rmp_exam_questions),
    }
    if rmp_actual != EXPECTED_RMP:
        print(
            f"REFUSING TO GENERATE - RMP volumes changed.\n  expected {EXPECTED_RMP}\n  actual   {rmp_actual}",
            file=sys.stderr,
        )
        print("  Update EXPECTED_RMP if this is intended.", file=sys.stderr)
        return 1

    write(CATALOGUE_PATH, render_catalogue(exam_rows, counts))
    write(BANKS_PATH, render_banks(questions, choices, exam_questions))
    write(RMP_PATH, render_rmp(rmp_questions, rmp_choices, rmp_exam_questions, rmp_counts, offset))

    print(f"exams           {len(kept_ids):,} kept, {len(EXCLUDED_EXAM_IDS)} excluded {sorted(EXCLUDED_EXAM_IDS)}")
    print(f"questions       {actual['questions']:,}")
    print(f"choices         {actual['choices']:,}")
    print(f"exam_questions  {actual['exam_questions']:,}")
    print(f"written         {CATALOGUE_PATH.name} ({CATALOGUE_PATH.stat().st_size / 1_000:.0f} KB)")
    print(f"written         {BANKS_PATH.name} ({BANKS_PATH.stat().st_size / 1_000_000:.1f} MB)")
    print()
    print(f"RMP exams       {len(RMP_EXAMS)}, ids {min(r['id'] for r in RMP_EXAMS)}-{max(r['id'] for r in RMP_EXAMS)}")
    print(f"RMP questions   {rmp_actual['questions']:,}  ids {min(rmp_ids)}-{max(rmp_ids)} (bank ids +{offset})")
    print(f"RMP choices     {rmp_actual['choices']:,}")
    print(f"written         {RMP_PATH.name} ({RMP_PATH.stat().st_size / 1_000_000:.1f} MB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
