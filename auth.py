from typing import Optional

from fastapi import APIRouter, Depends

from lib.auth import optional_user
from models.schemas import User

router = APIRouter(prefix="/auth")


@router.get("/me", response_model=Optional[User])
async def me(user: Optional[User] = Depends(optional_user)):
    return user  # null when anonymous — sign-in itself is handled by Clerk (Google)
