from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db.session import get_db

router = APIRouter()


@router.get("ping-db")
def ping_db(db: Session = Depends(get_db)):
    return {"ok": True}
