"""
Database Management with SQLite
Smart India Hackathon 2026 - SIH26090
"""
import sqlite3
import json
from backend.config import DATABASE_PATH


def get_db_connection():
    """Create a thread-safe connection to the SQLite database."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables and seed sample data if empty."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            artisan_name TEXT NOT NULL,
            artisan_phone TEXT DEFAULT '+919876543210',
            artisan_location TEXT NOT NULL,
            category TEXT NOT NULL,
            price INTEGER NOT NULL,
            suggested_price_min INTEGER,
            suggested_price_max INTEGER,
            price_justification TEXT,
            description_en TEXT NOT NULL,
            description_hi TEXT,
            tags TEXT NOT NULL,
            image_url TEXT NOT NULL,
            is_enhanced INTEGER DEFAULT 0,
            mosje_verified INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'buyer',
            phone TEXT,
            city TEXT,
            language TEXT DEFAULT 'en',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, product_id)
        );
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            quantity INTEGER DEFAULT 1,
            total INTEGER NOT NULL,
            status TEXT DEFAULT 'Confirmed',
            eta TEXT DEFAULT '2-4 working days',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    )

    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        seed_sample_products(cursor)

    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        seed_demo_users(cursor)

    conn.commit()
    conn.close()


def seed_demo_users(cursor):
    cursor.executemany(
        """
        INSERT INTO users (name, email, password, role, phone, city, language)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                'Aarav Sharma',
                'demo@kalakriti.in',
                'demo123',
                'buyer',
                '+919800112233',
                'Bhopal, Madhya Pradesh',
                'en',
            ),
            (
                'Seema Devi',
                'artisan@kalakriti.in',
                'artisan123',
                'artisan',
                '+919876543210',
                'Madhubani, Bihar',
                'hi',
            ),
        ],
    )


def seed_sample_products(cursor):
    """Seed authentic Indian craft samples for instant demo showcase."""
    samples = [
        (
            "Terracotta Hand-Painted Surahi (Clay Pitcher)",
            "Rameshwar Prajapati",
            "+919876543210",
            "Gorakhpur, Uttar Pradesh",
            "Pottery & Terracotta",
            650,
            550,
            750,
            "Hand-thrown on traditional wheel, natural red clay kiln fired with organic herbal motif painting.",
            "Traditional Indian terracotta clay pitcher crafted from alluvial riverbank clay. Naturally cools water and features exquisite handcrafted floral folk patterns etched by village potters.",
            "पारंपरिक भारतीय टेराकोटा मिट्टी की सुराही जो प्राकृतिक रूप से पानी को ठंडा रखती है। इस पर ग्रामीण कारीगरों द्वारा हस्तनिर्मित सुंदर लोक चित्रकारी उकेरी गई है।",
            json.dumps(["Terracotta", "Clay Pitcher", "Eco-Friendly", "Handmade", "Home Decor", "Cooling Pot"]),
            "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
            1,
            1,
        ),
        (
            "Authentic Bastar Dhokra Bell Metal Elephant",
            "Mangli Bai",
            "+919876543211",
            "Bastar, Chhattisgarh",
            "Brass & Metalcraft",
            1850,
            1600,
            2200,
            "Ancient 4000-year-old lost-wax (Cire-perdue) brass casting by tribal artisans; 3 days of labor.",
            "Authentic Dhokra bell-metal elephant figurine handcrafted by Bastar tribal artisans using the ancient lost-wax casting technique. Perfect as a heritage centerpiece and symbol of auspicious strength.",
            "प्राचीन लॉस्ट-वैक्स तकनीक का उपयोग करके बस्तर के जनजातीय कारीगरों द्वारा हस्तनिर्मित प्रामाणिक ढोकरा बेल-मेटल हाथी। भारतीय सांस्कृतिक धरोहर का अनूठा प्रतीक।",
            json.dumps(["Dhokra Art", "Bastar Craft", "Brass Metal", "Tribal Art", "Heritage", "Lost Wax"]),
            "https://images.unsplash.com/photo-1610444583715-46884024b33a?auto=format&fit=crop&w=800&q=80",
            1,
            1,
        ),
        (
            "Kachchhi Hand-Embroidered Mirrorwork Wall Hanging",
            "Jiviben Rabari",
            "+919876543212",
            "Bhuj, Gujarat",
            "Handloom & Textiles",
            1400,
            1200,
            1650,
            "Traditional Rabari needlework with embedded glass mirrors, silk thread on handspun organic cotton.",
            "Vibrant Kutchi mirror-work tapestry meticulously stitched by rural women weavers. Represents centuries-old tribal folklore patterns with sparkling glass reflections that brighten any room.",
            "कच्छ की ग्रामीण महिला कारीगरों द्वारा हाथ से काढ़ा गया जीवंत आभला (दर्पण) वर्क वॉल हैंगिंग। यह पारंपरिक जनजातीय लोककला का उत्कृष्ट नमूना है।",
            json.dumps(["Kutch Embroidery", "Mirror Work", "Handloom", "Tapestry", "Rabari Craft", "Wall Art"]),
            "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80",
            1,
            1,
        ),
        (
            "Channapatna Eco-Friendly Wooden Stacking Rings",
            "Chellappa Gowda",
            "+919876543213",
            "Channapatna, Karnataka",
            "Woodcraft",
            480,
            400,
            550,
            "Made from soft Wrightia tinctoria (Ivory Wood) and colored with 100% child-safe vegetable dyes.",
            "Traditional GI-tagged Channapatna lacquerware wooden toy crafted from natural wood and organic vegetable dyes (turmeric, indigo). Smooth child-safe finish with vibrant rings.",
            "प्राकृतिक लकड़ी और जैविक वनस्पति रंगों से बना पारंपरिक जीआई-टैग चन्नापटना खिलौना। बच्चों के लिए 100% सुरक्षित और पर्यावरण के अनुकूल।",
            json.dumps(["Channapatna", "Wooden Toy", "Organic Dyes", "Eco Friendly", "GI Tagged", "Montessori"]),
            "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80",
            1,
            1,
        ),
        (
            "Madhubani Hand-Painted Tussar Silk Dupatta",
            "Sita Devi",
            "+919876543214",
            "Madhubani, Bihar",
            "Handloom & Textiles",
            2200,
            1900,
            2600,
            "Pure Bhagalpuri Tussar silk hand-painted using natural twig nibs and natural plant extracts.",
            "Exquisite pure Tussar Silk dupatta featuring traditional Mithila Madhubani artwork of the Tree of Life and sacred fish motifs, symbolizing prosperity and fertility. Hand-drawn by master women artisans.",
            "शुद्ध टसर सिल्क पर हाथ से बनाई गई पारंपरिक मिथिला मधुबनी चित्रकारी युक्त दुपट्टा। जीवन वृक्ष और मत्स्य रूपांकन का सुंदर संयोजन जो समृद्धि का प्रतीक है।",
            json.dumps(["Madhubani", "Mithila Painting", "Tussar Silk", "Dupatta", "Ethnic Wear", "Handpainted"]),
            "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
            1,
            1,
        ),
        (
            "Woven Bamboo & Cane Utility Basket with Lid",
            "Biren Das",
            "+919876543215",
            "Barpeta, Assam",
            "Cane & Bamboo",
            720,
            600,
            850,
            "Locally sourced sustainable Muli bamboo woven tightly with natural protective smoked finish.",
            "Sturdy and elegant handcrafted Assam bamboo storage basket with lid. Sustainable, biodegradable, and versatile for kitchen, bread storage, or artisanal home styling.",
            "असम के स्थानीय प्राकृतिक बांस से हाथ से बुनी गई टिकाऊ और आकर्षक टोकरी। रसोई व घरेलू सजावट के लिए पूरी तरह पर्यावरण अनुकूल और प्राकृतिक।",
            json.dumps(["Bamboo Craft", "Assam Cane", "Eco Storage", "Sustainable", "Handwoven", "Zero Plastic"]),
            "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
            1,
            1,
        ),
    ]

    cursor.executemany(
        """
        INSERT INTO products (
            name, artisan_name, artisan_phone, artisan_location,
            category, price, suggested_price_min, suggested_price_max,
            price_justification, description_en, description_hi,
            tags, image_url, is_enhanced, mosje_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        samples,
    )
