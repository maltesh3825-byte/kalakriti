"""
FastAPI Server for AI-Driven Market Linkage & Smart Cataloging
Smart India Hackathon 2026 - SIH26090
Ministry of Social Justice and Empowerment (MoSJE)
"""
import json
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.ai_service import analyze_craft_image_with_gemini, CATEGORIES
from backend.config import STATIC_DIR, UPLOAD_DIR, GEMINI_API_KEY, HOST, PORT
from backend.database import get_db_connection, init_db

# Initialize DB on start
init_db()

app = FastAPI(
    title="KalaKriti - AI Smart Cataloging & Market Linkage",
    description="SIH 2026 (SIH26090) AI-driven platform for marginalized artisans and weavers.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProductCreate(BaseModel):
    name: str
    artisan_name: str
    artisan_phone: Optional[str] = "+919876543210"
    artisan_location: str
    category: str
    price: int
    suggested_price_min: Optional[int] = None
    suggested_price_max: Optional[int] = None
    price_justification: Optional[str] = None
    description_en: str
    description_hi: Optional[str] = ""
    tags: List[str]
    image_url: str
    is_enhanced: Optional[bool] = False
    quantity: int = 1


class UserLogin(BaseModel):
    email: str
    password: str
    role: str = "buyer"


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "buyer"
    phone: Optional[str] = ""
    city: str = ""
    language: str = "en"


class WishlistRequest(BaseModel):
    product_id: int


class OrderCreate(BaseModel):
    user_id: int
    product_id: int
    product_name: str
    quantity: int = 1
    total: int
    status: str = "Confirmed"
    eta: str = "2-4 working days"


class InstitutionalRequestCreate(BaseModel):
    artisan_name: str
    email: str
    phone: str = ""
    location: str = ""
    buyer_type: str = ""
    product_category: str = ""
    quantity: int = 1
    target_market: str = ""
    requirements: str = ""


def normalize_user_row(row):
    user = dict(row)
    user.pop("password", None)
    return user


@app.get("/api/config-status")
def get_config_status():
    """Returns AI model connection status so frontend can display badge."""
    has_gemini = bool(GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE")
    return {
        "status": "ready",
        "has_gemini_key": has_gemini,
        "engine": "Google Gemini Vision 1.5/2.0" if has_gemini else "Smart Cataloging Fallback Engine",
        "hackathon": "Smart India Hackathon 2026 (SIH26090)",
        "ministry": "Ministry of Social Justice & Empowerment (MoSJE)",
    }


@app.get("/health")
def health_check():
    """Lightweight readiness endpoint for hosting providers and monitoring."""
    return {"status": "ok", "service": "kalakriti-api"}


@app.get("/api/categories")
def get_categories():
    """Returns official handicraft categories."""
    return {"categories": CATEGORIES}


@app.post("/api/auth/login")
def login_user(payload: UserLogin):
    """Authenticate a buyer or artisan for the mobile app."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE lower(email) = ? AND password = ?",
        (payload.email.strip().lower(), payload.password),
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"status": "success", "user": normalize_user_row(row)}


@app.post("/api/auth/register")
def register_user(payload: UserCreate):
    """Register a new buyer/seller profile for the app."""
    email = payload.email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE lower(email) = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="User already exists")

    cursor.execute(
        """
        INSERT INTO users (name, email, password, role, phone, city, language)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.name,
            email,
            payload.password,
            payload.role,
            payload.phone or "",
            payload.city or "",
            payload.language or "en",
        ),
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {"status": "success", "user_id": user_id}


@app.get("/api/users/{user_id}")
def get_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return normalize_user_row(row)


@app.get("/api/wishlist/{user_id}")
def get_wishlist(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT product_id FROM wishlist WHERE user_id = ? ORDER BY id DESC",
        (user_id,),
    )
    products = [row[0] for row in cursor.fetchall()]
    conn.close()
    return {"wishlist": products}


@app.post("/api/wishlist/{user_id}")
def add_to_wishlist(user_id: int, item: WishlistRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)",
        (user_id, item.product_id),
    )
    conn.commit()
    conn.close()
    return {"status": "success", "product_id": item.product_id}


@app.delete("/api/wishlist/{user_id}/{product_id}")
def remove_from_wishlist(user_id: int, product_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
        (user_id, product_id),
    )
    conn.commit()
    conn.close()
    return {"status": "success"}


@app.get("/api/orders/{user_id}")
def get_orders(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
        (user_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return {"orders": [dict(r) for r in rows]}


@app.post("/api/orders")
def create_order(payload: OrderCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    requested_quantity = max(1, payload.quantity)
    cursor.execute("SELECT quantity, name, price FROM products WHERE id = ?", (payload.product_id,))
    product_row = cursor.fetchone()
    if not product_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    available_quantity = int(product_row[0] or 0)
    if available_quantity < requested_quantity:
        conn.close()
        raise HTTPException(status_code=409, detail="This product is no longer available in the requested quantity")

    cursor.execute(
        "UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?",
        (requested_quantity, payload.product_id, requested_quantity),
    )
    if cursor.rowcount != 1:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=409, detail="This product was just reserved by another buyer")
    cursor.execute(
        """
        INSERT INTO orders (user_id, product_id, product_name, quantity, total, status, eta)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.user_id,
            payload.product_id,
            payload.product_name,
            requested_quantity,
            payload.total * requested_quantity,
            payload.status,
            payload.eta,
        ),
    )
    order_id = cursor.lastrowid
    conn.commit()
    conn.close()
    remaining_quantity = available_quantity - requested_quantity
    return {"status": "success", "order_id": order_id, "remaining_quantity": remaining_quantity}


@app.post("/api/institutional-requests")
def create_institutional_request(payload: InstitutionalRequestCreate):
    """Store a bulk linkage/RFQ request for follow-up by the KalaKriti team."""
    if not payload.artisan_name.strip() or not payload.email.strip():
        raise HTTPException(status_code=400, detail="Name and email are required")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO institutional_requests (
            artisan_name, email, phone, location, buyer_type,
            product_category, quantity, target_market, requirements
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.artisan_name.strip(),
            payload.email.strip().lower(),
            payload.phone.strip(),
            payload.location.strip(),
            payload.buyer_type.strip(),
            payload.product_category.strip(),
            max(1, payload.quantity),
            payload.target_market.strip(),
            payload.requirements.strip(),
        ),
    )
    request_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"status": "success", "request_id": request_id}


@app.post("/api/analyze-product")
async def analyze_product(
    file: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    price_hint: Optional[float] = Form(None),
):
    """Step 1 & 2: artisan uploads image to analyze craft and pricing."""
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"craft_{uuid.uuid4().hex[:10]}.{ext}"
        saved_path = UPLOAD_DIR / filename

        with open(saved_path, "wb") as f:
            f.write(image_bytes)

        image_url = f"/static/uploads/{filename}"
        ai_result = analyze_craft_image_with_gemini(
            image_bytes=image_bytes,
            artisan_notes=notes,
            artisan_input_price=price_hint,
        )
        ai_result["saved_image_url"] = image_url
        ai_result["original_filename"] = file.filename
        return JSONResponse(content=ai_result)
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to analyze product: {str(exc)}"},
        )


@app.post("/api/products")
def create_product(product: ProductCreate):
    """Publish a reviewed artisan listing to the marketplace."""
    listing_quantity = product.quantity
    if listing_quantity < 1 or listing_quantity > 10:
        raise HTTPException(status_code=400, detail="Each listing must contain between 1 and 10 items")

    conn = get_db_connection()
    cursor = conn.cursor()
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    cursor.execute(
        "SELECT COUNT(*) FROM products WHERE lower(artisan_name) = lower(?) AND substr(created_at, 1, 7) = ?",
        (product.artisan_name.strip(), current_month),
    )
    monthly_listings = cursor.fetchone()[0]
    if monthly_listings >= 3:
        conn.close()
        raise HTTPException(status_code=429, detail="This artisan has used all 3 marketplace listings for this month")

    cursor.execute(
        """
        INSERT INTO products (
            name, artisan_name, artisan_phone, artisan_location,
            category, price, suggested_price_min, suggested_price_max,
            price_justification, description_en, description_hi,
            tags, image_url, is_enhanced, mosje_verified, quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            product.name,
            product.artisan_name,
            product.artisan_phone or "+919876543210",
            product.artisan_location,
            product.category,
            product.price,
            product.suggested_price_min,
            product.suggested_price_max,
            product.price_justification or "",
            product.description_en,
            product.description_hi or "",
            json.dumps(product.tags),
            product.image_url,
            1 if product.is_enhanced else 0,
            1,
            listing_quantity,
        ),
    )

    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {"status": "success", "product_id": new_id, "message": "Product published to marketplace!"}


@app.get("/api/products")
def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    sort: Optional[str] = "newest",
):
    """Public catalog page listing all products with search & category filters."""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM products WHERE quantity > 0"
    params = []

    if category and category != "All":
        query += " AND category = ?"
        params.append(category)

    if search:
        s = f"%{search}%"
        query += " AND (name LIKE ? OR description_en LIKE ? OR artisan_name LIKE ? OR tags LIKE ?)"
        params.extend([s, s, s, s])

    if min_price is not None:
        query += " AND price >= ?"
        params.append(min_price)

    if max_price is not None:
        query += " AND price <= ?"
        params.append(max_price)

    if sort == "price_low":
        query += " ORDER BY price ASC"
    elif sort == "price_high":
        query += " ORDER BY price DESC"
    else:
        query += " ORDER BY id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()

    products = []
    for row in rows:
        p = dict(row)
        try:
            p["tags"] = json.loads(p["tags"]) if isinstance(p["tags"], str) else p["tags"]
        except Exception:
            p["tags"] = [t.strip() for t in str(p["tags"]).split(",") if t.strip()]
        products.append(p)

    conn.close()
    return {"products": products, "total": len(products)}


@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Product not found")

    p = dict(row)
    try:
        p["tags"] = json.loads(p["tags"])
    except Exception:
        p["tags"] = [t.strip() for t in str(p["tags"]).split(",") if t.strip()]

    return p


@app.get("/api/stats")
def get_stats():
    """Returns marketplace summary statistics for the dashboard/pitch."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM products")
    total_products = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT artisan_name) FROM products")
    total_artisans = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT category) FROM products")
    total_clusters = cursor.fetchone()[0]

    conn.close()

    return {
        "total_products": total_products,
        "total_artisans": total_artisans,
        "craft_clusters": total_clusters,
        "mosje_certified_pct": "100%",
    }


# Mount uploads separately because hosted deployments may place them outside
# STATIC_DIR (for example /tmp/uploads on Render's free tier).
app.mount("/static/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def serve_index():
    """Serves the main application page."""
    return FileResponse(STATIC_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn

    print(f"🚀 Starting KalaKriti Artisan App on http://{HOST}:{PORT}")
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
