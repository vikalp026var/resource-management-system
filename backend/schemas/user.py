from pydantic import BaseModel, EmailStr
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr
    fullName: Optional[str] = None
    employee_id: Optional[str] = None


class UserCreate(UserBase):
    password: str
    confirmPassword: str


class UserRead(UserBase):
    id: int
    employee_id: Optional[str]
    is_active: bool
    role: str
    is_superuser: bool

    class Config:
        from_attributes = True
