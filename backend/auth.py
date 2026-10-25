import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import User

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cyber_pet_vocab_super_secret_key_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7
COOKIE_NAME = "pet_vocab_token"

# 1時間につき -5% エネルギー減衰（12分 = 720秒ごとに -1%）
DECAY_RATE_PER_HOUR = 5


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_DAYS * 24 * 3600,
        samesite="lax",
        secure=False,
        path="/",
    )


def clear_auth_cookie(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")


def get_energy_status_label(energy: int) -> str:
    if energy >= 70:
        return "元気"
    elif energy >= 30:
        return "普通"
    else:
        return "衰弱"


async def apply_energy_decay(user: User, db: AsyncSession) -> int:
    """
    最終アクセス日時 (last_accessed_at) からの経過時間に応じてエネルギーを減衰させ、
    最新の energy と last_accessed_at をDBに永続化する。
    減衰率: 1時間につき -5% (0%未満にはならない)
    """
    now = datetime.now(timezone.utc)
    last_access = user.last_accessed_at
    if last_access is None:
        user.last_accessed_at = now
        await db.commit()
        await db.refresh(user)
        return 0

    if last_access.tzinfo is None:
        last_access = last_access.replace(tzinfo=timezone.utc)

    elapsed_seconds = max(0.0, (now - last_access).total_seconds())
    # 1時間(3600秒)あたり 5% 減衰（720秒 = 12分ごとに 1% 減衰）
    decay = int((elapsed_seconds / 3600.0) * DECAY_RATE_PER_HOUR)

    decayed_amount = 0
    if decay > 0:
        old_energy = user.energy
        user.energy = max(0, user.energy - decay)
        decayed_amount = old_energy - user.energy
        user.last_accessed_at = now
        await db.commit()
        await db.refresh(user)
    elif elapsed_seconds >= 60:
        # 1分以上経過していれば最終アクセス時刻を更新してDBに保存
        user.last_accessed_at = now
        await db.commit()
        await db.refresh(user)

    return decayed_amount


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    HttpOnly Cookie（またはAuthorizationヘッダー）からJWTを検証し、
    現在ログイン中のユーザー(User)を返す。
    未ログインまたは無効なトークンの場合は 401 Unauthorized を送出する。
    """
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ログインが必要です。Cookieに有効な認証トークンが存在しません。",
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="無効な認証トークンです。",
            )
        result = await db.execute(
            select(User).where(User.id == int(user_id_str))
        )
        user = result.scalar_one_or_none()
    except (JWTError, ValueError):
        user = None

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ユーザー情報が見つからないか、セッションの有効期限が切れています。",
        )

    return user
