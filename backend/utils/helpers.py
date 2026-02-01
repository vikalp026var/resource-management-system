from sqlalchemy.orm import Session
from models import User
from constant import constant


def generate_employee_id(db: Session):
    last_user = (
        db.query(User)
        .filter(User.employee_id.isnot(None))
        .filter(User.employee_id.like(f"{constant.EMPLOYEE_ID_PREFIX}%"))
        .order_by(User.employee_id.desc())
        .first()
    )

    if last_user and last_user.employee_id:
        last_number = int(
            last_user.employee_id.replace(constant.EMPLOYEE_ID_PREFIX, "")
        )
        new_number = last_number + 1
    else:
        new_number = 51020

    return f"{constant.EMPLOYEE_ID_PREFIX}{new_number}"
