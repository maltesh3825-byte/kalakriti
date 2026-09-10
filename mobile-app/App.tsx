/**
 * KalaSetu - Cross-Platform Mobile Application
 * Smart India Hackathon 2026 - Problem Statement SIH26090
 * Ministry of Social Justice and Empowerment (MoSJE)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Switch,
  ImageStyle
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from './constants/Colors';
import { i18n, additionalTranslations, getAppText, Language } from './constants/i18n';

TextInput.defaultProps = {
  placeholderTextColor: Colors.textSecondary,
};

import {
  CraftProduct,
  AiAnalysisResult,
  fetchMarketplaceProducts,
  analyzeProductPhoto,
  publishProductToApi,
  SEED_PRODUCTS,
  AppUser,
  UserRole,
  OrderRecord,
  loginUser,
  createOrder,
  fetchOrdersForUser,
  cancelOrderApi,
  addProductReview,
  deleteProduct,
  fetchPublishedProducts,
  loginAdmin,
  fetchAdminRequests,
  updateAdminRequest,
  AdminRequest
} from './services/api';

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (event: { resultIndex?: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onerror: (event: { error?: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

export default function App() {
  const catalogDraftKey = 'kalasetu_catalog_drafts';
  const bulkDraftKey = 'kalasetu_bulk_drafts';
  // Navigation & Language State
  const [activeTab, setActiveTab] = useState<'home' | 'studio' | 'market' | 'institutional' | 'account' | 'wishlist' | 'orders' | 'profile'>('home');
  const [accountView, setAccountView] = useState<'profile' | 'history' | 'orders' | 'requests' | 'wishlist' | 'notifications' | 'admin'>('profile');
  const [lang, setLang] = useState<Language>('en');
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  // Unified user account state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('demo@kalakriti.in');
  const [authPassword, setAuthPassword] = useState('demo123');
  const [authName, setAuthName] = useState('Aarav Sharma');
  const [authRole, setAuthRole] = useState<UserRole>('buyer');
  const [bulkNeed, setBulkNeed] = useState('');
  const [bulkBuyerType, setBulkBuyerType] = useState('Retail / Institutional Buyer');
  const [bulkCategory, setBulkCategory] = useState('Handloom & Textiles');
  const [bulkQuantity, setBulkQuantity] = useState('100');
  const [bulkUnitPrice, setBulkUnitPrice] = useState('250');
  const [bulkLeadTime, setBulkLeadTime] = useState('7-15 working days');

  // Artisan Studio State
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [artisanName, setArtisanName] = useState('Ramvati Devi');
  const [artisanLocation, setArtisanLocation] = useState('Madhubani, Bihar');
  const [artisanPhone, setArtisanPhone] = useState('+919876543210');
  const [artisanNotes, setArtisanNotes] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState<'en-IN' | 'kn-IN' | 'hi-IN'>('kn-IN');
  const browserRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const browserListeningRef = useRef(false);
  const browserTranscriptRef = useRef('');
  const nativeListeningRef = useRef(false);
  const [priceIdea, setPriceIdea] = useState('');
  const [isEnhanced, setIsEnhanced] = useState(false);

  // AI & Review State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Pottery & Terracotta');
  const [editPrice, setEditPrice] = useState('');
  const [editDescEn, setEditDescEn] = useState('');
  const [editDescHi, setEditDescHi] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [listingQuantity, setListingQuantity] = useState('1');

  // Marketplace State
  const [products, setProducts] = useState<CraftProduct[]>(SEED_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [publishedProducts, setPublishedProducts] = useState<CraftProduct[]>([]);
  const [cancelReason, setCancelReason] = useState('Changed requirement / buyer changed decision');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [buyQuantity, setBuyQuantity] = useState('1');
  const [orderActionMessage, setOrderActionMessage] = useState('');
  const [deliveryDetails, setDeliveryDetails] = useState({
    recipientName: '', recipientPhone: '', addressLine: '', city: '', state: '', pincode: ''
  });
  const [catalogDrafts, setCatalogDrafts] = useState<Array<{ id: string; title: string; savedAt: string; data: Record<string, unknown> }>>([]);
  const [bulkDrafts, setBulkDrafts] = useState<Array<{ id: string; savedAt: string; data: Record<string, string> }>>([]);
  const [adminToken, setAdminToken] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([]);
  const [adminStatus, setAdminStatus] = useState('');

  const t = { ...i18n, ...additionalTranslations }[lang];
  const tx = (key: Parameters<typeof getAppText>[1]) => getAppText(lang, key);
  const speechLocale = ({ en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', kn: 'kn-IN', te: 'te-IN', ml: 'ml-IN', mr: 'mr-IN', bh: 'hi-IN', bho: 'hi-IN' } as const)[lang];
  const topSafeInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
  const roleLabel = currentUser?.role === 'buyer'
    ? (lang === 'hi' ? 'खरीदार' : lang === 'ta' ? 'வாங்குபவர்' : lang === 'kn' ? 'ಖರೀದಿದಾರ' : lang === 'te' ? 'కొనుగోలుదారు' : lang === 'ml' ? 'വാങ്ങുന്നയാൾ' : lang === 'mr' ? 'खरेदीदार' : 'Buyer')
    : currentUser?.role === 'artisan'
      ? (lang === 'hi' ? 'कारीगर' : lang === 'ta' ? 'கைவினைஞர்' : lang === 'kn' ? 'ಕಲಾವಿದ' : lang === 'te' ? 'కళాకారుడు' : lang === 'ml' ? 'കലാകാരൻ' : lang === 'mr' ? 'कारागीर' : 'Seller')
      : tx('sellerBuyer');
  const languageOptions: Array<[Language, string]> = [
    ['en', 'English'], ['hi', 'हिंदी'], ['kn', 'ಕನ್ನಡ'], ['te', 'తెలుగు'],
    ['ml', 'മലയാളം'], ['mr', 'मराठी'], ['ta', 'தமிழ்'], ['bh', 'बिहारी'], ['bho', 'भोजपुरी']
  ];
  const bulkQuantityNumber = Math.max(0, Number(bulkQuantity) || 0);
  const bulkUnitPriceNumber = Math.max(0, Number(bulkUnitPrice) || 0);
  const bulkPricingTiers = [
    { volume: '1-10 units', price: bulkUnitPriceNumber, minimum: 1, margin: 'Retail' },
    { volume: '11-50 units', price: bulkUnitPriceNumber * 0.87, minimum: 11, margin: '13% savings' },
    { volume: '50+ units', price: bulkUnitPriceNumber * 0.74, minimum: 51, margin: '26% savings' }
  ];

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setSpeechError('');
  });

  useSpeechRecognitionEvent('end', () => {
    if (nativeListeningRef.current) {
      window.setTimeout(() => {
        if (nativeListeningRef.current) {
          ExpoSpeechRecognitionModule.start({
            lang: voiceLanguage,
            interimResults: true,
            continuous: true,
            maxAlternatives: 1,
          });
        }
      }, 300);
    } else {
      setIsListening(false);
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (transcript) {
      setArtisanNotes(transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    nativeListeningRef.current = false;
    setIsListening(false);
    setSpeechError(`Speech recognition error: ${event.message || event.error}`);
  });

  useEffect(() => {
    loadProducts();
    void loadOfflineDrafts();
    AsyncStorage.getItem('kalasetu_language').then(savedLanguage => {
      if (savedLanguage && ['en', 'hi', 'ta', 'kn', 'te', 'ml', 'mr', 'bh', 'bho'].includes(savedLanguage)) {
        setLang(savedLanguage as Language);
      }
    });
    AsyncStorage.getItem('kalasetu_admin_token').then(token => {
      if (token) {
        setAdminToken(token);
        fetchAdminRequests(token).then(setAdminRequests).catch(() => AsyncStorage.removeItem('kalasetu_admin_token'));
      }
    });
  }, []);

  const handleAdminLogin = async () => {
    try {
      const token = await loginAdmin(adminEmail.trim(), adminPassword);
      await AsyncStorage.setItem('kalasetu_admin_token', token);
      setAdminToken(token);
      setAdminStatus('');
      setAdminRequests(await fetchAdminRequests(token));
    } catch (error) {
      setAdminStatus(error instanceof Error ? error.message : 'Admin sign-in failed.');
    }
  };

  const handleAdminLogout = async () => {
    await AsyncStorage.removeItem('kalasetu_admin_token');
    setAdminToken('');
    setAdminRequests([]);
  };

  const handleAdminUpdate = async (requestId: number, status: string) => {
    if (!adminToken) return;
    try {
      await updateAdminRequest(adminToken, requestId, status, '');
      setAdminRequests(await fetchAdminRequests(adminToken));
    } catch (error) {
      setAdminStatus(error instanceof Error ? error.message : 'Review could not be saved.');
    }
  };

  const loadOfflineDrafts = async () => {
    const [catalogValue, bulkValue] = await Promise.all([
      AsyncStorage.getItem(catalogDraftKey),
      AsyncStorage.getItem(bulkDraftKey)
    ]);
    setCatalogDrafts(catalogValue ? JSON.parse(catalogValue) : []);
    setBulkDrafts(bulkValue ? JSON.parse(bulkValue) : []);
  };

  const saveCatalogDraft = async () => {
    const draft = {
      id: String(Date.now()),
      title: editTitle || 'Untitled catalog draft',
      savedAt: new Date().toISOString(),
      data: {
        imageUri, artisanName, artisanLocation, artisanPhone, artisanNotes, priceIdea,
        isEnhanced, editTitle, editCategory, editPrice, editDescEn, editDescHi,
        tags, listingQuantity, newTag
      }
    };
    const nextDrafts = [draft, ...catalogDrafts];
    await AsyncStorage.setItem(catalogDraftKey, JSON.stringify(nextDrafts));
    setCatalogDrafts(nextDrafts);
    Alert.alert('Draft saved offline', 'Your catalog is saved on this device and can be restored without internet.');
  };

  const restoreCatalogDraft = (draft: typeof catalogDrafts[number]) => {
    const data = draft.data;
    setImageUri(typeof data.imageUri === 'string' ? data.imageUri : null);
    setArtisanName(typeof data.artisanName === 'string' ? data.artisanName : '');
    setArtisanLocation(typeof data.artisanLocation === 'string' ? data.artisanLocation : '');
    setArtisanPhone(typeof data.artisanPhone === 'string' ? data.artisanPhone : '');
    setArtisanNotes(typeof data.artisanNotes === 'string' ? data.artisanNotes : '');
    setPriceIdea(typeof data.priceIdea === 'string' ? data.priceIdea : '');
    setIsEnhanced(data.isEnhanced === true);
    setEditTitle(typeof data.editTitle === 'string' ? data.editTitle : '');
    setEditCategory(typeof data.editCategory === 'string' ? data.editCategory : 'Pottery & Terracotta');
    setEditPrice(typeof data.editPrice === 'string' ? data.editPrice : '');
    setEditDescEn(typeof data.editDescEn === 'string' ? data.editDescEn : '');
    setEditDescHi(typeof data.editDescHi === 'string' ? data.editDescHi : '');
    setTags(Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : []);
    setListingQuantity(typeof data.listingQuantity === 'string' ? data.listingQuantity : '1');
    setNewTag(typeof data.newTag === 'string' ? data.newTag : '');
    setActiveTab('studio');
    Alert.alert('Draft restored', 'Continue editing your saved catalog.');
  };

  const removeCatalogDraft = async (draftId: string) => {
    const nextDrafts = catalogDrafts.filter(draft => draft.id !== draftId);
    await AsyncStorage.setItem(catalogDraftKey, JSON.stringify(nextDrafts));
    setCatalogDrafts(nextDrafts);
  };

  const saveBulkDraft = async () => {
    const draft = {
      id: String(Date.now()),
      savedAt: new Date().toISOString(),
      data: { bulkNeed, bulkBuyerType, bulkCategory, bulkQuantity, bulkUnitPrice, bulkLeadTime }
    };
    const nextDrafts = [draft, ...bulkDrafts];
    await AsyncStorage.setItem(bulkDraftKey, JSON.stringify(nextDrafts));
    setBulkDrafts(nextDrafts);
    Alert.alert('Bulk draft saved offline', 'Your institutional request is saved on this device.');
  };

  const restoreBulkDraft = (draft: typeof bulkDrafts[number]) => {
    setBulkNeed(draft.data.bulkNeed || '');
    setBulkBuyerType(draft.data.bulkBuyerType || 'Retail / Institutional Buyer');
    setBulkCategory(draft.data.bulkCategory || 'Handloom & Textiles');
    setBulkQuantity(draft.data.bulkQuantity || '100');
    setBulkUnitPrice(draft.data.bulkUnitPrice || '250');
    setBulkLeadTime(draft.data.bulkLeadTime || '7-15 working days');
    Alert.alert('Bulk draft restored', 'Continue editing your saved RFQ.');
  };

  const loadProducts = async () => {
    const data = await fetchMarketplaceProducts();
    setProducts(data);
  };

  const refreshAccountData = async (user: AppUser) => {
    const [userOrders, userListings] = await Promise.all([
      fetchOrdersForUser(user.id),
      fetchPublishedProducts(user.id)
    ]);
    setOrders(userOrders);
    setPublishedProducts(userListings);
  };

  const handleGuestLogin = async () => {
    const user = await loginUser(authEmail, authPassword, authRole);
    if (!user) {
      Alert.alert('Login Error', 'Use demo@kalakriti.in / demo123 or check the backend connection.');
      return;
    }
    setCurrentUser(user);
    setIsLoggedIn(true);
    setAuthMode('login');
    setActiveTab('home');
    try {
      await refreshAccountData(user);
    } catch (error) {
      console.warn('Account activity unavailable:', error);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setActiveTab('home');
  };

  const openHomeMarket = () => {
    setActiveTab('home');
  };

  const toggleWishlist = (productId: number) => {
    if (!isLoggedIn) {
      Alert.alert('Sign in required', 'Please sign in to save products to your wishlist.');
      setActiveTab('account');
      return;
    }
    setWishlist(prev => prev.includes(productId)
      ? prev.filter(id => id !== productId)
      : [...prev, productId]);
  };

  const requestOrder = async (product: CraftProduct) => {
    if (!isLoggedIn || !currentUser) {
      setOrderActionMessage('Sign in from Account before placing an order.');
      Alert.alert('Sign in required', 'Please sign in to request an order.');
      setActiveTab('account');
      return;
    }

    const availableQuantity = Math.max(0, Number(product.quantity ?? 10));
    if (availableQuantity <= 0) {
      setOrderActionMessage('This product is sold out.');
      Alert.alert('Sold out', 'This product has no remaining stock.');
      return;
    }

    if (!deliveryDetails.recipientName || !deliveryDetails.recipientPhone || !deliveryDetails.addressLine ||
      !deliveryDetails.city || !deliveryDetails.state || !/^\d{6}$/.test(deliveryDetails.pincode)) {
      setOrderActionMessage('Complete the delivery details above, including a valid 6-digit pincode.');
      Alert.alert('Delivery details required', 'Enter your name, phone, address, city, state, and 6-digit pincode before ordering.');
      return;
    }
    const quantity = Number(buyQuantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > availableQuantity) {
      setOrderActionMessage(`Choose a quantity from 1 to ${availableQuantity}.`);
      Alert.alert('Invalid quantity', `You can buy between 1 and ${availableQuantity} products for this item.`);
      return;
    }

    setIsPlacingOrder(true);
    setOrderActionMessage('');
    try {
      const order = await createOrder({
        userId: currentUser.id,
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity,
        customerName: currentUser.name,
        ...deliveryDetails
      });

      setOrders(prev => [order, ...prev]);
      setProducts(prev => prev.map(item => item.id === product.id
        ? { ...item, quantity: Math.max(0, (Number(item.quantity ?? 10)) - quantity) }
        : item
      ));
      setBuyQuantity('1');
      Alert.alert('Order requested', `Your request for ${product.name} has been sent to the artisan.`);
      setActiveTab('account');
      setAccountView('orders');
    } catch (error) {
      setOrderActionMessage(error instanceof Error ? error.message : 'Could not place the order request.');
      Alert.alert('Order request failed', error instanceof Error ? error.message : 'Could not place the order request.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const removeOwnProduct = async (product: CraftProduct) => {
    if (!currentUser) {
      Alert.alert('Sign in required', 'Please sign in to manage marketplace listings.');
      return;
    }
    if (deletingProductId === product.id) return;
    if (Platform.OS === 'web' && !globalThis.confirm('Delete this product listing?')) return;

    if (Platform.OS !== 'web') {
      const shouldDelete = await new Promise<boolean>(resolve => {
        Alert.alert('Delete listing', 'Delete this product listing?', [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
        ], { cancelable: true, onDismiss: () => resolve(false) });
      });
      if (!shouldDelete) return;
    }

    setDeletingProductId(product.id);
    try {
      await deleteProduct(product.id, currentUser.id);
      setProducts(prev => prev.filter(item => item.id !== product.id));
      setPublishedProducts(prev => prev.filter(item => item.id !== product.id));
      Alert.alert('Deleted', 'Your product listing was deleted.');
    } catch (error) {
      Alert.alert('Delete failed', error instanceof Error ? error.message : 'Could not delete listing.');
    } finally {
      setDeletingProductId(null);
    }
  };

  const submitReview = async (product: CraftProduct) => {
    if (!reviewComment.trim()) {
      Alert.alert('Review required', 'Please write a comment before submitting.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const result = await addProductReview(product.id, currentUser?.name || 'Marketplace visitor', reviewRating, reviewComment.trim());
      setProducts(prev => prev.map(item => item.id === product.id ? { ...item, rating: result.rating, reviews: result.reviews } : item));
      setReviewComment('');
      setReviewProductId(null);
      Alert.alert('Thank you', 'Your rating and review were added.');
    } catch (error) {
      Alert.alert('Review unavailable', error instanceof Error ? error.message : 'Could not submit the review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleBulkSupport = () => {
    const subject = encodeURIComponent('KalaSetu Bulk & Institutional Linkage Request');
    const body = encodeURIComponent(
      `Hello KalaSetu team,\n\nI want to connect with bulk buyers / institutional buyers for my craft.\n\nName: ${currentUser?.name || authName}\nEmail: ${currentUser?.email || authEmail}\nCity: ${currentUser?.city || artisanLocation}\nRequirement: ${bulkNeed || 'Need help connecting to institutional buyers and government e-marketplaces'}\nBuyer type: ${bulkBuyerType}\n\nPlease help me with bulk opportunities and procurement support.`
    );
    Linking.openURL(`mailto:kalasetu24824.9@gmail.com?subject=${subject}&body=${body}`);
  };

  const openBulkChannel = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Link unavailable', 'Please open this channel from a browser.');
    });
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!isLoggedIn) {
      Alert.alert('Sign in required', 'Please sign in to manage your orders.');
      setActiveTab('account');
      return;
    }

    const reason = cancelReason.trim();
    if (!reason) {
      Alert.alert('Order cancellation', 'Please add a reason before cancelling this order.');
      return;
    }

    try {
      const result = await cancelOrderApi(orderId, reason);
      if (result?.status !== 'success') {
        throw new Error('The order could not be cancelled.');
      }
      setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status: 'Cancelled' } : order));
      Alert.alert(
        'Order cancelled',
        result.localOnly
          ? 'The demo order was removed from this device. Connect the backend to persist cancellations.'
          : `The order quantity was restored by ${result.restored_quantity || 1} item(s).`
      );
    } catch (error) {
      Alert.alert('Order cancellation failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const selectLanguage = async (nextLanguage: Language) => {
    setLang(nextLanguage);
    setIsLanguageMenuOpen(false);
    await AsyncStorage.setItem('kalasetu_language', nextLanguage);
  };

  // Pick Image from Camera
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera permission is needed to photograph crafts.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Pick Image from Gallery
  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Load Demo Presets (for instant 1-click jury demonstrations)
  const loadDemoPreset = (presetIndex: number) => {
    if (presetIndex === 0) {
      setImageUri("https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80");
      setArtisanNotes("Red clay pot made on village wheel with floral engravings");
      setPriceIdea("600");
    } else if (presetIndex === 1) {
      setImageUri("https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80");
      setArtisanNotes("Lost wax bell metal craft by Bastar tribal artisans");
      setPriceIdea("1800");
    } else {
      setImageUri("https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80");
      setArtisanNotes("Traditional Kutchi mirrorwork embroidered textile");
      setPriceIdea("1400");
    }
  };

  // Run AI Vision Analysis
  const handleAnalyze = async () => {
    if (!imageUri) {
      Alert.alert("Photo Required", "Please take or select a craft photo first.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(lang === 'hi' ? "शिल्प की बनावट की जांच..." : "Analyzing craft texture & materials...");

    setTimeout(() => {
      setAnalysisProgress(lang === 'hi' ? "उचित कारीगर मूल्य और टैग तैयार..." : "Calculating fair artisan pricing & SEO tags...");
    }, 1200);

    try {
      const result = await analyzeProductPhoto(imageUri, artisanNotes, priceIdea);
      setAiResult(result);
      setEditTitle(result.suggested_title);
      setEditCategory(result.category);
      setEditPrice(String(result.pricing.suggested));
      setEditDescEn(result.description_en);
      setEditDescHi(result.description_hi);
      setTags(result.tags || []);
    } catch (err) {
      Alert.alert("Analysis Error", "Could not complete AI analysis. Try again.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  // Native Audio Speech
  const toggleSpeech = (text: string, speechLang: string = 'en') => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(text, {
        language: speechLang.includes('-') ? speechLang : speechLocale,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const toggleVoiceInput = async () => {
    if (isListening) {
      if (Platform.OS === 'web') {
        browserListeningRef.current = false;
        browserRecognitionRef.current?.abort?.();
        browserRecognitionRef.current?.stop();
        browserRecognitionRef.current = null;
        setIsListening(false);
      } else {
        nativeListeningRef.current = false;
        ExpoSpeechRecognitionModule.stop();
        setIsListening(false);
      }
      return;
    }

    setSpeechError('');
    try {
      if (Platform.OS === 'web') {
        const isEmbeddedBrowser = /Electron|Code/.test(navigator.userAgent || '') || !!(globalThis as typeof globalThis & { process?: { versions?: { electron?: unknown } } }).process?.versions?.electron;
        if (isEmbeddedBrowser) {
          setSpeechError('Speech recognition is not available in this embedded browser. Open the app in Chrome or Edge and allow microphone access.');
          return;
        }

        const browserSpeech = globalThis as typeof globalThis & {
          SpeechRecognition?: BrowserSpeechRecognitionConstructor;
          webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
        };
        const Recognition = browserSpeech.SpeechRecognition || browserSpeech.webkitSpeechRecognition;
        if (!Recognition) {
          setSpeechError(tx('voiceError'));
          return;
        }

        const recognition = new Recognition();
        browserRecognitionRef.current = recognition;
        browserTranscriptRef.current = artisanNotes.trim();
        recognition.lang = voiceLanguage;
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.onresult = event => {
          let transcript = '';
          const startIndex = event.resultIndex || 0;
          for (let index = startIndex; index < event.results.length; index += 1) {
            transcript += `${event.results[index]?.[0]?.transcript || ''} `;
          }
          const cleanTranscript = transcript.trim();
          if (cleanTranscript) {
            const existing = browserTranscriptRef.current;
            const nextText = existing && !cleanTranscript.startsWith(existing)
              ? `${existing} ${cleanTranscript}`
              : cleanTranscript;
            setArtisanNotes(nextText.trim());
            if (event.results[event.results.length - 1]?.[0]) {
              browserTranscriptRef.current = nextText.trim();
            }
          }
        };
        recognition.onerror = event => {
          browserListeningRef.current = false;
          setIsListening(false);
          setSpeechError(`Speech recognition error: ${event.error || 'unknown error'}`);
        };
        recognition.onend = () => {
          if (browserListeningRef.current) {
            window.setTimeout(() => {
              if (browserListeningRef.current) {
                try {
                  recognition.start();
                } catch {
                  window.setTimeout(() => {
                    if (browserListeningRef.current) {
                      try {
                        recognition.start();
                      } catch {
                        // The browser will retry from its next end event.
                      }
                    }
                  }, 1000);
                }
              }
            }, 250);
          } else {
            setIsListening(false);
            browserRecognitionRef.current = null;
          }
        };
        browserListeningRef.current = true;
        try {
          recognition.start();
          setIsListening(true);
        } catch (error) {
          browserListeningRef.current = false;
          browserRecognitionRef.current = null;
          setSpeechError(error instanceof Error ? error.message : tx('voiceError'));
          setIsListening(false);
        }
        return;
      }

      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setSpeechError(tx('voicePermissionDenied'));
        return;
      }

      nativeListeningRef.current = true;
      ExpoSpeechRecognitionModule.start({
        lang: voiceLanguage,
        interimResults: true,
        continuous: true,
        maxAlternatives: 1,
      });
    } catch (error) {
      setSpeechError(error instanceof Error ? error.message : tx('voiceError'));
    }
  };

  // Add Tag
  const handleAddTag = () => {
    const trimmed = newTag.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag('');
    }
  };

  // Remove Tag
  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, idx) => idx !== index));
  };

  // Publish to Marketplace
  const handlePublish = async () => {
    if (!editTitle || !editPrice) {
      Alert.alert("Incomplete Listing", "Please provide a title and price.");
      return;
    }
    const listingQuantityValue = Number(listingQuantity);
    if (!Number.isInteger(listingQuantityValue) || listingQuantityValue < 1 || listingQuantityValue > 10) {
      Alert.alert('Invalid quantity', 'Each listing must contain between 1 and 10 products.');
      return;
    }

    setIsPublishing(true);
    const imageUrl = imageUri || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80";
    const newProduct: Omit<CraftProduct, 'id'> = {
      name: editTitle,
      artisan_name: currentUser?.name || artisanName || "Artisan Beneficiary",
      artisan_location: artisanLocation || "Rural Cluster",
      artisan_phone: artisanPhone,
      category: editCategory,
      price: Number(editPrice),
      quantity: listingQuantityValue,
      suggested_price_min: aiResult?.pricing.fair_min,
      suggested_price_max: aiResult?.pricing.fair_max,
      price_justification: aiResult?.pricing.justification,
      description_en: editDescEn,
      description_hi: editDescHi,
      tags: tags,
      image_url: imageUrl,
      image_gallery: [imageUrl],
      rating: 4.8,
      reviews: [{ user_name: artisanName || "Verified Buyer", rating: 5, comment: "Fresh artisan listing with marketplace photo." }],
      is_enhanced: isEnhanced,
      mosje_verified: true
    };

    try {
      await publishProductToApi(newProduct);
    } catch (error) {
      setIsPublishing(false);
      Alert.alert('Publishing failed', error instanceof Error ? error.message : 'Could not publish this listing.');
      return;
    }
    setIsPublishing(false);

    try {
      const [marketplaceProducts] = await Promise.all([
        fetchMarketplaceProducts(),
        currentUser ? refreshAccountData(currentUser) : Promise.resolve()
      ]);
      setProducts(marketplaceProducts);
    } catch (error) {
      console.warn('Published listing refresh unavailable:', error);
      setProducts(prev => [{ ...newProduct, id: Date.now() }, ...prev]);
    }

    Alert.alert(
      lang === 'hi' ? "सफलता!" : "Success!",
      t.publishSuccess,
      [{ text: "OK", onPress: () => setActiveTab('market') }]
    );

    // Reset Studio
    setImageUri(null);
    setListingQuantity('1');
    setAiResult(null);
    setArtisanNotes('');
    setPriceIdea('');
  };

  // Open WhatsApp Link directly from phone
  const openWhatsApp = (phone: string, productName: string, price: number) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hello! I saw your handcrafted '${productName}' on KalaSetu marketplace for ₹${price}. I would like to buy it directly from you.`);
    const url = `whatsapp://send?phone=${cleanPhone}&text=${message}`;
    const webFallback = `https://wa.me/${cleanPhone}?text=${message}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(webFallback);
      }
    });
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.artisan_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoriesList = ['All', 'Handloom & Textiles', 'Pottery & Terracotta', 'Brass & Metalcraft', 'Woodcraft', 'Cane & Bamboo', 'Folk Art & Painting'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {Platform.OS === 'android' && (
        <View style={[styles.statusBarSpacer, { height: topSafeInset, backgroundColor: Colors.secondary }]} />
      )}

      {/* Top MoSJE Banner Strip */}
      <View style={styles.topStrip}>
        <View style={styles.topStripLeft}>
          <Text style={styles.sihTag}>SIH 2026</Text>
          <Text style={styles.topStripText}>{t.sihBadge}</Text>
        </View>
        <TouchableOpacity style={styles.langBtn} onPress={() => setIsLanguageMenuOpen(true)}>
          <Text style={styles.langBtnText}>🌐 {languageOptions.find(([code]) => code === lang)?.[1]} ▾</Text>
        </TouchableOpacity>
      </View>

      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <TouchableOpacity onPress={openHomeMarket} style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>क</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openHomeMarket}>
            <Text style={styles.appName}>KalaSetu</Text>
            <Text style={styles.appSub}>{t.appSubtitle}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.helpBtn} 
          onPress={() => toggleSpeech(lang === 'hi' ? 'नमस्ते! कलासेतु में आपका स्वागत है। यहां आप अपने हस्तशिल्प की फोटो अपलोड करें। हमारा एआई आपके उत्पाद का नाम, कीमत और विवरण खुद तैयार करेगा।' : 'Welcome to KalaSetu! Take a photo of your craft. Our AI will automatically identify the craft category, suggest fair pricing, and write SEO descriptions.', lang)}>
          <Text style={styles.helpBtnText}>{isSpeaking ? '⏹ Stop' : `🔊 ${lang === 'hi' ? 'मदद सुनें' : 'Audio Help'}`}</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={isLanguageMenuOpen} transparent animationType="fade" onRequestClose={() => setIsLanguageMenuOpen(false)}>
        <TouchableOpacity style={styles.languageModalBackdrop} activeOpacity={1} onPress={() => setIsLanguageMenuOpen(false)}>
          <View style={styles.languageMenu}>
            <Text style={styles.languageMenuTitle}>{t.selectLanguage}</Text>
            {languageOptions.map(([code, label]) => (
              <TouchableOpacity
                key={code}
                style={[styles.languageMenuOption, lang === code && styles.languageMenuOptionActive]}
                onPress={() => void selectLanguage(code)}
              >
                <Text style={[styles.languageMenuOptionText, lang === code && styles.languageMenuOptionTextActive]}>{label}</Text>
                {lang === code && <Text style={styles.languageCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Main Body: Scrollable Screen */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {activeTab === 'home' ? (
          <View style={styles.homeContainer}>
            <View style={styles.homeHero}>
              <Text style={styles.homeKicker}>KalaSetu x SIH26090</Text>
              <Text style={styles.homeTitle}>{tx('homeTitle')}</Text>
              <Text style={styles.homeSubtitle}>{tx('homeSubtitle')}</Text>
              <View style={styles.homeActionRow}>
                <TouchableOpacity style={styles.primaryAction} onPress={() => setActiveTab('studio')}>
                  <Text style={styles.primaryActionText}>{tx('startCataloging')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryAction} onPress={() => setActiveTab('market')}>
                  <Text style={styles.secondaryActionText}>{tx('exploreCrafts')}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.homeImageCard}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1577083288073-40892c0860a4?auto=format&fit=crop&w=1200&q=80' }} style={styles.homeImage} />
              <Text style={styles.homeImageCaption}>Terracotta • Madhubani • Dhokra • {t.mosjeVerified}</Text>
            </View>
            <Text style={styles.homeSectionTitle}>{tx('connectedPaths')}</Text>
            <View style={styles.homeFeatureGrid}>
              <View style={styles.homeFeatureCard}>
                <Text style={styles.homeFeatureIcon}>🪡</Text>
                <Text style={styles.homeFeatureTitle}>{tx('forArtisans')}</Text>
                <Text style={styles.homeFeatureText}>{tx('artisanPath')}</Text>
              </View>
              <View style={styles.homeFeatureCard}>
                <Text style={styles.homeFeatureIcon}>🏛️</Text>
                <Text style={styles.homeFeatureTitle}>{tx('forBuyers')}</Text>
                <Text style={styles.homeFeatureText}>{tx('buyerPath')}</Text>
              </View>
            </View>
            <Text style={styles.homeSectionTitle}>{tx('aiCataloging')}</Text>
            <View style={styles.homeFeatureCard}>
              <Text style={styles.homeFeatureTitle}>{tx('aiCatalogingText')}</Text>
              <Text style={styles.homeFeatureText}>{tx('homeSubtitle')}</Text>
            </View>
          </View>
        ) : activeTab === 'studio' ? (
          /* ======================================================= */
          /* SCREEN 1: ARTISAN STUDIO                                */
          /* ======================================================= */
          <View style={styles.studioContainer}>
            <View style={styles.offlineDraftBanner}>
              <View style={styles.offlineDraftHeader}>
                <Text style={styles.offlineDraftTitle}>{tx('saveDraft')}</Text>
                <Text style={styles.offlineDraftBadge}>{catalogDrafts.length} saved</Text>
              </View>
              <Text style={styles.offlineDraftText}>{tx('bulkHelp')}</Text>
              <TouchableOpacity style={styles.offlineDraftSaveButton} onPress={saveCatalogDraft}>
                <Text style={styles.offlineDraftSaveText}>{tx('saveDraft')}</Text>
              </TouchableOpacity>
              {catalogDrafts.map(draft => (
                <View key={draft.id} style={styles.offlineDraftRow}>
                  <View style={styles.offlineDraftInfo}>
                    <Text style={styles.offlineDraftName}>{draft.title}</Text>
                    <Text style={styles.offlineDraftDate}>{new Date(draft.savedAt).toLocaleString()}</Text>
                  </View>
                  <View style={styles.offlineDraftActions}>
                    <TouchableOpacity onPress={() => restoreCatalogDraft(draft)}>
                      <Text style={styles.offlineDraftRestore}>{tx('restoreDraft')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeCatalogDraft(draft.id)}>
                      <Text style={styles.offlineDraftRemove}>{tx('removePublished')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            
            {/* Step 1 Card: Photo Capture */}
            <View style={styles.card}>
              <Text style={styles.cardStepTitle}>{t.step1Title}</Text>
              <Text style={styles.cardStepSub}>{t.step1Sub}</Text>

              {/* Demo Sample Presets */}
              <View style={styles.presetsRow}>
                <Text style={styles.presetLabel}>{t.demoSampleTitle}</Text>
                <View style={styles.presetButtons}>
                  <TouchableOpacity style={styles.presetChip} onPress={() => loadDemoPreset(0)}>
                    <Text style={styles.presetChipText}>🏺 Terracotta</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.presetChip} onPress={() => loadDemoPreset(1)}>
                    <Text style={styles.presetChipText}>🐘 Brass</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.presetChip} onPress={() => loadDemoPreset(2)}>
                    <Text style={styles.presetChipText}>🧵 Handloom</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Image Preview Box */}
              <View style={styles.imageBox}>
                {imageUri ? (
                  <Image 
                    source={{ uri: imageUri }} 
                    style={[styles.previewImage, isEnhanced && styles.enhancedImage]} 
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderEmoji}>📸</Text>
                    <Text style={styles.placeholderText}>
                      {lang === 'hi' ? 'यहाँ फोटो दिखाई देगी' : 'Take or pick a photo of your craft'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Studio Light Enhancement Switch */}
              <View style={styles.enhancerRow}>
                <View>
                  <Text style={styles.enhancerTitle}>💡 {t.studioEnhancer}</Text>
                  <Text style={styles.enhancerSub}>Professional marketplace lighting</Text>
                </View>
                <Switch 
                  value={isEnhanced} 
                  onValueChange={setIsEnhanced}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quantity to sell (1-10)</Text>
                <TextInput
                  style={styles.textInput}
                  value={listingQuantity}
                  onChangeText={setListingQuantity}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholderTextColor={Colors.textSecondary}
                />
                <Text style={styles.helperText}>Maximum 3 marketplace listings per artisan each calendar month.</Text>
              </View>

              {/* Action Buttons: Camera & Gallery */}
              <View style={styles.actionButtonRow}>
                <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}>
                  <Text style={styles.primaryButtonText}>📷 {t.btnCamera}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={pickFromGallery}>
                  <Text style={styles.secondaryButtonText}>🖼️ {t.btnGallery}</Text>
                </TouchableOpacity>
              </View>

              {/* Artisan Profile & Voice Notes */}
              <View style={styles.formFields}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.artisanName}</Text>
                  <TextInput 
                    style={styles.textInput} 
                    value={artisanName} 
                    onChangeText={setArtisanName} 
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.artisanLocation}</Text>
                  <TextInput 
                    style={styles.textInput} 
                    value={artisanLocation} 
                    onChangeText={setArtisanLocation} 
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.artisanPhone}</Text>
                  <TextInput 
                    style={styles.textInput} 
                    value={artisanPhone} 
                    onChangeText={setArtisanPhone} 
                    keyboardType="phone-pad" 
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.priceIdea}</Text>
                  <TextInput 
                    style={styles.textInput} 
                    value={priceIdea} 
                    onChangeText={setPriceIdea} 
                    keyboardType="numeric" 
                    placeholder="e.g. 500"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Text style={styles.inputLabel}>{t.artisanNotes}</Text>
                    <TouchableOpacity
                      style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
                      onPress={toggleVoiceInput}
                    >
                      <Text style={styles.voiceButtonText}>
                        {isListening ? `⏹️ ${tx('voiceListening')}` : '🎙️ Speak in English / Kannada / Hindi'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.voiceLanguageRow}>
                    {([['en-IN', 'English'], ['kn-IN', 'ಕನ್ನಡ'], ['hi-IN', 'हिन्दी']] as const).map(([code, label]) => (
                      <TouchableOpacity
                        key={code}
                        style={[styles.voiceLanguageChip, voiceLanguage === code && styles.voiceLanguageChipActive]}
                        onPress={() => setVoiceLanguage(code)}
                      >
                        <Text style={[styles.voiceLanguageChipText, voiceLanguage === code && styles.voiceLanguageChipTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.descriptionInputWrap}>
                    <TextInput
                      style={[styles.textInput, styles.textArea, styles.descriptionInput]}
                      value={artisanNotes}
                      onChangeText={setArtisanNotes}
                      multiline
                      placeholder={t.artisanNotesPlaceholder}
                      placeholderTextColor={Colors.textSecondary}
                    />
                    <TouchableOpacity
                      style={[styles.descriptionMicButton, isListening && styles.voiceButtonActive]}
                      onPress={toggleVoiceInput}
                      accessibilityLabel={isListening ? tx('voiceListening') : tx('voiceInput')}
                    >
                      <Text style={styles.descriptionMicText}>{isListening ? '⏹️' : '🎙️'}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.voiceHint}>Speak in English, Kannada or Hindi. AI will create the English catalog description.</Text>
                  {speechError ? <Text style={styles.errorText}>{speechError}</Text> : null}
                </View>
              </View>

              {/* Analyze Button */}
              <TouchableOpacity 
                style={[styles.analyzeButton, (!imageUri || isAnalyzing) && styles.disabledButton]} 
                onPress={handleAnalyze}
                disabled={!imageUri || isAnalyzing}>
                {isAnalyzing ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text style={styles.analyzeButtonText}>{analysisProgress || t.analyzing}</Text>
                  </View>
                ) : (
                  <Text style={styles.analyzeButtonText}>{t.btnAnalyze}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Step 2 Card: Review & Edit Suggestions */}
            {aiResult && (
              <View style={[styles.card, styles.reviewCard]}>
                <Text style={styles.cardStepTitle}>{t.step2Title}</Text>

                {/* Title */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.productTitle}</Text>
                  <TextInput 
                    style={styles.textInput} 
                    value={editTitle} 
                    onChangeText={setEditTitle} 
                  />
                </View>

                {/* Category */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.category}</Text>
                  <TextInput 
                    style={styles.textInput} 
                    value={editCategory} 
                    onChangeText={setEditCategory} 
                  />
                </View>

                {/* Dynamic Pricing Assistant Box */}
                <View style={styles.pricingBox}>
                  <Text style={styles.pricingTitle}>⚖️ {t.pricingAssistant}</Text>
                  <Text style={styles.pricingRange}>
                    {t.fairRange} <Text style={styles.boldText}>₹{aiResult.pricing.fair_min} - ₹{aiResult.pricing.fair_max}</Text>
                  </Text>
                  <Text style={styles.pricingJustification}>{aiResult.pricing.justification}</Text>

                  <TouchableOpacity 
                    style={styles.applyPriceBtn} 
                    onPress={() => setEditPrice(String(aiResult.pricing.suggested))}>
                    <Text style={styles.applyPriceBtnText}>{t.btnApplyPrice} (₹{aiResult.pricing.suggested})</Text>
                  </TouchableOpacity>
                </View>

                {/* Price Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Final Selling Price (₹)</Text>
                  <TextInput 
                    style={[styles.textInput, styles.boldPriceInput]} 
                    value={editPrice} 
                    onChangeText={setEditPrice} 
                    keyboardType="numeric" 
                  />
                </View>

                {/* Tags */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.tags}</Text>
                  <View style={styles.tagsContainer}>
                    {tags.map((tag, idx) => (
                      <TouchableOpacity key={idx} style={styles.tagChip} onPress={() => handleRemoveTag(idx)}>
                        <Text style={styles.tagText}>#{tag} ×</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.addTagRow}>
                    <TextInput 
                      style={[styles.textInput, styles.addTagInput]} 
                      value={newTag} 
                      onChangeText={setNewTag} 
                      placeholder="Add tag..." 
                    />
                    <TouchableOpacity style={styles.addTagBtn} onPress={handleAddTag}>
                      <Text style={styles.addTagBtnText}>+ Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* English Description + Audio */}
                <View style={styles.inputGroup}>
                  <View style={styles.descHeaderRow}>
                    <Text style={styles.inputLabel}>{t.descEn}</Text>
                    <TouchableOpacity 
                      style={styles.speakerBtn} 
                      onPress={() => toggleSpeech(editDescEn, 'en')}>
                      <Text style={styles.speakerBtnText}>{isSpeaking ? '⏹ Stop' : `🔊 ${t.listenDesc}`}</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput 
                    style={[styles.textInput, styles.textArea]} 
                    value={editDescEn} 
                    onChangeText={setEditDescEn} 
                    multiline 
                  />
                </View>

                {/* Hindi Description + Audio */}
                <View style={styles.inputGroup}>
                  <View style={styles.descHeaderRow}>
                    <Text style={styles.inputLabel}>{t.descHi}</Text>
                    <TouchableOpacity 
                      style={styles.speakerBtn} 
                      onPress={() => toggleSpeech(editDescHi, 'hi')}>
                      <Text style={styles.speakerBtnText}>{isSpeaking ? '⏹ Stop' : `🔊 ${t.listenDesc}`}</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput 
                    style={[styles.textInput, styles.textArea]} 
                    value={editDescHi} 
                    onChangeText={setEditDescHi} 
                    multiline 
                  />
                </View>

                {/* Publish Button */}
                <TouchableOpacity 
                  style={[styles.publishButton, isPublishing && styles.disabledButton]} 
                  onPress={handlePublish}
                  disabled={isPublishing}>
                  {isPublishing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.publishButtonText}>{t.btnPublish}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={saveCatalogDraft}>
                   <Text style={styles.secondaryButtonText}>{tx('saveDraft')}</Text>
                </TouchableOpacity>

              </View>
            )}
          </View>
          ) : activeTab === 'market' ? (
          /* ======================================================= */
          /* SCREEN 2: BUYER MARKETPLACE FEED                        */
          /* ======================================================= */
          <View style={styles.marketContainer}>
            
            {/* Marketplace Banner */}
            <View style={styles.marketHero}>
              <Text style={styles.marketHeroTitle}>{t.marketTitle}</Text>
              <Text style={styles.marketHeroSub}>{t.marketSub}</Text>
              <TouchableOpacity
                style={styles.marketSpeakButton}
                onPress={() => toggleSpeech(`${t.marketTitle}. ${t.marketSub}. ${t.directToArtisan}. ${t.mosjeVerified}`, speechLocale)}
              >
                <Text style={styles.marketSpeakButtonText}>{isSpeaking ? '⏹ Stop' : `🔊 ${tx('tapToSpeak')}`}</Text>
              </TouchableOpacity>
              <View style={styles.guaranteeRow}>
                <Text style={styles.guaranteeText}>✓ {t.directToArtisan}</Text>
                <Text style={styles.guaranteeText}>✓ {t.mosjeVerified}</Text>
              </View>
            </View>

            <View style={styles.bulkLeadCard}>
              <Text style={styles.bulkLeadTitle}>{tx('bulkLinkage')}</Text>
              <Text style={styles.bulkLeadText}>{tx('bulkSubtitle')}</Text>
              <TouchableOpacity style={styles.bulkLeadButton} onPress={() => setActiveTab('institutional')}>
                <Text style={styles.bulkLeadButtonText}>{tx('prepareRfq')}</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <TextInput 
              style={styles.searchBar} 
              placeholder={t.searchPlaceholder} 
              value={searchQuery} 
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textSecondary}
            />
            <View style={styles.deliveryCard}>
              <Text style={styles.deliveryTitle}>{tx('deliveryDetails')}</Text>
              {([
                ['recipientName', 'Full name'],
                ['recipientPhone', tx('mobileNumber')],
                ['addressLine', tx('houseStreet')],
                ['city', tx('city')],
                ['state', tx('state')],
                ['pincode', tx('pincode')]
              ] as const).map(([key, placeholder]) => (
                <TextInput
                  key={key}
                  style={styles.deliveryInput}
                  placeholder={placeholder}
                  value={deliveryDetails[key]}
                  onChangeText={value => setDeliveryDetails(prev => ({ ...prev, [key]: value }))}
                  keyboardType={key === 'pincode' || key === 'recipientPhone' ? 'phone-pad' : 'default'}
                  placeholderTextColor={Colors.textSecondary}
                />
              ))}
            </View>
            {!!orderActionMessage && <Text style={styles.orderActionMessage}>{orderActionMessage}</Text>}

            {/* Category Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesBar}>
              {categoriesList.map((cat, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
                  onPress={() => setSelectedCategory(cat)}>
                  <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Products Feed */}
            <View style={styles.productsFeed}>
              {filteredProducts.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  
                  {/* Image & Badges */}
                  <View style={styles.productImageWrapper}>
                    <Image source={{ uri: product.image_url }} style={styles.productImage} />
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{product.category}</Text>
                    </View>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>★ MoSJE</Text>
                    </View>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceBadgeText}>₹{product.price}</Text>
                    </View>
                  </View>

                  {/* Card Content */}
                  <View style={styles.productCardBody}>
                    <Text style={styles.productCardTitle}>{product.name}</Text>
                    <Text style={styles.productArtisan}>
                      👤 {product.artisan_name} &bull; {product.artisan_location}
                    </Text>

                    <Text style={styles.productDesc} numberOfLines={2}>
                      {lang === 'hi' && product.description_hi ? product.description_hi : product.description_en}
                    </Text>

                    <View style={styles.ratingRow}>
                      <Text style={styles.ratingText}>★ {Number(product.rating || 4.5).toFixed(1)}</Text>
                      <Text style={styles.reviewText}>{product.reviews?.length || 0} {tx('reviews')}</Text>
                    </View>

                    <TouchableOpacity style={styles.reviewButton} onPress={() => setReviewProductId(reviewProductId === product.id ? null : product.id)}>
                      <Text style={styles.reviewButtonText}>{tx('rateReview')}</Text>
                    </TouchableOpacity>
                    {reviewProductId === product.id && (
                      <View style={styles.reviewEditor}>
                        <View style={styles.reviewStarsRow}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                              <Text style={[styles.reviewStar, star <= reviewRating && styles.reviewStarActive]}>★</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TextInput
                          style={styles.reviewInput}
                          value={reviewComment}
                          onChangeText={setReviewComment}
                          placeholder={tx('writeExperience')}
                          multiline
                          placeholderTextColor={Colors.textSecondary}
                        />
                        <TouchableOpacity style={styles.submitReviewButton} onPress={() => submitReview(product)} disabled={isSubmittingReview}>
                          {isSubmittingReview ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitReviewButtonText}>{tx('submitReview')}</Text>}
                        </TouchableOpacity>
                      </View>
                    )}

                    {product.image_gallery && product.image_gallery.length > 1 ? (
                      <View style={styles.galleryRow}>
                        {product.image_gallery.slice(0, 3).map((url, idx) => (
                          <Image key={`${url}-${idx}`} source={{ uri: url }} style={styles.galleryThumb} />
                        ))}
                      </View>
                    ) : null}

                    <Text style={styles.quantityLabel}>Quantity for this order ({Math.max(1, Number(product.quantity ?? 10))} available)</Text>
                    <View style={styles.quantityOptions}>
                      {Array.from({ length: Math.max(0, Number(product.quantity ?? 10)) }, (_, index) => String(index + 1)).map(option => (
                        <TouchableOpacity
                          key={`${product.id}-${option}`}
                          style={[styles.quantityOption, buyQuantity === option && styles.quantityOptionActive]}
                          onPress={() => setBuyQuantity(option)}
                        >
                          <Text style={[styles.quantityOptionText, buyQuantity === option && styles.quantityOptionTextActive]}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.inlineActionRow}>
                      <TouchableOpacity style={styles.inlineActionButton} onPress={() => toggleWishlist(product.id)}>
                        <Text style={styles.inlineActionButtonText}>{wishlist.includes(product.id) ? t.removeFromWishlist : t.addToWishlist}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.inlineActionButtonPrimary, isPlacingOrder && styles.disabledButton]} onPress={() => requestOrder(product)} disabled={isPlacingOrder || (Number(product.quantity ?? 10) <= 0)}>
                        <Text style={styles.inlineActionButtonText}>{isPlacingOrder ? 'Placing...' : Number(product.quantity ?? 10) <= 0 ? 'Sold Out' : t.buyNow}</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                      style={styles.whatsAppButton} 
                      onPress={() => openWhatsApp(product.artisan_phone || '+919876543210', product.name, product.price)}>
                      <Text style={styles.whatsAppButtonText}>💬 {t.btnWhatsApp}</Text>
                    </TouchableOpacity>
                    {isLoggedIn && (
                      <TouchableOpacity style={styles.deleteProductButton} onPress={() => removeOwnProduct(product)}>
                        <Text style={styles.deleteProductButtonText}>Delete my listing</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                </View>
              ))}
            </View>
          </View>
        ) : activeTab === 'institutional' ? (
        <View style={styles.marketContainer}>
          <View style={styles.institutionalHero}>
            <Text style={styles.institutionalKicker}>{tx('bulkHero')}</Text>
            <Text style={styles.institutionalTitle}>{tx('bulkTitle')}</Text>
            <Text style={styles.institutionalSubtitle}>{tx('bulkSubtitle')}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.stepLabel}>{tx('step')} 1</Text>
            <Text style={styles.profileSectionTitle}>{tx('createBulkRequest')}</Text>
            <Text style={styles.bulkHelpText}>{tx('bulkHelp')}</Text>
            <TextInput style={styles.textInput} value={currentUser?.name || authName} placeholder={t.fullName} editable={!isLoggedIn} placeholderTextColor={Colors.textSecondary} />
            <TextInput style={styles.textInput} value={currentUser?.email || authEmail} placeholder={`${t.email} for follow-up`} keyboardType="email-address" editable={!isLoggedIn} placeholderTextColor={Colors.textSecondary} />
            <TextInput style={styles.textInput} value={bulkBuyerType} onChangeText={setBulkBuyerType} placeholder={tx('buyerType')} placeholderTextColor={Colors.textSecondary} />
            <TextInput style={styles.textInput} value={bulkCategory} onChangeText={setBulkCategory} placeholder={t.category} placeholderTextColor={Colors.textSecondary} />
            <View style={styles.bulkInputRow}>
              <TextInput style={[styles.textInput, styles.bulkHalfInput]} value={bulkQuantity} onChangeText={setBulkQuantity} placeholder="Quantity" keyboardType="numeric" placeholderTextColor={Colors.textSecondary} />
              <TextInput style={[styles.textInput, styles.bulkHalfInput]} value={bulkUnitPrice} onChangeText={setBulkUnitPrice} placeholder="Unit price (₹)" keyboardType="numeric" placeholderTextColor={Colors.textSecondary} />
            </View>
            <TextInput style={styles.textInput} value={bulkLeadTime} onChangeText={setBulkLeadTime} placeholder="Production / dispatch lead time" placeholderTextColor={Colors.textSecondary} />
            <TextInput style={[styles.textInput, styles.textArea]} value={bulkNeed} onChangeText={setBulkNeed} multiline placeholder="Packaging, customization, certifications, quality sample notes..." placeholderTextColor={Colors.textSecondary} />
            <TouchableOpacity style={styles.primaryAction} onPress={handleBulkSupport}>
              <Text style={styles.primaryActionText}>{tx('submitRfq')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={saveBulkDraft}>
              <Text style={styles.secondaryButtonText}>{tx('saveDraft')}</Text>
            </TouchableOpacity>
            {bulkDrafts.length > 0 && (
              <View>
                <Text style={styles.helperText}>{bulkDrafts.length} bulk draft(s) saved on this device.</Text>
                <TouchableOpacity onPress={() => restoreBulkDraft(bulkDrafts[0])}>
                  <Text style={styles.offlineDraftRestore}>{tx('restoreDraft')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.card}>
            <Text style={styles.stepLabel}>{tx('step')} 2</Text>
            <Text style={styles.profileSectionTitle}>{tx('buyerReady')}</Text>
            <Text style={styles.bulkHelpText}>{tx('buyerReadyHelp')}</Text>
            <View style={styles.bulkPricingCard}>
              <View style={styles.bulkPricingHeader}>
                <Text style={styles.bulkPricingTitle}>{tx('pricingTiers')}</Text>
                <Text style={styles.bulkPricingBadge}>{tx('wholesaleReady')}</Text>
              </View>
              <Text style={styles.bulkPricingHint}>
                Based on {bulkQuantityNumber || 0} units at ₹{bulkUnitPriceNumber.toLocaleString('en-IN')} base price
              </Text>
              {bulkPricingTiers.map(tier => (
                <View key={tier.volume} style={styles.bulkPricingRow}>
                  <Text style={styles.bulkPricingVolume}>{tier.volume}</Text>
                  <Text style={styles.bulkPricingPrice}>₹{Math.round(tier.price).toLocaleString('en-IN')}</Text>
                  <Text style={[styles.bulkPricingMargin, bulkQuantityNumber < tier.minimum && styles.bulkPricingUnavailable]}>
                    {bulkQuantityNumber >= tier.minimum ? tier.margin : `Needs ${tier.minimum}+`}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.bulkToolRow}>
              <TouchableOpacity style={styles.bulkToolButton} onPress={() => {
                if (!bulkQuantityNumber || !bulkUnitPriceNumber) {
                  Alert.alert('Bulk pricing', 'Enter both quantity and unit price to calculate your live bulk total.');
                  return;
                }
                const tierIndex = bulkQuantityNumber >= 51 ? 2 : bulkQuantityNumber >= 11 ? 1 : 0;
                const tier = bulkPricingTiers[tierIndex];
                const total = Math.round(tier.price) * bulkQuantityNumber;
                const savings = Math.max(0, Math.round((bulkUnitPriceNumber - tier.price) * bulkQuantityNumber));
                Alert.alert('Bulk pricing', `${bulkQuantityNumber} units × ₹${Math.round(tier.price).toLocaleString('en-IN')} = ₹${total.toLocaleString('en-IN')}\nSavings: ₹${savings.toLocaleString('en-IN')} (${tier.margin})`);
              }}>
                <Text style={styles.bulkToolText}>📊 Bulk pricing calculator</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bulkToolButton} onPress={() => Alert.alert('RFQ pitch', `Create a buyer pitch for ${bulkCategory}, ${bulkQuantity} units at ₹${bulkUnitPrice} each.`)}>
                <Text style={styles.bulkToolText}>✉️ Generate RFQ pitch</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bulkToolRow}>
              <TouchableOpacity style={styles.bulkToolButton} onPress={() => Alert.alert('GeM export', 'Your RFQ details are ready to be copied into a GeM-compliant CSV.')}>
                <Text style={styles.bulkToolText}>📦 GeM-ready export</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bulkToolButton} onPress={() => Alert.alert('ONDC export', 'Your RFQ details are ready for an ONDC Beckn JSON payload.')}>
                <Text style={styles.bulkToolText}>⚡ ONDC JSON</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.stepLabel}>{tx('step')} 3</Text>
            <Text style={styles.profileSectionTitle}>{tx('connectChannels')}</Text>
            <Text style={styles.bulkHelpText}>{tx('connectHelp')}</Text>
            <View style={styles.bulkChannelRow}>
              <TouchableOpacity style={styles.bulkChannelButton} onPress={() => openBulkChannel('https://gem.gov.in/')}><Text style={styles.bulkToolText}>GeM ↗</Text></TouchableOpacity>
              <TouchableOpacity style={styles.bulkChannelButton} onPress={() => openBulkChannel('https://ondc.org/')}><Text style={styles.bulkToolText}>ONDC ↗</Text></TouchableOpacity>
              <TouchableOpacity style={styles.bulkChannelButton} onPress={() => openBulkChannel('https://trifed.tribal.gov.in/')}><Text style={styles.bulkToolText}>TRIFED ↗</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => openBulkChannel('mailto:kalasetu24824.9@gmail.com?subject=KalaSetu%20Bulk%20Buyer%20Support')}>
              <Text style={styles.secondaryActionText}>{tx('emailSupport')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        ) : activeTab === 'account' ? (
          <View style={styles.marketContainer}>
            {!isLoggedIn ? (
              <View style={styles.authCard}>
                <Text style={styles.marketHeroTitle}>{t.loginTitle}</Text>
                <Text style={styles.authSubtitle}>{t.loginSubtitle}</Text>
                <TextInput style={styles.searchBar} value={authEmail} onChangeText={setAuthEmail} placeholder={t.email} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={styles.searchBar} value={authPassword} onChangeText={setAuthPassword} placeholder={t.password} secureTextEntry />
                <TouchableOpacity style={styles.primaryAction} onPress={handleGuestLogin}>
                  <Text style={styles.primaryActionText}>{t.signIn}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.profileCard}>
                <Text style={styles.marketHeroTitle}>{tx('account')}</Text>
                <Text style={styles.profileName}>{currentUser?.name}</Text>
                <Text style={styles.profileMeta}>{currentUser?.email} · {currentUser?.city}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountSubnav}>
                  {([
                    ['profile', tx('profile')], ['history', tx('history')], ['orders', t.tabOrders],
                    ['requests', tx('requests')], ['wishlist', t.tabWishlist], ['notifications', tx('notifications')], ['admin', tx('admin')]
                  ] as const).map(([key, label]) => (
                    <TouchableOpacity key={key} style={[styles.accountSubnavButton, accountView === key && styles.accountSubnavButtonActive]} onPress={() => setAccountView(key)}>
                      <Text style={[styles.accountSubnavText, accountView === key && styles.accountSubnavTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {accountView === 'profile' && (
                  <View>
                    <Text style={styles.profileSectionTitle}>{tx('profile')}</Text>
                    <Text style={styles.notificationText}>{tx('role')}: {roleLabel}</Text>
                    <Text style={styles.notificationText}>{tx('publishedListings')}: {publishedProducts.length}</Text>
                    <Text style={styles.notificationText}>{tx('savedCrafts')}: {wishlist.length}</Text>
                    <TouchableOpacity style={styles.secondaryAction} onPress={handleLogout}><Text style={styles.secondaryActionText}>{tx('logout')}</Text></TouchableOpacity>
                  </View>
                )}
                {accountView === 'history' && (
                  <View>
                    <Text style={styles.profileSectionTitle}>{tx('activityHistory')}</Text>
                    <Text style={styles.notificationText}>{orders.length} {tx('purchaseOrders')}</Text>
                    <Text style={styles.notificationText}>{publishedProducts.length} {tx('publishedListing')}</Text>
                    {orders.slice(0, 5).map(order => <Text key={order.id} style={styles.notificationText}>• {order.productName} — {order.status}</Text>)}
                    {publishedProducts.slice(0, 5).map(product => <Text key={`published-${product.id}`} style={styles.notificationText}>• Published: {product.name} — ₹{product.price}</Text>)}
                  </View>
                )}
                {accountView === 'orders' && (
                  <View>
                    <Text style={styles.profileSectionTitle}>{tx('ordersByMe')}</Text>
                    {orders.filter(order => order.status.toLowerCase() !== 'cancelled').length === 0 ? <Text style={styles.emptyStateText}>{tx('noActiveOrders')}</Text> : orders.filter(order => order.status.toLowerCase() !== 'cancelled').map(order => (
                      <View key={order.id} style={styles.orderCard}>
                        <Text style={styles.orderTitle}>{order.productName}</Text>
                        <Text style={styles.orderMeta}>₹{order.price} · {order.status}</Text>
                        <TouchableOpacity style={styles.secondaryAction} onPress={() => handleCancelOrder(order.id)}><Text style={styles.secondaryActionText}>{tx('cancelOrder')}</Text></TouchableOpacity>
                      </View>
                    ))}
                    <Text style={styles.profileSectionTitle}>{tx('ordersPublishedByMe')}</Text>
                    {publishedProducts.map(product => <View key={product.id} style={styles.orderCard}><Text style={styles.orderTitle}>{product.name}</Text><Text style={styles.orderMeta}>₹{product.price} · {product.category}</Text><TouchableOpacity style={[styles.deleteProductButton, deletingProductId === product.id && styles.disabledButton]} onPress={() => removeOwnProduct(product)} disabled={deletingProductId === product.id}><Text style={styles.deleteProductButtonText}>{deletingProductId === product.id ? 'Removing...' : tx('removePublished')}</Text></TouchableOpacity></View>)}
                  </View>
                )}
                {accountView === 'requests' && (
                  <View>
                    <Text style={styles.profileSectionTitle}>{tx('bulkRequests')}</Text>
                    <TextInput style={styles.textInput} value={bulkBuyerType} onChangeText={setBulkBuyerType} placeholder={tx('forBuyers')} />
                    <TextInput style={[styles.textInput, styles.textArea]} value={bulkNeed} onChangeText={setBulkNeed} multiline placeholder={tx('bulkHelp')} />
                    <TouchableOpacity style={styles.primaryAction} onPress={handleBulkSupport}><Text style={styles.primaryActionText}>{tx('sendRequest')}</Text></TouchableOpacity>
                  </View>
                )}
                {accountView === 'wishlist' && (
                  <View>
                    <Text style={styles.profileSectionTitle}>{tx('savedCraftsTitle')}</Text>
                    {products.filter(product => wishlist.includes(product.id)).map(product => <View key={product.id} style={styles.orderCard}><Text style={styles.orderTitle}>{product.name}</Text><Text style={styles.orderMeta}>₹{product.price} · {product.artisan_name}</Text></View>)}
                    {wishlist.length === 0 && <Text style={styles.emptyStateText}>{tx('noSavedCrafts')}</Text>}
                  </View>
                )}
                {accountView === 'notifications' && (
                  <View style={styles.notificationCard}>
                    <Text style={styles.notificationTitle}>{tx('notifications')}</Text>
                    {orders.length ? orders.slice(0, 5).map(order => <Text key={order.id} style={styles.notificationText}>{tx('orderUpdate')}: {order.productName} is {order.status}.</Text>) : <Text style={styles.notificationText}>{tx('noNotifications')}</Text>}
                  </View>
                )}
                {accountView === 'admin' && (
                  <View>
                    <Text style={styles.profileSectionTitle}>{tx('adminReview')}</Text>
                    {!adminToken ? (
                      <View>
                        <Text style={styles.bulkHelpText}>{tx('reviewRequests')}</Text>
                        <TextInput style={styles.textInput} value={adminEmail} onChangeText={setAdminEmail} placeholder={tx('adminEmail')} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.textSecondary} />
                        <TextInput style={styles.textInput} value={adminPassword} onChangeText={setAdminPassword} placeholder={tx('adminPassword')} secureTextEntry placeholderTextColor={Colors.textSecondary} />
                        {!!adminStatus && <Text style={styles.orderActionMessage}>{adminStatus}</Text>}
                        <TouchableOpacity style={styles.primaryAction} onPress={handleAdminLogin}>
                          <Text style={styles.primaryActionText}>{tx('signInAdmin')}</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View>
                        <View style={styles.adminHeaderRow}>
                          <Text style={styles.bulkHelpText}>{tx('requestQueue')}</Text>
                          <TouchableOpacity onPress={handleAdminLogout}><Text style={styles.offlineDraftRemove}>Logout</Text></TouchableOpacity>
                        </View>
                        {adminRequests.length === 0 ? <Text style={styles.emptyStateText}>No institutional requests yet.</Text> : adminRequests.map(request => (
                          <View key={request.id} style={styles.orderCard}>
                            <Text style={styles.orderTitle}>{request.artisan_name} · {request.product_category || 'Craft request'}</Text>
                            <Text style={styles.orderMeta}>{request.email} · Qty {request.quantity || 1} · {request.target_market || 'Bulk'}</Text>
                            <Text style={styles.orderMeta}>{request.requirements || 'No requirements'}</Text>
                            <View style={styles.adminStatusRow}>
                              {['New', 'In Review', 'Approved', 'Rejected'].map(status => (
                                <TouchableOpacity key={status} style={[styles.adminStatusButton, request.status === status && styles.adminStatusButtonActive]} onPress={() => handleAdminUpdate(request.id, status)}>
                                  <Text style={[styles.adminStatusText, request.status === status && styles.adminStatusTextActive]}>{status}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        ) : activeTab === 'wishlist' ? (
          <View style={styles.marketContainer}>
            <Text style={styles.marketHeroTitle}>{t.wishlistTitle}</Text>
            {wishlist.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateText}>Save products you like to build your shortlist.</Text>
              </View>
            ) : (
              <View style={styles.productsFeed}>
                {products.filter(p => wishlist.includes(p.id)).map(product => (
                  <View key={product.id} style={styles.productCard}>
                    <View style={styles.productImageWrapper}>
                      <Image source={{ uri: product.image_url }} style={styles.productImage} />
                      <View style={styles.priceBadge}>
                        <Text style={styles.priceBadgeText}>₹{product.price}</Text>
                      </View>
                    </View>
                    <View style={styles.productCardBody}>
                      <Text style={styles.productCardTitle}>{product.name}</Text>
                      <TouchableOpacity style={styles.whatsAppButton} onPress={() => requestOrder(product)}>
                        <Text style={styles.whatsAppButtonText}>{t.buyNow}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : activeTab === 'orders' ? (
          <View style={styles.marketContainer}>
            <Text style={styles.marketHeroTitle}>{t.ordersTitle}</Text>
            {!isLoggedIn ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateText}>Sign in to track your purchase requests and delivery updates.</Text>
              </View>
            ) : orders.length === 0 && publishedProducts.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateText}>No orders yet. Your recent requests will appear here.</Text>
              </View>
            ) : (
              <View style={styles.productsFeed}>
                <Text style={styles.orderTitle}>{tx('ordersByMe')}</Text>
                {orders.length === 0 ? <Text style={styles.emptyStateText}>{tx('noActiveOrders')}</Text> : orders.map((order) => (
                  <View key={order.id} style={styles.orderCard}>
                    <Text style={styles.orderTitle}>{order.productName}</Text>
                    <Text style={styles.orderMeta}>₹{order.price} • {order.customerName}</Text>
                    <Text style={styles.orderMeta}>{t.orderStatus}: {order.status}</Text>
                    <Text style={styles.orderMeta}>{t.deliveryEta}: {order.eta}</Text>
                    <TextInput
                      style={styles.searchBar}
                      value={cancelReason}
                      onChangeText={setCancelReason}
                      placeholder="Why cancel this order?"
                    />
                    <TouchableOpacity style={styles.secondaryAction} onPress={() => handleCancelOrder(order.id)}>
                      <Text style={styles.secondaryActionText}>{tx('cancelOrder')}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <Text style={styles.orderTitle}>{tx('ordersPublishedByMe')}</Text>
                {publishedProducts.length === 0 ? <Text style={styles.emptyStateText}>{tx('noPublishedProducts')}</Text> : publishedProducts.map(product => (
                  <View key={`published-${product.id}`} style={styles.orderCard}>
                    <Text style={styles.orderTitle}>{product.name}</Text>
                    <Text style={styles.orderMeta}>₹{product.price} • {product.category} • Qty {product.quantity || 0}</Text>
                    <TouchableOpacity style={styles.deleteProductButton} onPress={() => removeOwnProduct(product)}>
                      <Text style={styles.deleteProductButtonText}>{tx('removePublished')}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.marketContainer}>
            {!isLoggedIn ? (
              <View style={styles.authCard}>
                <Text style={styles.marketHeroTitle}>{t.loginTitle}</Text>
                <Text style={styles.authSubtitle}>{t.loginSubtitle}</Text>
                <View style={styles.authToggleRow}>
                  <TouchableOpacity style={[styles.authToggle, authMode === 'login' && styles.authToggleActive]} onPress={() => setAuthMode('login')}>
                    <Text style={[styles.authToggleText, authMode === 'login' && styles.authToggleTextActive]}>{t.signIn}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.authToggle, authMode === 'register' && styles.authToggleActive]} onPress={() => setAuthMode('register')}>
                    <Text style={[styles.authToggleText, authMode === 'register' && styles.authToggleTextActive]}>{t.register}</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={styles.searchBar} value={authName} onChangeText={setAuthName} placeholder={t.fullName} placeholderTextColor={Colors.textSecondary} />
                <TextInput style={styles.searchBar} value={authEmail} onChangeText={setAuthEmail} placeholder={t.email} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.textSecondary} />
                <TextInput style={styles.searchBar} value={authPassword} onChangeText={setAuthPassword} placeholder={t.password} secureTextEntry placeholderTextColor={Colors.textSecondary} />
                <TextInput style={styles.searchBar} value={artisanLocation} onChangeText={setArtisanLocation} placeholder={t.artisanLocation} placeholderTextColor={Colors.textSecondary} />
                <View style={styles.roleRow}>
                  <TouchableOpacity style={[styles.roleChip, authRole === 'buyer' && styles.roleChipActive]} onPress={() => setAuthRole('buyer')}>
                    <Text style={[styles.roleChipText, authRole === 'buyer' && styles.roleChipTextActive]}>{t.continueAsBuyer}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.roleChip, authRole === 'artisan' && styles.roleChipActive]} onPress={() => setAuthRole('artisan')}>
                    <Text style={[styles.roleChipText, authRole === 'artisan' && styles.roleChipTextActive]}>{t.continueAsSeller}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.primaryAction} onPress={handleGuestLogin}>
                  <Text style={styles.primaryActionText}>{authMode === 'login' ? t.signIn : t.register}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.profileCard}>
                <Text style={styles.marketHeroTitle}>{t.profileTitle}</Text>
                <View style={styles.profileSummary}>
                  <Text style={styles.profileName}>{currentUser?.name}</Text>
                  <Text style={styles.profileMeta}>{currentUser?.email}</Text>
                  <Text style={styles.profileMeta}>{currentUser?.city}</Text>
                  <Text style={styles.profileMeta}>Role: {currentUser?.role || 'both'} · Seller & Buyer</Text>
                </View>

                <Text style={styles.profileSectionTitle}>History & notifications</Text>
                <View style={styles.notificationCard}>
                  <Text style={styles.notificationTitle}>Recent activity</Text>
                  <Text style={styles.notificationText}>{orders.length} {tx('purchaseHistory')}</Text>
                  <Text style={styles.notificationText}>{publishedProducts.length} {tx('publishedManage')}</Text>
                  {orders.slice(0, 3).map(order => (
                    <Text key={`notification-${order.id}`} style={styles.notificationText}>• {order.productName}: {order.status}</Text>
                  ))}
                </View>

                <Text style={styles.profileSectionTitle}>Bulk Requests</Text>
                <View style={styles.bulkRequestGrid}>
                  <View style={styles.bulkRequestColumn}>
                    <Text style={styles.bulkRequestColumnTitle}>Bulk request from other buyers</Text>
                    <View style={styles.bulkRequestList}>
                      <Text style={styles.bulkRequestItem}>Retail Chain RFQ • 120 pcs</Text>
                      <Text style={styles.bulkRequestItem}>Government Supply Notice • 500 pcs</Text>
                      <Text style={styles.bulkRequestItem}>Corporate Gifting • 250 pcs</Text>
                    </View>
                  </View>

                  <View style={styles.bulkRequestColumn}>
                    <Text style={styles.bulkRequestColumnTitle}>Bulk sell request by me</Text>
                    <View style={styles.bulkRequestList}>
                      <Text style={styles.bulkRequestItem}>My textile lot • 300 pcs</Text>
                      <Text style={styles.bulkRequestItem}>My craft supply • 80 pcs</Text>
                      <Text style={styles.bulkRequestItem}>My institutional lot • 600 pcs</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.secondaryAction} onPress={handleLogout}>
                  <Text style={styles.secondaryActionText}>Log out</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.supportButton} onPress={() => Linking.openURL('mailto:kalasetu24824.9@gmail.com?subject=KalaSetu%20Support')}>
                  <Text style={styles.supportButtonText}>Help & Support: kalasetu24824.9@gmail.com</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* Bottom Tab Navigation Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bottomTabBar} contentContainerStyle={styles.bottomTabBarContent}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'home' && styles.tabButtonActive]}
          onPress={() => setActiveTab('home')}>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>{tx('homeTab')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'studio' && styles.tabButtonActive]}
          onPress={() => setActiveTab('studio')}>
          <Text style={styles.tabIcon}>✨</Text>
          <Text style={[styles.tabText, activeTab === 'studio' && styles.tabTextActive]}>
            {t.tabStudio}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'market' && styles.tabButtonActive]}
          onPress={() => setActiveTab('market')}>
          <Text style={styles.tabIcon}>🛍️</Text>
          <Text style={[styles.tabText, activeTab === 'market' && styles.tabTextActive]}>
            {t.tabMarket}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'institutional' && styles.tabButtonActive]}
          onPress={() => setActiveTab('institutional')}>
          <Text style={styles.tabIcon}>🏛️</Text>
          <Text style={[styles.tabText, activeTab === 'institutional' && styles.tabTextActive]}>{tx('bulkTab')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'account' && styles.tabButtonActive]}
          onPress={() => setActiveTab('account')}>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={[styles.tabText, activeTab === 'account' && styles.tabTextActive]}>{tx('accountTab')}</Text>
        </TouchableOpacity>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statusBarSpacer: {
    width: '100%',
  },
  topStrip: {
    backgroundColor: Colors.secondary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sihTag: {
    backgroundColor: '#F59E0B',
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  topStripText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  langBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  langBtnText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  languageModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 52 : 42,
    paddingRight: 12,
  },
  languageMenu: {
    width: 220,
    maxHeight: 520,
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  languageMenuTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  languageMenuOption: {
    minHeight: 40,
    borderRadius: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageMenuOptionActive: {
    backgroundColor: Colors.primaryLight,
  },
  languageMenuOptionText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  languageMenuOptionTextActive: {
    color: Colors.primaryDark,
  },
  languageCheck: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  appSub: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  helpBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  helpBtnText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  studioContainer: {
    padding: 16,
  },
  offlineDraftBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  offlineDraftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offlineDraftTitle: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '900',
  },
  offlineDraftBadge: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '800',
  },
  offlineDraftText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
  offlineDraftSaveButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 10,
  },
  offlineDraftSaveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  offlineDraftRow: {
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
    marginTop: 10,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  offlineDraftInfo: {
    flex: 1,
  },
  offlineDraftName: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  offlineDraftDate: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  offlineDraftActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  offlineDraftRestore: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  offlineDraftRemove: {
    color: Colors.error,
    fontSize: 11,
    fontWeight: '800',
  },
  homeContainer: {
    padding: 16,
  },
  homeHero: {
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  homeKicker: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  homeTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: 10,
  },
  homeSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  homeActionRow: {
    gap: 8,
  },
  homeImageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
  },
  homeImage: {
    width: '100%',
    height: 190,
    resizeMode: 'cover',
  } as ImageStyle,
  homeImageCaption: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    padding: 12,
  },
  homeSectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  homeFeatureGrid: {
    gap: 10,
    marginBottom: 18,
  },
  homeFeatureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  homeFeatureIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  homeFeatureTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 5,
  },
  homeFeatureText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  cardStepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardStepSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  presetsRow: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  imageBox: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  } as ImageStyle,
  enhancedImage: {
    opacity: 0.96,
  } as ImageStyle,
  imagePlaceholder: {
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
    marginBottom: 6,
  },
  placeholderText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  enhancerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  enhancerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#78350F',
  },
  enhancerSub: {
    fontSize: 10,
    color: '#92400E',
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  formFields: {
    gap: 10,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  voiceButton: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  voiceButtonActive: {
    backgroundColor: '#FFEDD5',
    borderColor: Colors.primary,
  },
  voiceButtonText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  translateButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 5,
  },
  translateButtonText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '700',
  },
  descriptionInputWrap: {
    position: 'relative',
  },
  descriptionInput: {
    paddingRight: 48,
  },
  descriptionMicButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  descriptionMicText: {
    fontSize: 16,
  },
  voiceLanguageRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  voiceLanguageChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  voiceLanguageChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: Colors.primary,
  },
  voiceLanguageChipText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  voiceLanguageChipTextActive: {
    color: Colors.primary,
  },
  voiceHint: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 11,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  boldPriceInput: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  analyzeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pricingBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  pricingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  pricingRange: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '800',
  },
  pricingJustification: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
    marginBottom: 8,
  },
  applyPriceBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  applyPriceBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  tagChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: 'bold',
  },
  addTagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addTagInput: {
    flex: 1,
  },
  addTagBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 10,
  },
  addTagBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  descHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speakerBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },
  speakerBtnText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  publishButton: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  marketContainer: {
    padding: 16,
  },
  bulkLeadCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  bulkLeadTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9A4D11',
    marginBottom: 4,
  },
  bulkLeadText: {
    fontSize: 11,
    color: '#7C2D12',
    lineHeight: 16,
    marginBottom: 8,
  },
  bulkLeadButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  bulkLeadButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  institutionalHero: {
    backgroundColor: Colors.secondary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  institutionalKicker: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  institutionalTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    marginBottom: 8,
  },
  institutionalSubtitle: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  stepLabel: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 5,
  },
  bulkHelpText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  bulkInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkHalfInput: {
    flex: 1,
  },
  bulkToolRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  bulkPricingCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.background,
    padding: 12,
    marginBottom: 12,
  },
  bulkPricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  bulkPricingTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '900',
  },
  bulkPricingBadge: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '800',
  },
  bulkPricingHint: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginBottom: 8,
  },
  bulkPricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 9,
    gap: 6,
  },
  bulkPricingVolume: {
    flex: 1.2,
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  bulkPricingPrice: {
    flex: 0.8,
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '900',
  },
  bulkPricingMargin: {
    flex: 1,
    color: Colors.success,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  bulkPricingUnavailable: {
    color: Colors.textSecondary,
  },
  bulkToolButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
  },
  bulkToolText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  bulkChannelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  bulkChannelButton: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 10,
    paddingVertical: 11,
  },
  marketHero: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  marketHeroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  marketHeroSub: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 4,
  },
  marketHeroSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  marketSpeakButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 12,
  },
  marketSpeakButtonText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  guaranteeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  guaranteeText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: 'bold',
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 12,
  },
  orderActionMessage: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '700',
    padding: 10,
    marginBottom: 12,
  },
  helperText: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  quantityLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  quantityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  quantityOption: {
    minWidth: 30,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  quantityOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quantityOptionText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  quantityOptionTextActive: {
    color: '#FFFFFF',
  },
  deliveryTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
  },
  deliveryInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 7,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  categoriesBar: {
    marginBottom: 14,
  },
  catChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  productsFeed: {
    gap: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  productImageWrapper: {
    position: 'relative',
    height: 180,
    backgroundColor: '#F1F5F9',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  } as ImageStyle,
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FDE68A',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  productCardBody: {
    padding: 12,
  },
  productCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  productArtisan: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginVertical: 4,
  },
  productDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ratingText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '900',
  },
  reviewText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  reviewButton: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewButtonText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: 'bold',
  },
  reviewEditor: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  reviewStar: {
    color: '#D1D5DB',
    fontSize: 24,
  },
  reviewStarActive: {
    color: '#D97706',
  },
  reviewInput: {
    minHeight: 60,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 12,
    marginBottom: 8,
  },
  submitReviewButton: {
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  submitReviewButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  galleryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  galleryThumb: {
    width: 46,
    height: 46,
    borderRadius: 8,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inlineActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  inlineActionButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  inlineActionButtonPrimary: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  inlineActionButtonText: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 11,
  },
  whatsAppButton: {
    backgroundColor: '#25D366',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  whatsAppButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteProductButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteProductButtonText: {
    color: '#B91C1C',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  orderMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  authSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  authToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  authToggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  authToggleActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  authToggleText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  authToggleTextActive: {
    color: Colors.primaryDark,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  roleChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  roleChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  roleChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  primaryAction: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  profileSummary: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  profileSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  accountSubnav: {
    marginVertical: 16,
  },
  accountSubnavButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  accountSubnavButtonActive: {
    backgroundColor: Colors.primary,
  },
  accountSubnavText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  accountSubnavTextActive: {
    color: '#FFFFFF',
  },
  notificationCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    marginBottom: 16,
  },
  notificationTitle: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  notificationText: {
    color: '#1E40AF',
    fontSize: 11,
    marginBottom: 4,
  },
  adminHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  adminStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  adminStatusButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  adminStatusButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  adminStatusText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  adminStatusTextActive: {
    color: '#FFFFFF',
  },
  bulkRequestGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  bulkRequestColumn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
  },
  bulkRequestColumnTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  bulkRequestList: {
    gap: 6,
  },
  bulkRequestItem: {
    fontSize: 11,
    color: Colors.textSecondary,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
  },
  secondaryAction: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryActionText: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  supportButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  supportButtonText: {
    color: '#312E81',
    fontWeight: '700',
    fontSize: 11,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    zIndex: 20,
    elevation: 20,
  },
  bottomTabBarContent: {
    flexDirection: 'row',
    minWidth: '100%',
    height: 78,
    paddingBottom: 8,
    paddingHorizontal: 6,
  },
  tabButton: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
