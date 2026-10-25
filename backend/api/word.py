from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import select, or_, desc, case
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from auth import get_current_user
from models.word import User, Word, UserWord
from schemas.word import WordResponse, CustomWordCreate, UserWordUpdate

router = APIRouter(prefix="/api/words", tags=["words"])


def _to_word_response(word: Word, uw: Optional[UserWord]) -> WordResponse:
    return WordResponse(
        id=word.id,
        word_spell=word.word_spell,
        level=word.level,
        noun_meaning=word.noun_meaning,
        verb_meaning=word.verb_meaning,
        adj_meaning=word.adj_meaning,
        adv_meaning=word.adv_meaning,
        is_custom=word.is_custom,
        created_by=word.created_by,
        in_my_book=uw.in_my_book if uw else False,
        last_searched_at=uw.last_searched_at if uw else None,
        correct_count=uw.correct_count if uw else 0,
        wrong_count=uw.wrong_count if uw else 0,
    )


@router.get("/search", response_model=List[WordResponse])
async def search_words_by_spell(
    word_spell: str = Query(..., min_length=1, description="検索する英単語のスペルまたは日本語意味"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    1. GET /api/words/search
    word_spell をクエリパラメータで受け取り、単語を検索する。
    検索と同時に上位ヒット単語の user_words.last_searched_at を現在時刻で更新（または新規作成）する。
    """
    q = word_spell.strip()
    kw = f"%{q}%"
    rank_order = case(
        (Word.word_spell.ilike(q), 0),
        (Word.word_spell.ilike(f"{q}%"), 1),
        else_=2,
    )

    stmt = (
        select(Word, UserWord)
        .outerjoin(
            UserWord,
            (UserWord.word_id == Word.id) & (UserWord.user_id == current_user.id),
        )
        .where(
            or_(
                Word.word_spell.ilike(kw),
                Word.noun_meaning.ilike(kw),
                Word.verb_meaning.ilike(kw),
                Word.adj_meaning.ilike(kw),
                Word.adv_meaning.ilike(kw),
            )
        )
        .order_by(rank_order, Word.word_spell.asc())
        .limit(50)
    )

    res = await db.execute(stmt)
    rows = res.all()

    if rows:
        now = datetime.now(timezone.utc)
        for word_obj, uw_obj in rows[:3]:
            if uw_obj is None:
                uw_obj = UserWord(
                    user_id=current_user.id,
                    word_id=word_obj.id,
                    in_my_book=False,
                    last_searched_at=now,
                    correct_count=0,
                    wrong_count=0,
                )
                db.add(uw_obj)
            else:
                uw_obj.last_searched_at = now
        await db.commit()
        res = await db.execute(stmt)
        rows = res.all()

    return [_to_word_response(w, uw) for w, uw in rows]


@router.get("/recent", response_model=List[WordResponse])
async def get_recent_searched_words(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    4. GET /api/words/recent
    ペットのコメント用に、現在ログイン中のユーザーが直近で検索した単語
    （user_words.last_searched_at 降順）を最大20件取得する。
    """
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
    return [_to_word_response(w, uw) for w, uw in rows]


@router.post("/{word_id}/mybook", response_model=WordResponse)
async def register_word_to_mybook(
    word_id: int = Path(..., ge=1, description="マイ単語帳に登録する単語ID"),
    update_data: Optional[UserWordUpdate] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    3. POST /api/words/{word_id}/mybook
    既存の単語をマイ単語帳に登録（またはトグル更新）する。
    """
    word_res = await db.execute(select(Word).where(Word.id == word_id))
    word = word_res.scalar_one_or_none()
    if not word:
        raise HTTPException(status_code=404, detail="単語が見つかりません。")

    uw_res = await db.execute(
        select(UserWord).where(
            UserWord.user_id == current_user.id,
            UserWord.word_id == word_id,
        )
    )
    uw = uw_res.scalar_one_or_none()
    now = datetime.now(timezone.utc)

    if not uw:
        target_flag = update_data.in_my_book if (update_data and update_data.in_my_book is not None) else True
        uw = UserWord(
            user_id=current_user.id,
            word_id=word_id,
            in_my_book=target_flag,
            last_searched_at=now,
            correct_count=0,
            wrong_count=0,
        )
        db.add(uw)
    else:
        if update_data and update_data.in_my_book is not None:
            uw.in_my_book = update_data.in_my_book
        else:
            uw.in_my_book = not uw.in_my_book
        if uw.in_my_book and not uw.last_searched_at:
            uw.last_searched_at = now

    await db.commit()
    await db.refresh(uw)
    return _to_word_response(word, uw)
