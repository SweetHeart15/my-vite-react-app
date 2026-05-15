import os
import sqlite3

DATABASE_URL = os.getenv("DATABASE_URL", "")

USE_POSTGRES = DATABASE_URL.startswith("postgresql") or DATABASE_URL.startswith("postgres")

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras


def get_db():
    if USE_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False
        return conn
    else:
        conn = sqlite3.connect("sanctuary.db")
        conn.row_factory = sqlite3.Row
        return conn


def init_db():
    if USE_POSTGRES:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id            SERIAL PRIMARY KEY,
                first_name    TEXT NOT NULL,
                last_name     TEXT NOT NULL,
                email         TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at    TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id            SERIAL PRIMARY KEY,
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

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS savings_goals (
                id             SERIAL PRIMARY KEY,
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
        print("✅ Database initialised with PostgreSQL (Neon)")

    else:
        conn = sqlite3.connect("sanctuary.db")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

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
        print("✅ Database initialised at sanctuary.db")