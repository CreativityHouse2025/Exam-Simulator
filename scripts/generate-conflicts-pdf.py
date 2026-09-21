#!/usr/bin/env python3
"""
Render the Arabic side of the 8 ar/en conflicting questions to a reviewable PDF.

Usage:
    python scripts/generate-conflicts-pdf.py

Reads  src/data/exam/ar/{1,3,5}.json  and  src/data/exam/en/{1,3,5}.json
Writes src/data/bank-conflicts.pdf

The three exams are held out of the database seed until a human resolves these
questions (see docs/specs/bank-conflicts.md). This file is what they read: the
Arabic text and choices as they stand today, with the currently-correct choice
marked and the kind of conflict named.

PDF generation goes through headless Chrome rather than a Python PDF library:
Arabic needs glyph shaping and bidi reordering, and a browser engine already
does both correctly. reportlab would need arabic_reshaper + python-bidi + a
bundled Arabic TTF to reach the same place.
"""

import json
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BANKS = ROOT / "src" / "data" / "exam"
OUT_PDF = ROOT / "src" / "data" / "bank-conflicts.pdf"

CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "google-chrome",
    "chromium",
]

# Exam names as migration 013_content_tracks_exams.sql spells them.
EXAM_NAMES = {
    1: "اختبار PMP الكامل 1",
    3: "اختبار PMP الكامل 3",
    5: "اختبار PMP الكامل 5",
}

# What is actually wrong with each question, established by comparing the two
# banks choice-by-choice rather than trusting the equal-length/equal-id check.
REORDER = "ترتيب الخيارات مختلف بين اللغتين، والإجابة الصحيحة متطابقة"
DIFFERENT = "النص العربي سؤال مختلف تمامًا عن النص الإنجليزي"
CHOICE_COUNT = "عدد الخيارات مختلف: 4 بالعربية مقابل 6 بالإنجليزية"

CONFLICTS = {
    640: DIFFERENT,
    643: DIFFERENT,
    989: REORDER,
    990: REORDER,
    992: REORDER,
    993: REORDER,
    994: REORDER,
    1381: CHOICE_COUNT,
}

SEVERITY = {
    DIFFERENT: ("severe", "يحتاج قرارًا بشريًا"),
    CHOICE_COUNT: ("severe", "يحتاج قرارًا بشريًا"),
    REORDER: ("minor", "قابل للإصلاح آليًا"),
}


def find_chrome() -> str:
    for candidate in CHROME_CANDIDATES:
        if pathlib.Path(candidate).exists():
            return candidate
        found = shutil.which(candidate)
        if found:
            return found
    sys.exit("Chrome not found. Install Chrome or add it to PATH.")


def load(lang: str, exam: int) -> list[dict]:
    return json.loads((BANKS / lang / f"{exam}.json").read_text(encoding="utf-8"))


def correct_positions(question: dict) -> list[int]:
    return [i for i, c in enumerate(question["choices"]) if c["correct"]]


def collect() -> list[dict]:
    """One entry per conflicting question, in exam then index order."""
    rows = []
    for exam in sorted(EXAM_NAMES):
        ar, en = load("ar", exam), load("en", exam)
        for index, (a, e) in enumerate(zip(ar, en)):
            if a["id"] not in CONFLICTS:
                continue
            rows.append(
                {
                    "exam": exam,
                    "index": index,
                    "id": a["id"],
                    "text": a["text"],
                    "choices": a["choices"],
                    "ar_correct": correct_positions(a),
                    "en_correct": correct_positions(e),
                    "conflict": CONFLICTS[a["id"]],
                }
            )
    return rows


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .strip()
    )


def render_card(row: dict) -> str:
    kind, label = SEVERITY[row["conflict"]]
    choices = "".join(
        f'<li class="{"correct" if i in row["ar_correct"] else ""}">'
        f'<span class="pos">{i}</span>{esc(c["text"])}</li>'
        for i, c in enumerate(row["choices"])
    )
    return f"""
    <article class="card {kind}">
      <header>
        <div class="ids">
          <span class="exam">{esc(EXAM_NAMES[row['exam']])}</span>
          <span class="meta">ملف {row['exam']}.json &middot; ترتيب {row['index']} &middot; معرّف {row['id']}</span>
        </div>
        <span class="badge {kind}">{label}</span>
      </header>
      <p class="conflict">{esc(row['conflict'])}</p>
      <p class="question">{esc(row['text'])}</p>
      <ol class="choices">{choices}</ol>
      <footer>
        الإجابة الصحيحة الحالية &mdash; بالعربية: {', '.join(map(str, row['ar_correct']))}
        &nbsp;|&nbsp; بالإنجليزية: {', '.join(map(str, row['en_correct']))}
      </footer>
    </article>"""


def build_html(rows: list[dict]) -> str:
    severe = sum(1 for r in rows if SEVERITY[r["conflict"]][0] == "severe")
    cards = "".join(render_card(r) for r in rows)
    return f"""<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>أسئلة متعارضة بين النسختين العربية والإنجليزية</title>
<style>
  @page {{ size: A4; margin: 16mm 14mm; }}
  * {{ box-sizing: border-box; }}
  body {{
    font-family: "Segoe UI", Tahoma, "Traditional Arabic", sans-serif;
    font-size: 11.5pt; line-height: 1.85; color: #16181d; margin: 0;
  }}
  h1 {{ font-size: 18pt; margin: 0 0 4px; }}
  .lede {{ color: #555c68; font-size: 10.5pt; margin: 0 0 6px; }}
  .counts {{ font-size: 10.5pt; margin: 0 0 22px; padding: 10px 14px;
             background: #f4f6f8; border-right: 4px solid #9aa4b2; border-radius: 4px; }}
  .card {{ border: 1px solid #d9dee5; border-radius: 6px; padding: 14px 16px;
           margin-bottom: 16px; page-break-inside: avoid; }}
  .card.severe {{ border-right: 5px solid #b3261e; }}
  .card.minor  {{ border-right: 5px solid #8a6d00; }}
  .card header {{ display: flex; justify-content: space-between; align-items: baseline;
                  gap: 12px; margin-bottom: 8px; }}
  .exam {{ font-weight: 700; font-size: 12pt; }}
  .meta {{ color: #6b7280; font-size: 9.5pt; margin-right: 8px; }}
  .badge {{ font-size: 9pt; padding: 2px 9px; border-radius: 10px; white-space: nowrap; }}
  .badge.severe {{ background: #fce8e6; color: #8c1d18; }}
  .badge.minor  {{ background: #fdf3d0; color: #6b5300; }}
  .conflict {{ font-size: 10pt; color: #5b6472; margin: 0 0 10px; }}
  .question {{ margin: 0 0 10px; }}
  .choices {{ list-style: none; padding: 0; margin: 0; }}
  .choices li {{ padding: 5px 10px; border-radius: 4px; margin-bottom: 3px; }}
  .choices li.correct {{ background: #e7f4ea; font-weight: 600; }}
  .choices li.correct::after {{ content: " \\2713"; color: #1a7f37; }}
  .pos {{ display: inline-block; min-width: 20px; color: #8a919c; font-size: 9.5pt; }}
  .choices li.correct .pos {{ color: #1a7f37; }}
  footer {{ margin-top: 10px; padding-top: 8px; border-top: 1px dashed #d9dee5;
            font-size: 9.5pt; color: #6b7280; }}
</style>
</head>
<body>
  <h1>أسئلة متعارضة بين النسختين العربية والإنجليزية</h1>
  <p class="lede">النص العربي والخيارات العربية فقط، مع الإجابة الصحيحة المسجّلة حاليًا.</p>
  <p class="counts">
    {len(rows)} أسئلة في 3 امتحانات &mdash;
    <strong>{severe}</strong> تحتاج قرارًا بشريًا،
    <strong>{len(rows) - severe}</strong> قابلة للإصلاح آليًا (اختلاف ترتيب فقط).
    هذه الامتحانات الثلاثة مستبعدة من قاعدة البيانات حتى تُحَلّ.
  </p>
  {cards}
</body>
</html>"""


def main() -> None:
    rows = collect()
    missing = set(CONFLICTS) - {r["id"] for r in rows}
    if missing:
        sys.exit(f"Question ids not found in the banks: {sorted(missing)}")

    html_path = OUT_PDF.with_suffix(".html")
    html_path.write_text(build_html(rows), encoding="utf-8")

    subprocess.run(
        [
            find_chrome(),
            "--headless",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={OUT_PDF}",
            html_path.as_uri(),
        ],
        check=True,
        capture_output=True,
    )
    html_path.unlink()
    print(f"Wrote {OUT_PDF.relative_to(ROOT)} - {len(rows)} questions")


if __name__ == "__main__":
    main()
