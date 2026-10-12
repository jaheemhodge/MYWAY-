from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from typing import Any

from .config import DB_PATH


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                first_name TEXT,
                answers_json TEXT NOT NULL,
                outcome TEXT NOT NULL,
                created_at TEXT NOT NULL,
                demo INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS checkins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_id TEXT NOT NULL,
                day INTEGER NOT NULL,
                session_id TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                action TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS completions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile_id TEXT NOT NULL,
                day INTEGER NOT NULL,
                session_id TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )


def save_profile(profile_id: str, first_name: str | None, answers: dict[str, Any], outcome: str, demo: bool) -> None:
    init_db()
    with connect() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO profiles (id, first_name, answers_json, outcome, created_at, demo)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                profile_id,
                first_name,
                json.dumps(answers),
                outcome,
                datetime.now(timezone.utc).isoformat(),
                1 if demo else 0,
            ),
        )


def get_profile(profile_id: str) -> dict[str, Any] | None:
    init_db()
    with connect() as conn:
        row = conn.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,)).fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "first_name": row["first_name"],
            "answers": json.loads(row["answers_json"]),
            "outcome": row["outcome"],
            "created_at": row["created_at"],
            "demo": bool(row["demo"]),
        }


def save_checkin(profile_id: str, day: int, session_id: str, payload: dict[str, Any], action: str) -> None:
    init_db()
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO checkins (profile_id, day, session_id, payload_json, action, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                profile_id,
                day,
                session_id,
                json.dumps(payload),
                action,
                datetime.now(timezone.utc).isoformat(),
            ),
        )


def save_completion(profile_id: str, day: int, session_id: str) -> None:
    init_db()
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO completions (profile_id, day, session_id, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (profile_id, day, session_id, datetime.now(timezone.utc).isoformat()),
        )


def progress_for(profile_id: str) -> dict[str, Any]:
    init_db()
    with connect() as conn:
        completions = [
            dict(row)
            for row in conn.execute(
                "SELECT day, session_id, created_at FROM completions WHERE profile_id = ? ORDER BY day",
                (profile_id,),
            ).fetchall()
        ]
        checkins = [
            {
                "day": row["day"],
                "session_id": row["session_id"],
                "action": row["action"],
                "payload": json.loads(row["payload_json"]),
                "created_at": row["created_at"],
            }
            for row in conn.execute(
                "SELECT day, session_id, action, payload_json, created_at FROM checkins WHERE profile_id = ? ORDER BY id",
                (profile_id,),
            ).fetchall()
        ]
    return {"completions": completions, "checkins": checkins}
