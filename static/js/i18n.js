/**
 * Bilingual Internationalization (English & Hindi)
 * Smart India Hackathon 2026 - SIH26090
 * Supports low-literacy artisans with clear Hindi translations.
 */

const translations = {
  en: {
    app_title: "KalaKriti",
    app_subtitle: "AI Studio & Market Linkage for Artisans",
    nav_studio: "Artisan Studio",
    nav_market: "Buyer Marketplace",
    nav_about: "MoSJE Mission",
    lang_toggle: "हिंदी",
    
    // Header & Badges
    mosje_badge: "Ministry of Social Justice & Empowerment",
    sih_badge: "SIH 2026 | SIH26090",
    gemini_live: "Gemini Vision Active",
    gemini_sim: "Smart AI Mode",

    // Artisan Studio
    studio_step1_title: "1. Capture or Upload Craft Photo",
    studio_step1_sub: "Take a clear picture of your handmade product in good natural light.",
    btn_upload_photo: "Choose Photo",
    btn_take_photo: "Use Camera",
    or_label: "OR",
    dropzone_hint: "Drag & drop your handicraft photo here, or browse files",
    
    // Form Inputs
    artisan_name_label: "Your Name (Artisan)",
    artisan_name_placeholder: "e.g. Rameshwar Prajapati",
    artisan_loc_label: "Village / Cluster / State",
    artisan_loc_placeholder: "e.g. Gorakhpur, Uttar Pradesh",
    artisan_phone_label: "WhatsApp Number (For Direct Buyers)",
    artisan_phone_placeholder: "+91 98765 43210",
    artisan_notes_label: "Voice Notes / Craft Details (Speak or Type)",
    artisan_notes_placeholder: "Tap the mic and speak what you made, materials used, etc...",
    mic_tooltip: "Tap to speak in Hindi or English",
    mic_recording: "Listening... Speak now",
    
    price_idea_label: "Your Estimated Price (₹)",
    price_idea_placeholder: "e.g. 500",

    // Action button
    btn_analyze_ai: "Analyze with AI Vision",
    btn_analyzing: "AI is analyzing your craft...",

    // Review & Edit Card
    review_title: "2. Review & Optimize Catalog Listing",
    review_sub: "AI has generated these details. You can review or edit anything before publishing.",
    suggested_title_label: "Product Marketplace Title",
    category_label: "Handicraft Category",
    tags_label: "SEO & Search Tags",
    tags_hint: "Tags help buyers discover your item on Google and e-commerce platforms.",
    desc_en_label: "Marketable Description (English)",
    desc_hi_label: "Marketable Description (हिंदी)",
    
    // Dynamic Pricing Assistant
    pricing_assistant_title: "AI Dynamic Pricing Assistant",
    fair_range_label: "Suggested Fair Market Range:",
    justification_label: "Why this price?",
    btn_apply_suggested: "Apply Suggested Price",

    // Studio Enhancement
    enhancer_label: "AI Studio Light Enhancement",
    enhancer_sub: "Enhances lighting and contrasts for professional e-commerce presentation.",

    // Publish
    btn_publish: "Publish to Marketplace Now",
    btn_publishing: "Publishing your craft...",
    publish_success: "Product published successfully to the marketplace!",

    // Marketplace Tab
    market_hero_title: "Direct From India's Master Artisans",
    market_hero_sub: "Eliminating middlemen. Directly empowering marginalized rural micro-entrepreneurs under MoSJE.",
    search_placeholder: "Search handicrafts, pottery, handlooms, brass...",
    filter_all: "All Crafts",
    sort_label: "Sort by:",
    sort_newest: "Newest First",
    sort_price_low: "Price: Low to High",
    sort_price_high: "Price: High to Low",
    mosje_verified: "MoSJE Verified Artisan",
    btn_view_details: "View & Place Order",
    btn_whatsapp_inquire: "Contact Artisan on WhatsApp",
    artisan_direct: "100% Proceeds to Artisan",

    // Detail Modal
    craft_story_title: "Cultural Heritage & Story",
    care_title: "Artisan Care Instructions",
    close_btn: "Close",

    // Audio narration
    listen_desc: "Listen to Description",
    stop_audio: "Stop Audio"
  },

  hi: {
    app_title: "कलाकृति",
    app_subtitle: "कारीगरों के लिए एआई स्टूडियो और सीधा बाज़ार",
    nav_studio: "कारीगर स्टूडियो (अपलोड)",
    nav_market: "खरीदार हाट (बाज़ार)",
    nav_about: "सामाजिक न्याय मंत्रालय",
    lang_toggle: "English",
    
    // Header & Badges
    mosje_badge: "सामाजिक न्याय और अधिकारिता मंत्रालय",
    sih_badge: "स्मार्ट इंडिया हैकथॉन 2026",
    gemini_live: "जेमिनी एआई सक्रिय",
    gemini_sim: "स्मार्ट एआई मोड",

    // Artisan Studio
    studio_step1_title: "१. हस्तशिल्प उत्पाद की फोटो खींचें / अपलोड करें",
    studio_step1_sub: "अपने हाथ से बने सामान की साफ फोटो लें या गैलरी से चुनें।",
    btn_upload_photo: "फोटो चुनें",
    btn_take_photo: "कैमरा खोलें",
    or_label: "या",
    dropzone_hint: "यहाँ फोटो खींचकर लाएं या फाइल चुनें",
    
    // Form Inputs
    artisan_name_label: "आपका नाम (कारीगर)",
    artisan_name_placeholder: "जैसे: रामेश्वर प्रजापति",
    artisan_loc_label: "गाँव / ज़िला / राज्य",
    artisan_loc_placeholder: "जैसे: गोरखपुर, उत्तर प्रदेश",
    artisan_phone_label: "व्हाट्सएप नंबर (सीधे खरीदार के लिए)",
    artisan_phone_placeholder: "+91 98765 43210",
    artisan_notes_label: "आवाज से बताएं / विवरण (बोलें या लिखें)",
    artisan_notes_placeholder: "माइक बटन दबाकर बोलें कि आपने क्या बनाया है...",
    mic_tooltip: "हिंदी या अंग्रेजी में बोलने के लिए माइक दबाएं",
    mic_recording: "सुन रहे हैं... कृपया बोलें",
    
    price_idea_label: "आपकी अनुमानित कीमत (₹)",
    price_idea_placeholder: "जैसे: 500",

    // Action button
    btn_analyze_ai: "एआई दृष्टि से जांचें (Analyze with AI)",
    btn_analyzing: "एआई आपके उत्पाद की जांच कर रहा है...",

    // Review & Edit Card
    review_title: "२. एआई सुझाव देखें और सुधारें",
    review_sub: "एआई ने आपके उत्पाद का विवरण तैयार किया है। बाज़ार में डालने से पहले जांच लें।",
    suggested_title_label: "उत्पाद का नाम (बाज़ार के लिए)",
    category_label: "शिल्प की श्रेणी (Category)",
    tags_label: "सर्च टैग्स (Tags)",
    tags_hint: "टैग्स से खरीदार आपके उत्पाद को गूगल और ऑनलाइन बाज़ार में आसानी से खोज पाते हैं।",
    desc_en_label: "अंग्रेजी विवरण (English Description)",
    desc_hi_label: "हिंदी विवरण (Hindi Description)",
    
    // Dynamic Pricing Assistant
    pricing_assistant_title: "एआई उचित मूल्य सहायक (AI Dynamic Pricing)",
    fair_range_label: "बाज़ार के अनुसार उचित कीमत दायरा:",
    justification_label: "यह कीमत क्यों सही है?",
    btn_apply_suggested: "सुझाई गई कीमत लागू करें",

    // Studio Enhancement
    enhancer_label: "एआई स्टूडियो लाइटिंग सुधार",
    enhancer_sub: "फोटो की रोशनी और पृष्ठभूमि को पेशेवर ई-कॉमर्स स्तर पर सुधारें।",

    // Publish
    btn_publish: "अभी बाज़ार में प्रकाशित करें",
    btn_publishing: "प्रकाशित किया जा रहा है...",
    publish_success: "बधाई! आपका हस्तशिल्प बाज़ार में सफलतापूर्वक जुड़ गया है!",

    // Marketplace Tab
    market_hero_title: "भारत के हुनरमंद कारीगरों से सीधे खरीदें",
    market_hero_sub: "बिचौलियों से मुक्ति। सामाजिक न्याय और अधिकारिता मंत्रालय (MoSJE) समर्थित कारीगर।",
    search_placeholder: "हस्तशिल्प, साड़ी, टेराकोटा, पीतल, खिलौने खोजें...",
    filter_all: "सभी शिल्प",
    sort_label: "क्रमबद्ध करें:",
    sort_newest: "सबसे नया",
    sort_price_low: "कम से अधिक कीमत",
    sort_price_high: "अधिक से कम कीमत",
    mosje_verified: "मंत्रालय प्रमाणित कारीगर",
    btn_view_details: "देखें और ऑर्डर करें",
    btn_whatsapp_inquire: "कारीगर से व्हाट्सएप पर बात करें",
    artisan_direct: "100% कमाई सीधे कारीगर को",

    // Detail Modal
    craft_story_title: "सांस्कृतिक विरासत एवं परंपरा",
    care_title: "कारीगर द्वारा रखरखाव सलाह",
    close_btn: "बंद करें",

    // Audio narration
    listen_desc: "विवरण सुनें (Audio)",
    stop_audio: "ऑडियो रोकें"
  }
};

const coreTranslations = {
  en: { nav_studio: 'Artisan Studio', nav_market: 'Buyer Marketplace', nav_bulk: 'Bulk & Institutions', nav_account: 'Account', account_profile: 'Profile', account_history: 'History', account_orders: 'Orders', account_requests: 'Requests', account_wishlist: 'Wishlist', btn_place_order: 'Place order request', btn_whatsapp_inquire: 'Contact Artisan on WhatsApp', order_sent: 'Order request sent to the artisan', sign_in: 'Sign in', logout: 'Log out', email: 'Email', password: 'Password', buyer: 'Buyer', seller: 'Artisan / Seller', save: 'Save', submit: 'Submit', close: 'Close', search: 'Search', loading: 'Loading', no_orders: 'No orders yet', no_requests: 'No requests yet', no_saved: 'Nothing saved yet' },
  hi: { nav_studio: 'कारीगर स्टूडियो', nav_market: 'खरीदार बाज़ार', nav_bulk: 'थोक और संस्थान', nav_account: 'खाता', account_profile: 'प्रोफ़ाइल', account_history: 'इतिहास', account_orders: 'ऑर्डर', account_requests: 'अनुरोध', account_wishlist: 'पसंदीदा', btn_place_order: 'ऑर्डर अनुरोध भेजें', btn_whatsapp_inquire: 'व्हाट्सएप पर कारीगर से संपर्क करें', order_sent: 'कारीगर को ऑर्डर अनुरोध भेज दिया गया', sign_in: 'साइन इन', logout: 'लॉग आउट', email: 'ईमेल', password: 'पासवर्ड', buyer: 'खरीदार', seller: 'कारीगर / विक्रेता', save: 'सेव करें', submit: 'जमा करें', close: 'बंद करें', search: 'खोजें', loading: 'लोड हो रहा है', no_orders: 'अभी कोई ऑर्डर नहीं', no_requests: 'अभी कोई अनुरोध नहीं', no_saved: 'अभी कुछ सेव नहीं है' },
  ta: { nav_studio: 'கைவினை ஸ்டூடியோ', nav_market: 'வாங்குபவர் சந்தை', nav_bulk: 'மொத்த விற்பனை மற்றும் நிறுவனங்கள்', nav_account: 'கணக்கு', account_profile: 'சுயவிவரம்', account_history: 'வரலாறு', account_orders: 'ஆர்டர்கள்', account_requests: 'கோரிக்கைகள்', account_wishlist: 'விருப்பங்கள்', btn_place_order: 'ஆர்டர் கோரிக்கை', btn_whatsapp_inquire: 'வாட்ஸ்அப்பில் கைவினைஞரை தொடர்பு கொள்ளுங்கள்', order_sent: 'ஆர்டர் கோரிக்கை அனுப்பப்பட்டது', sign_in: 'உள்நுழை', logout: 'வெளியேறு', email: 'மின்னஞ்சல்', password: 'கடவுச்சொல்', buyer: 'வாங்குபவர்', seller: 'கைவினைஞர் / விற்பனையாளர்', save: 'சேமி', submit: 'சமர்ப்பி', close: 'மூடு', search: 'தேடு', loading: 'ஏற்றப்படுகிறது', no_orders: 'ஆர்டர்கள் இல்லை', no_requests: 'கோரிக்கைகள் இல்லை', no_saved: 'சேமிப்புகள் இல்லை' },
  kn: { nav_studio: 'ಕುಶಲಕರ್ಮಿ ಸ್ಟುಡಿಯೋ', nav_market: 'ಖರೀದಿದಾರರ ಮಾರುಕಟ್ಟೆ', nav_bulk: 'ಸಗಟು ಮತ್ತು ಸಂಸ್ಥೆಗಳು', nav_account: 'ಖಾತೆ', account_profile: 'ಪ್ರೊಫೈಲ್', account_history: 'ಇತಿಹಾಸ', account_orders: 'ಆರ್ಡರ್‌ಗಳು', account_requests: 'ವಿನಂತಿಗಳು', account_wishlist: 'ಇಷ್ಟಪಟ್ಟವು', btn_place_order: 'ಆರ್ಡರ್ ವಿನಂತಿ', btn_whatsapp_inquire: 'ವಾಟ್ಸಪ್‌ನಲ್ಲಿ ಕಲೆಗಾರರನ್ನು ಸಂಪರ್ಕಿಸಿ', order_sent: 'ಆರ್ಡರ್ ವಿನಂತಿ ಕಳುಹಿಸಲಾಗಿದೆ', sign_in: 'ಸೈನ್ ಇನ್', logout: 'ಲಾಗ್ ಔಟ್', email: 'ಇಮೇಲ್', password: 'ಪಾಸ್‌ವರ್ಡ್', buyer: 'ಖರೀದಿದಾರ', seller: 'ಕಲೆಗಾರ / ಮಾರಾಟಗಾರ', save: 'ಉಳಿಸಿ', submit: 'ಸಲ್ಲಿಸಿ', close: 'ಮುಚ್ಚಿ', search: 'ಹುಡುಕಿ', loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ', no_orders: 'ಆರ್ಡರ್‌ಗಳಿಲ್ಲ', no_requests: 'ವಿನಂತಿಗಳಿಲ್ಲ', no_saved: 'ಉಳಿಸಿದವುಗಳಿಲ್ಲ' },
  te: { nav_studio: 'కళాకారుల స్టూడియో', nav_market: 'కొనుగోలుదారుల మార్కెట్', nav_bulk: 'బల్క్ మరియు సంస్థలు', nav_account: 'ఖాతా', account_profile: 'ప్రొఫైల్', account_history: 'చరిత్ర', account_orders: 'ఆర్డర్లు', account_requests: 'అభ్యర్థనలు', account_wishlist: 'ఇష్టమైనవి', btn_place_order: 'ఆర్డర్ అభ్యర్థన', btn_whatsapp_inquire: 'వాట్సాప్‌లో కళాకారుడిని సంప్రదించండి', order_sent: 'ఆర్డర్ అభ్యర్థన పంపబడింది', sign_in: 'సైన్ ఇన్', logout: 'లాగ్ అవుట్', email: 'ఇమెయిల్', password: 'పాస్‌వర్డ్', buyer: 'కొనుగోలుదారు', seller: 'కళాకారుడు / విక్రేత', save: 'సేవ్ చేయండి', submit: 'సమర్పించండి', close: 'మూసివేయండి', search: 'వెతకండి', loading: 'లోడ్ అవుతోంది', no_orders: 'ఆర్డర్లు లేవు', no_requests: 'అభ్యర్థనలు లేవు', no_saved: 'సేవ్ చేసినవి లేవు' },
  bn: { nav_studio: 'কারিগর স্টুডিও', nav_market: 'ক্রেতা বাজার', nav_bulk: 'বাল্ক ও প্রতিষ্ঠান', nav_account: 'অ্যাকাউন্ট', account_profile: 'প্রোফাইল', account_history: 'ইতিহাস', account_orders: 'অর্ডার', account_requests: 'অনুরোধ', account_wishlist: 'উইশলিস্ট', btn_place_order: 'অর্ডার অনুরোধ', btn_whatsapp_inquire: 'হোয়াটসঅ্যাপে কারিগরের সঙ্গে যোগাযোগ করুন', order_sent: 'অর্ডার অনুরোধ পাঠানো হয়েছে', sign_in: 'সাইন ইন', logout: 'লগ আউট', email: 'ইমেল', password: 'পাসওয়ার্ড', buyer: 'ক্রেতা', seller: 'কারিগর / বিক্রেতা', save: 'সংরক্ষণ', submit: 'জমা দিন', close: 'বন্ধ করুন', search: 'খুঁজুন', loading: 'লোড হচ্ছে', no_orders: 'কোনও অর্ডার নেই', no_requests: 'কোনও অনুরোধ নেই', no_saved: 'কিছু সংরক্ষিত নেই' },
  mr: { nav_studio: 'कारागीर स्टुडिओ', nav_market: 'खरेदीदार बाजार', nav_bulk: 'घाऊक आणि संस्था', nav_account: 'खाते', account_profile: 'प्रोफाइल', account_history: 'इतिहास', account_orders: 'ऑर्डर', account_requests: 'विनंत्या', account_wishlist: 'यादी', btn_place_order: 'ऑर्डर विनंती पाठवा', btn_whatsapp_inquire: 'व्हॉट्सॲपवर कारागिराशी संपर्क करा', order_sent: 'ऑर्डर विनंती पाठवली', sign_in: 'साइन इन', logout: 'लॉग आउट', email: 'ईमेल', password: 'पासवर्ड', buyer: 'खरेदीदार', seller: 'कारागीर / विक्रेता', save: 'जतन करा', submit: 'सबमिट करा', close: 'बंद करा', search: 'शोधा', loading: 'लोड होत आहे', no_orders: 'ऑर्डर नाहीत', no_requests: 'विनंत्या नाहीत', no_saved: 'काहीही जतन केलेले नाही' },
  gu: { nav_studio: 'કારીગર સ્ટુડિયો', nav_market: 'ખરીદદાર બજાર', nav_bulk: 'જથ્થાબંધ અને સંસ્થાઓ', nav_account: 'એકાઉન્ટ', account_profile: 'પ્રોફાઇલ', account_history: 'ઇતિહાસ', account_orders: 'ઓર્ડર', account_requests: 'વિનંતીઓ', account_wishlist: 'વિશલિસ્ટ', btn_place_order: 'ઓર્ડર વિનંતી', btn_whatsapp_inquire: 'વોટ્સએપ પર કારીગરનો સંપર્ક કરો', order_sent: 'ઓર્ડર વિનંતી મોકલાઈ', sign_in: 'સાઇન ઇન', logout: 'લૉગ આઉટ', email: 'ઇમેઇલ', password: 'પાસવર્ડ', buyer: 'ખરીદદાર', seller: 'કારીગર / વેચનાર', save: 'સાચવો', submit: 'સબમિટ કરો', close: 'બંધ કરો', search: 'શોધો', loading: 'લોડ થઈ રહ્યું છે', no_orders: 'કોઈ ઓર્ડર નથી', no_requests: 'કોઈ વિનંતી નથી', no_saved: 'કંઈ સાચવેલું નથી' }
};

let currentLanguage = 'en';

function setLanguage(lang) {
  currentLanguage = lang;
  const dictionary = { ...translations.en, ...(translations[lang] || {}), ...(coreTranslations[lang] || {}) };
  localStorage.setItem('kalakriti_language', lang);
  document.documentElement.lang = lang;
  
  // Update all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dictionary[key]) {
      el.textContent = dictionary[key];
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dictionary[key]) {
      el.setAttribute('placeholder', dictionary[key]);
    }
  });

  // Update titles/tooltips
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (dictionary[key]) {
      el.setAttribute('title', dictionary[key]);
    }
  });

  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) languageSelect.value = lang;

  const navLabels = {
    studio: dictionary.nav_studio,
    marketplace: dictionary.nav_market,
    institutional: dictionary.nav_bulk,
    account: dictionary.nav_account
  };
  Object.entries(navLabels).forEach(([tab, label]) => {
    document.querySelectorAll(`[data-tab-target="${tab}"] span:last-child`).forEach(el => { el.textContent = label; });
  });
  document.querySelectorAll('[data-account-view]').forEach(button => {
    const key = `account_${button.dataset.accountView}`;
    if (dictionary[key]) button.textContent = dictionary[key];
  });

  // Update dynamic badges if needed
  if (window.onLanguageChanged) {
    window.onLanguageChanged(lang);
  }
}

function toggleLanguage() {
  const nextLang = currentLanguage === 'en' ? 'hi' : 'en';
  setLanguage(nextLang);
}

function t(key) {
  return coreTranslations[currentLanguage]?.[key] || translations[currentLanguage]?.[key] || translations.en[key] || key;
}
