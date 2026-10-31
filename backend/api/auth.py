from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.word import User
from schemas import UserCreate, CharacterSelectRequest, UserLogin, UserResponse
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    set_auth_cookie,
    clear_auth_cookie,
    get_current_user,
    apply_energy_decay,
    get_energy_status_label,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
VALID_CHARACTERS = {"jellyfish", "whaleshark", "mendako", "sea_slug", "kurage", "jinbei"}
CHARACTER_TYPE_ALIASES = {
    "kurage": "jellyfish",
    "jinbei": "whaleshark",
}


def normalize_character_type(char_type: str | None) -> str | None:
    if not char_type:
        return None
    normalized = CHARACTER_TYPE_ALIASES.get(char_type, char_type)
    return normalized if normalized in {"jellyfish", "whaleshark", "mendako", "sea_slug"} else None


@router.post("/register", response_model=UserResponse)
async def register(
    payload: UserCreate,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    username = payload.username.strip()
    existing = await db.execute(select(User).where(User.username == username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="このユーザー名は既に使用されています。")

    if payload.character_type is not None and payload.character_type not in VALID_CHARACTERS:
        raise HTTPException(
            status_code=400,
            detail="無効なキャラクターです。クラゲ(jellyfish)、ジンベイザメ(whaleshark)、メンダコ(mendako)、アオウミウシ(sea_slug)から選択してください。",
        )

    char_type = normalize_character_type(payload.character_type)

    new_user = User(
        username=username,
        hashed_password=get_password_hash(payload.password),
        character_type=char_type,
        points=230,
        energy=95,
        last_accessed_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id)})
    set_auth_cookie(response, token)

    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        character_type=new_user.character_type,
        points=new_user.points,
        energy=new_user.energy,
        last_accessed_at=new_user.last_accessed_at,
        energy_status=get_energy_status_label(new_user.energy),
        decayed_amount=0,
    )


@router.post("/character", response_model=UserResponse)
@router.put("/character", response_model=UserResponse)
async def select_character(
    payload: CharacterSelectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.character_type not in VALID_CHARACTERS:
        raise HTTPException(
            status_code=400,
            detail="無効なキャラクターです。クラゲ(jellyfish)、ジンベイザメ(whaleshark)、メンダコ(mendako)、アオウミウシ(sea_slug)から選択してください。",
        )

    current_user.character_type = normalize_character_type(payload.character_type)
    current_user.last_accessed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        character_type=current_user.character_type,
        points=current_user.points,
        energy=current_user.energy,
        last_accessed_at=current_user.last_accessed_at,
        energy_status=get_energy_status_label(current_user.energy),
        decayed_amount=0,
    )


@router.post("/login", response_model=UserResponse)
async def login(
    payload: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.username == payload.username.strip())
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=401, detail="ユーザー名またはパスワードが正しくありません。"
        )

    # ログイン時に最終アクセス時刻からの放置時間を計算し、減衰後のエネルギーをDBに保存
    decayed = await apply_energy_decay(user, db)
    token = create_access_token({"sub": str(user.id)})
    set_auth_cookie(response, token)

    return UserResponse(
        id=user.id,
        username=user.username,
        character_type=user.character_type,
        points=user.points,
        energy=user.energy,
        last_accessed_at=user.last_accessed_at,
        energy_status=get_energy_status_label(user.energy),
        decayed_amount=decayed,
    )


@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "ログアウトしました"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    フロントエンドの初回マウント・リロード時に呼び出されるエンドポイント。
    1. DBから現在の energy と last_accessed_at を取得
    2. 経過時間（1時間につき -5%）に応じて energy を減算（下限 0%）
    3. 減算後の最新 energy と現在時刻の last_accessed_at をDBに永続化
    4. 最新のユーザーステータスを返却
    """
    decayed = await apply_energy_decay(current_user, db)
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        character_type=current_user.character_type,
        points=current_user.points,
        energy=current_user.energy,
        last_accessed_at=current_user.last_accessed_at,
        energy_status=get_energy_status_label(current_user.energy),
        decayed_amount=decayed,
    )
