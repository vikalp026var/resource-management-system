from fastapi import Depends, HTTPException, status
from utils.jwt_bearer import jwt_bearer, decode_jwt


def require_role(required_roles: list[str]):
    def role_checker(token: str = Depends(jwt_bearer)):
        payload = decode_jwt(token)

        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        if payload.get("role") not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
            )

        return payload

    return role_checker
