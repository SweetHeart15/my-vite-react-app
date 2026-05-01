import sqlite3

DB_PATH = "sanctuary.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables. No shared seed data — each user starts fresh."""
    conn = get_db()
    cursor = conn.cursor()

    # ── Users ──────────────────────────────────────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name    TEXT NOT NULL,
            last_name     TEXT NOT NULL,
            email         TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at    TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ── Transactions (user-scoped) ─────────────────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id       INTEGER NOT NULL,
            merchant_name TEXT NOT NULL,
            amount        REAL NOT NULL,
            date          TEXT NOT NULL,
            time          TEXT NOT NULL,
            category      TEXT NOT NULL,
            status        TEXT NOT NULL DEFAULT 'Pending',
            created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # ── Savings Goals (user-scoped) ────────────────────────────────────────────
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS savings_goals (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id        INTEGER NOT NULL,
            name           TEXT NOT NULL,
            type           TEXT NOT NULL,
            current_amount REAL NOT NULL DEFAULT 0,
            goal_amount    REAL NOT NULL,
            due_date       TEXT NOT NULL,
            color          TEXT DEFAULT '#e8d5c4',
            image          TEXT DEFAULT '🎯',
            created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    conn.commit()
    conn.close()
    print("✅ Database initialised at", DB_PATH)