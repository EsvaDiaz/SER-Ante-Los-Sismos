from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from backend.models import UserCreate, UserInDB, UserRole
from backend.utils import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from backend.database import database
from datetime import timedelta
import os
from jose import JWTError, jwt
from pydantic import BaseModel
from typing import Optional

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "SER_ADMIN_2025")

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False

class AdminRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    phone: str
    age: int
    sex: str
    admin_secret: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await database.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return UserInDB(**user)

async def get_current_admin(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return current_user

@router.post("/register", response_model=UserInDB)
async def register(user: UserCreate):
    # Validaciones de campos obligatorios
    if not user.phone or not user.phone.strip():
        raise HTTPException(status_code=400, detail="El número de teléfono es obligatorio.")
    if not user.age or user.age < 1 or user.age > 120:
        raise HTTPException(status_code=400, detail="La edad debe estar entre 1 y 120 años.")
    if user.sex not in ("M", "F"):
        raise HTTPException(status_code=400, detail="El sexo debe ser 'M' (Masculino) o 'F' (Femenino).")

    existing_user = await database.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    user_dict = user.model_dump(exclude={"password"})
    user_in_db = UserInDB(**user_dict, hashed_password=hashed_password)
    user_in_db.role = UserRole.USER

    await database.users.insert_one(user_in_db.model_dump())
    return user_in_db

@router.post("/admin/register", response_model=UserInDB)
async def admin_register(data: AdminRegisterRequest):
    if data.admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=400, detail="Invalid admin secret")

    if not data.phone or not data.phone.strip():
        raise HTTPException(status_code=400, detail="El número de teléfono es obligatorio.")
    if not data.age or data.age < 1 or data.age > 120:
        raise HTTPException(status_code=400, detail="La edad debe estar entre 1 y 120 años.")
    if data.sex not in ("M", "F"):
        raise HTTPException(status_code=400, detail="El sexo debe ser 'M' o 'F'.")

    existing_user = await database.users.find_one({"email": data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(data.password)
    user_in_db = UserInDB(
        email=data.email,
        full_name=data.full_name,
        phone=data.phone,
        age=data.age,
        sex=data.sex,
        hashed_password=hashed_password,
        role=UserRole.ADMIN,
    )
    await database.users.insert_one(user_in_db.model_dump())
    return user_in_db

@router.post("/token", response_model=Token)
async def login_for_access_token(
    username: str = Form(...),
    password: str = Form(...),
    remember_me: bool = Form(False)
):
    user = await database.users.find_one({"email": username})
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expires_minutes = 60 * 24 * 30 if remember_me else ACCESS_TOKEN_EXPIRE_MINUTES
    access_token = create_access_token(
        data={"sub": user["email"], "role": user.get("role", "user")},
        expires_delta=timedelta(minutes=expires_minutes)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/admin/token", response_model=Token)
async def admin_login(
    username: str = Form(...),
    password: str = Form(...),
    admin_secret: str = Form(...),
    remember_me: bool = Form(False)
):
    if admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=400, detail="Invalid admin secret")

    user = await database.users.find_one({"email": username})
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="User is not an admin")

    expires_minutes = 60 * 24 * 30 if remember_me else ACCESS_TOKEN_EXPIRE_MINUTES
    access_token = create_access_token(
        data={"sub": user["email"], "role": user.get("role", "admin")},
        expires_delta=timedelta(minutes=expires_minutes)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserInDB)
async def get_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserInDB)
async def update_me(update_data: UserProfileUpdate, current_user: UserInDB = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        await database.users.update_one({"email": current_user.email}, {"$set": update_dict})
        updated_user = await database.users.find_one({"email": current_user.email})
        return UserInDB(**updated_user)
    return current_user

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.patch("/password")
async def change_password(data: PasswordChangeRequest, current_user: UserInDB = Depends(get_current_user)):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    new_hashed = get_password_hash(data.new_password)
    await database.users.update_one({"email": current_user.email}, {"$set": {"hashed_password": new_hashed}})
    return {"message": "Contraseña actualizada exitosamente"}

@router.delete("/me")
async def delete_account(current_user: UserInDB = Depends(get_current_user)):
    await database.users.delete_one({"email": current_user.email})
    return {"message": "Cuenta eliminada exitosamente"}
