import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from database import database
from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel
from typing import Optional, Union
# 管理者認証設定
SECRET_KEY = "YOUR_SUPER_SECRET_KEY_HERE"  # 本番環境では環境変数化してください
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

#フロントエンドから送信されたurlから、Bearerヘッダーを読み込んで抽出する。
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 画像保存ディレクトリの設定と静的ファイル配信 ---
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
#指定したフォルダ(uploads)がローカル上に存在しない場合に自動作成、exist_ok=Trueによって、既にファイルが存在していてもFileExistsErrorを発生させず、スルーする。
# /uploads/ファイル名 で画像にアクセスできるようにする
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


# --- Pydantic スキーマ ---
class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    image_url: Optional[str] = None
    created_at: datetime


# --- 認証ユーティリティ関数 ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
  # passlibで生成された既存ハッシュ (str) にも互換性があります
  return bcrypt.checkpw(
      plain_password.encode("utf-8"), hashed_password.encode("utf-8")
  )

#パスワードをハッシュ化して、16進数の文字列にデコードする。
def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

#{"sub": username, "exp": expire}によって、トークンを発行
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

#トークンとデータベース照合による本人確認関数
async def get_current_admin(token: str = Depends(oauth2_scheme)):
    # 認証用例外オブジェクトを共通化
    credentials_exception = HTTPException(
        status_code=401, 
        detail="認証に失敗しました", 
        headers={"WWW-Authenticate": "Bearer"}
    )
    
    try:
        # トークンをデコードし、usernameをパースする
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        #Bearerトークンの中にはsolt情報が含まれるため、keyとアルゴリズム情報のみでデコード可能
        username: str = payload.get("sub")

        if username is None:
            raise credentials_exception

    except JWTError:  # JWTの解読・期限切れエラーを個別にキャッチ
        raise credentials_exception

    # 該当するusernameがデータベース内にあるかを確認 (id等の情報も含めて取得)
    query = "SELECT * FROM admins WHERE username = :username"
    current_admin = await database.fetch_one(query=query, values={"username": username})

    # ユーザーの存在確認
    if current_admin is None:
        raise HTTPException(
            status_code=401, 
            detail="アカウントが無効です。", 
            headers={"WWW-Authenticate": "Bearer"}
        )

    # ユーザーが存在した場合、current_admin（辞書/行オブジェクト）を返す
    return current_admin

# --- API エンドポイント ---

@app.get("/api/info")
def get_info():
    return {
        "name": "Culinary Haven",
        "description": "旬の地場食材をふんだんに使った、心温まる創作イタリアンレストランです。",
        "address": "東京都渋谷区神南 1-2-3",
        "hours": "11:30 - 22:00 (L.O. 21:30)",
        "closed": "毎週月曜日",
        "phone": "03-1234-5678"
    }


# 1. ログイン（データベースとのパスワード照合）+ トークン発行
@app.post("/api/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # DBから管理者情報を取得
    query = "SELECT * FROM admins WHERE username = :username"
    admin = await database.fetch_one(query=query, values={"username": form_data.username})

    # ユーザーが存在しない、またはパスワード不一致の場合エラー
    if not admin or not verify_password(form_data.password, admin["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ユーザー名またはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": admin["username"]})
    return {"access_token": access_token, "token_type": "bearer"}


# 2. 投稿の新規作成（画像アップロード対応 & JWT認証）
@app.post("/api/posts", response_model=PostResponse)
async def create_post(
    title: str = Form(...),
    content: str = Form(...),
    image: Optional[UploadFile] = File(None),  # Union[UploadFile, str] ではなく UploadFile 単体にする
    #Uploadingクラスは、fastAPIでバイナリファイルを受信するための標準クラス
    current_admin: dict = Depends(get_current_admin)
):

    image_url = None

    # image が存在し、ファイル名が空でない場合のみ画像を保存
    if image and image.filename and image.filename.strip() != "":
        file_extension = os.path.splitext(image.filename)[1]
        #このコードによって、ファイル名と拡張子が分離した要素数2のタプルが作成される。
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as buffer:
            buffer.write(await image.read())

        image_url = f"/uploads/{unique_filename}"

    query = """
        INSERT INTO posts (title, content, image_url)
        VALUES (:title, :content, :image_url)
        RETURNING id, title, content, image_url, created_at
    """
    values = {"title": title, "content": content, "image_url": image_url}

    new_post = await database.fetch_one(query=query, values=values)
    return new_post


# 3. 投稿一覧の取得
@app.get("/api/posts", response_model=List[PostResponse])
async def get_posts(
    limit: int = Query(default=5, ge=1),
    offset: int = Query(default=0, ge=0)
):
    query = """
        SELECT id, title, content, image_url, created_at
        FROM posts
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """
    values = {"limit": limit, "offset": offset}
    
    posts = await database.fetch_all(query=query, values=values)
    return posts
