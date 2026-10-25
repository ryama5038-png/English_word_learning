from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=230, nullable=False)
    energy: Mapped[int] = mapped_column(Integer, default=95, nullable=False)
    last_accessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    # Relationships
    words: Mapped[List["Word"]] = relationship(
        "Word", back_populates="creator"
    )
    user_words: Mapped[List["UserWord"]] = relationship(
        "UserWord", back_populates="user", cascade="all, delete-orphan"
    )


class Word(Base):
    __tablename__ = "words"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    word_spell: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="共通テスト", index=True)
    noun_meaning: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    verb_meaning: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    adj_meaning: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    adv_meaning: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    creator: Mapped[Optional["User"]] = relationship("User", back_populates="words")
    user_words: Mapped[List["UserWord"]] = relationship(
        "UserWord", back_populates="word", cascade="all, delete-orphan"
    )


class UserWord(Base):
    __tablename__ = "user_words"
    __table_args__ = (
        UniqueConstraint("user_id", "word_id", name="uq_user_word"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    word_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("words.id", ondelete="CASCADE"), nullable=False, index=True
    )
    in_my_book: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_searched_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    correct_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    wrong_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_words")
    word: Mapped["Word"] = relationship("Word", back_populates="user_words")
