from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from schemas import LoginRequest, ChangePassword, UserCreate, UserRead, TokenSchema
import models
from db import get_db
from utils import auth_utils, jwt_bearer

router = APIRouter()


@router.get("/ping-db")
def ping_db(db: Session = Depends(get_db)):
    return {"ok": True}


@router.post("/register", response_model=UserRead)
def register_user(user: UserCreate, session: Session = Depends(get_db)):
    existing_user = session.query(models.User).filter_by(email=user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already registered")

    encrypted_password = auth_utils.get_hashed_password(user.password)
    new_user = models.User(
        email=user.email, full_name=user.full_name, hashed_password=encrypted_password
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


@router.get("/users", response_model=list[UserRead])
def get_users(token: str = Depends(jwt_bearer), db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users


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
