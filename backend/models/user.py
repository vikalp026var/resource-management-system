from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
import datetime
from db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(String(50), default="employee")
    is_superuser = Column(Boolean, default=False)


class TokenTable(Base):
    __tablename__ = "token"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    access_token = Column(String(450), primary_key=True)
    refresh_token = Column(String(450), nullable=False)
    status = Column(Boolean)
    created_date = Column(DateTime, default=datetime.datetime.now)
