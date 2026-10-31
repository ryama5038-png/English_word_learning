from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from schemas.word import (
    WordResponse,
    PaginatedWordsResponse,
    StudyPositionUpdate,
    StudyPositionResponse,
    BookmarkToggleRequest,
    CustomWordCreate,
    UserWordUpdate,
)


# --- Auth & User Schemas ---
class UserCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=4, max_length=100)
    character_type: Optional[str] = None


class CharacterSelectRequest(BaseModel):
    character_type: str = Field(..., pattern="^(jellyfish|whaleshark|mendako|sea_slug|kurage|jinbei)$")


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    character_type: Optional[str] = None
    points: int
    energy: int
    last_accessed_at: datetime
    energy_status: str = "元気"  # 元気, 普通, 衰弱
    decayed_amount: int = 0
    last_studied_word_id: Optional[int] = None
    last_studied_offset: int = 0


# Backward compatibility aliases for existing main.py
class WordCreateCustom(CustomWordCreate):
    add_to_my_book: bool = True


class WordOut(WordResponse):
    pass


# --- Pet Action & Idle Talk Schemas ---
class PetActionRequest(BaseModel):
    action_type: str
    target_energy: Optional[int] = None


class PetActionResponse(BaseModel):
    points: int
    energy: int
    energy_status: str
    speech: str


class IdleTalkResponse(BaseModel):
    speech: str
    energy: int
    energy_status: str
    word_id: Optional[int] = None
    word_spell: Optional[str] = None


# --- Quiz Schemas ---
class QuizGenerateRequest(BaseModel):
    """クイズ出題リクエストスキーマ（範囲指定・通常カテゴリ共通）"""
    mode: str = Field(
        default="basic",
        description="出題モード (range, basic, advanced, toeic, recent, my_book, weak)",
    )
    start_num: Optional[int] = Field(
        default=None, ge=1, description="範囲指定モード時の開始番号 (Start ID/Number)"
    )
    end_num: Optional[int] = Field(
        default=None, ge=1, description="範囲指定モード時の終了番号 (End ID/Number)"
    )
    limit: Optional[int] = Field(
        default=None, ge=1, le=200, description="取得問題数（全問出題の場合は null または指定なし）"
    )


class QuizQuestion(BaseModel):
    word_id: int
    word_spell: str
    level: str
    pos_key: str
    pos_label: str
    options: List[str]
    correct_index: int
    correct_meaning: str
    all_meanings_summary: str
    correct_count: int = 0
    wrong_count: int = 0


class QuizAnswerItem(BaseModel):
    word_id: int
    is_correct: bool


class QuizSubmitRequest(BaseModel):
    category: str
    answers: List[QuizAnswerItem]


class QuizSubmitResponse(BaseModel):
    earned_points: int
    total_points: int
    correct_total: int
    question_total: int
    speech: str
