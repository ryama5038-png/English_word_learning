from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from database import Base


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    character_type = Column(String(30), nullable=True, default=None)
    points = Column(Integer, default=230, nullable=False)
    energy = Column(Integer, default=95, nullable=False)
    last_accessed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    custom_words = relationship("Word", back_populates="creator")
    user_words = relationship("UserWord", back_populates="user", cascade="all, delete-orphan")


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    word_spell = Column(String(100), nullable=False, index=True)
    level = Column(String(30), nullable=False, default="basic", index=True)  # basic, advanced, toeic, custom
    noun_meaning = Column(Text, nullable=True)
    verb_meaning = Column(Text, nullable=True)
    adj_meaning = Column(Text, nullable=True)
    adv_meaning = Column(Text, nullable=True)
    is_custom = Column(Boolean, default=False, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    creator = relationship("User", back_populates="custom_words")
    user_words = relationship("UserWord", back_populates="word", cascade="all, delete-orphan")


class UserWord(Base):
    __tablename__ = "user_words"
    __table_args__ = (
        UniqueConstraint("user_id", "word_id", name="uq_user_word"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    word_id = Column(Integer, ForeignKey("words.id", ondelete="CASCADE"), nullable=False, index=True)
    in_my_book = Column(Boolean, default=False, nullable=False)
    last_searched_at = Column(DateTime(timezone=True), nullable=True)
    correct_count = Column(Integer, default=0, nullable=False)
    wrong_count = Column(Integer, default=0, nullable=False)

    user = relationship("User", back_populates="user_words")
    word = relationship("Word", back_populates="user_words")
