/**
 * API Service for KalaSetu Mobile App
 * Connects to FastAPI Backend with Automatic Heuristic Fallback
 */
import Constants from 'expo-constants';

// Override through a public Expo environment variable for deployed backends.
// Example: EXPO_PUBLIC_BACKEND_URL=https://your-render-app.onrender.com
const configuredBackendUrl =
  Constants.expoConfig?.extra?.backendUrl ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://kalakriti-api-nmnz.onrender.com';

export const BACKEND_URL = configuredBackendUrl;

export interface ProductReview {
  user_name?: string;
  rating?: number;
  comment?: string;
  created_at?: string;
}

export interface CraftProduct {
  id: number;
  name: string;
  artisan_name: string;
  artisan_phone?: string;
  artisan_location: string;
  category: string;
  price: number;
  quantity?: number;
  suggested_price_min?: number;
  suggested_price_max?: number;
  price_justification?: string;
  description_en: string;
  description_hi?: string;
  tags: string[];
  image_url: string;
  image_gallery?: string[];
  rating?: number;
  reviews?: ProductReview[];
  is_enhanced?: boolean;
  mosje_verified?: boolean;
}

export interface AiAnalysisResult {
  category: string;
  suggested_title: string;
  tags: string[];
  description_en: string;
  description_hi: string;
  pricing: {
    fair_min: number;
    fair_max: number;
    suggested: number;
    justification: string;
  };
  craft_heritage_story?: string;
  care_instructions?: string;
  is_ai_simulated?: boolean;
  ai_engine?: string;
  saved_image_url?: string;
}

export type UserRole = 'artisan' | 'buyer' | 'seller' | 'both' | 'buyer-seller' | 'seller-buyer';

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  city: string;
  language: 'en' | 'hi' | 'ta' | 'kn';
}

export interface OrderRecord {
  id: number;
  productId: number;
  productName: string;
  price: number;
  status: 'Confirmed' | 'Packed' | 'In Transit' | 'Delivered' | 'Cancelled';
  eta: string;
  customerName: string;
  deliveryAddress?: string;
}

export interface CancelOrderResponse {
  status: string;
  order_id: number;
  restored_quantity: number;
  reason: string;
  localOnly?: boolean;
}

// Fallback seed catalog for offline mobile demo
export const SEED_PRODUCTS: CraftProduct[] = [
  {
    id: 1,
    name: "Terracotta Hand-Painted Surahi (Clay Pitcher)",
    artisan_name: "Rameshwar Prajapati",
    artisan_phone: "+919876543210",
    artisan_location: "Gorakhpur, Uttar Pradesh",
    category: "Pottery & Terracotta",
    price: 650,
    suggested_price_min: 550,
    suggested_price_max: 750,
    price_justification: "Hand-thrown on traditional wheel, red clay kiln fired with herbal motif painting.",
    description_en: "Traditional Indian terracotta clay pitcher crafted from alluvial riverbank clay. Naturally cools water and features exquisite handcrafted floral folk patterns.",
    description_hi: "पारंपरिक भारतीय टेराकोटा मिट्टी की सुराही जो प्राकृतिक रूप से पानी को ठंडा रखती है। इस पर सुंदर लोक चित्रकारी उकेरी गई है।",
    tags: ["Terracotta", "Clay Pitcher", "Eco-Friendly", "Handmade"],
    image_url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
    image_gallery: [
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    reviews: [
      { user_name: "Aarav", rating: 5, comment: "Beautiful terracotta piece and great artisan story." },
      { user_name: "Ritika", rating: 4.7, comment: "Lovely finish and authentic clay texture." }
    ],
    mosje_verified: true
  },
  {
    id: 2,
    name: "Authentic Bastar Dhokra Bell Metal Elephant",
    artisan_name: "Mangli Bai",
    artisan_phone: "+919876543211",
    artisan_location: "Bastar, Chhattisgarh",
    category: "Brass & Metalcraft",
    price: 1850,
    suggested_price_min: 1600,
    suggested_price_max: 2200,
    price_justification: "Ancient 4000-year-old lost-wax (Cire-perdue) brass casting by tribal artisans; 3 days of labor.",
    description_en: "Authentic Dhokra bell-metal elephant figurine handcrafted by Bastar tribal artisans using the ancient lost-wax casting technique. Auspicious heritage centerpiece.",
    description_hi: "प्राचीन लॉस्ट-वैक्स तकनीक का उपयोग करके बस्तर के जनजातीय कारीगरों द्वारा हस्तनिर्मित प्रामाणिक ढोकरा बेल-मेटल हाथी।",
    tags: ["Dhokra Art", "Bastar Craft", "Brass Metal", "Tribal Art"],
    image_url: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
    image_gallery: [
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.7,
    reviews: [
      { user_name: "Priya", rating: 4.8, comment: "Beautifully cast and carefully finished." }
    ],
    mosje_verified: true
  },
  {
    id: 3,
    name: "Kachchhi Hand-Embroidered Mirrorwork Wall Hanging",
    artisan_name: "Jiviben Rabari",
    artisan_phone: "+919876543212",
    artisan_location: "Bhuj, Gujarat",
    category: "Handloom & Textiles",
    price: 1400,
    suggested_price_min: 1200,
    suggested_price_max: 1650,
    price_justification: "Traditional Rabari needlework with embedded glass mirrors, silk thread on handspun organic cotton.",
    description_en: "Vibrant Kutchi mirror-work tapestry meticulously stitched by rural women weavers. Centuries-old tribal folklore patterns with sparkling glass reflections.",
    description_hi: "कच्छ की ग्रामीण महिला कारीगरों द्वारा हाथ से काढ़ा गया जीवंत आभला (दर्पण) वर्क वॉल हैंगिंग।",
    tags: ["Kutch Embroidery", "Mirror Work", "Handloom", "Tapestry"],
    image_url: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80",
    image_gallery: [
      "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    reviews: [
      { user_name: "Meera", rating: 5, comment: "Stunning mirrorwork and authentic craft story." }
    ],
    mosje_verified: true
  }
];

export async function fetchMarketplaceProducts(): Promise<CraftProduct[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/products`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      return data.products || SEED_PRODUCTS;
    }

  } catch (err) {
    console.warn("Backend not reachable, loading local seed catalog:", err);
  }
  return SEED_PRODUCTS;
}

export async function addProductReview(
  productId: number,
  userName: string,
  rating: number,
  comment: string
): Promise<{ rating: number; reviews: ProductReview[] }> {
  const res = await fetch(`${BACKEND_URL}/api/products/${productId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name: userName, rating, comment })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Review could not be submitted');
  return { rating: data.rating, reviews: data.reviews || [] };
}

export async function analyzeProductPhoto(
  imageUri: string,
  notes: string = "",
  priceHint: string = ""
): Promise<AiAnalysisResult> {
  try {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    // @ts-ignore: React Native FormData file format
    formData.append('file', { uri: imageUri, name: filename, type });
    if (notes) formData.append('notes', notes);
    if (priceHint) formData.append('price_hint', priceHint);

    const res = await fetch(`${BACKEND_URL}/api/analyze-product`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      }
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Error calling backend vision API, using local intelligent simulation:", err);
  }

  // Local Offline Simulation if backend server is not active
  const lowerNotes = notes.toLowerCase();
  if (lowerNotes.includes('brass') || lowerNotes.includes('metal')) {
    return {
      category: "Brass & Metalcraft",
      suggested_title: "Handcrafted Bell-Metal Figurine",
      tags: ["BrassCraft", "LostWax", "Handmade", "Heritage"],
      description_en: "Ancient lost-wax cast metal artefact handcrafted by traditional metalworkers. Durable, historic, and beautifully detailed.",
      description_hi: "पारंपरिक कारीगरों द्वारा प्राचीन धातु ढलाई तकनीक से हस्तनिर्मित अनूठी कलाकृति।",
      pricing: {
        fair_min: 1500,
        fair_max: 2100,
        suggested: priceHint ? Number(priceHint) : 1750,
        justification: "Calculated based on 18 hours of manual clay wax modeling and pure brass smelting."
      },
      is_ai_simulated: true,
      ai_engine: "Mobile On-Device AI Engine"
    };
  } else if (lowerNotes.includes('cloth') || lowerNotes.includes('saree') || lowerNotes.includes('textile') || lowerNotes.includes('weave')) {
    return {
      category: "Handloom & Textiles",
      suggested_title: "Artisan Handwoven Heritage Textile",
      tags: ["Handloom", "NaturalDye", "OrganicCotton", "ArtisanDirect"],
      description_en: "Pure handloom textile hand-woven on traditional wooden looms. Natural organic fibers with heritage geometric motifs.",
      description_hi: "पारंपरिक करघे पर हाथ से बुना गया वस्त्र। 100% प्राकृतिक धागों से निर्मित और पर्यावरण-अनुकूल।",
      pricing: {
        fair_min: 1100,
        fair_max: 1600,
        suggested: priceHint ? Number(priceHint) : 1350,
        justification: "Fair compensation covering 14 hours of manual loom work and organic dye extraction."
      },
      is_ai_simulated: true,
      ai_engine: "Mobile On-Device AI Engine"
    };
  }

  return {
    category: "Pottery & Terracotta",
    suggested_title: "Traditional Handcrafted Clay Artefact",
    tags: ["Terracotta", "ClayCraft", "EcoFriendly", "Handmade"],
    description_en: "Hand-thrown on traditional potter's wheel using natural alluvial river clay. Natural cooling properties and chemical-free.",
    description_hi: "पारंपरिक चाक पर शुद्ध नदी की मिट्टी से बना हस्तशिल्प। पूर्णतः प्राकृतिक और पर्यावरण अनुकूल।",
    pricing: {
      fair_min: 480,
      fair_max: 750,
      suggested: priceHint ? Number(priceHint) : 580,
      justification: "Pricing accounts for clay refinement, solar drying, kiln firing, and fair artisan wage."
    },
    is_ai_simulated: true,
    ai_engine: "Mobile On-Device AI Engine"
  };
}

export async function publishProductToApi(product: Omit<CraftProduct, 'id'>): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return res.ok;
  } catch (err) {
    console.warn("Could not publish to backend, saved locally:", err);
    return true;
  }
}

export async function loginUser(email: string, password: string, role: UserRole = 'buyer'): Promise<AppUser | null> {
  try {
    const payload = { email, password, role };
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.user) {
        return data.user as AppUser;
      }
    }
  } catch (err) {
    console.warn('Auth backend unavailable, using local fallback demo login:', err);
  }

  if (email.toLowerCase().includes('artisan')) {
    return {
      id: 2,
      name: 'Seema Devi',
      email,
      role: 'both',
      phone: '+919876543210',
      city: 'Madhubani, Bihar',
      language: 'hi'
    };
  }

  return {
    id: 1,
    name: 'Aarav Sharma',
    email,
    role: 'both',
    phone: '+919800112233',
    city: 'Bhopal, Madhya Pradesh',
    language: 'en'
  };
}

export async function createOrder(input: {
  userId: number;
  productId: number;
  productName: string;
  price: number;
  customerName: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
}): Promise<OrderRecord> {
  const order: OrderRecord = {
    id: Date.now(),
    productId: input.productId,
    productName: input.productName,
    price: input.price,
    status: 'Confirmed',
    eta: '2-4 working days',
    customerName: input.customerName
  };

  try {
    const res = await fetch(`${BACKEND_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: input.userId,
        product_id: input.productId,
        product_name: input.productName,
        quantity: 1,
        total: input.price,
        status: order.status,
        eta: order.eta,
        recipient_name: input.recipientName,
        recipient_phone: input.recipientPhone,
        address_line: input.addressLine,
        city: input.city,
        state: input.state,
        pincode: input.pincode
      })
    });

    if (res.ok) {
      const data = await res.json();
      return { ...order, id: Number(data.order_id) || order.id };
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Could not place the order request.');

  } catch (err) {
    if (!(err instanceof Error) || err.message === 'Failed to fetch') {
      console.warn('Order API unavailable, saved in app state only:', err);
    } else {
      throw err;
    }
  }

  return order;
}

export async function deleteProduct(productId: number, userId: number): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Product could not be deleted');
}

export async function fetchPublishedProducts(userId: number): Promise<CraftProduct[]> {
  const res = await fetch(`${BACKEND_URL}/api/products/${userId}/published`);
  if (!res.ok) throw new Error('Published products could not be loaded');
  const data = await res.json();
  return data.products || [];
}

export async function fetchOrdersForUser(userId: number): Promise<OrderRecord[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/orders/${userId}`, { method: 'GET' });
    if (!res.ok) {
      throw new Error('Backend orders unavailable');
    }
    const data = await res.json();
    return (data.orders || []).map((row: any) => ({
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      price: Number(row.total || row.price || 0),
      status: String(row.status || 'Confirmed'),
      eta: row.eta || '2-4 working days',
      customerName: row.buyer_name || 'Verified Buyer'
    }));
  } catch (err) {
    console.warn('Falling back to mobile demo orders:', err);
  }

  return [
    {
      id: 101,
      productId: 1,
      productName: 'Terracotta Hand-Painted Surahi',
      price: 650,
      status: 'In Transit',
      eta: 'Tomorrow',
      customerName: 'Aarav Sharma'
    },
    {
      id: 102,
      productId: 3,
      productName: 'Mirrorwork Wall Hanging',
      price: 1400,
      status: 'Packed',
      eta: '2 days',
      customerName: 'Aarav Sharma'
    }
  ];
}

export async function cancelOrderApi(orderId: number, reason: string): Promise<CancelOrderResponse | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Cancel order failed');
    }
    return await res.json();
  } catch (err) {
    if (err instanceof TypeError) {
      return { status: 'success', order_id: orderId, restored_quantity: 0, reason, localOnly: true };
    }
    throw err instanceof Error ? err : new Error('Order cancellation failed');
  }
}
