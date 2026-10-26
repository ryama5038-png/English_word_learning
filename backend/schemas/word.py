from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class WordResponse(BaseModel):
    """検索・単語帳一覧レスポンス用スキーマ (Pydantic V2)"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    word_spell: str
    level: Optional[str] = None
    noun_meaning: Optional[str] = None
    verb_meaning: Optional[str] = None
    adj_meaning: Optional[str] = None
    adv_meaning: Optional[str] = None
    is_custom: bool = False
    created_by: Optional[int] = None

    # ユーザーごとの学習記録情報（user_words）
    in_my_book: bool = False
    is_bookmarked: bool = False
    last_searched_at: Optional[datetime] = None
    correct_count: int = 0
    wrong_count: int = 0


class PaginatedWordsResponse(BaseModel):
    """ページネーション付き単語帳一覧レスポンス"""
    items: List[WordResponse]
    total: int
    limit: int
    offset: int
    last_studied_word_id: Optional[int] = None
    last_studied_offset: int = 0


class StudyPositionUpdate(BaseModel):
    """しおり（前回学習位置）保存用スキーマ"""
    last_studied_word_id: Optional[int] = Field(default=None, description="最後に学習した単語ID")
    last_studied_offset: int = Field(default=0, ge=0, description="最後に表示していたページオフセット")


class StudyPositionResponse(BaseModel):
    """しおり（前回学習位置）取得レスポンス用スキーマ"""
    last_studied_word_id: Optional[int] = None
    last_studied_offset: int = 0
    last_studied_word_spell: Optional[str] = None


class BookmarkToggleRequest(BaseModel):
    """付箋（ブックマーク）切り替え用リクエストスキーマ"""
    is_bookmarked: Optional[bool] = Field(default=None, description="明示的に指定する場合の付箋状態（未指定時はトグル）")


class CustomWordCreate(BaseModel):
    """マイ単語帳 / 独自単語登録リクエスト用スキーマ"""
    word_spell: str = Field(..., min_length=1, max_length=100, description="英単語のスペル")
    level: Optional[str] = Field(default="custom", max_length=50, description="単語レベル（例: 共通テスト, TOEIC, custom）")
    noun_meaning: Optional[str] = Field(default=None, description="名詞の意味（カンマ区切り可）")
    verb_meaning: Optional[str] = Field(default=None, description="動詞の意味")
    adj_meaning: Optional[str] = Field(default=None, description="形容詞の意味")
    adv_meaning: Optional[str] = Field(default=None, description="副詞の意味")


class UserWordUpdate(BaseModel):
    """学習記録更新用スキーマ"""
    in_my_book: Optional[bool] = Field(default=None, description="マイ単語帳登録フラグ")
    is_bookmarked: Optional[bool] = Field(default=None, description="付箋（ブックマーク）フラグ")
    last_searched_at: Optional[datetime] = Field(default=None, description="最終検索日時")
    correct_count: Optional[int] = Field(default=None, ge=0, description="テストでの正解数")
    wrong_count: Optional[int] = Field(default=None, ge=0, description="テストでの不正解数")
