import secrets

from fastapi import APIRouter, Depends, HTTPException

from ..database import db
from ..database.seed import verify_password
from ..schemas import LoginRequest, LoginResponse
from .deps import current_user, require_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

DEMO_ACCOUNTS = [
    {"email": "alex@polarsync.in", "password": "polar123", "role": "contributor", "name": "Alex Johnson"},
    {"email": "admin@polarsync.in", "password": "admin123", "role": "admin", "name": "Dr. Kavya Iyer"},
]


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    user = db.fetch_one("SELECT * FROM users WHERE lower(email) = lower(?)", [body.email.strip()])
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = secrets.token_urlsafe(24)
    db.insert("sessions", {"token": token, "user_id": user["id"], "created_at": db.now_iso()})
    return {"token": token, "user": {k: user[k] for k in ("id", "name", "email", "role", "organization", "title")}}


@router.get("/me")
def me(user=Depends(require_user)):
    return user


@router.post("/logout")
def logout(user=Depends(current_user)):
    if user:
        db.execute("DELETE FROM sessions WHERE user_id = ?", [user["id"]])
    return {"ok": True}


@router.get("/demo-accounts")
def demo_accounts():
    return DEMO_ACCOUNTS
