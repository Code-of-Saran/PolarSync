import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
DATA_DIR = Path(os.environ.get("POLARSYNC_DATA_DIR", BASE_DIR / "data"))
DB_PATH = str(DATA_DIR / "polarsync.db")
UPLOAD_DIR = DATA_DIR / "uploads"

CORS_ORIGINS = os.environ.get(
    "POLARSYNC_CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

MAX_UPLOAD_MB = int(os.environ.get("POLARSYNC_MAX_UPLOAD_MB", "200"))
