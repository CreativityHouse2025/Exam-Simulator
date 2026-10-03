#!/usr/bin/env python3
"""
Convert an RMP exam's Excel workbooks into the JSON banks the generator reads.

Usage:
    python scripts/convert-rmp-xlsx.py <exam number>
    python scripts/convert-rmp-xlsx.py 5

Reads:
    src/data/exam/pmi_rmp_exam_<n>_english.xlsx
    src/data/exam/pmi_rmp_exam_<n>_arabic.xlsx

Writes:
    src/data/exam/en/pmi_rmp_exam_<n>_english.json
    src/data/exam/ar/pmi_rmp_exam_<n>_arabic.json

Only question content is kept: text, options, correct option(s), explanation.
Original numbers, answer types and source references are dropped. Array order
follows the workbook's "No." column.

Questions carry no id: public.questions.id is an identity column, so the
database assigns them when the migration inserts the rows.

Refuses to write unless the two languages are symmetric: same question count,
same option count and correct positions per question, no empty field, and each
file written in its own script. Also refuses if a correct letter points at a
blank option.
"""

import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
BANK_DIR = ROOT / "src" / "data" / "exam"
LANG_SUFFIX = {"en": "english", "ar": "arabic"}

# Positions in the "Question Bank" sheet (the second sheet in both workbooks;
# its name is translated in the Arabic one, so it is found by index).
QUESTION_SHEET_INDEX = 1
COL_NUMBER, COL_TEXT, COL_OPTIONS, COL_CORRECT, COL_EXPLANATION = 0, 2, slice(3, 8), 8, 10

ARABIC = re.compile(r"[؀-ۿ]")

LETTER_INDEX = {
    "en": {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4},
    "ar": {"أ": 0, "ب": 1, "ج": 2, "د": 3, "هـ": 4, "ه": 4},
}


def cell_text(value):
    return "" if value is None else str(value).strip()


def correct_indices(raw, lang):
    letters = [part.strip() for part in re.split(r"[,،]", raw) if part.strip()]
    try:
        return {LETTER_INDEX[lang][letter] for letter in letters}
    except KeyError as error:
        raise SystemExit(f"{lang}: unknown answer letter {error} in {raw!r}")


def read_workbook(exam_number, lang):
    path = BANK_DIR / f"pmi_rmp_exam_{exam_number}_{LANG_SUFFIX[lang]}.xlsx"
    if not path.exists():
        raise SystemExit(f"Missing workbook: {path.relative_to(ROOT)}")

    sheet = openpyxl.load_workbook(path, read_only=True).worksheets[QUESTION_SHEET_INDEX]
    rows = [row for row in list(sheet.iter_rows(values_only=True))[1:] if cell_text(row[COL_NUMBER])]
    rows.sort(key=lambda row: int(row[COL_NUMBER]))

    numbers = [int(row[COL_NUMBER]) for row in rows]
    if numbers != list(range(1, len(rows) + 1)):
        raise SystemExit(f"{lang}: 'No.' column is not 1..{len(rows)} without gaps")

    questions = []
    for row in rows:
        number = row[COL_NUMBER]
        options = [cell_text(value) for value in row[COL_OPTIONS]]
        correct = correct_indices(cell_text(row[COL_CORRECT]), lang)
        if not correct:
            raise SystemExit(f"{lang} question {number}: no correct answer")
        if any(not options[index] for index in correct):
            raise SystemExit(f"{lang} question {number}: a correct letter points at a blank option")

        questions.append(
            {
                "text": cell_text(row[COL_TEXT]),
                "explanation": cell_text(row[COL_EXPLANATION]),
                "choices": [
                    {"text": text, "correct": index in correct} for index, text in enumerate(options) if text
                ],
            }
        )
    return questions


def fields(question):
    return [question["text"], question["explanation"], *(choice["text"] for choice in question["choices"])]


def assert_languages_agree(en, ar):
    if len(en) != len(ar):
        raise SystemExit(f"Question count differs: en {len(en)}, ar {len(ar)}")

    problems = []
    for number, (en_question, ar_question) in enumerate(zip(en, ar), start=1):
        en_correct = [choice["correct"] for choice in en_question["choices"]]
        ar_correct = [choice["correct"] for choice in ar_question["choices"]]
        if en_correct != ar_correct:
            problems.append(f"question {number}: option count or correct positions differ")
        if not all(fields(en_question)) or not all(fields(ar_question)):
            problems.append(f"question {number}: empty text, explanation or option")
        if any(ARABIC.search(text) for text in fields(en_question)):
            problems.append(f"question {number}: Arabic text in the English bank")
        if not (ARABIC.search(ar_question["text"]) and ARABIC.search(ar_question["explanation"])):
            problems.append(f"question {number}: Arabic bank's text or explanation is not Arabic")

    if problems:
        raise SystemExit("en/ar banks are not symmetric:\n  " + "\n  ".join(problems))


def main():
    if len(sys.argv) != 2 or not sys.argv[1].isdigit():
        raise SystemExit(__doc__)
    exam_number = int(sys.argv[1])

    banks = {lang: read_workbook(exam_number, lang) for lang in LANG_SUFFIX}
    assert_languages_agree(banks["en"], banks["ar"])

    for lang, questions in banks.items():
        bank = [{"type": "multiple-choice", **question} for question in questions]
        path = BANK_DIR / lang / f"pmi_rmp_exam_{exam_number}_{LANG_SUFFIX[lang]}.json"
        path.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"written  {path.relative_to(ROOT)}")

    print(f"questions {len(banks['en'])}")


if __name__ == "__main__":
    main()
