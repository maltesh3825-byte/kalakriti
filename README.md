# 🎨 KalaSetu: AI-Driven Market Linkage & Smart Cataloging for Marginalized Artisans

**Smart India Hackathon 2026** | **Problem Statement ID: SIH26090**  
**Organization**: Ministry of Social Justice and Empowerment (MoSJE)  
**Theme**: Heritage & Culture | **Category**: Software

---

## 📌 Executive Summary & Solution Overview

Rural and marginalized micro-entrepreneurs, weavers, and traditional artisans in India face severe digital divide challenges: low digital literacy, language barriers, and lack of technical skills required to professionally photograph, price, and catalog products for modern e-commerce.

**KalaSetu** acts as an intuitive **AI Virtual Business Manager** on mobile and web:
1. **Low-Barrier Artisan Studio**: Designed for zero-tech users with large visual touch targets, one-tap camera capture, and Web Speech voice recognition in Hindi (`hi-IN`) and English.
2. **Multimodal AI Vision Model (Google Gemini)**: Instantly identifies craft category (Handloom, Terracotta, Dhokra Brass, Cane/Bamboo, Woodcraft, etc.), crafts 3–5 high-converting SEO tags, and drafts compelling product descriptions in both **English and Hindi**.
3. **AI Dynamic Pricing Assistant**: Recommends an optimal, fair-trade selling price range with clear justification based on estimated craftsmanship complexity, raw material value, and fair living wages.
4. **AI Studio Enhancer**: Corrects uneven village lighting and enhances contrast to e-commerce marketplace standards.
5. **Direct Market Linkage (Zero Middlemen)**: Direct buyer storefront with real-time category filtering, search, and pre-filled 1-click **WhatsApp Direct Inquiry** connecting buyers directly to the artisan.
6. **Audio Narration (Text-to-Speech)**: Integrated audio playback for illiterate or low-vision artisans to listen to what the AI wrote before publishing.

---

## 🔑 Where to Paste Your Google Gemini API Key

The application is configured to read your Gemini API key seamlessly:

### Method 1: In `.env` (Recommended)
Open the `.env` file in the project root directory:
```env
# artisan-market-linkage/.env
GEMINI_API_KEY=AIzaSyYourActualGoogleGeminiKeyHere
```

> [!NOTE]
> **Get a Free Gemini API Key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey). Do not commit API keys to source control; use `.env` or an environment variable.
> **Demo Resilience**: If no key is configured or if network quota is exceeded during a live hackathon presentation, KalaSetu automatically switches to its built-in **Smart Cataloging Heuristic Engine**, ensuring your demo NEVER crashes in front of judges!

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+ (Installed on system)
- Node.js 20+ and Expo Go on an Android or iOS phone

### Option A: Run the Competition Mobile App (Recommended)

KalaSetu's primary competition deliverable is the React Native mobile app in `mobile-app/`.

1. Start the backend and Expo together on Windows:
   ```powershell
   .\run_mobile.bat
   ```
   This opens the API in a separate window and launches Expo Go from `mobile-app/`.
2. Alternatively, start Expo manually from the mobile project:
   ```powershell
   cd mobile-app
   npm install
   npm start
   ```
3. Scan the QR code with Expo Go. Keep the phone and computer on the same Wi-Fi.

For AI and marketplace API access on a physical phone, set the computer's LAN address before starting Expo:
```powershell
$env:EXPO_PUBLIC_BACKEND_URL="http://192.168.1.5:8000"
npm start
```
Replace `192.168.1.5` with the computer's IPv4 address. The app also includes an offline demo catalog and fallback AI engine.

The web target is only an optional preview:
```powershell
npm run web
```

### Option C: Hosted Backend and Team APK

The standalone APK must use a public HTTPS backend URL. It cannot use `127.0.0.1`, `localhost`, or a laptop LAN address once it is shared with teammates.

#### Deploy the backend on Render

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint** and select the repository. Render will detect `render.yaml`.
3. Add `GEMINI_API_KEY` as a secret environment variable if live Gemini analysis is required. The built-in fallback engine works without it.
4. Deploy the service and verify:
   ```text
   https://YOUR-SERVICE.onrender.com/health
   ```
   The response should contain `{"status":"ok"}`.

The included Render configuration uses Render's free web-service plan. SQLite data and uploaded images are stored temporarily under `/tmp` and may reset when the service restarts or sleeps. This is suitable for a demo and team testing, but production should use a paid persistent database/storage service.

#### Build an installable Android APK

From `mobile-app/`, replace `https://YOUR-BACKEND-DOMAIN.example.com` in `eas.json` with the deployed HTTPS backend URL, then run:

```powershell
cd mobile-app
npx eas login
npx eas build:configure
npm run build:apk
```

Expo will provide a build page and APK download link. Share that APK with the team for internal testing. For Google Play distribution, use the production profile instead:

```powershell
npm run build:android
```

The production profile creates an Android App Bundle (`.aab`), which is the format expected by Google Play.

For local Expo Go testing, keep using `EXPO_PUBLIC_BACKEND_URL` with the computer's LAN IP as described above.

### Option B: 1-Click Launch (Windows)
Double-click `run.bat` or run:
```powershell
.\run.bat
```

### Option B: Manual Terminal Execution
1. Open a terminal and navigate to the project folder:
   ```bash
   cd C:\Users\MALATESH\.gemini\antigravity\scratch\artisan-market-linkage
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the application:
   ```bash
   python app.py
   ```
4. Open your browser at the port shown in the terminal output (for example, **http://127.0.0.1:8000** or the next free port if 8000 is already in use).
   👉 **Interactive API Documentation (Swagger)**: use the same base URL with `/docs` (for example, **http://127.0.0.1:8000/docs**)

---

## 🌟 Hackathon Jury Demo Walkthrough (SIH 2026)

To deliver an award-winning demonstration to the SIH jury:

1. **Demonstrate Low Digital Literacy UX**:
   - Show the **Hindi / English toggle** (`🌐 हिंदी`) in the top bar.
   - Point out the large buttons and zero-friction camera upload.
   - Tap the 🎙️ **Microphone button** and speak: *"यह लाल मिट्टी का घड़ा है जो पानी ठंडा रखता है"* (or click a quick preset sample).
   - Tap **"Listen Help" (🔊)** to show how the app talks to non-literate artisans.

2. **Demonstrate Multimodal AI Vision & Smart Cataloging**:
   - Click one of the **1-Click Demo Samples** (e.g. *Terracotta Pitcher* or *Dhokra Brass Elephant*), or upload your own craft photo.
   - Click **"Analyze with AI Vision"**.
   - Watch the AI multi-step reasoning animation:
     - Detects category: *Pottery & Terracotta*
     - Generates SEO tags: *#Terracotta #ClayPitcher #EcoFriendly #Handmade*
     - Generates bilingual descriptions in English and Hindi.
     - Computes the **AI Dynamic Pricing Recommendation** with justification of fair labor hours!

3. **Demonstrate Studio Lighting Enhancement**:
   - Toggle **"AI Studio Light Enhancement"** to show instant photo lighting correction.

4. **Demonstrate Review & Edit**:
   - Edit the price or title, click **"Apply Suggested Price"**, and add a custom tag.
   - Click **"Publish to Marketplace Now"**.

5. **Demonstrate Direct Market Linkage (Public Buyer Catalog)**:
   - The app automatically switches to the **Buyer Marketplace** tab.
   - Show the newly published item with its **MoSJE Beneficiary Verified** badge.
   - Test category filtering pills (*Handloom*, *Brass*, *Pottery*) and live search.
   - Click **"View & Inquire"** on the product card.
   - Click **"Contact Artisan on WhatsApp"** to show the pre-filled buyer order message ready to send directly to the artisan's phone!

---

## 📁 Architecture & File Directory

```
artisan-market-linkage/
├── backend/
│   ├── __init__.py
│   ├── config.py             # 🔑 API Key resolution and configuration
│   ├── database.py           # SQLite persistent storage with authentic seed crafts
│   ├── ai_service.py         # Google Gemini Vision integration + Fallback Engine
│   └── main.py               # FastAPI REST endpoints & static file hosting
├── static/
│   ├── index.html            # Single-Page App with Studio & Marketplace
│   ├── css/
│   │   └── style.css         # Heritage styling, animations & studio lighting
│   └── js/
│       ├── app.js            # Frontend controller & marketplace logic
│       ├── i18n.js           # English & Hindi translation dictionary
│       └── voice.js          # Speech-to-Text & Text-to-Speech audio engine
├── uploads/                  # Storage for artisan uploaded product images
├── app.py                    # Root Python runner
├── run.bat                   # 1-click batch script for Windows
├── requirements.txt          # Python packages
├── .env.example              # Environment variables template
├── .env                      # Active environment configuration
└── README.md                 # Complete documentation
```

---

## 🏛️ Alignment with Ministry of Social Justice & Empowerment (MoSJE) Goals

| MoSJE Impact Goal | How KalaSetu Solves It |
| :--- | :--- |
| **Year-Round Digital Sales** | Replaces dependence on once-a-year physical fairs (Surajkund, Shilp Samagam) with a 24/7 digital storefront. |
| **Overcoming Low Literacy** | Voice-to-text dictation, one-click camera capture, and audio narration (TTS). |
| **Competitive Market Presentation** | Gemini Vision AI crafts professional titles, SEO tags, and studio photo enhancement. |
| **Fair Artisan Remuneration** | Dynamic Pricing Assistant prevents artisans from being exploited by underpricing or middleman cuts. |
| **Direct Buyer Linkage** | 100% of proceeds go directly to the artisan via direct WhatsApp contact. |
