from pydantic import BaseModel, EmailStr
import datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None  # user_id or email
    exp: int | None = None  # expiration timestamp


class RequestDetails(BaseModel):
    email: str
    password: str
    old_password: str | None = None
    new_password: str | None = None


class TokenSchema(BaseModel):
    access_token: str
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
