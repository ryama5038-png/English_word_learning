from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.word import User, Word, UserWord
from auth import get_password_hash
from seed_words import seed_initial_data


async def run_seed(db: AsyncSession):
    """
    DB初期化・起動時のシード処理:
    1. 共通デフォルト単語（is_custom=False、大学入試・TOEIC頻出 2000語以上）の投入
    2. テスト用初期アカウント2件（testuser_a, testuser_b）の自動作成と個別初期データの設定
    """
    await seed_initial_data(db)
