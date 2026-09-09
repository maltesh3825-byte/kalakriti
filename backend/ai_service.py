"""
AI Vision & Smart Cataloging Engine
Smart India Hackathon 2026 - SIH26090
Powered by Google Gemini Vision with Fallback Heuristic Engine
"""
import base64
import hashlib
import json
import logging
import re
from pathlib import Path
from typing import Dict, Any, Optional
import requests
from PIL import Image
import io

from backend.config import GEMINI_API_KEY, GEMINI_API_URL, GEMINI_MODEL

logger = logging.getLogger("artisan_ai")
logging.basicConfig(level=logging.INFO)

# Canonical Handicraft Categories (aligned with Ministry of Social Justice & Empowerment / TRIFED)
CATEGORIES = [
    "Handloom & Textiles",
    "Pottery & Terracotta",
    "Brass & Metalcraft",
    "Cane & Bamboo",
    "Woodcraft",
    "Tribal Jewelry",
    "Leather Craft",
    "Folk Art & Painting",
    "Stone Carving"
]

def encode_image_to_base64(image_bytes: bytes) -> str:
    """Encodes raw image bytes to base64 string."""
    return base64.b64encode(image_bytes).decode("utf-8")

def detect_mime_type(image_bytes: bytes) -> str:
    """Determine MIME type using PIL or signature header."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        fmt = (img.format or "JPEG").lower()
        if fmt in ["jpg", "jpeg"]:
            return "image/jpeg"
        elif fmt == "png":
            return "image/png"
        elif fmt == "webp":
            return "image/webp"
        return f"image/{fmt}"
    except Exception:
        return "image/jpeg"

def clean_json_response(raw_text: str) -> Dict[str, Any]:
    """Strip markdown code blocks and parse JSON safely."""
    cleaned = raw_text.strip()
    # Remove markdown ```json and ```
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    
    # Extract first JSON object if surrounded by prose
    json_match = re.search(r'(\{[\s\S]*\})', cleaned)
    if json_match:
        cleaned = json_match.group(1)

    return json.loads(cleaned)

def analyze_craft_image_with_gemini(
    image_bytes: bytes,
    artisan_notes: Optional[str] = None,
    artisan_input_price: Optional[float] = None
) -> Dict[str, Any]:
    """
    Main AI Vision analyzer.
    1. Checks if GEMINI_API_KEY is configured.
    2. Calls Gemini Vision API.
    3. If unavailable, gracefully falls back to Heuristic Engine.
    """
    if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
        logger.warning("No valid GEMINI_API_KEY found. Falling back to Smart Cataloging Engine.")
        return generate_heuristic_craft_catalog(image_bytes, artisan_notes, artisan_input_price, "API Key not configured in .env")

    mime_type = detect_mime_type(image_bytes)
    base64_data = encode_image_to_base64(image_bytes)

    prompt = f"""
You are the AI Virtual Business Manager for rural and marginalized Indian artisans and weavers under the Ministry of Social Justice and Empowerment (MoSJE).
Your mission is to empower low-literacy artisans by analyzing their handmade craft photo and auto-generating an e-commerce catalog entry that commands fair market value.

Context from artisan (if any):
- Artisan Voice/Text Notes: "{artisan_notes or 'None provided'}"
- Artisan Self-Price Idea: "{artisan_input_price or 'Not specified'}"

Analyze the product image with high attention to Indian heritage craftsmanship (handloom, terracotta, metal, bamboo, wood, embroidery, etc.).

Return ONLY a valid JSON object matching this exact schema:
{{
  "category": "Pick exactly one from: {', '.join(CATEGORIES)}",
  "suggested_title": "Concise, SEO-optimized title in English (e.g., 'Hand-Carved Sheesham Wood Elephant Figurine')",
  "tags": ["3 to 5 relevant tags like 'Handmade', 'EcoFriendly', 'BastarArt', 'Terracotta']",
  "description_en": "2-3 sentences. Highlighting traditional craftsmanship, natural materials, authentic cultural technique, and home utility.",
  "description_hi": "A warm, natural Hindi translation of the description in Devanagari script for local and regional reach.",
  "pricing": {{
    "fair_min": 450,
    "fair_max": 750,
    "suggested": 600,
    "justification": "Clear, simple explanation of why this price is fair based on craftsmanship complexity, estimated labor hours, and raw material value."
  }},
  "craft_heritage_story": "A single sentence celebrating the cultural tradition or artisan lineage behind this work.",
  "care_instructions": "One simple sentence advising the buyer on how to care for this handmade product."
}}
"""

    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": base64_data
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "topP": 0.8,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json"
        }
    }

    try:
        response = requests.post(
            GEMINI_API_URL,
            headers=headers,
            params=params,
            json=payload,
            timeout=25
        )

        if response.status_code == 200:
            res_json = response.json()
            candidates = res_json.get("candidates", [])
            if candidates:
                content_parts = candidates[0].get("content", {}).get("parts", [])
                if content_parts:
                    raw_text = content_parts[0].get("text", "")
                    parsed = clean_json_response(raw_text)
                    parsed["is_ai_simulated"] = False
                    parsed["ai_engine"] = f"Google Gemini ({GEMINI_MODEL})"
                    return parsed
            raise ValueError("Empty or invalid candidate response from Gemini API")
        else:
            logger.error(f"Gemini API returned error {response.status_code}: {response.text}")
            return generate_heuristic_craft_catalog(
                image_bytes, artisan_notes, artisan_input_price,
                f"Gemini API returned HTTP {response.status_code}. Using intelligent fallback."
            )

    except Exception as e:
        logger.exception(f"Error calling Gemini Vision API: {e}")
        return generate_heuristic_craft_catalog(
            image_bytes, artisan_notes, artisan_input_price,
            f"AI Vision service fallback: {str(e)}"
        )

def generate_heuristic_craft_catalog(
    image_bytes: bytes,
    artisan_notes: Optional[str] = None,
    artisan_input_price: Optional[float] = None,
    fallback_reason: str = ""
) -> Dict[str, Any]:
    """
    Intelligent heuristic fallback analyzer.
    Ensures that during hackathon judging or offline demos, the app remains 100% functional.
    Derives category, tags, pricing, and descriptions using keyword recognition and visual aspect analysis.
    """
    notes = (artisan_notes or "").lower()
    # Keep offline/fallback listings distinct even when no artisan notes or
    # Gemini key are available. The image itself is part of the catalog input.
    image_digest = hashlib.sha256(image_bytes).hexdigest()[:6].upper()
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        width, height = image.size
        sample = image.resize((1, 1)).getpixel((0, 0))
        if sample[0] >= sample[1] + 25 and sample[0] >= sample[2] + 25:
            palette = "warm red and earthy"
        elif sample[1] >= sample[0] + 20 and sample[1] >= sample[2] + 10:
            palette = "natural green"
        elif max(sample) - min(sample) < 22:
            palette = "neutral-toned"
        else:
            palette = "multi-coloured"
        visual_note = f"Photograph profile {image_digest}: {palette} palette, {width}x{height} framing."
    except Exception:
        visual_note = f"Photograph profile {image_digest}: individually captured artisan piece."
    
    # Heuristic keyword matching
    if any(k in notes for k in ["sari", "saree", "kurta", "cloth", "textile", "weave", "thread", "cotton", "silk", "dupatta", "embroidery", "कपड़ा", "साड़ी"]):
        category = "Handloom & Textiles"
        title = f"Artisan Handwoven Heritage Textile {image_digest}"
        tags = ["Handloom", "Organic Cotton", "Traditional Weave", "Ethnic", "Artisan Made"]
        desc_en = f"Masterfully woven on traditional pit looms by heritage artisans. Made with pure natural fibers that offer exceptional comfort and longevity. {visual_note}"
        desc_hi = "पारंपरिक करघे पर हस्तनिर्मित शुद्ध प्राकृतिक धागों से बुना गया वस्त्र। यह आरामदायक, पर्यावरण-अनुकूल और टिकाऊ है।"
        suggested = artisan_input_price if artisan_input_price else 1250
        min_p = round(suggested * 0.85)
        max_p = round(suggested * 1.30)
        justification = "Pricing covers 16-20 hours of manual loom warping and weft insertion, natural dye extraction, and fair artisan wage."
        story = "Preserves the ancient weaving traditions passed down across four generations of village weavers."
        care = "Hand wash gently in cold water with mild organic detergent and dry in shade."

    elif any(k in notes for k in ["clay", "pot", "terracotta", "surahi", "diya", "pitcher", "ceramic", "मिट्टी", "बर्तन", "घड़ा"]):
        category = "Pottery & Terracotta"
        title = f"Handcrafted Terracotta Clay Artefact {image_digest}"
        tags = ["Terracotta", "Natural Clay", "Eco-Friendly", "Handmade", "Home Decor"]
        desc_en = f"Handcrafted on a traditional potter's wheel using natural riverbed clay and baked in open wood kilns. Naturally porous and chemical-free. {visual_note}"
        desc_hi = "पारंपरिक कुम्हार के चाक पर शुद्ध नदी की मिट्टी से बना हस्तनिर्मित उत्पाद। पूरी तरह प्राकृतिक, रसायन मुक्त और पर्यावरण अनुकूल।"
        suggested = artisan_input_price if artisan_input_price else 550
        min_p = round(suggested * 0.80)
        max_p = round(suggested * 1.35)
        justification = "Reflects artisanal clay refinement, manual wheel throwing, solar drying, and traditional firewood firing."
        story = "Crafted by generational potters upholding the sacred Vedic terracotta arts of rural India."
        care = "Clean with clean water and soft sponge; avoid harsh chemical detergents."

    elif any(k in notes for k in ["brass", "metal", "dhokra", "bronze", "copper", "पीतल", "धातु"]):
        category = "Brass & Metalcraft"
        title = f"Tribal Bell-Metal Heritage Figurine {image_digest}"
        tags = ["Dhokra", "Brass Craft", "Tribal Art", "Heritage", "Lost Wax"]
        desc_en = f"Created using the ancient 4,000-year-old lost-wax casting technique. Every piece is unique, featuring rustic geometric tribal engravings. {visual_note}"
        desc_hi = "प्राचीन लॉस्ट-वैक्स धातु ढलाई तकनीक से जनजातीय कारीगरों द्वारा हस्तनिर्मित अनूठी कृति। प्रत्येक वस्तु अपने आप में विशिष्ट है।"
        suggested = artisan_input_price if artisan_input_price else 1650
        min_p = round(suggested * 0.85)
        max_p = round(suggested * 1.25)
        justification = "High metal density, multiple stages of clay modeling, wax threading, furnace smelting, and fine manual chiseling."
        story = "Rooted in the timeless Harappan metal-crafting lineage of central Indian tribal heartlands."
        care = "Wipe with a dry cotton cloth; apply natural brass polish sparingly if extra shine is desired."

    elif any(k in notes for k in ["bamboo", "cane", "basket", "tokri", "बांस", "टोकरी"]):
        category = "Cane & Bamboo"
        title = f"Artisanal Woven Bamboo Utility Ware {image_digest}"
        tags = ["Bamboo Craft", "Zero Plastic", "Sustainable", "Handwoven", "Eco Storage"]
        desc_en = f"Splinted and hand-woven from seasoned natural bamboo. Lightweight, high tensile strength, and 100% biodegradable. {visual_note}"
        desc_hi = "प्राकृतिक बांस की तीलियों से हाथ से बुनी गई टिकाऊ टोकरी। हल्की, मजबूत और प्लास्टिक मुक्त जीवनशैली के लिए उत्तम।"
        suggested = artisan_input_price if artisan_input_price else 680
        min_p = round(suggested * 0.80)
        max_p = round(suggested * 1.30)
        justification = "Includes manual forest bamboo harvesting, seasoning, thin splint peeling, and intricate multi-strand weaving."
        story = "Celebrates the indigenous sustainable forest craftsmanship of Northeast and Eastern India."
        care = "Keep in dry, aerated conditions; wipe clean with a slightly damp cloth."

    elif any(k in notes for k in ["wood", "toy", "carving", "sheesham", "teak", "लकड़ी", "खिलौना"]):
        category = "Woodcraft"
        title = f"Hand-Carved Artisan Wooden Craft {image_digest}"
        tags = ["Woodcraft", "Natural Polish", "Hand Carved", "Traditional", "GI Craft"]
        desc_en = f"Handcrafted from sustainably sourced seasoned timber with smooth lacquer finish and child-safe organic tints. {visual_note}"
        desc_hi = "प्राकृतिक लकड़ी पर नक्काशी कर सुरक्षित वनस्पति रंगों और लाख की पॉलिश से तैयार किया गया सुंदर हस्तशिल्प।"
        suggested = artisan_input_price if artisan_input_price else 750
        min_p = round(suggested * 0.80)
        max_p = round(suggested * 1.25)
        justification = "Hand-lathe shaping, natural vegetal pigment burnishing, and safe lacquer glossing."
        story = "Carries forward historical timber carving legacies recognized under India's Geographical Indication (GI)."
        care = "Avoid prolonged direct water exposure; polish occasionally with a drop of coconut oil."

    else:
        # Default smart handicraft preset
        category = "Folk Art & Painting"
        title = f"Authentic Handcrafted Folk Art Creation {image_digest}"
        tags = ["Folk Art", "Handmade", "Cultural Heritage", "Indigenous", "Artisan Direct"]
        desc_en = f"Exquisitely hand-crafted by indigenous artisans using traditional techniques and natural pigments. Celebrates rich cultural folklore. {visual_note}"
        desc_hi = "पारंपरिक तकनीकों और प्राकृतिक रंगों का उपयोग करके स्थानीय कारीगरों द्वारा हाथ से बनाई गई अनूठी कलाकृति।"
        suggested = artisan_input_price if artisan_input_price else 850
        min_p = round(suggested * 0.80)
        max_p = round(suggested * 1.30)
        justification = "Estimated 8 to 12 hours of specialized manual craftsmanship, locally sourced raw materials, and fair living wage."
        story = "Represents indigenous craft traditions promoted by the Ministry of Social Justice and Empowerment."
        care = "Handle with care, keep away from dampness and direct harsh sunlight."

    desc_hi = f"{desc_hi} चित्र पहचान: {image_digest}।"

    return {
        "category": category,
        "suggested_title": title,
        "tags": tags,
        "description_en": desc_en,
        "description_hi": desc_hi,
        "pricing": {
            "fair_min": min_p,
            "fair_max": max_p,
            "suggested": suggested,
            "justification": justification
        },
        "craft_heritage_story": story,
        "care_instructions": care,
        "is_ai_simulated": True,
        "ai_engine": "Smart Cataloging Heuristic Engine (SIH Studio)",
        "fallback_note": fallback_reason
    }
