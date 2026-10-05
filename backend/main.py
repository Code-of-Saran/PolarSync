"""Entry point: `python main.py` or `uvicorn main:app --reload --port 8000`."""
import os

import uvicorn

from app.main import app  # noqa: F401

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=int(os.environ.get("PORT", "8000")), reload=False)
