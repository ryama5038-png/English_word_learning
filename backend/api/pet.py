import random
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.word import User, Word, UserWord
from schemas import PetActionRequest, PetActionResponse, IdleTalkResponse
from auth import get_current_user, apply_energy_decay, get_energy_status_label

router = APIRouter(prefix="/api/pet", tags=["pet"])


def build_pos_summary(word: Word) -> str:
    parts = []
    if word.noun_meaning:
        parts.append(f"【名】{word.noun_meaning}")
    if word.verb_meaning:
        parts.append(f"【動】{word.verb_meaning}")
    if word.adj_meaning:
        parts.append(f"【形】{word.adj_meaning}")
    if word.adv_meaning:
        parts.append(f"【副】{word.adv_meaning}")
    return " / ".join(parts) if parts else "意味未登録"


@router.get("/idle-talk", response_model=IdleTalkResponse)
async def get_pet_idle_talk(
    exclude_word_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    現在ログイン中のユーザー(current_user.id)が直近で検索した単語（最大20件）から選び、
    エネルギー残量（元気・普通・衰弱）に応じたトーンで復習コメントを生成する。
    """
    await apply_energy_decay(current_user, db)
    energy = current_user.energy
    status_label = get_energy_status_label(energy)

    # 必ず current_user.id の検索履歴のみを取得（他ユーザーのデータと混ざらない）
    stmt = (
        select(Word, UserWord)
        .join(UserWord, UserWord.word_id == Word.id)
        .where(
            UserWord.user_id == current_user.id,
            UserWord.last_searched_at.isnot(None),
        )
        .order_by(desc(UserWord.last_searched_at))
        .limit(20)
    )
    res = await db.execute(stmt)
    rows = res.all()
    words_pool = [r[0] for r in rows]

    # まだ検索履歴がない場合は、マイ単語帳登録語または共通デフォルト単語から取得
    if not words_pool:
        mybook_stmt = (
            select(Word)
            .join(UserWord, UserWord.word_id == Word.id)
            .where(
                UserWord.user_id == current_user.id,
                UserWord.in_my_book.is_(True),
            )
            .limit(20)
        )
        mybook_res = await db.execute(mybook_stmt)
        words_pool = list(mybook_res.scalars().all())

    if not words_pool:
        fallback_stmt = select(Word).where(Word.is_custom.is_(False)).limit(20)
        fallback_res = await db.execute(fallback_stmt)
        words_pool = list(fallback_res.scalars().all())

    if exclude_word_id and len(words_pool) > 1:
        filtered = [w for w in words_pool if w.id != exclude_word_id]
        if filtered:
            words_pool = filtered

    if not words_pool:
        return IdleTalkResponse(
            speech="システム安定中。辞書から単語を検索してマイ単語帳を増やそう！⚡",
            energy=energy,
            energy_status=status_label,
        )

    target_word = random.choice(words_pool)
    pos_summary = build_pos_summary(target_word)

    if energy >= 70:
        templates = [
            f"「{target_word.word_spell}」は {pos_summary} って意味だよ！⚡ バッチリ覚えちゃおう♪",
            f"復習タイム！✨「{target_word.word_spell}」＝ {pos_summary} だよ！エネルギー満タンで絶好調！",
            f"ねぇ {current_user.username}！「{target_word.word_spell}」の意味、覚えてる？ {pos_summary} だよ♪",
            f"「{target_word.word_spell}」({pos_summary})！品詞の違いにも気をつけてね⚡",
        ]
    elif energy >= 30:
        templates = [
            f"「{target_word.word_spell}」は {pos_summary} って意味だよ💭 そろそろ少しお腹が空いてきたかも…",
            f"復習メモ：「{target_word.word_spell}」＝ {pos_summary} だよ。テストでポイントを稼いでチャージしてね。",
            f"「{target_word.word_spell}」の意味は {pos_summary} … もう少しエネルギーがあると嬉しいな⚡",
        ]
    else:
        templates = [
            f"うぅ…エネルギー切れそう…💦「{target_word.word_spell}」は {pos_summary} …はやくCHARGEしてぇ…",
            f"⚠️ バッテリー低下中…「{target_word.word_spell}」＝ {pos_summary} …力が…出ないよ…",
            f"システム衰弱中…💦「{target_word.word_spell}」({pos_summary})…テストを解いて助けて…",
        ]

    return IdleTalkResponse(
        speech=random.choice(templates),
        energy=energy,
        energy_status=status_label,
        word_id=target_word.id,
        word_spell=target_word.word_spell,
    )


@router.post("/action", response_model=PetActionResponse)
async def pet_action(
    payload: PetActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    給餌（CHARGE）やあそぶ（OPTIMIZE）を実行した際、
    users テーブルの points, energy, last_accessed_at を更新し、DBに永続化する。
    """
    # まず操作前の経過時間減衰を反映
    await apply_energy_decay(current_user, db)

    action = payload.action_type
    now = datetime.now(timezone.utc)

    if action == "charge":
        if current_user.points < 20:
            raise HTTPException(
                status_code=400,
                detail="ポイント(CR)が足りません！単語テストを解いて獲得しましょう（必要: 20 CR）",
            )
        current_user.points -= 20
        current_user.energy = min(100, current_user.energy + 10)
        current_user.last_accessed_at = now
        speech = f"エネルギー充填完了 (+10%)！現在 {current_user.energy}% だよ、ありがとう！⚡"

    elif action == "optimize":
        if current_user.points < 15:
            raise HTTPException(
                status_code=400,
                detail="ポイント(CR)が足りません！単語テストを解いて獲得しましょう（必要: 15 CR）",
            )
        current_user.points -= 15
        current_user.energy = min(100, current_user.energy + 5)
        current_user.last_accessed_at = now
        speech = f"システム最適化完了 (+5%)！現在 {current_user.energy}% で動作サクサクだよ♪✨"

    elif action == "set_energy":
        target = payload.target_energy if payload.target_energy is not None else 50
        current_user.energy = max(0, min(100, target))
        current_user.last_accessed_at = now
        status_label = get_energy_status_label(current_user.energy)
        speech = f"エネルギー状態を「{status_label} ({current_user.energy}%)」に更新してDBに保存したよ！"

    else:
        raise HTTPException(status_code=400, detail="無効なアクションです。")

    await db.commit()
    await db.refresh(current_user)

    return PetActionResponse(
        points=current_user.points,
        energy=current_user.energy,
        energy_status=get_energy_status_label(current_user.energy),
        speech=speech,
    )
