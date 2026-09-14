import os
from pydantic import BaseModel

class Settings(BaseModel):
    DEV_MODE: bool = os.getenv("DEV_MODE", "true").lower() == "true"
    CONVEX_URL: str = os.getenv("CONVEX_URL", "http://localhost:3210")
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    MAPPLS_API_KEY: str = os.getenv("MAPPLS_API_KEY", "")

settings = Settings()
