from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Union, Any
from jose import jwt
from constant import constant


class AuthUtils:
    def __init__(self):
        self.password_context = CryptContext(schemes=["argon2"], deprecated="auto")

    def get_hashed_password(self, password: str) -> str:
        return self.password_context.hash(password)

    def verify_password(self, password: str, hashed_pass: str) -> bool:
        return self.password_context.verify(password, hashed_pass)

    def create_access_token(
        self, user_id: Union[str, int], role: str = None, expires_delta=None
    ):
        expire = datetime.utcnow() + timedelta(
            minutes=constant.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        to_encode = {"sub": str(user_id), "exp": expire}
        if role:
            to_encode["role"] = role
        return jwt.encode(to_encode, constant.JWT_SECRET_KEY, constant.ALGORITHM)

    def create_refresh_token(
        self, subject: Union[str, Any], expires_delta: int = None
    ) -> str:
        if expires_delta is not None:
            expires_delta = datetime.utcnow() + expires_delta
        else:
            expires_delta = datetime.utcnow() + timedelta(
                minutes=constant.REFRESH_TOKEN_EXPIRE_MINUTES
            )

        to_encode = {"exp": expires_delta, "sub": str(subject)}
        encoded_jwt = jwt.encode(
            to_encode, constant.JWT_REFRESH_SECRET_KEY, constant.ALGORITHM
        )

        return encoded_jwt


auth_utils = AuthUtils()
