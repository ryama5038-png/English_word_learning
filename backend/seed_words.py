from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from models import User, Word, UserWord
from auth import get_password_hash

DEFAULT_WORDS = [
    # --- BASIC (基礎・共通テスト頻出: 品詞混同しやすい重要語を含む) ---
    {
        "word_spell": "book",
        "level": "basic",
        "noun_meaning": "本、書籍、帳簿",
        "verb_meaning": "予約する、帳簿に記入する",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "run",
        "level": "basic",
        "noun_meaning": "走ること、連続、上演期間",
        "verb_meaning": "走る、経営・運営する、（機械が）動く",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "light",
        "level": "basic",
        "noun_meaning": "光、明かり、照明",
        "verb_meaning": "火をつける、照らす",
        "adj_meaning": "明るい、軽い、薄い",
        "adv_meaning": "軽く、軽装で",
    },
    {
        "word_spell": "fast",
        "level": "basic",
        "noun_meaning": "断食、絶食",
        "verb_meaning": "断食する",
        "adj_meaning": "速い、急速な、（時計が）進んでいる",
        "adv_meaning": "速く、しっかりと、ぐっすりと",
    },
    {
        "word_spell": "present",
        "level": "basic",
        "noun_meaning": "贈り物、現在",
        "verb_meaning": "贈呈する、提示する、発表する",
        "adj_meaning": "出席している、現在の、存在する",
        "adv_meaning": None,
    },
    {
        "word_spell": "right",
        "level": "basic",
        "noun_meaning": "権利、正義、右側",
        "verb_meaning": "正す、立て直す",
        "adj_meaning": "正しい、適切な、右の",
        "adv_meaning": "ちょうど、まっすぐに、すぐさま",
    },
    {
        "word_spell": "kind",
        "level": "basic",
        "noun_meaning": "種類、性質",
        "verb_meaning": None,
        "adj_meaning": "親切な、優しい、思いやりのある",
        "adv_meaning": None,
    },
    {
        "word_spell": "mean",
        "level": "basic",
        "noun_meaning": "中間、平均",
        "verb_meaning": "意味する、意図する、つもりである",
        "adj_meaning": "意地悪な、卑劣な、平均の",
        "adv_meaning": None,
    },
    {
        "word_spell": "mind",
        "level": "basic",
        "noun_meaning": "心、精神、知性、考え",
        "verb_meaning": "気にする、嫌がる、注意する",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "matter",
        "level": "basic",
        "noun_meaning": "問題、事柄、物質",
        "verb_meaning": "重要である、問題になる",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "state",
        "level": "basic",
        "noun_meaning": "状態、国家、州",
        "verb_meaning": "述べる、言明する",
        "adj_meaning": "国の、州立の",
        "adv_meaning": None,
    },
    {
        "word_spell": "change",
        "level": "basic",
        "noun_meaning": "変化、お釣り、小銭",
        "verb_meaning": "変える、変わる、乗り換える",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "point",
        "level": "basic",
        "noun_meaning": "要点、点、得点、先端",
        "verb_meaning": "指さす、向ける",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "experience",
        "level": "basic",
        "noun_meaning": "経験、体験",
        "verb_meaning": "経験する、体験する",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "support",
        "level": "basic",
        "noun_meaning": "支持、支援、支え",
        "verb_meaning": "支持する、支える、扶養する",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "cause",
        "level": "basic",
        "noun_meaning": "原因、理由、大義",
        "verb_meaning": "引き起こす、〜させる",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "share",
        "level": "basic",
        "noun_meaning": "分け前、シェア、株式",
        "verb_meaning": "共有する、分け合う、分担する",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "hard",
        "level": "basic",
        "noun_meaning": None,
        "verb_meaning": None,
        "adj_meaning": "硬い、難しい、厳しい、熱心な",
        "adv_meaning": "一生懸命に、激しく、強く",
    },
    {
        "word_spell": "well",
        "level": "basic",
        "noun_meaning": "井戸、源泉",
        "verb_meaning": "湧き出る、あふれ出る",
        "adj_meaning": "健康な、順調な",
        "adv_meaning": "上手に、よく、十分に",
    },
    {
        "word_spell": "still",
        "level": "basic",
        "noun_meaning": "静寂、静止画",
        "verb_meaning": "静める、落ち着かせる",
        "adj_meaning": "静止した、動かない、静かな",
        "adv_meaning": "まだ、依然として、それでもなお",
    },
    {
        "word_spell": "notice",
        "level": "basic",
        "noun_meaning": "通知、掲示、注目、予告",
        "verb_meaning": "気づく、注目する",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "wonder",
        "level": "basic",
        "noun_meaning": "驚き、驚異、不思議",
        "verb_meaning": "〜かなと思う、不思議に思う、驚く",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "promise",
        "level": "basic",
        "noun_meaning": "約束、見込み、前途有望",
        "verb_meaning": "約束する、見込みがある",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "direct",
        "level": "basic",
        "noun_meaning": None,
        "verb_meaning": "向ける、指示する、監督する、案内する",
        "adj_meaning": "直接の、直行の、率直な",
        "adv_meaning": "直接に、直行で",
    },
    {
        "word_spell": "remain",
        "level": "basic",
        "noun_meaning": "残り、遺跡、遺体（通例複数形）",
        "verb_meaning": "〜のままである、残る、留まる",
        "adj_meaning": None,
        "adv_meaning": None,
    },

    # --- ADVANCED (応用・難関大・英検準1級レベル) ---
    {
        "word_spell": "object",
        "level": "advanced",
        "noun_meaning": "物体、対象、目的、目的語",
        "verb_meaning": "反対する、異議を唱える",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "subject",
        "level": "advanced",
        "noun_meaning": "主題、科目、被験者、国民",
        "verb_meaning": "服従させる、さらす（経験させる）",
        "adj_meaning": "影響を受けやすい、服従している",
        "adv_meaning": None,
    },
    {
        "word_spell": "conduct",
        "level": "advanced",
        "noun_meaning": "行為、品行、運営、指導",
        "verb_meaning": "実施する、行う、指揮する、導く",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "attribute",
        "level": "advanced",
        "noun_meaning": "属性、特質、特徴",
        "verb_meaning": "（原因・結果を）〜に帰する、〜のおかげとする",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "yield",
        "level": "advanced",
        "noun_meaning": "収穫高、産出量、利回り",
        "verb_meaning": "産出する、もたらす、屈服する、道を譲る",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "compromise",
        "level": "advanced",
        "noun_meaning": "妥協、歩み寄り、折衷案",
        "verb_meaning": "妥協する、危うくする、損なう",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "exploit",
        "level": "advanced",
        "noun_meaning": "偉業、武勲、功績",
        "verb_meaning": "開発する、活用する、搾取する",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "novel",
        "level": "advanced",
        "noun_meaning": "（長編）小説",
        "verb_meaning": None,
        "adj_meaning": "斬新な、目新しい、奇抜な",
        "adv_meaning": None,
    },
    {
        "word_spell": "minute",
        "level": "advanced",
        "noun_meaning": "分、瞬間、議事録（複数形）",
        "verb_meaning": "議事録に記録する",
        "adj_meaning": "微小な、極めて小さい、詳細な",
        "adv_meaning": None,
    },
    {
        "word_spell": "content",
        "level": "advanced",
        "noun_meaning": "中身、内容、目次、含有量",
        "verb_meaning": "満足させる",
        "adj_meaning": "満足している、甘んじる",
        "adv_meaning": None,
    },
    {
        "word_spell": "elaborate",
        "level": "advanced",
        "noun_meaning": None,
        "verb_meaning": "詳しく述べる、入念に作り上げる",
        "adj_meaning": "精巧な、入念な、凝った",
        "adv_meaning": None,
    },
    {
        "word_spell": "manifest",
        "level": "advanced",
        "noun_meaning": "積荷目録、乗客名簿",
        "verb_meaning": "明白に示す、現れる",
        "adj_meaning": "明白な、明らかな",
        "adv_meaning": None,
    },
    {
        "word_spell": "advocate",
        "level": "advanced",
        "noun_meaning": "提唱者、擁護者、弁護士",
        "verb_meaning": "提唱する、主張する、擁護する",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "subordinate",
        "level": "advanced",
        "noun_meaning": "部下、下位のもの",
        "verb_meaning": "従属させる、二の次にする",
        "adj_meaning": "下位の、従属する、副次的な",
        "adv_meaning": None,
    },
    {
        "word_spell": "complement",
        "level": "advanced",
        "noun_meaning": "補完するもの、補足、補語",
        "verb_meaning": "補完する、引き立てる",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "decline",
        "level": "advanced",
        "noun_meaning": "減少、衰退、低下",
        "verb_meaning": "減少する、衰退する、丁重に断る",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "preserve",
        "level": "advanced",
        "noun_meaning": "保護区、禁猟区、ジャム",
        "verb_meaning": "保護する、保存する、維持する",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "suspect",
        "level": "advanced",
        "noun_meaning": "容疑者、疑わしい人",
        "verb_meaning": "〜ではないかと疑う、怪しむ",
        "adj_meaning": "疑わしい、怪しい",
        "adv_meaning": None,
    },
    {
        "word_spell": "deliberate",
        "level": "advanced",
        "noun_meaning": None,
        "verb_meaning": "熟考する、審議する",
        "adj_meaning": "故意の、意図的な、慎重な",
        "adv_meaning": None,
    },
    {
        "word_spell": "abstract",
        "level": "advanced",
        "noun_meaning": "要約、抄録、抽象概念",
        "verb_meaning": "抽出する、要約する",
        "adj_meaning": "抽象的な、観念的な",
        "adv_meaning": None,
    },

    # --- TOEIC (ビジネス・TOEIC頻出語) ---
    {
        "word_spell": "address",
        "level": "toeic",
        "noun_meaning": "住所、宛先、演説、挨拶",
        "verb_meaning": "（問題などに）対処する、演説する、宛名を書く",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "contract",
        "level": "toeic",
        "noun_meaning": "契約、契約書",
        "verb_meaning": "契約を結ぶ、収縮する、（病気に）かかる",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "charge",
        "level": "toeic",
        "noun_meaning": "料金、請求、責任、充電、告発",
        "verb_meaning": "料金を請求する、充電する、責任を負わせる",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "account",
        "level": "toeic",
        "noun_meaning": "口座、会計、説明、顧客（取引先）",
        "verb_meaning": "説明する、割合を占める（account for）",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "estimate",
        "level": "toeic",
        "noun_meaning": "見積もり、概算、評価",
        "verb_meaning": "見積もる、推定する、評価する",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "implement",
        "level": "toeic",
        "noun_meaning": "道具、器具、手段",
        "verb_meaning": "実行する、実施する、導入する",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "executive",
        "level": "toeic",
        "noun_meaning": "重役、経営幹部、管理職",
        "verb_meaning": None,
        "adj_meaning": "経営上の、実行力のある、重役専用の",
        "adv_meaning": None,
    },
    {
        "word_spell": "representative",
        "level": "toeic",
        "noun_meaning": "担当者、代表者、代理人",
        "verb_meaning": None,
        "adj_meaning": "代表する、典型的な",
        "adv_meaning": None,
    },
    {
        "word_spell": "alternative",
        "level": "toeic",
        "noun_meaning": "代替案、選択肢",
        "verb_meaning": None,
        "adj_meaning": "代替の、別の、二者択一の",
        "adv_meaning": None,
    },
    {
        "word_spell": "initiative",
        "level": "toeic",
        "noun_meaning": "主導権、新構想、率先力",
        "verb_meaning": None,
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "launch",
        "level": "toeic",
        "noun_meaning": "（新製品の）発売、開始、打ち上げ",
        "verb_meaning": "発売する、開始する、立ち上げる",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "feature",
        "level": "toeic",
        "noun_meaning": "特徴、特色、特集記事、目玉商品",
        "verb_meaning": "〜を特徴として備える、特集する、主演させる",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "process",
        "level": "toeic",
        "noun_meaning": "過程、工程、手続き",
        "verb_meaning": "処理する、加工する",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "schedule",
        "level": "toeic",
        "noun_meaning": "予定、日程表、スケジュール",
        "verb_meaning": "予定に入れる、計画する",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "guarantee",
        "level": "toeic",
        "noun_meaning": "保証、保証書、担保",
        "verb_meaning": "保証する、確約する",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "refund",
        "level": "toeic",
        "noun_meaning": "返金、払い戻し金",
        "verb_meaning": "返金する、払い戻す",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "purchase",
        "level": "toeic",
        "noun_meaning": "購入、購入品",
        "verb_meaning": "購入する、買い求める",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "permit",
        "level": "toeic",
        "noun_meaning": "許可証、通行証",
        "verb_meaning": "許可する、可能にする",
        "adj_meaning": None,
        "adv_meaning": None,
    },
    {
        "word_spell": "prompt",
        "level": "toeic",
        "noun_meaning": "促すもの、プロンプト",
        "verb_meaning": "促す、引き起こす、刺激する",
        "adj_meaning": "迅速な、即座の、時間を守る",
        "adv_meaning": "時間通りに、きっかりに",
    },
    {
        "word_spell": "secure",
        "level": "toeic",
        "noun_meaning": None,
        "verb_meaning": "確保する、獲得する、固定する、守る",
        "adj_meaning": "安全な、安心な、確実な",
        "adv_meaning": None,
    },
]


async def seed_initial_data(db: AsyncSession):
    # 1. デモユーザー 'master' の作成
    res = await db.execute(select(User).where(User.username == "master"))
    master_user = res.scalar_one_or_none()
    if not master_user:
        master_user = User(
            username="master",
            hashed_password=get_password_hash("password123"),
            points=230,
            energy=95,
            last_accessed_at=datetime.now(timezone.utc),
        )
        db.add(master_user)
        await db.commit()
        await db.refresh(master_user)

    # 2. 単語データ（大学入試・共通テスト・TOEIC 2,000語以上）のシード
    from vocab_generator import generate_all_words

    existing_res = await db.execute(select(Word.word_spell))
    existing_spells = {row[0].lower() for row in existing_res.all() if row[0]}

    all_seed_words = list(DEFAULT_WORDS) + generate_all_words()
    new_words = []
    for w_data in all_seed_words:
        spell_lower = w_data["word_spell"].strip().lower()
        if not spell_lower or spell_lower in existing_spells:
            continue
        existing_spells.add(spell_lower)
        word = Word(
            word_spell=w_data["word_spell"].strip(),
            level=w_data["level"],
            noun_meaning=w_data["noun_meaning"],
            verb_meaning=w_data["verb_meaning"],
            adj_meaning=w_data["adj_meaning"],
            adv_meaning=w_data["adv_meaning"],
            is_custom=False,
            created_by=None,
        )
        db.add(word)
        new_words.append(word)

    if new_words:
        await db.commit()

    # 重複スペルが存在する場合は最小IDのみ残してクリーンアップ
    min_ids_subq = (
        select(func.min(Word.id).label("min_id"))
        .group_by(func.lower(Word.word_spell))
        .subquery()
    )
    await db.execute(
        delete(Word).where(Word.id.notin_(select(min_ids_subq.c.min_id)))
    )
    await db.commit()

    # 3. 初期学習履歴がまだ0件の場合は数件登録
    uw_count_res = await db.execute(
        select(func.count(UserWord.id)).where(UserWord.user_id == master_user.id)
    )
    uw_count = uw_count_res.scalar() or 0
    if uw_count == 0:
        first_words_res = await db.execute(select(Word).order_by(Word.id.asc()).limit(8))
        first_words = first_words_res.scalars().all()
        for idx, word in enumerate(first_words):
            uw = UserWord(
                user_id=master_user.id,
                word_id=word.id,
                in_my_book=(idx < 5),
                last_searched_at=datetime.now(timezone.utc) - timedelta(minutes=idx * 5),
                correct_count=1 if idx % 2 == 0 else 0,
                wrong_count=2 if idx % 3 == 0 else 0,
            )
            db.add(uw)
        await db.commit()
