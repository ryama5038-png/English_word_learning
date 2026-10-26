import random
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc, func, case, text

from database import engine, Base, AsyncSessionLocal, get_db
from models import User, Word, UserWord
from schemas import (
    UserCreate,
    CharacterSelectRequest,
    UserLogin,
    UserResponse,
    WordCreateCustom,
    WordOut,
    PetActionRequest,
    PetActionResponse,
    IdleTalkResponse,
    QuizGenerateRequest,
    QuizQuestion,
    QuizSubmitRequest,
    QuizSubmitResponse,
)
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
from seed_words import seed_initial_data
from api.word import router as word_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS character_type VARCHAR(30);")
        )
        await conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_studied_word_id INTEGER REFERENCES words(id) ON DELETE SET NULL;")
        )
        await conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_studied_offset INTEGER NOT NULL DEFAULT 0;")
        )
        await conn.execute(
            text("ALTER TABLE user_words ADD COLUMN IF NOT EXISTS is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE;")
        )
    async with AsyncSessionLocal() as db:
        await seed_initial_data(db)
    yield


app = FastAPI(
    title="Pet-Vocab-App API",
    description="ゲーミフィケーション型・個別最適化 英単語学習アプリ バックエンドAPI",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https://.*\.cloudshell\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def format_word_out(word: Word, uw: Optional[UserWord]) -> WordOut:
    return WordOut(
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


# ==========================================
# 1. 認証・ユーザー情報 API (/api/auth)
# ==========================================
VALID_CHARACTERS = {"kurage", "jinbei", "slime"}


@app.post("/api/auth/register", response_model=UserResponse)
async def register(
    payload: UserCreate,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    username = payload.username.strip()
    existing = await db.execute(select(User).where(User.username == username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="このユーザー名は既に使用されています。")

    char_type = (
        payload.character_type
        if payload.character_type in VALID_CHARACTERS
        else None
    )

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
        last_studied_word_id=new_user.last_studied_word_id,
        last_studied_offset=new_user.last_studied_offset or 0,
    )


@app.post("/api/auth/character", response_model=UserResponse)
@app.put("/api/auth/character", response_model=UserResponse)
async def select_character(
    payload: CharacterSelectRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.character_type not in VALID_CHARACTERS:
        raise HTTPException(
            status_code=400,
            detail="無効なキャラクターです。クラゲ(kurage)、ジンベイザメ(jinbei)、スライム(slime)から選択してください。",
        )

    current_user.character_type = payload.character_type
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
        last_studied_word_id=current_user.last_studied_word_id,
        last_studied_offset=current_user.last_studied_offset or 0,
    )


@app.post("/api/auth/login", response_model=UserResponse)
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
        last_studied_word_id=user.last_studied_word_id,
        last_studied_offset=user.last_studied_offset or 0,
    )


@app.post("/api/auth/logout")
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"message": "ログアウトしました"}


@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
        last_studied_word_id=current_user.last_studied_word_id,
        last_studied_offset=current_user.last_studied_offset or 0,
    )


# ==========================================
# 2. サイバーペット育成＆無意識復習 API (/api/pet)
# ==========================================
@app.get("/api/pet/idle-talk", response_model=IdleTalkResponse)
async def get_pet_idle_talk(
    exclude_word_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    直近で検索した単語（最大20件）からランダムに選び、
    ペットの現在のエネルギー残量（元気・普通・衰弱）に応じた口調で呟く
    """
    await apply_energy_decay(current_user, db)
    energy = current_user.energy
    status_label = get_energy_status_label(energy)

    # 直近検索した単語 最大20件を取得
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

    # まだ検索履歴がない場合はマイ単語帳または全体の単語から取得
    if not words_pool:
        fallback_stmt = select(Word).limit(20)
        fallback_res = await db.execute(fallback_stmt)
        words_pool = list(fallback_res.scalars().all())

    if exclude_word_id and len(words_pool) > 1:
        filtered = [w for w in words_pool if w.id != exclude_word_id]
        if filtered:
            words_pool = filtered

    if not words_pool:
        return IdleTalkResponse(
            speech="システム安定中。単語を検索してマイ単語帳を増やそう！⚡",
            energy=energy,
            energy_status=status_label,
        )

    target_word = random.choice(words_pool)
    pos_summary = build_pos_summary(target_word)

    # エネルギー状態（元気 / 普通 / 衰弱）によって口調を変化させる
    if energy >= 70:
        templates = [
            f"「{target_word.word_spell}」は {pos_summary} って意味だよ！⚡ バッチリ覚えちゃおう♪",
            f"復習タイム！✨「{target_word.word_spell}」＝ {pos_summary} だよ！エネルギー満タンで絶好調！",
            f"ねぇマスター！「{target_word.word_spell}」の意味、覚えてる？ {pos_summary} だよ♪",
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
            f"システム衰弱中…💦「{target_word.word_spell}」({pos_summary})…テストを解いて助けてマスター…",
        ]

    return IdleTalkResponse(
        speech=random.choice(templates),
        energy=energy,
        energy_status=status_label,
        word_id=target_word.id,
        word_spell=target_word.word_spell,
    )


@app.post("/api/pet/action", response_model=PetActionResponse)
async def pet_action(
    payload: PetActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
        speech = f"システム最適化完了 (+5%)！動作サクサクで嬉しいな♪✨"

    elif action == "set_energy":
        # デモ・検証用：放置減衰による状態変化（元気・普通・衰弱）を即座に確認できる機能
        target = payload.target_energy if payload.target_energy is not None else 50
        current_user.energy = max(0, min(100, target))
        current_user.last_accessed_at = now
        status_label = get_energy_status_label(current_user.energy)
        speech = f"エネルギー状態を「{status_label} ({current_user.energy}%)」にシミュレート変更したよ！"

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


# ==========================================
# 3. 単語検索・カスタム登録・マイ単語帳 API (/api/words)
# ==========================================
app.include_router(word_router)


@app.get("/api/words/stats")
async def get_words_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    total_res = await db.execute(
        select(func.count(Word.id)).where(
            or_(Word.is_custom.is_(False), Word.created_by == current_user.id)
        )
    )
    total_words = total_res.scalar() or 0

    my_book_res = await db.execute(
        select(func.count(UserWord.id)).where(
            UserWord.user_id == current_user.id,
            UserWord.in_my_book.is_(True),
        )
    )
    my_book_count = my_book_res.scalar() or 0

    bookmarked_res = await db.execute(
        select(func.count(UserWord.id)).where(
            UserWord.user_id == current_user.id,
            UserWord.is_bookmarked.is_(True),
        )
    )
    bookmarked_count = bookmarked_res.scalar() or 0

    return {
        "total_words": total_words,
        "my_book_count": my_book_count,
        "bookmarked_count": bookmarked_count,
        "last_studied_word_id": current_user.last_studied_word_id,
        "last_studied_offset": current_user.last_studied_offset or 0,
    }


@app.get("/api/words", response_model=List[WordOut])
async def search_words(
    q: str = Query("", description="検索キーワード（英単語または日本語の意味）"),
    level: str = Query("all", description="all, basic, advanced, toeic, custom"),
    my_book_only: bool = Query(False, description="マイ単語帳のみ取得"),
    bookmarked_only: bool = Query(False, description="付箋付きの単語のみ取得"),
    recent_only: bool = Query(False, description="直近検索した単語(最大20件)のみ取得"),
    record_search: bool = Query(False, description="検索ヒット時に検索日時を記録するか"),
    limit: int = Query(150, ge=1, le=500, description="1ページあたりの取得件数上限"),
    offset: int = Query(0, ge=0, description="ページネーション開始位置"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Word, UserWord)
        .outerjoin(
            UserWord,
            (UserWord.word_id == Word.id) & (UserWord.user_id == current_user.id),
        )
        .where(
            or_(Word.is_custom.is_(False), Word.created_by == current_user.id)
        )
    )

    if level and level != "all":
        stmt = stmt.where(Word.level == level)

    clean_q = q.strip()
    if clean_q:
        kw = f"%{clean_q}%"
        stmt = stmt.where(
            or_(
                Word.word_spell.ilike(kw),
                Word.noun_meaning.ilike(kw),
                Word.verb_meaning.ilike(kw),
                Word.adj_meaning.ilike(kw),
                Word.adv_meaning.ilike(kw),
            )
        )

    if my_book_only:
        stmt = stmt.where(UserWord.in_my_book.is_(True))

    if bookmarked_only:
        stmt = stmt.where(UserWord.is_bookmarked.is_(True))

    if recent_only:
        stmt = stmt.where(UserWord.last_searched_at.isnot(None)).order_by(
            desc(UserWord.last_searched_at)
        ).limit(20)
    elif clean_q:
        rank_order = case(
            (Word.word_spell.ilike(clean_q), 0),
            (Word.word_spell.ilike(f"{clean_q}%"), 1),
            else_=2,
        )
        stmt = stmt.order_by(rank_order, Word.word_spell.asc()).offset(offset).limit(limit)
    else:
        stmt = stmt.order_by(Word.id.asc()).offset(offset).limit(limit)

    res = await db.execute(stmt)
    rows = res.all()

    # 検索キーワードが指定されていて record_search=True の場合、上位ヒット単語の検索履歴を更新
    if q.strip() and record_search and rows:
        now = datetime.now(timezone.utc)
        for word_obj, uw_obj in rows[:5]:
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
        # 再取得して最新状態を返す
        res = await db.execute(stmt)
        rows = res.all()

    return [format_word_out(w, uw) for w, uw in rows]


@app.post("/api/words/{word_id}/search-log", response_model=WordOut)
async def log_word_search(
    word_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """単語をタップ・詳細確認した際に直近検索履歴(last_searched_at)を更新する"""
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
        uw = UserWord(
            user_id=current_user.id,
            word_id=word_id,
            in_my_book=False,
            last_searched_at=now,
            correct_count=0,
            wrong_count=0,
        )
        db.add(uw)
    else:
        uw.last_searched_at = now

    await db.commit()
    await db.refresh(uw)
    return format_word_out(word, uw)


@app.post("/api/words/custom", response_model=WordOut)
async def create_custom_word(
    payload: WordCreateCustom,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    未知の単語を各品詞（名詞、動詞、形容詞、副詞）ごとに意味を入力してDBに追加し、
    マイ単語帳にも登録する
    """
    spell = payload.word_spell.strip()
    noun = payload.noun_meaning.strip() if payload.noun_meaning else None
    verb = payload.verb_meaning.strip() if payload.verb_meaning else None
    adj = payload.adj_meaning.strip() if payload.adj_meaning else None
    adv = payload.adv_meaning.strip() if payload.adv_meaning else None

    if not any([noun, verb, adj, adv]):
        raise HTTPException(
            status_code=400,
            detail="名詞・動詞・形容詞・副詞のうち、少なくとも1つの意味を入力してください。",
        )

    # 既存単語に同じスペルがあるかチェック
    existing_res = await db.execute(
        select(Word).where(Word.word_spell.ilike(spell))
    )
    existing_word = existing_res.scalars().first()

    if existing_word:
        # 既存の単語がある場合は品詞の意味を追記・更新可能にする
        if noun:
            existing_word.noun_meaning = noun
        if verb:
            existing_word.verb_meaning = verb
        if adj:
            existing_word.adj_meaning = adj
        if adv:
            existing_word.adv_meaning = adv
        word = existing_word
    else:
        word = Word(
            word_spell=spell,
            level=payload.level or "custom",
            noun_meaning=noun,
            verb_meaning=verb,
            adj_meaning=adj,
            adv_meaning=adv,
            is_custom=True,
            created_by=current_user.id,
        )
        db.add(word)
        await db.commit()
        await db.refresh(word)

    uw_res = await db.execute(
        select(UserWord).where(
            UserWord.user_id == current_user.id,
            UserWord.word_id == word.id,
        )
    )
    uw = uw_res.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if not uw:
        uw = UserWord(
            user_id=current_user.id,
            word_id=word.id,
            in_my_book=payload.add_to_my_book,
            last_searched_at=now,
            correct_count=0,
            wrong_count=0,
        )
        db.add(uw)
    else:
        uw.in_my_book = payload.add_to_my_book
        uw.last_searched_at = now

    await db.commit()
    await db.refresh(word)
    await db.refresh(uw)

    return format_word_out(word, uw)


@app.post("/api/words/{word_id}/toggle-book", response_model=WordOut)
async def toggle_my_book(
    word_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """マイ単語帳への登録・解除をトグルする"""
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
        uw = UserWord(
            user_id=current_user.id,
            word_id=word_id,
            in_my_book=True,
            last_searched_at=now,
            correct_count=0,
            wrong_count=0,
        )
        db.add(uw)
    else:
        uw.in_my_book = not uw.in_my_book
        if uw.in_my_book and not uw.last_searched_at:
            uw.last_searched_at = now

    await db.commit()
    await db.refresh(uw)
    return format_word_out(word, uw)


# ==========================================
# 4. 単語テスト・弱点克服・範囲指定クイズ API (/api/quiz)
# ==========================================
async def _generate_quiz_questions_core(
    effective_mode: str,
    start_num: Optional[int],
    end_num: Optional[int],
    limit: Optional[int],
    current_user: User,
    db: AsyncSession,
) -> List[QuizQuestion]:
    stmt = (
        select(Word, UserWord)
        .outerjoin(
            UserWord,
            (UserWord.word_id == Word.id) & (UserWord.user_id == current_user.id),
        )
        .where(
            or_(Word.is_custom.is_(False), Word.created_by == current_user.id)
        )
    )

    if effective_mode == "range":
        if start_num is None or end_num is None:
            raise HTTPException(
                status_code=400,
                detail="範囲指定モードでは「開始番号」と「終了番号」の両方を入力してください。",
            )
        if start_num < 1 or end_num < 1:
            raise HTTPException(
                status_code=400,
                detail="開始番号・終了番号には 1 以上の数値を指定してください。",
            )
        if start_num > end_num:
            raise HTTPException(
                status_code=400,
                detail="開始番号は終了番号以下の数値を指定してください（開始番号 ≦ 終了番号）。",
            )

        stmt = stmt.where(Word.id >= start_num, Word.id <= end_num).order_by(Word.id.asc())
        res = await db.execute(stmt)
        candidates = res.all()

        if not candidates:
            max_id_res = await db.execute(
                select(func.max(Word.id)).where(
                    or_(Word.is_custom.is_(False), Word.created_by == current_user.id)
                )
            )
            max_word_id = max_id_res.scalar() or 0
            raise HTTPException(
                status_code=400,
                detail=f"指定された範囲（No.{start_num} 〜 No.{end_num}）に単語が存在しません。（現在指定可能な番号: 1 〜 {max_word_id}）",
            )

        # limit が指定されている場合はランダムにサンプリング、未指定(null)の場合は範囲内全問を出題
        if limit is not None and limit > 0:
            selected_pairs = random.sample(candidates, k=min(limit, len(candidates)))
        else:
            # 全問出題（安全上限200問）
            selected_pairs = list(candidates[:200])
            random.shuffle(selected_pairs)

    else:
        if effective_mode in ("basic", "advanced", "toeic", "custom"):
            stmt = stmt.where(Word.level == effective_mode)
        elif effective_mode == "recent":
            stmt = stmt.where(UserWord.last_searched_at.isnot(None)).order_by(
                desc(UserWord.last_searched_at)
            )
        elif effective_mode == "weak":
            stmt = stmt.where(UserWord.wrong_count > 0)
        elif effective_mode == "my_book":
            stmt = stmt.where(UserWord.in_my_book.is_(True))

        res = await db.execute(stmt)
        candidates = res.all()

        if not candidates:
            raise HTTPException(
                status_code=404,
                detail="この出題範囲にはまだ対象の単語がありません（先に単語検索やマイ単語帳登録、または通常テストを行ってください）。",
            )

        # 弱点克服ソートロジック：(wrong_count - correct_count) が高い順 + ランダム性
        def weakness_score(item):
            _, uw = item
            wrong = uw.wrong_count if uw else 0
            correct = uw.correct_count if uw else 0
            return (wrong * 3 - correct) + random.uniform(0, 1.5)

        if effective_mode != "recent":
            candidates.sort(key=weakness_score, reverse=True)
        else:
            candidates = candidates[:20]
            candidates.sort(key=weakness_score, reverse=True)

        target_count = limit if (limit is not None and limit > 0) else 5
        selected_pairs = candidates[:target_count]

    # ダミー選択肢生成用に全単語を取得
    all_words_res = await db.execute(select(Word))
    all_words = list(all_words_res.scalars().all())

    pos_Sequence = [
        ("noun", "名詞", "noun_meaning"),
        ("verb", "動詞", "verb_meaning"),
        ("adj", "形容詞", "adj_meaning"),
        ("adv", "副詞", "adv_meaning"),
    ]

    questions: List[QuizQuestion] = []
    for word_obj, uw_obj in selected_pairs:
        available_pos = []
        for p_key, p_label, attr in pos_Sequence:
            val = getattr(word_obj, attr)
            if val:
                available_pos.append((p_key, p_label, attr, val))

        if not available_pos:
            continue

        # ランダムに1つの品詞を出題対象にする（品詞混同の防止）
        p_key, p_label, attr, correct_meaning = random.choice(available_pos)

        # 同じ品詞の他単語の意味から誤答選択肢を収集
        distractors_pool = [
            getattr(w, attr)
            for w in all_words
            if w.id != word_obj.id and getattr(w, attr) and getattr(w, attr) != correct_meaning
        ]
        # もし同じ品詞の他単語が少なければ全品詞の意味から補完
        if len(distractors_pool) < 3:
            for w in all_words:
                if w.id != word_obj.id:
                    for _, _, other_attr in pos_Sequence:
                        v = getattr(w, other_attr)
                        if v and v != correct_meaning and v not in distractors_pool:
                            distractors_pool.append(v)

        distractors = random.sample(distractors_pool, k=min(3, len(distractors_pool)))
        options = distractors + [correct_meaning]
        random.shuffle(options)
        correct_idx = options.index(correct_meaning)

        questions.append(
            QuizQuestion(
                word_id=word_obj.id,
                word_spell=word_obj.word_spell,
                level=word_obj.level,
                pos_key=p_key,
                pos_label=p_label,
                options=options,
                correct_index=correct_idx,
                correct_meaning=correct_meaning,
                all_meanings_summary=build_pos_summary(word_obj),
                correct_count=uw_obj.correct_count if uw_obj else 0,
                wrong_count=uw_obj.wrong_count if uw_obj else 0,
            )
        )

    if not questions:
        raise HTTPException(
            status_code=400,
            detail="指定された範囲に出題可能な単語データが存在しません。",
        )

    return questions


@app.get("/api/quiz/questions", response_model=List[QuizQuestion])
async def get_quiz_questions(
    mode: Optional[str] = Query(
        None,
        description="出題モード: range, basic, advanced, toeic, recent, weak, my_book",
    ),
    category: str = Query(
        "basic",
        description="互換用カテゴリ指定: basic, advanced, toeic, recent, weak, my_book, range",
    ),
    start_num: Optional[int] = Query(None, description="範囲指定時の開始番号 (Start ID)"),
    end_num: Optional[int] = Query(None, description="範囲指定時の終了番号 (End ID)"),
    limit: Optional[int] = Query(None, description="取得問題数（未指定時は範囲内全問またはデフォルト件数）"),
    count: Optional[int] = Query(None, ge=1, le=200, description="互換用問題数パラメータ"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    選択された出題モード（通常カテゴリ または 単語帳の範囲指定 mode=range）から
    品詞を明示した4択テスト問題を生成する。
    """
    effective_mode = mode if mode else category
    effective_limit = limit if limit is not None else count
    return await _generate_quiz_questions_core(
        effective_mode=effective_mode,
        start_num=start_num,
        end_num=end_num,
        limit=effective_limit,
        current_user=current_user,
        db=db,
    )


@app.post("/api/quiz/questions", response_model=List[QuizQuestion])
async def generate_quiz_questions_post(
    payload: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    POSTボディ（mode, start_num, end_num, limit）を受け取って4択クイズを生成するエンドポイント
    """
    return await _generate_quiz_questions_core(
        effective_mode=payload.mode,
        start_num=payload.start_num,
        end_num=payload.end_num,
        limit=payload.limit,
        current_user=current_user,
        db=db,
    )


@app.post("/api/quiz/submit", response_model=QuizSubmitResponse)
async def submit_quiz(
    payload: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    テスト結果を記録し、正解・不正解カウントを更新、ポイント(CR)を付与する
    """
    correct_total = 0
    question_total = len(payload.answers)
    now = datetime.now(timezone.utc)

    for ans in payload.answers:
        if ans.is_correct:
            correct_total += 1

        uw_res = await db.execute(
            select(UserWord).where(
                UserWord.user_id == current_user.id,
                UserWord.word_id == ans.word_id,
            )
        )
        uw = uw_res.scalar_one_or_none()
        if not uw:
            uw = UserWord(
                user_id=current_user.id,
                word_id=ans.word_id,
                in_my_book=False,
                last_searched_at=now,
                correct_count=1 if ans.is_correct else 0,
                wrong_count=0 if ans.is_correct else 1,
            )
            db.add(uw)
        else:
            if ans.is_correct:
                uw.correct_count += 1
            else:
                uw.wrong_count += 1

    # 難易度・カテゴリ別のポイント計算
    base_per_correct = 10
    if payload.category in ("advanced", "toeic", "my_book", "recent", "range"):
        base_per_correct = 15
    elif payload.category == "weak":
        base_per_correct = 20

    earned_points = correct_total * base_per_correct
    if question_total > 0 and correct_total == question_total:
        earned_points += 10  # 全問正解ボーナス

    current_user.points += earned_points
    current_user.last_accessed_at = now
    await db.commit()
    await db.refresh(current_user)

    if correct_total == question_total and question_total > 0:
        speech = f"パーフェクト！！全{question_total}問正解で +{earned_points} CR 獲得したよ！🎉⚡"
    elif correct_total > 0:
        speech = f"テスト完了！ {question_total}問中 {correct_total}問正解！ +{earned_points} CR 獲得だよ✨"
    else:
        speech = "おしいっ！間違えた単語は「弱点克服テスト」からいつでも復習できるよ💪"

    return QuizSubmitResponse(
        earned_points=earned_points,
        total_points=current_user.points,
        correct_total=correct_total,
        question_total=question_total,
        speech=speech,
    )
