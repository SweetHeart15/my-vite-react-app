import email
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from contextlib import asynccontextmanager
import hashlib
import secrets
import os

# Works both locally (python -m uvicorn main:app) and on Vercel (api/index.py)
try:
    from backend.database import get_db, init_db   # when run as a package
except ModuleNotFoundError:
    from database import get_db, init_db            # when run from project root


# ── Lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Sanctuary API", version="1.0.0", lifespan=lifespan)


# ── CORS ───────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv("CLIENT_ORIGIN", "https://my-vite-react-app-xi.vercel.app,https://my-vite-react-app-c6e7.onrender.com")
origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Password helpers ───────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{hashed}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, hashed = stored_hash.split(":", 1)
        return hashlib.sha256((salt + password).encode()).hexdigest() == hashed
    except Exception:
        return False


# ── Pydantic models ────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str

class RegisterOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    created_at: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: Optional[str] = None

class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str

class TransactionCreate(BaseModel):
    user_id: int
    merchant_name: str
    amount: float
    date: Optional[str] = None
    category: str

class TransactionOut(BaseModel):
    id: int
    user_id: int
    merchant_name: str
    amount: float
    date: str
    time: str
    category: str
    status: str

class GoalCreate(BaseModel):
    user_id: int
    name: str
    type: str
    current_amount: float = 0
    goal_amount: float
    due_date: str
    color: Optional[str] = "#e8d5c4"
    image: Optional[str] = "🎯"

class GoalUpdate(BaseModel):
    current_amount: float

class GoalOut(BaseModel):
    id: int
    user_id: int
    name: str
    type: str
    current_amount: float
    goal_amount: float
    due_date: str
    color: str
    image: str


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Sanctuary API is running 🌿"}


# ════════════════════════════════════════════════════════════════════════════════
# AUTH
# ════════════════════════════════════════════════════════════════════════════════

@app.post("/register", response_model=RegisterOut, status_code=201)
def register(data: RegisterRequest):
    if not data.first_name.strip():
        raise HTTPException(status_code=422, detail="First name is required.")
    if not data.last_name.strip():
        raise HTTPException(status_code=422, detail="Last name is required.")
    if len(data.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters.")

    conn = get_db()
    existing = conn.execute(
        "SELECT id FROM users WHERE email = ?", (data.email.lower(),)
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    password_hash = hash_password(data.password)
    cursor = conn.execute(
        "INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)",
        (data.first_name.strip(), data.last_name.strip(), data.email.lower(), password_hash),
    )
    conn.commit()
    row = conn.execute(
        "SELECT id, first_name, last_name, email, created_at FROM users WHERE id = ?",
        (cursor.lastrowid,)
    ).fetchone()
    conn.close()
    return dict(row)


@app.post("/login")
def login(data: LoginRequest):
    conn = get_db()
    from psycopg2.extras import RealDictCursor
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cur.execute("SELECT * FROM users WHERE email = %s", (data.email,))
        row = cur.fetchone()
    finally:
        cur.close()
        conn.close() # Always close the connection too!

    if not row or not verify_password(data.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {
        "id":         row["id"],
        "first_name": row["first_name"],
        "last_name":  row["last_name"],
        "email":      row["email"],
    }


@app.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate):
    conn = get_db()
    existing = conn.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        (data.email.lower(), user_id)
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="Email already in use by another account.")

    if data.password:
        password_hash = hash_password(data.password)
        conn.execute(
            "UPDATE users SET first_name=?, last_name=?, email=?, password_hash=? WHERE id=?",
            (data.first_name.strip(), data.last_name.strip(), data.email.lower(), password_hash, user_id)
        )
    else:
        conn.execute(
            "UPDATE users SET first_name=?, last_name=?, email=? WHERE id=?",
            (data.first_name.strip(), data.last_name.strip(), data.email.lower(), user_id)
        )

    conn.commit()
    row = conn.execute(
        "SELECT id, first_name, last_name, email FROM users WHERE id=?", (user_id,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found.")
    return dict(row)


# ════════════════════════════════════════════════════════════════════════════════
# TRANSACTIONS  (scoped per user)
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/transactions", response_model=list[TransactionOut])
def get_transactions(user_id: int):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC", (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/transactions", response_model=TransactionOut, status_code=201)
def create_transaction(tx: TransactionCreate):
    now = datetime.now()
    date_str = tx.date or now.strftime("%b %d")
    time_str = now.strftime("%I:%M %p")
    status = "Pending" if tx.amount > 0 else "Cleared"

    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO transactions (user_id, merchant_name, amount, date, time, category, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (tx.user_id, tx.merchant_name, tx.amount, date_str, time_str, tx.category, status),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM transactions WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return dict(row)


@app.delete("/transactions/{tx_id}", status_code=204)
def delete_transaction(tx_id: int):
    conn = get_db()
    result = conn.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")


# ════════════════════════════════════════════════════════════════════════════════
# SAVINGS GOALS  (scoped per user)
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/goals", response_model=list[GoalOut])
def get_goals(user_id: int):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM savings_goals WHERE user_id = ? ORDER BY id", (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/goals", response_model=GoalOut, status_code=201)
def create_goal(goal: GoalCreate):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO savings_goals (user_id, name, type, current_amount, goal_amount, due_date, color, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (goal.user_id, goal.name, goal.type, goal.current_amount,
         goal.goal_amount, goal.due_date, goal.color, goal.image),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM savings_goals WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return dict(row)


@app.patch("/goals/{goal_id}", response_model=GoalOut)
def update_goal_amount(goal_id: int, update: GoalUpdate):
    conn = get_db()
    result = conn.execute(
        "UPDATE savings_goals SET current_amount = ? WHERE id = ?",
        (update.current_amount, goal_id),
    )
    conn.commit()
    if result.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Goal not found")
    row = conn.execute("SELECT * FROM savings_goals WHERE id = ?", (goal_id,)).fetchone()
    conn.close()
    return dict(row)


@app.delete("/goals/{goal_id}", status_code=204)
def delete_goal(goal_id: int):
    conn = get_db()
    result = conn.execute("DELETE FROM savings_goals WHERE id = ?", (goal_id,))
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Goal not found")


# ════════════════════════════════════════════════════════════════════════════════
# SUMMARY  (scoped per user)
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/summary")
def get_summary(user_id: int):
    conn = get_db()
    total_income = conn.execute(
        "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ? AND amount > 0", (user_id,)
    ).fetchone()
    total_expenses = conn.execute(
        "SELECT COALESCE(SUM(ABS(amount)), 0) FROM transactions WHERE user_id = ? AND amount < 0", (user_id,)
    ).fetchone()
    total_savings = conn.execute(
        "SELECT COALESCE(SUM(current_amount), 0) FROM savings_goals WHERE user_id = ?", (user_id,)
    ).fetchone()
    total_goal = conn.execute(
        "SELECT COALESCE(SUM(goal_amount), 1) FROM savings_goals WHERE user_id = ?", (user_id,)
    ).fetchone()
    conn.close()

    # Aggregate queries return a single-key dict from RealDictCursor;
    # grab the first (and only) value regardless of the column alias.
    def first_val(row):
        if isinstance(row, dict):
            return list(row.values())[0]
        return row[0]  # sqlite3 fallback

    income   = first_val(total_income)   or 0
    expenses = first_val(total_expenses) or 0
    savings  = first_val(total_savings)  or 0
    goal     = first_val(total_goal)     or 1

    balance      = income - expenses
    savings_pct  = round((savings / goal) * 100) if goal else 0

    return {
        "balance":              round(balance, 2),
        "monthly_income":       round(income, 2),
        "monthly_expenses":     round(expenses, 2),
        "total_savings":        round(savings, 2),
        "savings_progress_pct": savings_pct,
    }