import os
from dotenv import load_dotenv

load_dotenv()


class Constant:
    def __init__(self):
        self.ACCESS_TOKEN_EXPIRE_MINUTES = 30
        self.REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
        self.ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
        self.JWT_SECRET_KEY = os.getenv(
            "JWT_SECRET_KEY", "narscbjim@$@&^@&%^&RFghgjvbdsha"
        )
        self.JWT_REFRESH_SECRET_KEY = os.getenv(
            "JWT_REFRESH_SECRET_KEY", "13ugfdfgh@#$%^@&jkl45678902"
        )


constant = Constant()
