#!/usr/bin/env python3
"""
Restore the JSON question banks from git into a working directory.

Usage:
    python scripts/restore-banks.py                    # all 42 exams -> src/data/exam/
    python scripts/restore-banks.py --only 1,3,5       # just the conflicting three
    python scripts/restore-banks.py --dest build/banks # somewhere other than the repo
    python scripts/restore-banks.py --force            # overwrite files already present

The banks stopped being shipped in the app bundle when the questions moved into
the database, so src/data/exam/ is empty in a fresh checkout. They are still the
human-editable source of truth: scripts/generate-content-migrations.py reads them
to build the catalogue and question-bank migrations, and resolving an ar/en
conflict means editing the JSON, not the SQL.

SOURCE_REF is the last commit that carried them. It is a fixed ref on purpose —
this script reproduces one known state, it does not track a moving branch.

Files are copied byte-for-byte out of git. Nothing is decoded or re-encoded, so
Arabic text and the newlines inside question bodies survive on Windows, where a
text-mode write would rewrite every \\n as \\r\\n.
"""

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_REF = "7972581^"
BANK_PREFIX = "src/data/exam"
LANGS = ("ar", "en")

# Catalogue metadata that sits beside the per-exam banks. exams.json is what
# orders the exam list — its array order IS display_order — and carries each
# exam's name in both languages. Restored alongside the banks because
# generate-content-migrations.py needs it to build the catalogue.
METADATA_FILES = ("exams.json", "exam-types.json")


def git(*args: str) -> bytes:
    result = subprocess.run(["git", *args], cwd=ROOT, capture_output=True)
    if result.returncode != 0:
        sys.exit(f"git {' '.join(args)} failed:\n{result.stderr.decode(errors='replace')}")
    return result.stdout


def bank_paths(lang: str) -> list[str]:
    listing = git("ls-tree", "--name-only", SOURCE_REF, f"{BANK_PREFIX}/{lang}/")
    return listing.decode().split()


def parse_only(raw: str | None) -> set[int] | None:
    if not raw:
        return None
    try:
        return {int(part) for part in raw.split(",") if part.strip()}
    except ValueError:
        sys.exit(f"--only expects comma-separated exam ids, got: {raw}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dest", default=BANK_PREFIX, help="target directory (default: %(default)s)")
    parser.add_argument("--only", help="comma-separated exam ids, e.g. 1,3,5")
    parser.add_argument("--force", action="store_true", help="overwrite existing files")
    args = parser.parse_args()

    wanted = parse_only(args.only)
    dest_root = Path(args.dest)
    if not dest_root.is_absolute():
        dest_root = ROOT / dest_root

    written = skipped = 0
    seen: set[int] = set()

    for lang in LANGS:
        (dest_root / lang).mkdir(parents=True, exist_ok=True)
        for source in bank_paths(lang):
            exam_id = int(Path(source).stem)
            seen.add(exam_id)
            if wanted is not None and exam_id not in wanted:
                continue

            target = dest_root / lang / f"{exam_id}.json"
            if target.exists() and not args.force:
                skipped += 1
                continue

            target.write_bytes(git("show", f"{SOURCE_REF}:{source}"))
            written += 1

    # Metadata describes the whole catalogue, so --only (a subset of exams) does
    # not apply to it. Restored whenever it is absent.
    for name in METADATA_FILES:
        target = dest_root / name
        if target.exists() and not args.force:
            skipped += 1
            continue
        target.write_bytes(git("show", f"{SOURCE_REF}:{BANK_PREFIX}/{name}"))
        written += 1

    if wanted:
        missing = sorted(wanted - seen)
        if missing:
            sys.exit(f"No bank in {SOURCE_REF} for exam id(s): {missing}")

    print(f"restored {written} file(s) to {dest_root}")
    if skipped:
        print(f"skipped  {skipped} already present (use --force to overwrite)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
