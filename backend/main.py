"""
FastAPI Server for AI-Driven Market Linkage & Smart Cataloging
Smart India Hackathon 2026 - SIH26090
Ministry of Social Justice and Empowerment (MoSJE)
"""
import json
import uuid
import hashlib
import hmac
import os
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.ai_service import analyze_craft_image_with_gemini, CATEGORIES
from backend.config import STATIC_DIR, UPLOAD_DIR, GEMINI_API_KEY, HOST, PORT, ADMIN_EMAIL, ADMIN_PASSWORD
from backend.database import get_db_connection, init_db

# Initialize DB on start
init_db()

app = FastAPI(
    title="KalaSetu - AI Smart Cataloging & Market Linkage",
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
    image_gallery: Optional[List[str]] = []
    rating: Optional[float] = 4.5
    reviews: Optional[List[dict]] = []
    is_enhanced: Optional[bool] = False
    quantity: int = 1


class ProductReviewCreate(BaseModel):
    user_name: str = "Verified Buyer"
    rating: float = 5.0
    comment: str = ""


class UserLogin(BaseModel):
    email: str
    password: str
    role: Optional[str] = None


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "buyer"
    phone: Optional[str] = ""
    city: str = ""
    language: str = "en"
    business_name: Optional[str] = ""
    gst_number: Optional[str] = ""
    udyam_number: Optional[str] = ""
    document_verification_status: Optional[str] = "pending"
    bank_status: Optional[str] = "not_uploaded"
    profile_completion: Optional[float] = 0.25


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


class CancelOrderRequest(BaseModel):
    reason: str = ""


class InstitutionalRequestCreate(BaseModel):
    artisan_name: str
    email: str
    phone: str = ""
    location: str = ""
    product_category: str = ""
    quantity: int = 1
    unit_price: float = 0
    lead_time: str = ""
    target_buyer: str = "Open to all"
    target_market: str = "Open to all"
    requirements: str = ""


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminRequestUpdate(BaseModel):
    status: str
    admin_notes: str = ""


class OfflineSyncRequest(BaseModel):
    drafts: List[InstitutionalRequestCreate] = []


def normalize_user_row(row):
    user = dict(row)
    user.pop("password", None)
    return user


def create_admin_token(email: str) -> str:
    secret = os.getenv("ADMIN_TOKEN_SECRET", ADMIN_PASSWORD)
    return hmac.new(secret.encode(), email.encode(), hashlib.sha256).hexdigest()


def require_admin(token: Optional[str]):
    expected = create_admin_token(ADMIN_EMAIL)
    if not token or not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=401, detail="Admin authentication required")


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


@app.post("/api/admin/login")
def admin_login(payload: AdminLogin):
    if payload.email.strip().lower() != ADMIN_EMAIL or not hmac.compare_digest(payload.password, ADMIN_PASSWORD):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    return {"status": "success", "admin": {"email": ADMIN_EMAIL}, "admin_token": create_admin_token(ADMIN_EMAIL)}


@app.post("/api/auth/register")
def register_user(payload: UserCreate):
    """Register a new buyer/seller profile for the app with onboarding profile fields."""
    email = payload.email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE lower(email) = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="User already exists")

    cursor.execute(
        """
        INSERT INTO users (name, email, password, role, phone, city, language,
                            business_name, gst_number, udyam_number,
                            document_verification_status, bank_status, profile_completion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.name,
            email,
            payload.password,
            payload.role,
            payload.phone or "",
            payload.city or "",
            payload.language or "en",
            payload.business_name or "",
            payload.gst_number or "",
            payload.udyam_number or "",
            payload.document_verification_status or "pending",
            payload.bank_status or "not_uploaded",
            payload.profile_completion or 0.25,
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


@app.get("/api/orders/{user_id}/incoming")
def get_incoming_orders(user_id: int):
    """Orders placed by buyers for products belonging to this artisan."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT orders.*, users.name AS buyer_name, users.email AS buyer_email
        FROM orders
        JOIN products ON products.id = orders.product_id
        LEFT JOIN users ON users.id = orders.user_id
        WHERE lower(products.artisan_name) = lower((SELECT name FROM users WHERE id = ?))
        ORDER BY orders.id DESC
        """,
        (user_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return {"orders": [dict(row) for row in rows]}


@app.get("/api/notifications/{user_id}")
def get_notifications(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 100",
        (user_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return {"notifications": [dict(row) for row in rows]}


@app.post("/api/notifications/{user_id}/read")
def mark_notifications_read(user_id: int):
    conn = get_db_connection()
    conn.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}


@app.post("/api/orders")
def create_order(payload: OrderCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    requested_quantity = max(1, payload.quantity)
    cursor.execute("SELECT quantity, artisan_name, name, price FROM products WHERE id = ?", (payload.product_id,))
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
    cursor.execute(
        "SELECT id FROM users WHERE lower(name) = lower(?) AND role = 'artisan' LIMIT 1",
        (product_row[1],),
    )
    artisan_row = cursor.fetchone()
    if artisan_row:
        cursor.execute(
            "INSERT INTO notifications (user_id, kind, title, message, related_id) VALUES (?, ?, ?, ?, ?)",
            (
                artisan_row[0],
                "buyer_order",
                "New buyer order request",
                f"A buyer requested {requested_quantity} unit(s) of {payload.product_name}.",
                order_id,
            ),
        )
    conn.commit()
    conn.close()
    remaining_quantity = available_quantity - requested_quantity
    return {"status": "success", "order_id": order_id, "remaining_quantity": remaining_quantity}


@app.post("/api/orders/{order_id}/cancel")
def cancel_order(order_id: int, payload: CancelOrderRequest):
    """Cancel an order by record, restore tracked quantity and add a cancellation notice to the buyer profile."""
    reason = payload.reason.strip() if payload.reason else ""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, product_id, product_name, quantity, status FROM orders WHERE id = ?",
        (order_id,),
    )
    order_row = cursor.fetchone()
    if not order_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Order not found")

    if str(order_row["status"]).lower() == "cancelled":
        conn.close()
        raise HTTPException(status_code=409, detail="Order is already cancelled")

    cursor.execute(
        "UPDATE orders SET status = 'Cancelled', cancel_reason = ?, cancelled_at = ? WHERE id = ?",
        (reason, datetime.now(timezone.utc).isoformat(), order_id),
    )
    cursor.execute(
        "UPDATE products SET quantity = quantity + ? WHERE id = ?",
        (int(order_row["quantity"]), int(order_row["product_id"])),
    )
    cursor.execute(
        "INSERT INTO notifications (user_id, kind, title, message, related_id) VALUES (?, ?, ?, ?, ?)",
        (
            int(order_row["user_id"]),
            "order_cancelled",
            "Order cancelled",
            f"Order #{order_id} for {order_row['product_name']} was cancelled. Reversal restored {order_row['quantity']} unit(s).{(' Reason: ' + reason) if reason else ''}",
            order_id,
        ),
    )
    conn.commit()
    conn.close()
    return {"status": "success", "order_id": order_id, "restored_quantity": int(order_row["quantity"]), "reason": reason}


def persist_institutional_request(payload: InstitutionalRequestCreate):
    """Shared DB persistence for institutional RFQ payloads, including offline queue replay."""
    if not payload.artisan_name.strip() or not payload.email.strip():
        raise HTTPException(status_code=400, detail="Name and email are required")

    quality_flags = []
    if not payload.phone.strip():
        quality_flags.append("Missing phone or WhatsApp number")
    if not payload.location.strip():
        quality_flags.append("Missing artisan location")
    if not payload.product_category.strip():
        quality_flags.append("Missing product category")
    if not payload.requirements.strip() or len(payload.requirements.strip()) < 12:
        quality_flags.append("Requirements are too vague")
    if payload.quantity < 1:
        quality_flags.append("Quantity must be at least 1")

    target_buyer = payload.target_buyer.strip() or payload.target_market.strip() or "Open to all"
    target_market = payload.target_market.strip() or target_buyer

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO institutional_requests (
            artisan_name, email, phone, location,
            product_category, quantity, unit_price, lead_time,
            target_buyer, target_market, requirements, quality_flags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.artisan_name.strip(),
            payload.email.strip().lower(),
            payload.phone.strip(),
            payload.location.strip(),
            payload.product_category.strip(),
            max(1, payload.quantity),
            payload.unit_price,
            payload.lead_time.strip(),
            target_buyer,
            target_market,
            payload.requirements.strip(),
            "; ".join(quality_flags),
        ),
    )
    request_id = cursor.lastrowid
    cursor.execute(
        "SELECT id FROM users WHERE lower(name) = lower(?) LIMIT 1",
        (payload.artisan_name.strip(),),
    )
    owner_row = cursor.fetchone()
    if owner_row:
        cursor.execute(
            "INSERT INTO notifications (user_id, kind, title, message, related_id) VALUES (?, ?, ?, ?, ?)",
            (
                owner_row[0],
                "bulk_request",
                "Bulk request submitted",
                f"Your {target_market} request for {max(1, payload.quantity)} unit(s) is pending review.",
                request_id,
            ),
        )
    conn.commit()
    conn.close()
    return {"status": "success", "request_id": request_id, "quality_flags": quality_flags}


@app.post("/api/institutional-requests")
def create_institutional_request(payload: InstitutionalRequestCreate):
    """Store a bulk linkage/RFQ request for follow-up by the KalaSetu team."""
    return persist_institutional_request(payload)


@app.post("/api/offline/sync")
def sync_offline_drafts(payload: OfflineSyncRequest):
    """Accept a lightweight local queue of offline RFQ drafts and persist them through the same path as online requests."""
    saved = []
    for draft in payload.drafts:
        try:
            result = persist_institutional_request(draft)
            saved.append(result)
        except HTTPException as exc:
            saved.append({"status": "error", "detail": str(exc.detail)})
    return {"status": "success", "synced": len(saved), "drafts": saved}


@app.get("/api/admin/institutional-requests")
def admin_list_institutional_requests(x_admin_token: Optional[str] = Header(None)):
    require_admin(x_admin_token)
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM institutional_requests ORDER BY id DESC").fetchall()
    conn.close()
    return {"requests": [dict(row) for row in rows]}


@app.patch("/api/admin/institutional-requests/{request_id}")
def admin_update_institutional_request(request_id: int, payload: AdminRequestUpdate, x_admin_token: Optional[str] = Header(None)):
    require_admin(x_admin_token)
    allowed_statuses = {"New", "In Review", "Approved", "Rejected"}
    if payload.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid moderation status")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE institutional_requests SET status = ?, admin_notes = ? WHERE id = ?", (payload.status, payload.admin_notes.strip(), request_id))
    if cursor.rowcount != 1:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")
    conn.commit()
    conn.close()
    return {"status": "success", "request_id": request_id}


@app.get("/api/institutional-requests/{user_id}")
def get_institutional_requests(user_id: int):
    """Return bulk requests submitted for the signed-in artisan."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT institutional_requests.*
        FROM institutional_requests
        JOIN users ON lower(users.name) = lower(institutional_requests.artisan_name)
        WHERE users.id = ?
        ORDER BY institutional_requests.id DESC
        """,
        (user_id,),
    )
    rows = cursor.fetchall()
    conn.close()
    return {"requests": [dict(row) for row in rows]}


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

    gallery_json = json.dumps(product.image_gallery or [product.image_url])
    reviews_json = json.dumps(product.reviews or [])
    cursor.execute(
        """
        INSERT INTO products (
            name, artisan_name, artisan_phone, artisan_location,
            category, price, suggested_price_min, suggested_price_max,
            price_justification, description_en, description_hi,
            tags, image_url, image_gallery, rating, reviews,
            is_enhanced, mosje_verified, quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            gallery_json,
            product.rating or 4.5,
            reviews_json,
            1 if product.is_enhanced else 0,
            1,
            listing_quantity,
        ),
    )

    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {"status": "success", "product_id": new_id, "message": "Product published to marketplace!"}


@app.post("/api/products/{product_id}/reviews")
def add_product_review(product_id: int, payload: ProductReviewCreate):
    """Add a marketplace product review with a review text and rating."""
    if not 1 <= payload.rating <= 5:
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5")
    if not payload.comment.strip():
        raise HTTPException(status_code=422, detail="Review comment is required")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT reviews, rating FROM products WHERE id = ?", (product_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    raw_reviews = json.loads(row["reviews"] or "[]") if isinstance(row["reviews"], str) else (row["reviews"] or [])
    review = {
        "user_name": payload.user_name.strip() or "Verified Buyer",
        "rating": round(float(payload.rating), 1),
        "comment": payload.comment.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    raw_reviews.append(review)

    ratings = [float(item.get("rating", 4.5)) for item in raw_reviews if isinstance(item, dict) and item.get("rating") is not None]
    average_rating = round(sum(ratings) / len(ratings), 1) if ratings else 4.5

    cursor.execute(
        "UPDATE products SET reviews = ?, rating = ? WHERE id = ?",
        (json.dumps(raw_reviews), average_rating, product_id),
    )
    conn.commit()
    conn.close()

    return {"status": "success", "product_id": product_id, "rating": average_rating, "reviews": raw_reviews}


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
        try:
            p["image_gallery"] = json.loads(p["image_gallery"]) if isinstance(p["image_gallery"], str) else (p["image_gallery"] or [])
        except Exception:
            p["image_gallery"] = []
        try:
            p["reviews"] = json.loads(p["reviews"]) if isinstance(p["reviews"], str) else (p["reviews"] or [])
        except Exception:
            p["reviews"] = []
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
    try:
        p["image_gallery"] = json.loads(p["image_gallery"]) if isinstance(p["image_gallery"], str) else (p["image_gallery"] or [])
    except Exception:
        p["image_gallery"] = []
    try:
        p["reviews"] = json.loads(p["reviews"]) if isinstance(p["reviews"], str) else (p["reviews"] or [])
    except Exception:
        p["reviews"] = []

    return p


@app.get("/api/export/gem-csv")
def export_gem_csv():
    """Expose a basic GeM-ready CSV payload from the product catalog."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, artisan_name, artisan_location, category, price, quantity, description_en, image_url FROM products ORDER BY id DESC"
    )
    rows = cursor.fetchall()
    conn.close()

    header = ["id", "name", "artisan_name", "artisan_location", "category", "price", "quantity", "description_en", "image_url"]
    lines = [",".join(header)]
    for row in rows:
        values = [str(row[idx]) if row[idx] is not None else "" for idx in range(len(header))]
        lines.append(",".join(values))
    return PlainTextResponse("\n".join(lines), media_type="text/csv")


@app.get("/api/export/ondc")
def export_ondc():
    """Expose an ONDC/Beckn-style JSON payload from the catalog and institutional request data."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, artisan_name, category, price, quantity FROM products ORDER BY id DESC LIMIT 25")
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()
    payload = {
        "context": {
            "domain": "ONDC:RET10",
            "country": "IND",
            "city": "IND",
            "action": "search",
            "version": "1.1.0",
            "bap_id": "kalakriti.app",
        },
        "catalog": products,
        "export_type": "ONDC_Beckn_Ready",
    }
    return JSONResponse(payload)


@app.get("/api/users/{user_id}/documents")
def get_document_verification(user_id: int):
    """Return verification readiness for onboarding fields such as Udyam, GST, bank, and profile documents."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, role, business_name, gst_number, udyam_number, document_verification_status, bank_status, profile_completion FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": row[0],
        "name": row[1],
        "email": row[2],
        "role": row[3],
        "business_name": row[4] or "",
        "gst_number": row[5] or "",
        "udyam_number": row[6] or "",
        "document_verification_status": row[7] or "pending",
        "bank_status": row[8] or "not_uploaded",
        "profile_completion": row[9] or 0.25,
        "required_documents": [
            "Udyam registration or artisan identity proof",
            "GST or business registration",
            "Bank passbook / bank account proof",
            "Product category and inventory declaration",
        ],
    }


@app.get("/api/users/{user_id}/business-advisor")
def get_ai_business_advisor(user_id: int):
    """Return AI-style business manager guidance for inventory, pricing, demand, and export opportunities."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, role FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    cursor.execute("SELECT COUNT(*) FROM products WHERE artisan_name IN (SELECT name FROM users WHERE id = ?)", (user_id,))
    product_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM orders WHERE user_id = ?", (user_id,))
    order_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM institutional_requests WHERE email = (SELECT email FROM users WHERE id = ?)", (user_id,))
    request_count = cursor.fetchone()[0]
    conn.close()

    return {
        "status": "ready",
        "role": user[1],
        "business_health": "positive",
        "recommended_actions": [
            "Refresh product photos and add GST/HSN-ready descriptions.",
            "Bundle similar products for bulk institutional requests.",
            "Create a catalog export for GeM or ONDC readiness.",
            "Re-run pricing with raw material and lead-time assumptions.",
        ],
        "metrics": {
            "inventory_products": product_count,
            "orders": order_count,
            "rfqs": request_count,
            "export_readiness": "partial",
        },
        "opportunities": [
            "Government procurement",
            "Corporate gifting",
            "Retail cluster demand",
            "Festival collection bundles",
        ],
    }


@app.get("/api/users/{user_id}/dashboard")
def get_dashboard(user_id: int):
    """Return analytics-like dashboard metrics and inventory/order trends for the dashboard experience."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, role, email, name FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    cursor.execute("SELECT COUNT(*) FROM products WHERE artisan_name = ?", (user[3],))
    product_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM orders WHERE user_id = ?", (user_id,))
    order_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM institutional_requests WHERE artisan_name = ?", (user[3],))
    request_count = cursor.fetchone()[0]
    cursor.execute("SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = ?", (user_id,))
    spend_total = cursor.fetchone()[0] or 0
    conn.close()

    return {
        "user_id": user[0],
        "name": user[3],
        "role": user[1],
        "email": user[2],
        "analytics": {
            "total_products": product_count,
            "orders": order_count,
            "institutional_requests": request_count,
            "estimated_order_value": spend_total,
            "export_readiness": "GeM/ONDC ready",
            "inventory_quality_score": "88%",
            "language_support": "en, hi",
        },
        "business_alerts": [
            "Follow up on pending institutional RFQs",
            "Export product catalog to GeM/ONDC",
            "Review missing GST/HSN classification",
            "Sync offline product drafts",
        ],
    }


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

    print(f"🚀 Starting KalaSetu Artisan App on http://{HOST}:{PORT}")
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
