"""
KalaKriti - Main Application Runner
Smart India Hackathon 2026 - SIH26090
"""
import sys
import uvicorn
from backend.config import HOST, PORT

if __name__ == "__main__":
    print("=" * 65)
    print("  KalaKriti - AI Smart Cataloging & Market Linkage")
    print("  Smart India Hackathon 2026 (SIH26090)")
    print("  Ministry of Social Justice & Empowerment (MoSJE)")
    print("=" * 65)
    print(f"\nAccess Web App: http://{HOST}:{PORT}")
    print(f"API Docs / Swagger: http://{HOST}:{PORT}/docs\n")
    print("Press Ctrl+C to stop the server.\n")

    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
