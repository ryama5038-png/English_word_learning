from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


# --- Auth & User Schemas ---
class UserCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=4, max_length=100)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    points: int
    energy: int
    last_accessed_at: datetime
    energy_status: str = "元気"  # 元気, 普通, 衰弱
    decayed_amount: int = 0


# --- Word & UserWord Schemas ---
class WordCreateCustom(BaseModel):
    word_spell: str = Field(..., min_length=1, max_length=100)
    level: str = Field(default="custom")
    noun_meaning: Optional[str] = None
    verb_meaning: Optional[str] = None
    adj_meaning: Optional[str] = None
    adv_meaning: Optional[str] = None
    add_to_my_book: bool = True


class WordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    word_spell: str
    level: str
    noun_meaning: Optional[str] = None
    verb_meaning: Optional[str] = None
    adj_meaning: Optional[str] = None
    adv_meaning: Optional[str] = None
    is_custom: bool
    created_by: Optional[int] = None
    # User-specific learning metadata
    in_my_book: bool = False
    last_searched_at: Optional[datetime] = None
    correct_count: int = 0
    wrong_count: int = 0


# --- Pet Action & Idle Talk Schemas ---
class PetActionRequest(BaseModel):
    action_type: str  # "charge", "optimize", "set_energy"
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
class QuizQuestion(BaseModel):
    word_id: int
    word_spell: str
    level: str
    pos_key: str        # "noun", "verb", "adj", "adv"
    pos_label: str      # "名詞", "動詞", "形容詞", "副詞"
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
