#!/usr/bin/env python3
"""
Analyse the exam question banks before they are seeded into Postgres.

Usage:
    python scripts/analyze-banks.py [--out docs/specs/bank-conflicts.md]

Reads every src/data/exam/{ar,en}/<id>.json pair and reports:
  1. ar/en conflicts  - questions where the two languages disagree on the
                        correct answer, or carry a different number of choices.
                        These cannot be seeded: one row holds one truth.
  2. parity           - ar and en must have identical length and identical
                        id-per-index in every file.
  3. id collisions    - the same question id mapping to two different texts.
  4. duplicates       - the same question id appearing twice inside one exam.
  5. volumes          - instance / distinct-id / shared-instance counts.

Writes a markdown report and exits non-zero if any parity, collision or
duplicate problem is found. ar/en conflicts alone do not fail the run: they
are expected output, and the seed generator excludes them.
"""

import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BANK_DIR = ROOT / "src" / "data" / "exam"
LANGS = ("ar", "en")


def load_banks():
    """Returns {exam_id: {lang: [question, ...]}} for every exam present in both languages."""
    ids = sorted(int(p.stem) for p in (BANK_DIR / "ar").glob("*.json"))
    banks = {}
    for exam_id in ids:
        banks[exam_id] = {
            lang: json.loads((BANK_DIR / lang / f"{exam_id}.json").read_text(encoding="utf-8"))
            for lang in LANGS
        }
    return banks


def correct_set(question):
    return frozenset(i for i, c in enumerate(question["choices"]) if c["correct"])


def find_parity_breaks(banks):
    """ar and en must be positionally identical. Anything else invalidates index-wise comparison."""
    breaks = []
    for exam_id, langs in banks.items():
        ar, en = langs["ar"], langs["en"]
        if len(ar) != len(en):
            breaks.append(f"{exam_id}.json: length ar={len(ar)} en={len(en)}")
            continue
        for index, (a, e) in enumerate(zip(ar, en)):
            if a["id"] != e["id"]:
                breaks.append(f"{exam_id}.json#{index}: id ar={a['id']} en={e['id']}")
    return breaks


def find_conflicts(banks):
    """Questions whose correct answer or choice count differs between the two languages."""
    conflicts = []
    for exam_id, langs in banks.items():
        for index, (ar, en) in enumerate(zip(langs["ar"], langs["en"])):
            if ar["id"] != en["id"]:
                continue
            reasons = []
            if len(ar["choices"]) != len(en["choices"]):
                reasons.append(f"choice count ar={len(ar['choices'])} en={len(en['choices'])}")
            if correct_set(ar) != correct_set(en):
                reasons.append(
                    f"correct set ar={sorted(correct_set(ar))} en={sorted(correct_set(en))}"
                )
            if reasons:
                conflicts.append(
                    {
                        "exam_id": exam_id,
                        "index": index,
                        "question_id": ar["id"],
                        "reasons": reasons,
                        "ar": ar,
                        "en": en,
                    }
                )
    return conflicts


def find_id_collisions(banks):
    """The same id must always carry the same text, in both languages."""
    texts = defaultdict(set)
    for langs in banks.values():
        for lang in LANGS:
            for question in langs[lang]:
                texts[(question["id"], lang)].add(question["text"])
    return {key: value for key, value in texts.items() if len(value) > 1}


def find_intra_exam_duplicates(banks):
    """No exam may contain the same question id twice - attempt_answers' PK depends on it."""
    duplicates = {}
    for exam_id, langs in banks.items():
        counts = Counter(question["id"] for question in langs["en"])
        repeated = {qid: n for qid, n in counts.items() if n > 1}
        if repeated:
            duplicates[exam_id] = repeated
    return duplicates


def volumes(banks):
    instances = [q["id"] for langs in banks.values() for q in langs["en"]]
    counts = Counter(instances)
    distinct = len(counts)
    shared = sum(n for n in counts.values() if n > 1)
    choices = sum(len(q["choices"]) for langs in banks.values() for q in langs["en"])
    unique_choice_rows = sum(
        len(next(q for langs in banks.values() for q in langs["en"] if q["id"] == qid)["choices"])
        for qid in counts
    )
    return {
        "files": len(banks),
        "instances": len(instances),
        "distinct_ids": distinct,
        "shared_instances": shared,
        "exam_questions_rows": len(instances),
        "choice_rows_all_instances": choices,
        "choice_rows_distinct": unique_choice_rows,
    }


def render(banks, parity, conflicts, collisions, duplicates, stats):
    lines = [
        "# Question bank analysis",
        "",
        "Generated by `scripts/analyze-banks.py`. Do not edit by hand.",
        "",
        "## Volumes",
        "",
        "| Metric | Value |",
        "| --- | --- |",
    ]
    for key, value in stats.items():
        lines.append(f"| {key.replace('_', ' ')} | {value:,} |")

    lines += ["", "## Integrity", "", "| Check | Result |", "| --- | --- |"]
    lines.append(f"| ar/en parity | {'OK' if not parity else str(len(parity)) + ' break(s)'} |")
    lines.append(f"| id -> text collisions | {'none' if not collisions else len(collisions)} |")
    lines.append(f"| duplicate id within an exam | {'none' if not duplicates else len(duplicates)} |")

    for label, items in (("Parity breaks", parity), ("Id collisions", sorted(map(str, collisions))),
                         ("Intra-exam duplicates", [f"{k}.json: {v}" for k, v in duplicates.items()])):
        if items:
            lines += ["", f"### {label}", ""]
            lines += [f"- {item}" for item in items]

    lines += [
        "",
        f"## ar/en conflicts — {len(conflicts)} question(s), EXCLUDED from the seed",
        "",
        "Each of these has one truth in Arabic and a different truth in English.",
        "They are omitted from `questions`, `choices` and `exam_questions` until a human",
        "resolves them, which also lowers `exams.question_count` for the exams listed.",
        "",
    ]

    affected = Counter(c["exam_id"] for c in conflicts)
    if affected:
        lines += ["| Exam | Questions dropped |", "| --- | --- |"]
        lines += [f"| {exam_id}.json | {n} |" for exam_id, n in sorted(affected.items())]
        lines.append("")

    for conflict in conflicts:
        ar, en = conflict["ar"], conflict["en"]
        lines += [
            f"### {conflict['exam_id']}.json#{conflict['question_id']} (index {conflict['index']})",
            "",
            *[f"- {reason}" for reason in conflict["reasons"]],
            "",
            "**English**",
            "",
            "> " + en["text"].strip().replace("\n", " ")[:400],
            "",
        ]
        for i, choice in enumerate(en["choices"]):
            mark = "x" if choice["correct"] else " "
            lines.append(f"- [{mark}] {i}. {choice['text'].strip()[:200]}")
        lines += ["", "**Arabic**", "", "> " + ar["text"].strip().replace("\n", " ")[:400], ""]
        for i, choice in enumerate(ar["choices"]):
            mark = "x" if choice["correct"] else " "
            lines.append(f"- [{mark}] {i}. {choice['text'].strip()[:200]}")
        lines.append("")

    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="docs/specs/bank-conflicts.md")
    args = parser.parse_args()

    banks = load_banks()
    parity = find_parity_breaks(banks)
    conflicts = find_conflicts(banks)
    collisions = find_id_collisions(banks)
    duplicates = find_intra_exam_duplicates(banks)
    stats = volumes(banks)

    out_path = ROOT / args.out
    out_path.write_text(render(banks, parity, conflicts, collisions, duplicates, stats), encoding="utf-8")

    print(f"files            {stats['files']}")
    print(f"instances        {stats['instances']}")
    print(f"distinct ids     {stats['distinct_ids']}")
    print(f"shared instances {stats['shared_instances']}")
    print(f"choice rows      {stats['choice_rows_distinct']} (distinct questions)")
    print(f"parity breaks    {len(parity)}")
    print(f"id collisions    {len(collisions)}")
    print(f"intra-exam dups  {len(duplicates)}")
    print(f"ar/en conflicts  {len(conflicts)}")
    print(f"report           {out_path}")

    return 1 if parity or collisions or duplicates else 0


if __name__ == "__main__":
    sys.exit(main())
