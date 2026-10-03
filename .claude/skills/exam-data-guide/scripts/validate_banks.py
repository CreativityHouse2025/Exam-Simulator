"""Check the exam banks hold their invariants. Run after ANY edit under src/data/exam/.

Checks, per bank file:
  1. Every en/<id>.json has a matching ar/<id>.json
  2. The two languages carry the same question ids in the same order
  3. Every question has at least one correct choice
  4. en and ar agree on the NUMBER of correct choices for a question
     (not the index — choice order legitimately differs between languages)
  5. en and ar agree on the number of choices for a question
  6. questionCount in full-exams.json / categories.json matches the real file length

Usage (from the repo root):
    python .claude/skills/exam-data-guide/scripts/validate_banks.py
Exit code 1 means at least one invariant is broken.
"""

import glob
import json
import os
import sys

BANKS = {"full": "full-exams.json", "domain": "categories.json"}


def load(path):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def correct_indices(question):
    return [i for i, choice in enumerate(question["choices"]) if choice.get("correct")]


def check_bank(bank, meta_file, problems):
    meta = {str(entry["id"]): entry["questionCount"] for entry in load(f"src/data/exam/{meta_file}")}

    for en_path in sorted(glob.glob(f"src/data/exam/{bank}/en/*.json")):
        name = os.path.basename(en_path)
        ar_path = f"src/data/exam/{bank}/ar/{name}"

        if not os.path.exists(ar_path):
            problems.append(f"{bank}/{name}: no Arabic counterpart")
            continue

        en, ar = load(en_path), load(ar_path)

        if [q["id"] for q in en] != [q["id"] for q in ar]:
            problems.append(f"{bank}/{name}: en and ar question ids differ or are out of order")
            continue

        for index, (en_question, ar_question) in enumerate(zip(en, ar)):
            where = f"{bank}/{name} [index {index}] id={en_question['id']}"
            en_correct, ar_correct = correct_indices(en_question), correct_indices(ar_question)

            if not en_correct:
                problems.append(f"{where}: en has no correct choice")
            if not ar_correct:
                problems.append(f"{where}: ar has no correct choice")
            if len(en_correct) != len(ar_correct):
                problems.append(
                    f"{where}: en marks {len(en_correct)} correct choice(s), ar marks {len(ar_correct)}"
                )
            if len(en_question["choices"]) != len(ar_question["choices"]):
                problems.append(
                    f"{where}: en has {len(en_question['choices'])} choices, "
                    f"ar has {len(ar_question['choices'])}"
                )

        bank_id = name[:-5]
        if bank_id in meta and meta[bank_id] != len(en):
            problems.append(
                f"{meta_file} id={bank_id}: questionCount is {meta[bank_id]} but the file has {len(en)}"
            )


def main():
    problems = []
    for bank, meta_file in BANKS.items():
        check_bank(bank, meta_file, problems)

    if problems:
        print(f"{len(problems)} problem(s):")
        for problem in problems:
            print(f"  - {problem}")
        return 1

    print("All exam bank invariants hold.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
