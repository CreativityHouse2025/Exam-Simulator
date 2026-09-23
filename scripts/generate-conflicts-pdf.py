#!/usr/bin/env python3
"""
Render both language sides of the 8 ar/en conflicting questions to a reviewable PDF.

Usage:
    python scripts/generate-conflicts-pdf.py

Reads  src/data/exam/ar/{1,3,5}.json, src/data/exam/en/{1,3,5}.json
       and src/data/exam/exams.json for the exam names.
Writes src/data/bank-conflicts.pdf

The three exams are held out of the database seed until a human resolves these
questions (see docs/specs/bank-conflicts.md). This file is what they read: each
question on its own page, English and Arabic side by side, with every choice,
the choice currently marked correct in that language, and both explanations.

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

EXAM_IDS = (1, 3, 5)

# How each conflict was resolved. The original conflict is kept in the first clause.
REORDER = ("Choice order differed; Arabic choices reordered to match English",
           "كان ترتيب الخيارات مختلفًا؛ أُعيد ترتيب الخيارات العربية لتطابق الإنجليزية")
DIFFERENT = ("Arabic was a different question; Arabic retranslated from English, new explanation in both",
             "كان النص العربي سؤالًا مختلفًا؛ أُعيدت ترجمته من الإنجليزية مع تفسير جديد باللغتين")
CHOICE_COUNT = ("English had 6 choices (2 were stem lines); those removed, answer matches Arabic",
                "كانت الإنجليزية تحوي 6 خيارات (اثنان من نص السؤال)؛ أُزيلا وتطابقت الإجابة مع العربية")

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
    DIFFERENT: ("resolved", "Resolved — review translation", "تم الحل — راجع الترجمة"),
    CHOICE_COUNT: ("resolved", "Resolved", "تم الحل"),
    REORDER: ("resolved", "Resolved", "تم الحل"),
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


def exam_names() -> dict[int, dict[str, str]]:
    exams = json.loads((BANKS / "exams.json").read_text(encoding="utf-8"))
    return {e["id"]: e["name"] for e in exams if e["id"] in EXAM_IDS}


def correct_positions(question: dict) -> list[int]:
    return [i for i, c in enumerate(question["choices"]) if c["correct"]]


def collect() -> list[dict]:
    """One entry per conflicting question, in exam then index order."""
    rows = []
    for exam in EXAM_IDS:
        ar, en = load("ar", exam), load("en", exam)
        for index, (a, e) in enumerate(zip(ar, en)):
            if a["id"] not in CONFLICTS:
                continue
            rows.append(
                {
                    "exam": exam,
                    "index": index,
                    "id": a["id"],
                    "ar": a,
                    "en": e,
                    "conflict": CONFLICTS[a["id"]],
                }
            )
    return rows


def esc(text: str) -> str:
    return (
        (text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .strip()
    )


def paragraphs(text: str) -> str:
    blocks = [esc(block) for block in (text or "").split("\n") if block.strip()]
    return "".join(f"<p>{block}</p>" for block in blocks) or "<p>&mdash;</p>"


def render_panel(question: dict, lang: str, heading: str) -> str:
    correct = correct_positions(question)
    choices = "".join(
        f'<li class="{"correct" if i in correct else ""}">'
        f'<span class="pos">{i}</span><span class="body">{esc(c["text"])}</span></li>'
        for i, c in enumerate(question["choices"])
    )
    answers = ", ".join(str(i) for i in correct) or "none"
    return f"""
      <section class="panel" lang="{lang}" dir="{'rtl' if lang == 'ar' else 'ltr'}">
        <h3>{heading}</h3>
        <p class="question">{esc(question['text'])}</p>
        <ol class="choices">{choices}</ol>
        <p class="answer">{'الإجابة الصحيحة' if lang == 'ar' else 'Correct'}: {answers}</p>
        <div class="explanation">
          <h4>{'التفسير' if lang == 'ar' else 'Explanation'}</h4>
          {paragraphs(question.get('explanation'))}
        </div>
      </section>"""


def render_card(row: dict, names: dict[int, dict[str, str]], position: int, total: int) -> str:
    kind, label_en, label_ar = SEVERITY[row["conflict"]]
    conflict_en, conflict_ar = row["conflict"]
    name = names[row["exam"]]
    return f"""
    <article class="card {kind}">
      <header>
        <div class="ids">
          <span class="exam">{esc(name['en'])}</span>
          <span class="exam-ar" dir="rtl">{esc(name['ar'])}</span>
          <span class="meta">{row['exam']}.json &middot; index {row['index']} &middot; id {row['id']}
            &middot; {position} / {total}</span>
        </div>
        <span class="badge {kind}">{label_en} &mdash; <span dir="rtl">{label_ar}</span></span>
      </header>
      <p class="conflict">{conflict_en}<br><span dir="rtl">{conflict_ar}</span></p>
      <div class="panels">
        {render_panel(row['en'], 'en', 'English')}
        {render_panel(row['ar'], 'ar', 'العربية')}
      </div>
    </article>"""


def build_html(rows: list[dict], names: dict[int, dict[str, str]]) -> str:
    retranslated = sum(1 for r in rows if r["conflict"] is DIFFERENT)
    cards = "".join(render_card(r, names, i + 1, len(rows)) for i, r in enumerate(rows))
    per_exam = ", ".join(
        f"{exam}.json ({sum(1 for r in rows if r['exam'] == exam)})" for exam in EXAM_IDS
    )
    return f"""<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<title>ar/en conflicting questions</title>
<style>
  @page {{ size: A4 landscape; margin: 12mm 11mm; }}
  * {{ box-sizing: border-box; }}
  body {{
    font-family: "Segoe UI", Tahoma, "Traditional Arabic", sans-serif;
    font-size: 8.5pt; line-height: 1.45; color: #16181d; margin: 0;
  }}
  h1 {{ font-size: 17pt; margin: 0 0 4px; }}
  .lede {{ color: #555c68; font-size: 10pt; margin: 0 0 8px; }}
  .counts {{ font-size: 10pt; margin: 0; padding: 10px 14px;
             background: #f4f6f8; border-left: 4px solid #9aa4b2; border-radius: 4px; }}
  .cover {{ page-break-after: always; }}
  .card {{ border: 1px solid #d9dee5; border-radius: 6px; padding: 10px 12px;
           page-break-after: always; }}
  .card:last-child {{ page-break-after: auto; }}
  .card.severe {{ border-left: 5px solid #b3261e; }}
  .card.minor  {{ border-left: 5px solid #8a6d00; }}
  .card header {{ display: flex; justify-content: space-between; align-items: baseline;
                  gap: 12px; margin-bottom: 6px; }}
  .exam {{ font-weight: 700; font-size: 11.5pt; }}
  .exam-ar {{ font-weight: 700; font-size: 11.5pt; margin-left: 8px; }}
  .meta {{ color: #6b7280; font-size: 9pt; margin-left: 8px; }}
  .badge {{ font-size: 8.5pt; padding: 2px 9px; border-radius: 10px; white-space: nowrap; }}
  .badge.severe {{ background: #fce8e6; color: #8c1d18; }}
  .badge.minor  {{ background: #fdf3d0; color: #6b5300; }}
  .card.resolved  {{ border-left: 5px solid #1a7f37; }}
  .badge.resolved {{ background: #e7f4ea; color: #1a7f37; }}
  .conflict {{ font-size: 8pt; color: #5b6472; margin: 0 0 8px;
               padding-bottom: 6px; border-bottom: 1px dashed #d9dee5; }}
  .panels {{ display: flex; gap: 16px; align-items: flex-start; }}
  .panel {{ flex: 1 1 0; min-width: 0; }}
  .panel + .panel {{ border-left: 1px solid #e5e9ef; padding-left: 16px; }}
  .panel h3 {{ font-size: 9pt; margin: 0 0 5px; color: #6b7280;
               text-transform: uppercase; letter-spacing: .04em; }}
  .question {{ margin: 0 0 7px; font-weight: 600; font-size: 9pt; }}
  .choices {{ list-style: none; padding: 0; margin: 0 0 8px; }}
  .choices li {{ display: flex; gap: 4px; padding: 3px 7px; border-radius: 4px;
                 margin-bottom: 2px; }}
  .choices li.correct {{ background: #e7f4ea; font-weight: 600; }}
  .choices li.correct .body::after {{ content: " \\2713"; color: #1a7f37; }}
  .pos {{ flex: 0 0 auto; min-width: 16px; color: #8a919c; font-size: 8pt; }}
  .choices li.correct .pos {{ color: #1a7f37; }}
  .answer {{ margin: 0 0 6px; font-size: 8.5pt; color: #1a7f37; font-weight: 600; }}
  .explanation {{ background: #f8fafc; border-radius: 4px; padding: 7px 9px; }}
  .explanation h4 {{ font-size: 8pt; margin: 0 0 4px; color: #6b7280;
                     text-transform: uppercase; letter-spacing: .04em; }}
  .explanation p {{ margin: 0 0 4px; font-size: 8pt; color: #3b414b; }}
  .explanation p:last-child {{ margin-bottom: 0; }}
</style>
</head>
<body>
  <div class="cover">
    <h1>ar/en conflicts, resolved &mdash; حل التعارضات بين النسختين</h1>
    <p class="lede">
      Every conflicting question in full, both languages: text, all choices, the choice marked
      correct in that language, and the explanation.<br>
      <span dir="rtl">كل سؤال متعارض بالكامل، باللغتين: النص، جميع الخيارات، الخيار المسجّل صحيحًا
      في كل لغة، والتفسير.</span>
    </p>
    <p class="counts">
      {len(rows)} questions across {len(EXAM_IDS)} exams &mdash; {per_exam}.<br>
      All resolved: <strong>{retranslated}</strong> retranslated (please review the Arabic),
      <strong>{len(rows) - retranslated}</strong> fixed mechanically.
      These exams can now be seeded in full.
    </p>
  </div>
  {cards}
</body>
</html>"""


def main() -> None:
    rows = collect()
    missing = set(CONFLICTS) - {r["id"] for r in rows}
    if missing:
        sys.exit(f"Question ids not found in the banks: {sorted(missing)}")

    names = exam_names()
    html_path = OUT_PDF.with_suffix(".html")
    html_path.write_text(build_html(rows, names), encoding="utf-8")

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
