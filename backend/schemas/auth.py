from pydantic import BaseModel, EmailStr
import datetime
from typing import Optional


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = None  # user_id or email
    exp: Optional[int] = None  # expiration timestamp


class RequestDetails(BaseModel):
    email: str
    password: str
    old_password: Optional[str] = None
    new_password: Optional[str] = None


class TokenSchema(BaseModel):
    access_token: str
    refresh_token: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ChangePassword(BaseModel):
    email: str
    old_password: str
    new_password: str


class TokenCreate(BaseModel):
    user_id: str
    access_token: str
    refresh_token: str
    status: bool
    created_date: datetime.datetime
