from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from schemas import (
    LoginRequest,
    ChangePassword,
    UserCreate,
    UserRead,
    TokenSchema,
    RefreshTokenRequest,
)
import models
from db import get_db
from utils import auth_utils, jwt_bearer, decode_jwt
from jose import jwt
from constant import constant
from typing import List
from utils import generate_employee_id

router = APIRouter()


@router.get("/ping-db")
def ping_db(db: Session = Depends(get_db)):
    return {"ok": True}


@router.post("/register", response_model=UserRead)
def register_user(user: UserCreate, session: Session = Depends(get_db)):
    existing_user = session.query(models.User).filter_by(email=user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already registered")

    # Validate password confirmation
    if user.password != user.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    employee_id = generate_employee_id(session)

    encrypted_password = auth_utils.get_hashed_password(user.password)
    new_user = models.User(
        email=user.email,
        fullName=user.fullName,
        employee_id=employee_id,
        hashed_password=encrypted_password,
        role="employee",
        is_superuser=False,
        is_active=True,
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return new_user


@router.post("/login", response_model=TokenSchema)
def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email"
        )

    real_password = user.hashed_password
    if not auth_utils.verify_password(request.password, real_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect password"
        )

    access_token = auth_utils.create_access_token(user.id, user.role)
    refresh_token = auth_utils.create_refresh_token(user.id)

    token_db = models.TokenTable(
        user_id=user.id,
        access_token=access_token,
        refresh_token=refresh_token,
        status=True,
    )

    db.add(token_db)
    db.commit()
    db.refresh(token_db)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
    }


@router.post("/refresh", response_model=TokenSchema)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        refresh_token = request.refresh_token

        payload = jwt.decode(
            refresh_token,
            constant.JWT_REFRESH_SECRET_KEY,
            algorithms=[constant.ALGORITHM],
        )
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
            )

        token_record = (
            db.query(models.TokenTable)
            .filter(
                models.TokenTable.refresh_token == refresh_token,
                models.TokenTable.status,
            )
            .first()
        )

        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
            )

        user = db.query(models.User).filter(models.User.id == int(user_id)).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        new_access_token = auth_utils.create_access_token(user.id, user.role)

        token_record.access_token = new_access_token
        db.commit()

        return {"access_token": new_access_token, "refresh_token": refresh_token}
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.get("/me", response_model=UserRead)
def get_current_user(token: str = Depends(jwt_bearer), db: Session = Depends(get_db)):
    """Get current logged-in user info"""
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return user


@router.post("/change_password")
def change_password(
    request: ChangePassword,
    dependencies=Depends(jwt_bearer),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User not found"
        )

    if not auth_utils.verify_password(request.old_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid old password"
        )

    encrypted_password = auth_utils.get_hashed_password(request.new_password)
    user.hashed_password = encrypted_password
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/logout")
def logout(token: str = Depends(jwt_bearer), db: Session = Depends(get_db)):
    token_record = (
        db.query(models.TokenTable)
        .filter(models.TokenTable.access_token == token)
        .first()
    )
    if token_record:
        token_record.status = False
        db.commit()
    return {"message": "Logout successfully"}


@router.get("/users", response_model=List[UserRead])
def get_all_users(
    db: Session = Depends(get_db),
    current_token: str = Depends(jwt_bearer),
):
    """Get all users"""

    payload = decode_jwt(current_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    user_id = payload.get("sub")
    current_user = db.query(models.User).filter(models.User.id == int(user_id)).first()

    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if current_user.role != "admin" and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this resource",
        )

    users = db.query(models.User).all()
    return users


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str,
    is_superuser: bool = False,
    db: Session = Depends(get_db),
    current_token: str = Depends(jwt_bearer),
):
    """Update user role"""
    payload = decode_jwt(current_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    current_user_id = payload.get("sub")
    current_user = (
        db.query(models.User).filter(models.User.id == int(current_user_id)).first()
    )

    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if current_user.role != "admin" and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this resource",
        )

    if role not in constant.VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role . Must be one of: " + ", ".join(constant.VALID_ROLES),
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    user.role = role
    user.is_superuser = is_superuser
    db.commit()
    db.refresh(user)
    return {
        "message": "User role updated successfully",
        "user": {
            "id": user.id,
            "employee_id": user.employee_id,
            "email": user.email,
            "fullName": user.fullName,
            "role": user.role,
            "is_superuser": user.is_superuser,
        },
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_token: str = Depends(jwt_bearer),
):
    """Delete user"""
    payload = decode_jwt(current_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    current_user_id = payload.get("sub")
    current_user = (
        db.query(models.User).filter(models.User.id == int(current_user_id)).first()
    )
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if current_user.role != "admin" and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this resource",
        )

    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if user_to_delete.id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete yourself"
        )

    if user_to_delete.role == "admin" or user_to_delete.role == "hr":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete an admin user",
        )

    db.query(models.TokenTable).filter(models.TokenTable.user_id == user_id).delete()
    db.delete(user_to_delete)
    db.commit()
    return {"message": f"User {user_to_delete.fullName} deleted successfully"}
