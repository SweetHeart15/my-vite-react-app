import hashlib
import secrets
import os
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from psycopg2.extras import RealDictCursor

# Database imports
try:
    from backend.database import get_db, init_db
except ModuleNotFoundError:
    from database import get_db, init_db

# ── Lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Sanctuary API", version="1.0.0", lifespan=lifespan)

# ── CORS ───────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv("CLIENT_ORIGIN", "https://my-vite-react-app-xi.vercel.app")
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

@app.post("/register")
def register(data: RegisterRequest):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM users WHERE email = %s", (data.email.lower(),))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_pw = hash_password(data.password)
        cur.execute(
            "INSERT INTO users (first_name, last_name, email, password_hash) VALUES (%s, %s, %s, %s)",
            (data.first_name.strip(), data.last_name.strip(), data.email.lower(), hashed_pw)
        )
        conn.commit()
        return {"message": "User created successfully"}
    finally:
        cur.close()
        conn.close()

@app.post("/login")
def login(data: LoginRequest):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM users WHERE email = %s", (data.email.lower(),))
        row = cur.fetchone()
    finally:
        cur.close()
        conn.close()

    if not row or not verify_password(data.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {
        "id": row["id"],
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "email": row["email"],
    }

@app.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT id FROM users WHERE email = %s AND id != %s", (data.email.lower(), user_id))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Email already in use.")

        if data.password:
            password_hash = hash_password(data.password)
            cur.execute(
                "UPDATE users SET first_name=%s, last_name=%s, email=%s, password_hash=%s WHERE id=%s",
                (data.first_name.strip(), data.last_name.strip(), data.email.lower(), password_hash, user_id)
            )
        else:
            cur.execute(
                "UPDATE users SET first_name=%s, last_name=%s, email=%s WHERE id=%s",
                (data.first_name.strip(), data.last_name.strip(), data.email.lower(), user_id)
            )
        conn.commit()
        
        cur.execute("SELECT id, first_name, last_name, email FROM users WHERE id=%s", (user_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found.")
        return row
    finally:
        cur.close()
        conn.close()

# ════════════════════════════════════════════════════════════════════════════════
# TRANSACTIONS
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/transactions", response_model=list[TransactionOut])
def get_transactions(user_id: int):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM transactions WHERE user_id = %s ORDER BY id DESC", (user_id,))
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()

@app.post("/transactions", response_model=TransactionOut, status_code=201)
def create_transaction(tx: TransactionCreate):
    now = datetime.now()
    date_str = tx.date or now.strftime("%b %d")
    time_str = now.strftime("%I:%M %p")
    status = "Pending" if tx.amount > 0 else "Cleared"

    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            """INSERT INTO transactions (user_id, merchant_name, amount, date, time, category, status) 
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (tx.user_id, tx.merchant_name, tx.amount, date_str, time_str, tx.category, status),
        )
        row = cur.fetchone()
        conn.commit()
        return row
    finally:
        cur.close()
        conn.close()

@app.delete("/transactions/{tx_id}", status_code=204)
def delete_transaction(tx_id: int):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM transactions WHERE id = %s", (tx_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        conn.commit()
    finally:
        cur.close()
        conn.close()

# ════════════════════════════════════════════════════════════════════════════════
# SAVINGS GOALS
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/goals", response_model=list[GoalOut])
def get_goals(user_id: int):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM savings_goals WHERE user_id = %s ORDER BY id", (user_id,))
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()

@app.post("/goals", response_model=GoalOut, status_code=201)
def create_goal(goal: GoalCreate):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            """INSERT INTO savings_goals (user_id, name, type, current_amount, goal_amount, due_date, color, image) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (goal.user_id, goal.name, goal.type, goal.current_amount,
             goal.goal_amount, goal.due_date, goal.color, goal.image),
        )
        row = cur.fetchone()
        conn.commit()
        return row
    finally:
        cur.close()
        conn.close()

@app.patch("/goals/{goal_id}", response_model=GoalOut)
def update_goal_amount(goal_id: int, update: GoalUpdate):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            "UPDATE savings_goals SET current_amount = %s WHERE id = %s RETURNING *",
            (update.current_amount, goal_id),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Goal not found")
        conn.commit()
        return row
    finally:
        cur.close()
        conn.close()

@app.delete("/goals/{goal_id}", status_code=204)
def delete_goal(goal_id: int):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM savings_goals WHERE id = %s", (goal_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Goal not found")
        conn.commit()
    finally:
        cur.close()
        conn.close()

# ════════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/summary")
def get_summary(user_id: int):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT COALESCE(SUM(amount), 0) as val FROM transactions WHERE user_id = %s AND amount > 0", (user_id,))
        income = cur.fetchone()['val']
        
        cur.execute("SELECT COALESCE(SUM(ABS(amount)), 0) as val FROM transactions WHERE user_id = %s AND amount < 0", (user_id,))
        expenses = cur.fetchone()['val']
        
        cur.execute("SELECT COALESCE(SUM(current_amount), 0) as val FROM savings_goals WHERE user_id = %s", (user_id,))
        savings = cur.fetchone()['val']
        
        cur.execute("SELECT COALESCE(SUM(goal_amount), 1) as val FROM savings_goals WHERE user_id = %s", (user_id,))
        goal = cur.fetchone()['val'] or 1

        balance = income - expenses
        savings_pct = round((savings / goal) * 100) if goal else 0

        return {
            "balance": round(float(balance), 2),
            "monthly_income": round(float(income), 2),
            "monthly_expenses": round(float(expenses), 2),
            "total_savings": round(float(savings), 2),
            "savings_progress_pct": savings_pct,
        }
    finally:
        cur.close()
        conn.close()