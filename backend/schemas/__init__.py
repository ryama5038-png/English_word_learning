from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from schemas.word import WordResponse, CustomWordCreate, UserWordUpdate


# --- Auth & User Schemas ---
class UserCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=4, max_length=100)
    character_type: Optional[str] = None


class CharacterSelectRequest(BaseModel):
    character_type: str = Field(..., pattern="^(kurage|jinbei|slime)$")


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
