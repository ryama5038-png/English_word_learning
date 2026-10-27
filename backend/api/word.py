from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import select, or_, desc, case, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from auth import get_current_user
from models.word import User, Word, UserWord
from schemas.word import (
    WordResponse,
    PaginatedWordsResponse,
    StudyPositionUpdate,
    StudyPositionResponse,
    BookmarkToggleRequest,
    CustomWordCreate,
    UserWordUpdate,
)

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
        is_bookmarked=uw.is_bookmarked if uw else False,
        last_searched_at=uw.last_searched_at if uw else None,
        correct_count=uw.correct_count if uw else 0,
        wrong_count=uw.wrong_count if uw else 0,
    )


@router.get("/mybook", response_model=PaginatedWordsResponse)
async def get_paginated_vocab_book(
    mode: str = Query("all", description="all: デフォルト＋登録単語すべて, my_book: マイ単語帳のみ"),
    level: str = Query("all", description="all, basic, advanced, toeic, custom"),
    bookmarked_only: bool = Query(False, description="付箋（ブックマーク）付きの単語のみに絞り込む"),
    q: str = Query("", description="検索キーワード（オプション）"),
    sort_by: str = Query("id", description="id: 単語ID順, spell: アルファベット順"),
    limit: int = Query(30, ge=1, le=200, description="1ページあたりの取得件数"),
    offset: int = Query(0, ge=0, description="取得開始位置（オフセット）"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    単語帳モード（一覧学習）用ページネーション対応API:
    - limit / offset による高速ページング
    - デフォルト全単語 / マイ単語帳 の切り替え
    - 付箋（is_bookmarked）フィルター
    - ユーザーの「前回のしおり位置 (last_studied_word_id, last_studied_offset)」も同時に返却
    """
    base_conditions = [
        or_(Word.is_custom.is_(False), Word.created_by == current_user.id)
    ]

    if level and level != "all":
        base_conditions.append(Word.level == level)

    clean_q = q.strip()
    if clean_q:
        kw = f"%{clean_q}%"
        base_conditions.append(
            or_(
                Word.word_spell.ilike(kw),
                Word.noun_meaning.ilike(kw),
                Word.verb_meaning.ilike(kw),
                Word.adj_meaning.ilike(kw),
                Word.adv_meaning.ilike(kw),
            )
        )

    if mode == "my_book":
        base_conditions.append(UserWord.in_my_book.is_(True))

    if bookmarked_only:
        base_conditions.append(UserWord.is_bookmarked.is_(True))

    # 総件数取得クエリ
    count_stmt = (
        select(func.count(Word.id))
        .outerjoin(
            UserWord,
            (UserWord.word_id == Word.id) & (UserWord.user_id == current_user.id),
        )
        .where(*base_conditions)
    )
    total_res = await db.execute(count_stmt)
    total_count = total_res.scalar() or 0

    # データ取得クエリ
    stmt = (
        select(Word, UserWord)
        .outerjoin(
            UserWord,
            (UserWord.word_id == Word.id) & (UserWord.user_id == current_user.id),
        )
        .where(*base_conditions)
    )

    if sort_by == "spell":
        stmt = stmt.order_by(Word.word_spell.asc(), Word.id.asc())
    else:
        stmt = stmt.order_by(Word.id.asc())

    stmt = stmt.offset(offset).limit(limit)
    res = await db.execute(stmt)
    rows = res.all()

    return PaginatedWordsResponse(
        items=[_to_word_response(w, uw) for w, uw in rows],
        total=total_count,
        limit=limit,
        offset=offset,
        last_studied_word_id=current_user.last_studied_word_id,
        last_studied_offset=current_user.last_studied_offset or 0,
    )


@router.get("/study-position", response_model=StudyPositionResponse)
async def get_study_position(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """前回学習したしおり位置（単語IDおよびオフセット）を取得する"""
    word_spell = None
    if current_user.last_studied_word_id:
        w_res = await db.execute(
            select(Word.word_spell).where(Word.id == current_user.last_studied_word_id)
        )
        word_spell = w_res.scalar_one_or_none()

    return StudyPositionResponse(
        last_studied_word_id=current_user.last_studied_word_id,
        last_studied_offset=current_user.last_studied_offset or 0,
        last_studied_word_spell=word_spell,
    )


@router.put("/study-position", response_model=StudyPositionResponse)
@router.post("/study-position", response_model=StudyPositionResponse)
async def save_study_position(
    payload: StudyPositionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """しおり位置（どこまで学習したかの単語ID・ページオフセット）を保存する"""
    word_spell = None
    if payload.last_studied_word_id is not None:
        w_res = await db.execute(
            select(Word).where(Word.id == payload.last_studied_word_id)
        )
        word = w_res.scalar_one_or_none()
        if not word:
            raise HTTPException(status_code=404, detail="指定された単語が見つかりません。")
        word_spell = word.word_spell
        current_user.last_studied_word_id = word.id
    else:
        current_user.last_studied_word_id = None

    current_user.last_studied_offset = max(0, payload.last_studied_offset)
    current_user.last_accessed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(current_user)

    return StudyPositionResponse(
        last_studied_word_id=current_user.last_studied_word_id,
        last_studied_offset=current_user.last_studied_offset or 0,
        last_studied_word_spell=word_spell,
    )


@router.post("/{word_id}/bookmark", response_model=WordResponse)
@router.patch("/{word_id}/bookmark", response_model=WordResponse)
async def toggle_word_bookmark(
    word_id: int = Path(..., ge=1, description="付箋を切り替える単語ID"),
    payload: Optional[BookmarkToggleRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """特定の単語に対する「付箋（ブックマーク: is_bookmarked）」のON/OFFを切り替える"""
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

    if not uw:
        target_flag = (
            payload.is_bookmarked
            if (payload and payload.is_bookmarked is not None)
            else True
        )
        uw = UserWord(
            user_id=current_user.id,
            word_id=word_id,
            in_my_book=False,
            is_bookmarked=target_flag,
            last_searched_at=None,
            correct_count=0,
            wrong_count=0,
        )
        db.add(uw)
    else:
        if payload and payload.is_bookmarked is not None:
            uw.is_bookmarked = payload.is_bookmarked
        else:
            uw.is_bookmarked = not uw.is_bookmarked

    await db.commit()
    await db.refresh(uw)
    return _to_word_response(word, uw)


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


async def fetch_prioritized_review_words(
    db: AsyncSession,
    current_user: User,
    max_total: int = 20,
) -> List[tuple[Word, Optional[UserWord]]]:
    """
    ペットのつぶやき（復習コメント）用に優先順位付きで単語リスト（最大20件）を取得する。
    - 優先度1（直近のクイズで間違えた単語）: user_words.wrong_count > 0 [最大7件]
    - 優先度2（最近覚えた / しおり付近の単語）: users.last_studied_word_id 周辺の単語、またはマイ単語帳登録単語 [最大7件]
    - 優先度3（クイズで正解した単語）: user_words.correct_count > 0 [残りの件数]
    """
    prioritized_rows: List[tuple[Word, Optional[UserWord]]] = []
    seen_word_ids: set[int] = set()

    def _add_rows(rows):
        for w, uw in rows:
            if w.id not in seen_word_ids and len(prioritized_rows) < max_total:
                seen_word_ids.add(w.id)
                prioritized_rows.append((w, uw))

    # 1. 優先度1: 直近のクイズで間違えた単語 (wrong_count > 0) [最大7件]
    p1_limit = 7
    p1_stmt = (
        select(Word, UserWord)
        .join(UserWord, UserWord.word_id == Word.id)
        .where(
            UserWord.user_id == current_user.id,
            UserWord.wrong_count > 0,
        )
        .order_by(
            desc(UserWord.wrong_count),
            desc(UserWord.last_searched_at),
            desc(UserWord.id),
        )
        .limit(p1_limit)
    )
    p1_res = await db.execute(p1_stmt)
    _add_rows(p1_res.all())

    # 2. 優先度2: 最近覚えた / しおり付近の単語 [最大7件]
    p2_target_count = min(max_total, len(prioritized_rows) + 7)

    # 2-a. しおり位置 (last_studied_word_id) 周辺の単語
    if current_user.last_studied_word_id is not None:
        anchor_id = current_user.last_studied_word_id
        bookmark_stmt = (
            select(Word, UserWord)
            .outerjoin(
                UserWord,
                (UserWord.word_id == Word.id) & (UserWord.user_id == current_user.id),
            )
            .where(
                or_(Word.is_custom.is_(False), Word.created_by == current_user.id),
                Word.id >= max(1, anchor_id - 2),
                Word.id <= anchor_id + 5,
            )
            .order_by(Word.id.asc())
            .limit(5)
        )
        if seen_word_ids:
            bookmark_stmt = bookmark_stmt.where(Word.id.notin_(seen_word_ids))
        bookmark_res = await db.execute(bookmark_stmt)
        for w, uw in bookmark_res.all():
            if w.id not in seen_word_ids and len(prioritized_rows) < p2_target_count:
                seen_word_ids.add(w.id)
                prioritized_rows.append((w, uw))

    # 2-b. マイ単語帳に直近で登録された単語
    p2_remaining = p2_target_count - len(prioritized_rows)
    if p2_remaining > 0:
        mybook_stmt = (
            select(Word, UserWord)
            .join(UserWord, UserWord.word_id == Word.id)
            .where(
                UserWord.user_id == current_user.id,
                or_(
                    UserWord.in_my_book.is_(True),
                    UserWord.is_bookmarked.is_(True),
                ),
            )
            .order_by(
                desc(UserWord.in_my_book),
                desc(UserWord.last_searched_at),
                desc(UserWord.id),
            )
            .limit(p2_remaining)
        )
        if seen_word_ids:
            mybook_stmt = mybook_stmt.where(Word.id.notin_(seen_word_ids))
        mybook_res = await db.execute(mybook_stmt)
        _add_rows(mybook_res.all())

    # 3. 優先度3: クイズで正解した単語 (correct_count > 0) [残りの件数]
    p3_remaining = max_total - len(prioritized_rows)
    if p3_remaining > 0:
        p3_stmt = (
            select(Word, UserWord)
            .join(UserWord, UserWord.word_id == Word.id)
            .where(
                UserWord.user_id == current_user.id,
                UserWord.correct_count > 0,
            )
            .order_by(
                desc(UserWord.last_searched_at),
                desc(UserWord.correct_count),
                desc(UserWord.id),
            )
            .limit(p3_remaining)
        )
        if seen_word_ids:
            p3_stmt = p3_stmt.where(Word.id.notin_(seen_word_ids))
        p3_res = await db.execute(p3_stmt)
        _add_rows(p3_res.all())

    # フォールバック: 学習履歴がまだ存在しない場合は直近検索またはデフォルト単語を取得
    if not prioritized_rows:
        recent_stmt = (
            select(Word, UserWord)
            .join(UserWord, UserWord.word_id == Word.id)
            .where(
                UserWord.user_id == current_user.id,
                UserWord.last_searched_at.isnot(None),
            )
            .order_by(desc(UserWord.last_searched_at))
            .limit(max_total)
        )
        recent_res = await db.execute(recent_stmt)
        _add_rows(recent_res.all())

    if not prioritized_rows:
        fallback_stmt = (
            select(Word)
            .where(Word.is_custom.is_(False))
            .order_by(Word.id.asc())
            .limit(max_total)
        )
        fallback_res = await db.execute(fallback_stmt)
        for w in fallback_res.scalars().all():
            prioritized_rows.append((w, None))

    return prioritized_rows


@router.get("/recent", response_model=List[WordResponse])
async def get_recent_searched_words(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    4. GET /api/words/recent
    ペットのコメント（復習つぶやき）用に、学習効果が高い優先順位
    （1: 間違えた単語 → 2: しおり付近/マイ単語帳の単語 → 3: 正解した単語）
    で結合した単語リスト（最大20件）を返却する。
    """
    rows = await fetch_prioritized_review_words(db, current_user, max_total=20)
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
