#!/usr/bin/env python3
"""Assign a local or remote video to an exercise or education clip without changing UI code."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSIGNMENTS = ROOT / "backend" / "data" / "video_assignments.json"


def main() -> None:
    parser = argparse.ArgumentParser(description="Assign demo/production media in the content manifest.")
    parser.add_argument("--type", choices=("exercise", "education"), default="exercise")
    parser.add_argument("--id", required=True, help="Exercise or education id")
    parser.add_argument("--url", required=True)
    parser.add_argument("--alt-url")
    parser.add_argument("--captions")
    parser.add_argument("--version", default="draft")
    args = parser.parse_args()

    data = json.loads(ASSIGNMENTS.read_text(encoding="utf-8")) if ASSIGNMENTS.exists() else {"exercises": {}, "education": {}}
    bucket = "exercises" if args.type == "exercise" else "education"
    data.setdefault(bucket, {})[args.id] = {
        "url": args.url,
        "alt_url": args.alt_url,
        "captions_url": args.captions,
        "version": args.version,
        "status": "draft",
    }
    ASSIGNMENTS.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"Updated {bucket}.{args.id} -> {args.url}")


if __name__ == "__main__":
    main()
