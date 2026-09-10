"""
Application Configuration
Smart India Hackathon 2026 - SIH26090
"""
import os
import socket
from pathlib import Path
from dotenv import load_dotenv

# Base Directory paths
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = Path(os.getenv("STATIC_DIR", str(BASE_DIR / "static")))
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(STATIC_DIR / "uploads")))

# Ensure upload directory exists
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Load .env file
load_dotenv(BASE_DIR / ".env")


def find_available_port(start_port: int, host: str = "0.0.0.0", max_tries: int = 20) -> int:
    """Return the first free port starting from start_port."""
    port = start_port
    for _ in range(max_tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind((host, port))
                return port
            except OSError:
                port += 1
    raise RuntimeError(f"No available port found starting at {start_port}.")


# =========================================================================
# 🔑 API KEY CONFIGURATION
# You can set your GEMINI_API_KEY in the `.env` file or export it as an env var.
# Keep credentials out of source control. Set GEMINI_API_KEY in `.env` or
# provide it through the process environment when deploying.
# =========================================================================
# >>> PASTE YOUR KEY HERE IF NOT USING .ENV <<<
DEFAULT_HARDCODED_KEY = ""

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", DEFAULT_HARDCODED_KEY).strip()

# Gemini Model endpoint: use a currently supported model for new users.
# Example: gemini-3.6-flash
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

# Application Settings
# Bind on all interfaces so a phone on the same Wi-Fi can reach the API.
HOST = os.getenv("HOST", "0.0.0.0")
configured_port = os.getenv("PORT")
PORT = int(configured_port) if configured_port else find_available_port(8000, HOST)
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(BASE_DIR / "artisan_catalog.db")))
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "kalasetu123.4@gmail.com").strip().lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "K123@nm")
