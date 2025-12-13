import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from models import TokenTable
from db import get_db
from constant import constant


def decode_jwt(jwtoken: str):
    try:
        payload = jwt.decode(
            jwtoken, constant.JWT_SECRET_KEY, algorithms=[constant.ALGORITHM]
        )
        return payload
    except InvalidTokenError:
        return None


class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request, db: Session = Depends(get_db)):
        credentials: HTTPAuthorizationCredentials = await super(
            JWTBearer, self
        ).__call__(request)

        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(
                    status_code=403, detail="Invalid authentication scheme."
                )

            if not self.verify_jwt(credentials.credentials, db):
                raise HTTPException(
                    status_code=403, detail="Invalid token or expired token."
                )

            return credentials.credentials
        else:
            raise HTTPException(status_code=403, detail="Invalid authorization code.")

    def verify_jwt(self, jwtoken: str, db: Session) -> bool:
        try:
            payload = decode_jwt(jwtoken)
            if not payload:
                return False

            # Check if token exists in database and is active
            token_record = (
                db.query(TokenTable)
                .filter(TokenTable.access_token == jwtoken, TokenTable.status.is_(True))
                .first()
            )

            return token_record is not None
        except Exception as e:
            raise e


jwt_bearer = JWTBearer()
