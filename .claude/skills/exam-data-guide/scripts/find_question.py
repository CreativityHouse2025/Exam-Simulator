"""Locate a question id across every exam bank and language.

Question ids are NOT unique across banks: the same question often lives in a full
exam file AND a domain file. A fix applied to only one copy leaves the other wrong,
so always run this before editing a question.

Usage (from the repo root):
    python .claude/skills/exam-data-guide/scripts/find_question.py 2997
    python .claude/skills/exam-data-guide/scripts/find_question.py 2997 3057 3058
"""

import glob
import json
import os
import sys

BANKS = ("full", "domain")
LANGS = ("en", "ar")


def find(question_ids):
    hits = {qid: [] for qid in question_ids}
    for bank in BANKS:
        for lang in LANGS:
            for path in sorted(glob.glob(f"src/data/exam/{bank}/{lang}/*.json")):
                with open(path, encoding="utf-8") as handle:
                    questions = json.load(handle)
                for index, question in enumerate(questions):
                    if question.get("id") in hits:
                        correct = [
                            i for i, c in enumerate(question["choices"]) if c.get("correct")
                        ]
                        hits[question["id"]].append((path.replace(os.sep, "/"), index, correct))
    return hits


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    question_ids = {int(arg) for arg in sys.argv[1:]}
    for qid, locations in find(question_ids).items():
        print(f"\nquestion {qid} — {len(locations)} copy/copies")
        if not locations:
            print("  NOT FOUND")
        for path, index, correct in locations:
            print(f"  {path}  [index {index}]  correct choice index: {correct}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
