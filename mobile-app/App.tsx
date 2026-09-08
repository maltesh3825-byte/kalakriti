/**
 * KalaSetu - Cross-Platform Mobile Application
 * Smart India Hackathon 2026 - Problem Statement SIH26090
 * Ministry of Social Justice and Empowerment (MoSJE)
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
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

import { Colors } from './constants/Colors';
import { i18n, Language } from './constants/i18n';
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
  cancelOrderApi
} from './services/api';

export default function App() {
  // Navigation & Language State
  const [activeTab, setActiveTab] = useState<'studio' | 'market' | 'wishlist' | 'orders' | 'profile'>('studio');
  const [lang, setLang] = useState<Language>('en');

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

  // Artisan Studio State
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [artisanName, setArtisanName] = useState('Ramvati Devi');
  const [artisanLocation, setArtisanLocation] = useState('Madhubani, Bihar');
  const [artisanPhone, setArtisanPhone] = useState('+919876543210');
  const [artisanNotes, setArtisanNotes] = useState('');
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

  // Marketplace State
  const [products, setProducts] = useState<CraftProduct[]>(SEED_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [cancelReason, setCancelReason] = useState('Changed requirement / buyer changed decision');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const t = i18n[lang];

  const HOME_BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1800&q=80';
  const STUDIO_BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1800&q=80';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await fetchMarketplaceProducts();
    setProducts(data);
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
    setActiveTab('market');
    const userOrders = await fetchOrdersForUser(user.id);
    setOrders(userOrders);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setActiveTab('market');
  };

  const openHomeMarket = () => {
    setActiveTab('market');
  };

  const toggleWishlist = (productId: number) => {
    if (!isLoggedIn) {
      Alert.alert('Sign in required', 'Please sign in to save products to your wishlist.');
      setActiveTab('profile');
      return;
    }

    setWishlist(prev => prev.includes(productId)
      ? prev.filter(id => id !== productId)
      : [...prev, productId]);
  };

  const requestOrder = async (product: CraftProduct) => {
    if (!isLoggedIn || !currentUser) {
      Alert.alert('Sign in required', 'Please sign in to request an order.');
      setActiveTab('profile');
      return;
    }

    const order = await createOrder({
      userId: currentUser.id,
      productId: product.id,
      productName: product.name,
      price: product.price,
      customerName: currentUser.name
    });

    setOrders(prev => [order, ...prev]);
    Alert.alert('Order requested', `Your request for ${product.name} has been sent to the artisan.`);
    setActiveTab('orders');
  };

  const handleBulkSupport = () => {
    const subject = encodeURIComponent('KalaSetu Bulk & Institutional Linkage Request');
    const body = encodeURIComponent(
      `Hello KalaSetu team,\n\nI want to connect with bulk buyers / institutional buyers for my craft.\n\nName: ${currentUser?.name || authName}\nEmail: ${currentUser?.email || authEmail}\nCity: ${currentUser?.city || artisanLocation}\nRequirement: ${bulkNeed || 'Need help connecting to institutional buyers and government e-marketplaces'}\nBuyer type: ${bulkBuyerType}\n\nPlease help me with bulk opportunities and procurement support.`
    );
    Linking.openURL(`mailto:kalasetu24824.9@gmail.com?subject=${subject}&body=${body}`);
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!isLoggedIn) {
      Alert.alert('Sign in required', 'Please sign in to manage your orders.');
      setActiveTab('profile');
      return;
    }

    const reason = cancelReason.trim();
    if (!reason) {
      Alert.alert('Order cancellation', 'Please add a reason before cancelling this order.');
      return;
    }

    const result = await cancelOrderApi(orderId, reason);
    if (result?.status === 'success') {
      setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status: 'Cancelled' } : order));
      Alert.alert('Order cancelled', `The order quantity was restored by ${result.restored_quantity || 1} item(s).`);
    } else {
      Alert.alert('Order cancellation', 'Cancel route returned a fallback; the order stays active in the local app view.');
    }
  };

  // Toggle Language
  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'hi' : 'en'));
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
        language: speechLang === 'hi' ? 'hi-IN' : 'en-IN',
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
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

    setIsPublishing(true);
    const newProduct: Omit<CraftProduct, 'id'> = {
      name: editTitle,
      artisan_name: artisanName || "Artisan Beneficiary",
      artisan_location: artisanLocation || "Rural Cluster",
      artisan_phone: artisanPhone,
      category: editCategory,
      price: Number(editPrice),
      suggested_price_min: aiResult?.pricing.fair_min,
      suggested_price_max: aiResult?.pricing.fair_max,
      price_justification: aiResult?.pricing.justification,
      description_en: editDescEn,
      description_hi: editDescHi,
      tags: tags,
      image_url: imageUri || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
      is_enhanced: isEnhanced,
      mosje_verified: true
    };

    await publishProductToApi(newProduct);
    setIsPublishing(false);

    // Refresh products list and prepend
    const fullProduct: CraftProduct = { ...newProduct, id: Date.now() };
    setProducts([fullProduct, ...products]);

    Alert.alert(
      lang === 'hi' ? "सफलता!" : "Success!",
      t.publishSuccess,
      [{ text: "OK", onPress: () => setActiveTab('market') }]
    );

    // Reset Studio
    setImageUri(null);
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

      {/* Top MoSJE Banner Strip */}
      <View style={styles.topStrip}>
        <View style={styles.topStripLeft}>
          <Text style={styles.sihTag}>SIH 2026</Text>
          <Text style={styles.topStripText}>{t.sihBadge}</Text>
        </View>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
          <Text style={styles.langBtnText}>{lang === 'en' ? '🌐 हिंदी' : '🌐 English'}</Text>
        </TouchableOpacity>
      </View>

      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <TouchableOpacity onPress={openHomeMarket} style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>क</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openHomeMarket}>
            <Text style={styles.appName}>{t.appTitle}</Text>
            <Text style={styles.appSub}>{t.appSubtitle}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.helpBtn} 
          onPress={() => toggleSpeech(lang === 'hi' ? 'नमस्ते! कलासेतु में आपका स्वागत है। यहां आप अपने हस्तशिल्प की फोटो अपलोड करें। हमारा एआई आपके उत्पाद का नाम, कीमत और विवरण खुद तैयार करेगा।' : 'Welcome to KalaSetu! Take a photo of your craft. Our AI will automatically identify the craft category, suggest fair pricing, and write SEO descriptions.', lang)}>
          <Text style={styles.helpBtnText}>{isSpeaking ? '⏹ Stop' : `🔊 ${lang === 'hi' ? 'मदद सुनें' : 'Audio Help'}`}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Body: Scrollable Screen */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {activeTab === 'studio' ? (
          /* ======================================================= */
          /* SCREEN 1: ARTISAN STUDIO                                */
          /* ======================================================= */
          <View style={styles.screenImageFrame}>
            <Image source={{ uri: STUDIO_BACKGROUND_IMAGE }} style={styles.screenImage} />
            <View style={styles.studioContainer}>
            
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
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.artisanNotes}</Text>
                  <TextInput 
                    style={[styles.textInput, styles.textArea]} 
                    value={artisanNotes} 
                    onChangeText={setArtisanNotes} 
                    multiline 
                    placeholder={t.artisanNotesPlaceholder} 
                  />
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

              </View>
            )}

            </View>
          </View>
        ) : activeTab === 'market' ? (
          /* ======================================================= */
          /* SCREEN 2: BUYER MARKETPLACE FEED                        */
          /* ======================================================= */
          <View style={styles.screenImageFrame}>
            <Image source={{ uri: HOME_BACKGROUND_IMAGE }} style={styles.screenImage} />
            <View style={styles.marketContainer}>
            
            {/* Marketplace Banner */}
            <View style={styles.marketHero}>
              <Text style={styles.marketHeroTitle}>{t.marketTitle}</Text>
              <Text style={styles.marketHeroSub}>{t.marketSub}</Text>
              <View style={styles.guaranteeRow}>
                <Text style={styles.guaranteeText}>✓ {t.directToArtisan}</Text>
                <Text style={styles.guaranteeText}>✓ {t.mosjeVerified}</Text>
              </View>
            </View>

            <View style={styles.bulkLeadCard}>
              <Text style={styles.bulkLeadTitle}>Bulk & Institutional Linkage</Text>
              <Text style={styles.bulkLeadText}>Connect with institutional buyers, bulk procurement teams, and government e-marketplace opportunities.</Text>
              <TouchableOpacity style={styles.bulkLeadButton} onPress={() => setActiveTab('profile')}>
                <Text style={styles.bulkLeadButtonText}>Prepare bulk RFQ</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <TextInput 
              style={styles.searchBar} 
              placeholder={t.searchPlaceholder} 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
            />

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

                    <View style={styles.inlineActionRow}>
                      <TouchableOpacity style={styles.inlineActionButton} onPress={() => toggleWishlist(product.id)}>
                        <Text style={styles.inlineActionButtonText}>{wishlist.includes(product.id) ? t.removeFromWishlist : t.addToWishlist}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.inlineActionButtonPrimary} onPress={() => requestOrder(product)}>
                        <Text style={styles.inlineActionButtonText}>{t.buyNow}</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                      style={styles.whatsAppButton} 
                      onPress={() => openWhatsApp(product.artisan_phone || '+919876543210', product.name, product.price)}>
                      <Text style={styles.whatsAppButtonText}>💬 {t.btnWhatsApp}</Text>
                    </TouchableOpacity>
                  </View>

                </View>
              ))}
            </View>

            </View>
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
            ) : orders.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateText}>No orders yet. Your recent requests will appear here.</Text>
              </View>
            ) : (
              <View style={styles.productsFeed}>
                {orders.map((order) => (
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
                      <Text style={styles.secondaryActionText}>Cancel order</Text>
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
                <TextInput style={styles.searchBar} value={authName} onChangeText={setAuthName} placeholder={t.fullName} />
                <TextInput style={styles.searchBar} value={authEmail} onChangeText={setAuthEmail} placeholder={t.email} keyboardType="email-address" autoCapitalize="none" />
                <TextInput style={styles.searchBar} value={authPassword} onChangeText={setAuthPassword} placeholder={t.password} secureTextEntry />
                <TextInput style={styles.searchBar} value={artisanLocation} onChangeText={setArtisanLocation} placeholder={t.artisanLocation} />
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
      <View style={styles.bottomTabBar}>
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
          style={[styles.tabButton, activeTab === 'wishlist' && styles.tabButtonActive]}
          onPress={() => setActiveTab('wishlist')}>
          <Text style={styles.tabIcon}>❤️</Text>
          <Text style={[styles.tabText, activeTab === 'wishlist' && styles.tabTextActive]}>
            {t.tabWishlist}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'orders' && styles.tabButtonActive]}
          onPress={() => setActiveTab('orders')}>
          <Text style={styles.tabIcon}>📦</Text>
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            {t.tabOrders}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'profile' && styles.tabButtonActive]}
          onPress={() => setActiveTab('profile')}>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
            {t.tabProfile}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  screenImageFrame: {
    width: '100%',
    minHeight: 420,
    position: 'relative',
    overflow: 'hidden',
  },
  screenImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    resizeMode: 'cover',
  },
  studioContainer: {
    padding: 16,
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
    flexDirection: 'row',
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
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
