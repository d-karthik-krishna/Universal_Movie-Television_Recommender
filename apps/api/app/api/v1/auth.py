from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import os
import uuid
from pathlib import Path
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, Token, UserUpdate
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    # Check email
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Check username
    result = await db.execute(select(User).where(User.username == user_in.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already registered")
        
    # Create user
    user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        display_name=user_in.username
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    # Authenticate (form_data.username can be email or username for our implementation)
    result = await db.execute(select(User).where((User.username == form_data.username) | (User.email == form_data.username)))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Generate token
    access_token = create_access_token(subject=str(user.id))
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserRead)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_user)]
):
    return current_user

@router.patch("/me", response_model=UserRead)
async def update_users_me(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    update_data = user_update.model_dump(exclude_unset=True)
    
    if "username" in update_data:
        # Check if username is already taken by someone else
        result = await db.execute(select(User).where(User.username == update_data["username"], User.id != current_user.id))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username is already taken")
            
    for key, value in update_data.items():
        setattr(current_user, key, value)
        
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/me/avatar", response_model=UserRead)
async def upload_avatar(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    ext = Path(file.filename).suffix
    if not ext:
        ext = ".jpg"
        
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = Path("uploads") / filename
    
    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())
        
    # Assuming API is running on localhost:8000, we should return a relative URL or absolute URL.
    # In nextjs, we can just use the absolute backend URL, but to be simple, let's just return
    # the relative URL and the frontend can append API_URL, or we return the full URL.
    # Actually, returning a relative URL like /uploads/filename is fine.
    
    avatar_url = f"http://localhost:8000/uploads/{filename}"
    
    # We should detect if the environment has a specific public URL, but hardcoding for localhost is okay
    # for this local setup, since the frontend uses http://localhost:8000
    from app.config import get_settings
    settings = get_settings()
    
    # Check if there is a frontend URL or use localhost
    # Let's just use localhost:8000
    
    setattr(current_user, "avatar_url", avatar_url)
    await db.commit()
    await db.refresh(current_user)
    return current_user
