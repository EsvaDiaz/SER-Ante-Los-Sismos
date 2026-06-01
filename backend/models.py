from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    telegram_id: Optional[str] = None
    role: UserRole = UserRole.USER
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    # Nuevos campos demográficos (opcionales en base para compatibilidad con usuarios existentes)
    phone: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None   # "M" o "F"

class UserCreate(BaseModel):
    """Modelo para registro de nuevos usuarios — phone, age y sex son obligatorios."""
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    telegram_id: Optional[str] = None
    role: UserRole = UserRole.USER
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    phone: str          # requerido
    age: int            # requerido
    sex: str            # requerido: "M" o "F"

class UserInDB(UserBase):
    hashed_password: str = ""
    created_at: datetime = Field(default_factory=datetime.now)

class PostType(str, Enum):
    NEWS = "news"
    ALERT = "alert"
    EDUCATIONAL = "educational"

class Post(BaseModel):
    title: str
    content: str
    type: PostType
    author_id: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    audio_name: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    link_url: Optional[str] = None
    link_title: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    tags: List[str] = []

class Earthquake(BaseModel):
    magnitude: float
    location: str
    depth: float
    time: datetime
    coordinates: Optional[List[float]] = None
    source: str = "CENAIS"
    raw_data: Optional[dict] = None

class ChatLog(BaseModel):
    user_id: str
    question: str
    answer: str
    timestamp: datetime = Field(default_factory=datetime.now)

class Reaction(BaseModel):
    post_id: str
    user_id: str
    emoji: str
    timestamp: datetime = Field(default_factory=datetime.now)

class PostComment(BaseModel):
    post_id: str
    user_id: str
    username: Optional[str] = None
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)

class PostSurvey(BaseModel):
    post_id: str
    user_id: str
    emoji_rating: Optional[str] = None
    liked_most: Optional[str] = None
    recommendation: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
