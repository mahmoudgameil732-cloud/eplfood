import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  MapPin, 
  Clock, 
  Phone, 
  ChevronRight, 
  Plus, 
  Minus, 
  Check, 
  X, 
  Search, 
  Info, 
  CreditCard, 
  Banknote, 
  History, 
  Globe, 
  Store, 
  Calendar, 
  AlertCircle,
  CheckCircle2,
  Bike,
  User,
  LogOut,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";

// --- Multi-Language Translations ---
const translations = {
  ar: {
    restaurantMenu: "قائمة الطعام",
    selectBranch: "اختر الفرع للبدء",
    howToReceive: "كيف ترغب في استلام طلبك؟",
    dineIn: "صالة",
    takeaway: "تيك أواي",
    delivery: "توصيل",
    tableNo: "رقم الطاولة *",
    enterTableNo: "أدخل رقم الطاولة",
    guestCount: "عدد الأشخاص",
    pickupTime: "وقت الاستلام",
    pickupName: "الاسم عند الاستلام *",
    asap: "أسرع وقت ممكن",
    chooseTime: "اختار وقت محدد",
    deliveryAddress: "عنوان التوصيل *",
    enterAddress: "أدخل تفاصيل العنوان...",
    building: "المبنى/العمارة",
    floor: "الدور",
    apartment: "الشقة",
    landmark: "علامة مميزة (اختياري)",
    deliveryFee: "رسوم التوصيل",
    minOrderWarn: "عذراً، لم يتم استيفاء الحد الأدنى للطلب",
    outOfZone: "⚠️ عذراً، العنوان لا يقع ضمن نطاق التوصيل لفرعنا",
    searchPlaceholder: "ابحث عن صنف...",
    addToCart: "إضافة للطلب",
    quantity: "الكمية",
    specialNotes: "ملاحظات خاصة (اختياري)",
    notesPlaceholder: "مثال: بدون بصل، صوص على الجانب...",
    reviewOrder: "مراجعة الطلب",
    yourInfo: "بيانات التواصل",
    name: "الاسم *",
    phone: "رقم الهاتف *",
    email: "البريد الإلكتروني (اختياري)",
    paymentMethod: "طريقة الدفع *",
    cashOnDelivery: "كاش عند الاستلام",
    cashOnPickup: "كاش عند الاستلام",
    payWithCard: "بطاقة إلكترونية (فيزا / ماستركارد)",
    cardNumber: "رقم البطاقة",
    expiry: "تاريخ الانتهاء",
    cvv: "الرمز السري CVV",
    specialInstructions: "ملاحظات للمطعم (اختياري)",
    subtotal: "المجموع الفرعي",
    tax: "الضريبة (14%)",
    total: "الإجمالي",
    placingOrder: "جاري إرسال الطلب...",
    confirmOrder: "تأكيد الطلب",
    orderNo: "طلب رقم",
    trackTitle: "حالة طلبك",
    bestseller: "الأكثر مبيعاً",
    new: "جديد",
    vegetarian: "🌱 نباتي",
    calories: "سعرة حرارية",
    required: "مطلوب",
    optional: "اختياري",
    selectRange: "اختار من {min} إلى {max}",
    callRestaurant: "اتصل بالمطعم",
    reorder: "إعادة الطلب",
    pastOrders: "الطلبات السابقة",
    enterPhoneLookup: "أدخل رقم هاتفك لعرض طلباتك السابقة:",
    lookupBtn: "بحث",
    noPastOrders: "لا توجد طلبات سابقة لهذا الرقم",
    egp: "ج.م",
    changeBranch: "تغيير الفرع",
    estimatedWait: "الوقت المتوقع للتجهيز",
    selectZone: "منطقة التوصيل *",
    chooseZone: "اختر منطقة التوصيل...",
    backToMenu: "العودة للقائمة",
    cartIsEmpty: "سلة الطلب فارغة حالياً",
    orderSuccess: "تم استلام طلبك بنجاح!",
    trackLive: "تابع حالة الطلب مباشرة أدناه:",
    minDeliveryOrder: "الحد الأدنى للتوصيل:",
    approx: "تقريباً"
  },
  en: {
    restaurantMenu: "Menu",
    selectBranch: "Select Branch to Begin",
    howToReceive: "How would you like to receive your order?",
    dineIn: "Dine-in",
    takeaway: "Takeaway",
    delivery: "Delivery",
    tableNo: "Table Number *",
    enterTableNo: "Enter table number",
    guestCount: "Guests",
    pickupTime: "Pickup Time",
    pickupName: "Name for Pickup *",
    asap: "As Soon As Possible",
    chooseTime: "Select Specific Time",
    deliveryAddress: "Delivery Address *",
    enterAddress: "Enter address details...",
    building: "Building",
    floor: "Floor",
    apartment: "Apartment",
    landmark: "Landmark (Optional)",
    deliveryFee: "Delivery Fee",
    minOrderWarn: "Minimum order amount not met",
    outOfZone: "⚠️ Sorry, this address is outside our delivery zones",
    searchPlaceholder: "Search for dish...",
    addToCart: "Add to Order",
    quantity: "Quantity",
    specialNotes: "Special Notes (Optional)",
    notesPlaceholder: "e.g. No onions, sauce on the side...",
    reviewOrder: "Review Order",
    yourInfo: "Contact Details",
    name: "Name *",
    phone: "Phone Number *",
    email: "Email (Optional)",
    paymentMethod: "Payment Method *",
    cashOnDelivery: "Cash on Delivery",
    cashOnPickup: "Cash on Pickup",
    payWithCard: "Card Online (Visa / Mastercard)",
    cardNumber: "Card Number",
    expiry: "Expiry Date",
    cvv: "CVV Code",
    specialInstructions: "Special Instructions (Optional)",
    subtotal: "Subtotal",
    tax: "VAT (14%)",
    total: "Total",
    placingOrder: "Submitting order...",
    confirmOrder: "Confirm Order",
    orderNo: "Order #",
    trackTitle: "Track Your Order",
    bestseller: "Bestseller",
    new: "New",
    vegetarian: "🌱 Vegetarian",
    calories: "kcal",
    required: "Required",
    optional: "Optional",
    selectRange: "Select between {min} and {max}",
    callRestaurant: "Call Restaurant",
    reorder: "Reorder",
    pastOrders: "Past Orders",
    enterPhoneLookup: "Enter phone to load past orders:",
    lookupBtn: "Search",
    noPastOrders: "No previous orders found for this phone number",
    egp: "EGP",
    changeBranch: "Change Branch",
    estimatedWait: "Estimated wait time",
    selectZone: "Delivery Zone *",
    chooseZone: "Choose delivery zone...",
    backToMenu: "Back to Menu",
    cartIsEmpty: "Your cart is empty",
    orderSuccess: "Order placed successfully!",
    trackLive: "Track your order status live below:",
    minDeliveryOrder: "Min delivery order:",
    approx: "approx."
  }
};

const ORDER_STATUS_LABELS = {
  placed:           { ar: "تم استلام طلبك", en: "Order Received", icon: "✅", color: "text-blue-600 bg-blue-50 border-blue-200" },
  confirmed:        { ar: "تم تأكيد طلبك", en: "Order Confirmed", icon: "👍", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  preparing:        { ar: "جاري تحضير الطعام", en: "Being Prepared", icon: "👨‍🍳", color: "text-amber-600 bg-amber-50 border-amber-200" },
  ready_for_pickup: { ar: "طلبك جاهز للاستلام!", en: "Ready for Pickup!", icon: "🎉", color: "text-green-600 bg-green-50 border-green-200" },
  ready_for_rider:  { ar: "بانتظار المندوب", en: "Awaiting Rider", icon: "⏳", color: "text-amber-600 bg-amber-50 border-amber-200" },
  rider_assigned:   { ar: "المندوب في الطريق إليك", en: "Rider on the way", icon: "🛵", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  picked_up:        { ar: "تم استلام الطلب", en: "Picked Up", icon: "📦", color: "text-green-600 bg-green-50 border-green-200" },
  delivered:        { ar: "تم التوصيل ✓", en: "Delivered ✓", icon: "🏠", color: "text-green-700 bg-green-100 border-green-300 animate-pulse" },
  cancelled:        { ar: "تم إلغاء الطلب", en: "Cancelled", icon: "❌", color: "text-red-600 bg-red-50 border-red-200" },
  completed:        { ar: "تم اكتمال الطلب ✓", en: "Completed ✓", icon: "🍽️", color: "text-green-700 bg-green-50 border-green-200" },
  paid:             { ar: "تم الدفع ✓", en: "Paid ✓", icon: "💳", color: "text-green-700 bg-green-50 border-green-200" },
  voided:           { ar: "ملغي", en: "Voided", icon: "🗑️", color: "text-slate-600 bg-slate-50 border-slate-200" }
};

interface CustomerPortalProps {
  menu?: any[];
  tables?: any[];
  onRefreshTables?: () => void;
  isPublicGuestMode?: boolean;
}

export default function CustomerPortal({ 
  menu: propMenu = [], 
  tables: propTables = [], 
  onRefreshTables, 
  isPublicGuestMode = false 
}: CustomerPortalProps) {
  
  // --- Global State ---
  const { i18n } = useTranslation();
  const lang = (i18n.language === "en" ? "en" : "ar") as "ar" | "en";
  const t = translations[lang];

  // --- Router State ---
  const [routeInfo, setRouteInfo] = useState({
    isMenuRoot: true,
    branchSlug: "",
    isOrderView: false,
    isConfirmedView: false,
    isTrackView: false,
    isAccountView: false,
    trackOrderId: ""
  });

  // --- Dynamic DB States ---
  const [branches, setBranches] = useState<any[]>([]);
  const [localMenu, setLocalMenu] = useState<any[]>(propMenu);
  const [localTables, setLocalTables] = useState<any[]>(propTables);
  const [modifiersList, setModifiersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Guest Selection States ---
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [fulfillmentType, setFulfillmentType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [dineInTable, setDineInTable] = useState("");
  const [dineInGuests, setDineInGuests] = useState(1);
  const [takeawayName, setTakeawayName] = useState("");
  const [takeawayTime, setTakeawayTime] = useState("ASAP");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryBldg, setDeliveryBldg] = useState("");
  const [deliveryFloor, setDeliveryFloor] = useState("");
  const [deliveryApt, setDeliveryApt] = useState("");
  const [deliveryLandmark, setDeliveryLandmark] = useState("");
  const [deliveryZoneId, setDeliveryZoneId] = useState("");
  
  // --- Cart State ---
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // --- Active Modals State ---
  const [modifierItem, setModifierItem] = useState<any | null>(null);
  const [modifierSelections, setModifierSelections] = useState<{ [groupId: string]: string[] }>({});
  const [modifierNotes, setModifierNotes] = useState("");
  const [modifierQty, setModifierQty] = useState(1);

  // --- Customer Login/Signup State ---
  const [customerUser, setCustomerUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("eplfood_customer_profile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showCustomerAuthModal, setShowCustomerAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (customerUser) {
      setCustName(customerUser.name || "");
      setCustPhone(customerUser.phone || "");
      setCustEmail(customerUser.email || "");
    } else {
      setCustName("");
      setCustPhone("");
      setCustEmail("");
    }
  }, [customerUser]);

  // --- Checkout Customer States ---
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [mockCardNo, setMockCardNo] = useState("");
  const [mockCardExpiry, setMockCardExpiry] = useState("");
  const [mockCardCvv, setMockCardCvv] = useState("");

  // --- Lookup & Tracking States ---
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupResults, setLookupResults] = useState<any[]>([]);
  const [searchingLookup, setSearchingLookup] = useState(false);
  const [hasSearchedLookup, setHasSearchedLookup] = useState(false);
  
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Account & Live tracking lists ---
  const [accountOrders, setAccountOrders] = useState<any[]>([]);
  const [loadingAccountOrders, setLoadingAccountOrders] = useState(false);

  // --- Required Branch Selection States ---
  const [hasConfirmedBranch, setHasConfirmedBranch] = useState(() => {
    try {
      return !!localStorage.getItem("epl_confirmed_branch_id");
    } catch {
      return false;
    }
  });
  const [showBranchSelectorModal, setShowBranchSelectorModal] = useState(false);

  const fetchAccountOrders = async () => {
    const phoneToQuery = custPhone || (customerUser && customerUser.phone);
    if (!phoneToQuery) return;
    setLoadingAccountOrders(true);
    try {
      const res = await fetch(`/api/orders/lookup?phone=${encodeURIComponent(phoneToQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setAccountOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAccountOrders(false);
    }
  };

  useEffect(() => {
    if (routeInfo.isAccountView) {
      fetchAccountOrders();
    }
  }, [routeInfo.isAccountView, custPhone, customerUser]);

  // Helper for router navigation
  const navigateTo = (newPath: string) => {
    window.history.pushState({}, "", newPath);
    window.dispatchEvent(new Event("popstate"));
  };

  // Toast notifier
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // --- Initial Data Loader & Real-Time Sync simulation ---
  useEffect(() => {
    const fetchPortalData = async () => {
      setLoading(true);
      try {
        // Load branches
        const branchRes = await fetch("/api/branches");
        const branchData = await branchRes.json();
        setBranches(branchData);

        // Load modifiers
        const modRes = await fetch("/api/modifiers");
        const modData = await modRes.json();
        setModifiersList(modData);

        // Load public available menu items
        const menuRes = await fetch(`/api/menu?channel=guest_portal&lang=${lang}`);
        const menuData = await menuRes.json();
        setLocalMenu(menuData);

        // Load tables
        const tableRes = await fetch("/api/tables");
        const tableData = await tableRes.json();
        setLocalTables(tableData);
      } catch (err) {
        console.error("Error loading portal data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();

    // Subscribe to periodic menu updates to auto-86 items in real time
    const interval = setInterval(async () => {
      try {
        const menuRes = await fetch(`/api/menu?channel=guest_portal&lang=${lang}`);
        const menuData = await menuRes.json();
        
        // Compare with local and see if items disappeared (86'd)
        setLocalMenu(prevMenu => {
          if (prevMenu.length > 0 && menuData.length < prevMenu.length) {
            // Find which items were removed
            const activeIds = new Set(menuData.map((it: any) => it.id));
            const soldOutItems = prevMenu.filter(it => !activeIds.has(it.id));
            if (soldOutItems.length > 0) {
              const itemLabel = lang === "ar" ? soldOutItems[0].nameAr || soldOutItems[0].name : soldOutItems[0].name;
              showToast(lang === "ar" ? `نفد صنف "${itemLabel}" للأسف وتمت إزالته` : `Sold out: "${itemLabel}" removed from menu`);
              
              // Also purge from current cart
              setCart(prevCart => prevCart.filter(it => activeIds.has(it.menuItemId || it.id)));
            }
          }
          return menuData;
        });

        // Pull active tables
        const tableRes = await fetch("/api/tables");
        const tableData = await tableRes.json();
        setLocalTables(tableData);
      } catch (e) {
        console.error("Poller error:", e);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [lang]);

  // Handle SPA path changes
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const parts = path.split("/").filter(Boolean); // ["menu", "maadi-branch", "order"]
      
      const isMenuRoot = parts.length === 1 && parts[0] === "menu";
      const branchSlug = parts[1] || "";
      const isOrderView = parts[2] === "order";
      const isConfirmedView = parts[2] === "confirmed";
      const isTrackView = parts[2] === "track";
      const isAccountView = parts[2] === "account";
      const trackOrderId = parts[3] || "";

      setRouteInfo({
        isMenuRoot,
        branchSlug,
        isOrderView,
        isConfirmedView,
        isTrackView,
        isAccountView,
        trackOrderId
      });
    };

    window.addEventListener("popstate", handleLocationChange);
    handleLocationChange(); // run on load

    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // --- URL Table parameter detector ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get("table") || urlParams.get("tableId") || "";
    const sourceParam = urlParams.get("source") || "";

    if (tableParam) {
      setDineInTable(tableParam);
      setFulfillmentType("dine_in");
      if (sourceParam === "qr") {
        showToast(lang === "ar" ? `تم الكشف عن طاولة رقم ${tableParam} عبر مسح الكود` : `Table #${tableParam} detected via QR scan`);
      }
    }
  }, [routeInfo.branchSlug]);

  // --- Auto-detect selected branch based on Slug ---
  useEffect(() => {
    if (branches.length > 0) {
      if (routeInfo.branchSlug) {
        const matched = branches.find(b => b.slug === routeInfo.branchSlug);
        if (matched) {
          setSelectedBranch(matched);
          if (!hasConfirmedBranch) {
            localStorage.setItem("epl_confirmed_branch_id", matched.id);
            setHasConfirmedBranch(true);
          }
        } else {
          setShowBranchSelectorModal(true);
        }
      } else {
        setShowBranchSelectorModal(true);
      }
    }
  }, [branches, routeInfo.branchSlug]);

  // --- Real-time Order Tracking Poller ---
  useEffect(() => {
    if (routeInfo.isTrackView && routeInfo.trackOrderId) {
      const fetchTrackOrder = async () => {
        try {
          const res = await fetch(`/api/orders/${routeInfo.trackOrderId}/track`);
          if (res.ok) {
            const data = await res.json();
            setTrackingOrder(data.order);
            if (data.branch) {
              setSelectedBranch(data.branch);
            }
          }
        } catch (err) {
          console.error("Failed to fetch tracking details:", err);
        }
      };

      fetchTrackOrder();
      const trackInterval = setInterval(fetchTrackOrder, 3000);
      return () => clearInterval(trackInterval);
    }
  }, [routeInfo.isTrackView, routeInfo.trackOrderId]);

  // --- Computed Cart Totals ---
  const subtotal = cart.reduce((total, item) => {
    const itemPrice = item.price;
    const modifiersPrice = (item.modifiers || []).reduce((acc: number, m: any) => acc + (m.price || 0), 0);
    return total + (itemPrice + modifiersPrice) * item.quantity;
  }, 0);

  const selectedZone = selectedBranch?.deliveryZones?.find((z: any) => z.id === deliveryZoneId);
  const deliveryFee = fulfillmentType === "delivery" ? (selectedZone?.fee || selectedBranch?.deliveryFeeBase || 15) : 0;
  const surcharge = fulfillmentType === "dine_in" ? 1.50 : 0;
  const taxAmount = Math.round((subtotal * 0.14) * 100) / 100; // 14% Egypt standard
  const grandTotal = subtotal + taxAmount + deliveryFee + surcharge;
  const totalItemCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  // Categories list
  const categories = ["All", ...Array.from(new Set(localMenu.map(it => it.category)))];

  // Filtered menu list based on search and category
  const filteredMenu = localMenu.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const label = (item.nameAr || item.name || "").toLowerCase() + " " + (item.name || "").toLowerCase();
    const matchesSearch = label.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // --- Modifier Sheet Helpers ---
  const openModifierModal = (item: any) => {
    if (!item.isAvailable) return;
    setModifierItem(item);
    setModifierQty(1);
    setModifierNotes("");
    
    // Initial blank selections for modifiers
    const initial: { [key: string]: string[] } = {};
    if (item.modifierGroupIds) {
      item.modifierGroupIds.forEach((id: string) => {
        initial[id] = [];
      });
    }
    setModifierSelections(initial);
  };

  const handleSelectModifierSingle = (groupId: string, optionId: string) => {
    setModifierSelections(prev => ({
      ...prev,
      [groupId]: [optionId]
    }));
  };

  const handleToggleModifierMulti = (groupId: string, optionId: string, max: number) => {
    setModifierSelections(prev => {
      const current = prev[groupId] || [];
      if (current.includes(optionId)) {
        return {
          ...prev,
          [groupId]: current.filter(id => id !== optionId)
        };
      } else {
        if (current.length >= max && max === 1) {
          return { ...prev, [groupId]: [optionId] };
        } else if (current.length >= max) {
          return prev; // limits reached
        }
        return {
          ...prev,
          [groupId]: [...current, optionId]
        };
      }
    });
  };

  const getModifierItemTotalPrice = () => {
    if (!modifierItem) return 0;
    let price = modifierItem.price;
    if (fulfillmentType === "delivery" && modifierItem.channelPricing?.delivery) {
      price = modifierItem.channelPricing.delivery;
    }
    
    let modsAdjustment = 0;
    Object.entries(modifierSelections).forEach(([groupId, optIds]) => {
      const group = modifiersList.find(g => g.id === groupId);
      if (!group) return;
      (optIds as string[]).forEach(optId => {
        const opt = group.options.find((o: any) => o.id === optId);
        if (opt) modsAdjustment += (opt.price || 0);
      });
    });

    return (price + modsAdjustment) * modifierQty;
  };

  const isModifierFormValid = () => {
    if (!modifierItem) return false;
    if (!modifierItem.modifierGroupIds) return true;

    for (const groupId of modifierItem.modifierGroupIds) {
      const group = modifiersList.find(g => g.id === groupId);
      if (!group) continue;
      const selections = modifierSelections[groupId] || [];
      if (group.required && selections.length < group.minSelections) {
        return false;
      }
    }
    return true;
  };

  const confirmAddToCart = () => {
    if (!modifierItem) return;

    const chosenModifiers: any[] = [];
    Object.entries(modifierSelections).forEach(([groupId, optIds]) => {
      const group = modifiersList.find(g => g.id === groupId);
      if (!group) return;
      (optIds as string[]).forEach(optId => {
        const option = group.options.find((o: any) => o.id === optId);
        if (option) {
          chosenModifiers.push({
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            price: option.price || 0
          });
        }
      });
    });

    const cartItemId = `guest-cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newCartItem = {
      id: cartItemId,
      menuItemId: modifierItem.id,
      name: modifierItem.name,
      nameAr: modifierItem.nameAr || modifierItem.name,
      price: modifierItem.price,
      quantity: modifierQty,
      modifiers: chosenModifiers,
      notes: modifierNotes
    };

    setCart(prev => [...prev, newCartItem]);
    setModifierItem(null);
    showToast(lang === "ar" ? "تمت الإضافة للسلة بنجاح" : "Added to cart successfully");
  };

  // Quick direct add for item without modifiers
  const handleQuickAdd = (item: any) => {
    if (item.modifierGroupIds && item.modifierGroupIds.length > 0) {
      openModifierModal(item);
    } else {
      const cartItemId = `guest-cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newCartItem = {
        id: cartItemId,
        menuItemId: item.id,
        name: item.name,
        nameAr: item.nameAr || item.name,
        price: item.price,
        quantity: 1,
        modifiers: [],
        notes: ""
      };
      setCart(prev => [...prev, newCartItem]);
      showToast(lang === "ar" ? "تمت الإضافة للسلة بنجاح" : "Added to cart successfully");
    }
  };

  // --- Cart mutations ---
  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  // --- Phone lookup for past orders (Duplicate Reorder feature) ---
  const triggerPhoneLookup = async () => {
    if (!lookupPhone) return;
    setSearchingLookup(true);
    setHasSearchedLookup(false);
    try {
      const res = await fetch(`/api/orders/lookup?phone=${encodeURIComponent(lookupPhone)}`);
      if (res.ok) {
        const data = await res.json();
        setLookupResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearchingLookup(false);
      setHasSearchedLookup(true);
    }
  };

  const handleReorderPastOrder = (pastOrder: any) => {
    const duplicatedCart = pastOrder.items.map((item: any) => {
      return {
        id: `reorder-cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        menuItemId: item.id || item.menuItemId,
        name: item.name,
        nameAr: item.nameAr || item.name,
        price: item.price,
        quantity: item.quantity,
        modifiers: item.modifiers || [],
        notes: item.notes || ""
      };
    });

    setCart(duplicatedCart);
    setShowLookupModal(false);
    showToast(lang === "ar" ? "تم تكرار طلبك السابق وإضافته للسلة" : "Previous order duplicated into cart");
    navigateTo(`/menu/${selectedBranch?.slug}/order`);
  };

  // --- Order Submission ---
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (!custName || !custPhone) {
      showToast(lang === "ar" ? "برجاء كتابة الاسم ورقم الهاتف" : "Please enter your name and phone");
      return;
    }

    if (fulfillmentType === "delivery" && selectedZone && subtotal < selectedZone.minOrder) {
      showToast(`${t.minOrderWarn} (${selectedZone.minOrder} ${t.egp})`);
      return;
    }

    setIsSubmittingOrder(true);

    const payload = {
      branchId: selectedBranch?.id || "branch-a",
      fulfillmentType,
      items: cart,
      paymentMethod,
      customer: {
        name: custName,
        phone: custPhone,
        email: custEmail || undefined
      },
      specialInstructions,
      ...(fulfillmentType === "dine_in" && {
        tableId: dineInTable,
        tableNumber: dineInTable,
        guestCount: dineInGuests
      }),
      ...(fulfillmentType === "takeaway" && {
        pickupTime: takeawayTime,
        pickupName: takeawayName || custName
      }),
      ...(fulfillmentType === "delivery" && {
        deliveryZoneId,
        deliveryAddress: {
          fullAddress: `${deliveryAddress}, Zone: ${selectedZone?.nameAr || "Base Zone"}`,
          building: deliveryBldg,
          floor: deliveryFloor,
          apartment: deliveryApt,
          landmark: deliveryLandmark
        }
      })
    };

    try {
      const res = await fetch("/api/orders/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCart([]); // Clear Cart
        navigateTo(`/menu/${selectedBranch?.slug}/track/${data.orderId}`);
      } else {
        showToast(data.error || "Failed to submit order");
      }
    } catch (e) {
      console.error(e);
      showToast("Network error submitting order");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Validating form entry
  const isFormValid = () => {
    if (!custName || !custPhone) return false;
    if (fulfillmentType === "dine_in" && !dineInTable) return false;
    if (fulfillmentType === "delivery" && (!deliveryAddress || !deliveryZoneId)) return false;
    if (fulfillmentType === "takeaway" && takeawayTime === "specific" && !takeawayName) return false;
    if (paymentMethod === "card") {
      if (!mockCardNo || !mockCardExpiry || !mockCardCvv) return false;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 text-center gap-3 bg-slate-50 min-h-screen">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">جاري تحميل قائمة الطعام والربط الفوري...</p>
      </div>
    );
  }

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      
      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          
          {/* Brand logo & name */}
          <div className="flex items-center gap-3">
            {selectedBranch ? (
              <button 
                onClick={() => setShowBranchSelectorModal(true)}
                className="flex items-center gap-2.5 text-start hover:opacity-85 transition-opacity cursor-pointer group"
                title={lang === "ar" ? "اضغط لتغيير الفرع" : "Click to change branch"}
              >
                <img src={selectedBranch.logo} alt={selectedBranch.name} className="w-10 h-10 rounded-xl object-cover shadow-xs border border-slate-100" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                      {lang === "ar" ? selectedBranch.nameAr : selectedBranch.name}
                    </h1>
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md group-hover:bg-indigo-100 transition-colors">
                      {lang === "ar" ? "تغيير" : "Change"}
                    </span>
                  </div>
                  <span className="text-[10px] bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.2 rounded-full font-bold">
                    ● {lang === "ar" ? "مفتوح الآن" : "Open"}
                  </span>
                </div>
              </button>
            ) : (
              <button 
                onClick={() => setShowBranchSelectorModal(true)}
                className="text-base font-black text-slate-900 hover:text-indigo-600 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{t.restaurantMenu}</span>
                <span className="text-xs font-normal text-indigo-600">({t.selectBranch})</span>
              </button>
            )}
          </div>

          {/* Quick Actions & Language Toggle */}
          <div className="flex items-center gap-2">
            
            {/* Past orders look up icon */}
            <button
              onClick={() => setShowLookupModal(true)}
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title={t.pastOrders}
            >
              <History size={16} className="text-indigo-600 animate-pulse" />
              <span className="hidden sm:inline">{t.pastOrders}</span>
            </button>

            {/* Customer Profile & Loyalty Points Section */}
            {customerUser ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Loyalty Badge */}
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-850 px-2.5 py-1.5 rounded-xl text-xs font-black">
                  <Sparkles size={13} className="text-amber-500 fill-amber-500" />
                  <span>
                    {customerUser.loyaltyPoints || 0} {lang === "ar" ? "نقطة" : "Pts"}
                  </span>
                </div>
                {/* Profile indicator */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800">
                  <User size={13} className="text-indigo-650" />
                  <span className="max-w-[70px] truncate">{customerUser.name}</span>
                </div>
                {/* Logout */}
                <button
                  onClick={() => {
                    localStorage.removeItem("eplfood_customer_profile");
                    setCustomerUser(null);
                    showToast(lang === "ar" ? "تم تسجيل الخروج بنجاح" : "Logged out successfully");
                  }}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100 transition-colors"
                  title={lang === "ar" ? "تسجيل خروج" : "Logout"}
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthError(null);
                  setAuthTab("login");
                  setShowCustomerAuthModal(true);
                }}
                className="p-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs"
              >
                <User size={14} />
                <span>{lang === "ar" ? "دخول / تسجيل" : "Login"}</span>
              </button>
            )}

            {/* Language Switcher */}
            <button
              onClick={() => i18n.changeLanguage(lang === "ar" ? "en" : "ar")}
              className="p-2 text-slate-700 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all flex items-center gap-1 text-xs font-black cursor-pointer"
            >
              <Globe size={15} className="text-indigo-600" />
              <span>{lang === "ar" ? "English" : "عربي"}</span>
            </button>

            {/* If POS review mode, a quick back to admin button */}
            {!isPublicGuestMode && (
              <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-bold">
                POS Preview
              </span>
            )}
          </div>

        </div>
      </header>

      {/* VIEWPORT CONTROLLER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-24">
        
        {/* TAB NAVIGATION BAR (MENU VS ACCOUNT) */}
        {!routeInfo.isTrackView && !routeInfo.isOrderView && selectedBranch && (
          <div className="flex justify-center mb-6">
            <div className="bg-white border border-slate-200 p-1 rounded-2xl flex shadow-xs">
              <button
                onClick={() => navigateTo(`/menu/${selectedBranch.slug}`)}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  !routeInfo.isAccountView 
                    ? "bg-indigo-650 text-white shadow-xs" 
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <span>🍽️</span>
                <span>{lang === "ar" ? "قائمة الطعام" : "Menu Browser"}</span>
              </button>
              
              <button
                onClick={() => navigateTo(`/menu/${selectedBranch.slug}/account`)}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  routeInfo.isAccountView 
                    ? "bg-indigo-650 text-white shadow-xs" 
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <span>👤</span>
                <span>{lang === "ar" ? "حسابي وطلباتي" : "My Account"}</span>
              </button>
            </div>
          </div>
        )}

        {/* TOAST POPUP */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-full shadow-lg flex items-center gap-2"
            >
              <Info size={14} className="text-indigo-400" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. ORDER TRACKING VIEW */}
        {routeInfo.isTrackView && trackingOrder && (
          <div className="max-w-xl mx-auto py-4">
            <div className="bg-white border border-slate-100 shadow-md rounded-2xl p-6 text-center mb-6">
              
              <div className="inline-flex p-3 bg-green-50 rounded-full text-green-600 mb-4 animate-bounce">
                <CheckCircle2 size={36} />
              </div>

              <h2 className="text-xl font-black text-slate-900 mb-2">{t.orderSuccess}</h2>
              <p className="text-xs text-slate-500 mb-4">{t.trackLive}</p>

              <div className="bg-slate-50 rounded-2xl p-4 inline-block mb-2">
                <span className="text-xxs text-slate-400 block font-semibold">{t.orderNo}</span>
                <span className="text-2xl font-black text-slate-800">#{trackingOrder.id.split("-").pop()}</span>
              </div>

              {/* Status display */}
              <div className={`mt-6 border p-4 rounded-xl flex items-center justify-center gap-3 font-bold text-sm ${ORDER_STATUS_LABELS[trackingOrder.status]?.color || 'text-slate-700 bg-slate-50'}`}>
                <span className="text-xl">{ORDER_STATUS_LABELS[trackingOrder.status]?.icon}</span>
                <span>{lang === "ar" ? ORDER_STATUS_LABELS[trackingOrder.status]?.ar : ORDER_STATUS_LABELS[trackingOrder.status]?.en}</span>
              </div>

              {/* ETA Wait */}
              {selectedBranch && (
                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock size={14} className="text-slate-400" />
                  <span>{t.estimatedWait}: ~{selectedBranch.estimatedWaitMinutes} {lang === "ar" ? "دقيقة" : "mins"}</span>
                </div>
              )}
            </div>

            {/* TRACKING PATH TIMELINE */}
            <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 text-start">{t.trackTitle}</h3>
              
              {[
                { status: "placed", ar: "تم استلام الطلب", en: "Order Placed", descAr: "تم تسجيل طلبك بنجاح في نظامنا", descEn: "Successfully queued into our terminal" },
                { status: "confirmed", ar: "تم تأكيد الطلب", en: "Order Confirmed", descAr: "قام الكاشير بتأكيد وقبول طلبك", descEn: "Accepted and authorized by operations staff" },
                { status: "preparing", ar: "جاري التحضير بالمطبخ", en: "Preparing Food", descAr: "الطهاة يقومون بتحضير وجبتك الآن", descEn: "Our culinary crew is firing your items" },
                { status: "ready_for_pickup", ar: "جاهز للتسليم", en: "Ready for Handover", descAr: "طلبك جاهز تماماً للاستلام", descEn: "Fresh and packaged at the counter" },
                { status: "delivered", ar: "تم الاستلام بنجاح", en: "Delivered & Done", descAr: "بالهناء والشفاء! نتطلع لخدمتك مجدداً", descEn: "Delivered safely! Enjoy your meal" }
              ].map((step, idx, arr) => {
                const statuses = ["placed", "confirmed", "preparing", "ready_for_pickup", "delivered", "completed", "paid"];
                const currentIdx = statuses.indexOf(trackingOrder.status);
                const stepIdx = statuses.indexOf(step.status);
                const isCompleted = currentIdx >= stepIdx;
                const isCurrent = trackingOrder.status === step.status || (trackingOrder.status === "completed" && step.status === "delivered");

                return (
                  <div key={step.status} className="flex gap-4 items-start relative text-start">
                    {idx < arr.length - 1 && (
                      <div className={`absolute top-8 ${lang === "ar" ? "right-4" : "left-4"} w-0.5 h-12 -ml-px bg-slate-200 ${isCompleted ? "bg-green-500" : ""}`} />
                    )}

                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs z-10 shrink-0 ${
                      isCompleted ? "bg-green-500 border-green-500 text-white" :
                      isCurrent ? "bg-indigo-50 border-indigo-650 text-indigo-650 animate-pulse" :
                      "bg-white border-slate-200 text-slate-400"
                    }`}>
                      {isCompleted ? <Check size={14} /> : idx + 1}
                    </div>

                    <div className="pt-0.5">
                      <p className={`text-sm font-bold ${isCurrent ? "text-indigo-650" : isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                        {lang === "ar" ? step.ar : step.en}
                      </p>
                      <p className="text-xxs text-slate-400 mt-0.5">
                        {lang === "ar" ? step.descAr : step.descEn}
                      </p>
                    </div>
                  </div>
                );
              })}

            </div>

            {/* FOOTER CALL TO BRANCH */}
            <div className="mt-6 text-center">
              <button 
                onClick={() => navigateTo(`/menu/${selectedBranch?.slug}`)}
                className="text-xs text-indigo-650 font-black hover:underline cursor-pointer"
              >
                ← {t.backToMenu}
              </button>
              {selectedBranch && (
                <a href={`tel:${selectedBranch.phone}`} className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-bold">
                  <Phone size={14} />
                  <span>{t.callRestaurant}: {selectedBranch.phone}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* 2. MENU BROWSER VIEW (MAIN PORTAL) */}
        {!routeInfo.isTrackView && !routeInfo.isOrderView && !routeInfo.isAccountView && selectedBranch && (
          <div className="space-y-6">
            
            {/* SERVICE TYPE SELECTOR BAR */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs">
              <h2 className="text-base font-black text-slate-900 mb-4 text-center">{t.howToReceive}</h2>
              
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "dine_in", labelAr: "صالة", labelEn: "Dine-in", icon: "🍽️" },
                  { id: "takeaway", labelAr: "تيك أواي", labelEn: "Takeaway", icon: "🛍️" },
                  { id: "delivery", labelAr: "توصيل", labelEn: "Delivery", icon: "🛵" }
                ].map((serv) => {
                  const isSel = fulfillmentType === serv.id;
                  return (
                    <button
                      key={serv.id}
                      onClick={() => setFulfillmentType(serv.id as any)}
                      className={`h-24 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isSel 
                          ? "border-indigo-600 bg-indigo-50/70 scale-[1.02] shadow-xs text-slate-900" 
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-3xl mb-1">{serv.icon}</span>
                      <span className="text-sm font-black">{lang === "ar" ? serv.labelAr : serv.labelEn}</span>
                    </button>
                  );
                })}
              </div>

              {/* DINAMIC SERVICE DETAILS FORM INLAY */}
              <div className="mt-5 pt-5 border-t border-slate-100">
                {fulfillmentType === "dine_in" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.tableNo}</label>
                      <select
                        value={dineInTable}
                        onChange={(e) => setDineInTable(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="">{t.enterTableNo}</option>
                        {localTables.map(t => (
                          <option key={t.id} value={t.name.replace(/\D/g, '') || t.id}>
                            {t.name} ({lang === "ar" ? (t.status === "occupied" ? "مشغولة" : "شغالة/متاحة") : t.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.guestCount}</label>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setDineInGuests(Math.max(1, dineInGuests - 1))}
                          className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-base font-black text-slate-800 w-8 text-center">{dineInGuests}</span>
                        <button 
                          onClick={() => setDineInGuests(dineInGuests + 1)}
                          className="w-11 h-11 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center hover:bg-indigo-700"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {fulfillmentType === "takeaway" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start">
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.pickupName}</label>
                      <input
                        type="text"
                        value={takeawayName}
                        onChange={(e) => setTakeawayName(e.target.value)}
                        placeholder={lang === "ar" ? "الاسم لتناديه عند التجهيز" : "Name for callout"}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.pickupTime}</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setTakeawayTime("ASAP")}
                          className={`h-11 rounded-xl text-xs font-bold border transition-colors ${
                            takeawayTime === "ASAP" 
                              ? "bg-indigo-650 text-white border-indigo-650" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {t.asap} (~{selectedBranch.estimatedWaitMinutes} {lang === "ar" ? "دقيقة" : "min"})
                        </button>
                        <button
                          onClick={() => setTakeawayTime("specific")}
                          className={`h-11 rounded-xl text-xs font-bold border transition-colors ${
                            takeawayTime === "specific" 
                              ? "bg-indigo-650 text-white border-indigo-650" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {t.chooseTime}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {fulfillmentType === "delivery" && (
                  <div className="space-y-4 text-start">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Interactive Zone Autocomplete Selector */}
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.selectZone}</label>
                        <select
                          value={deliveryZoneId}
                          onChange={(e) => setDeliveryZoneId(e.target.value)}
                          className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="">{t.chooseZone}</option>
                          {selectedBranch.deliveryZones.map((z: any) => (
                            <option key={z.id} value={z.id}>
                              {lang === "ar" ? z.nameAr : z.name} (+{z.fee} {t.egp})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Autocomplete-placeholder address query */}
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.deliveryAddress}</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDeliveryAddress(val);
                              // Simple text-mapping autocomplete search
                              const matchedZone = selectedBranch.deliveryZones.find((z: any) => 
                                val.toLowerCase().includes(z.name.toLowerCase()) || 
                                val.includes(z.nameAr)
                              );
                              if (matchedZone) {
                                setDeliveryZoneId(matchedZone.id);
                              }
                            }}
                            placeholder={lang === "ar" ? "اكتب اسم الشارع، الحي" : "Type street name, neighborhood..."}
                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                          <MapPin size={16} className={`absolute ${lang === "ar" ? "left-3" : "right-3"} top-3.5 text-slate-400`} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xxs font-semibold text-slate-400 mb-1 block">{t.building}</label>
                        <input type="text" value={deliveryBldg} onChange={(e) => setDeliveryBldg(e.target.value)} placeholder="رقم العمارة" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="text-xxs font-semibold text-slate-400 mb-1 block">{t.floor}</label>
                        <input type="text" value={deliveryFloor} onChange={(e) => setDeliveryFloor(e.target.value)} placeholder="الدور" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="text-xxs font-semibold text-slate-400 mb-1 block">{t.apartment}</label>
                        <input type="text" value={deliveryApt} onChange={(e) => setDeliveryApt(e.target.value)} placeholder="الشقة" className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="text-xxs font-semibold text-slate-400 mb-1 block">{t.landmark}</label>
                        <input type="text" value={deliveryLandmark} onChange={(e) => setDeliveryLandmark(e.target.value)} placeholder="بجانب مسجد، سوبرماركت..." className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs focus:outline-none" />
                      </div>

                      {/* Display delivery metrics */}
                      <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center text-xs mt-4">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Bike size={14} />
                          <span>{t.deliveryFee}:</span>
                        </div>
                        <span className="font-bold text-slate-800">{deliveryFee} {t.egp}</span>
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>

            {/* TWO-COLUMN BROWSER GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* LEFT: CATEGORIES & PRODUCTS BROWSER (65%) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* STICKY HORIZONTAL CATEGORY BAR */}
                <div className="sticky top-16 z-20 bg-slate-50 py-3 overflow-x-auto flex gap-2 scrollbar-none border-b border-slate-200">
                  {categories.map(cat => {
                    const isSel = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          isSel 
                            ? "bg-indigo-650 text-white shadow-xs" 
                            : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900"
                        }`}
                      >
                        {cat === "All" ? (lang === "ar" ? "الكل" : "All") : cat}
                      </button>
                    );
                  })}
                </div>

                {/* SEARCH INPUT */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-4 pr-10 text-sm font-medium shadow-xxs focus:outline-none focus:border-indigo-500"
                  />
                  <Search size={16} className={`absolute ${lang === "ar" ? "left-3.5" : "right-3.5"} top-3.5 text-slate-400`} />
                </div>

                {/* PRODUCTS LIST */}
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
                  {filteredMenu.length > 0 ? (
                    filteredMenu.map(item => {
                      const finalPrice = (fulfillmentType === "delivery" && item.channelPricing?.delivery) 
                        ? item.channelPricing.delivery 
                        : item.price;
                      
                      return (
                        <div 
                          key={item.id}
                          onClick={() => openModifierModal(item)}
                          className="p-4 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer text-start"
                        >
                          <div className="flex-1 min-w-0">
                            
                            {/* Product Tags */}
                            <div className="flex gap-1 mb-1">
                              {item.price > 12 && (
                                <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.2 rounded-full font-bold">
                                  🔥 {t.bestseller}
                                </span>
                              )}
                              {item.id.includes("1") && (
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.2 rounded-full font-bold">
                                  ✨ {t.new}
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-black text-slate-900">
                              {lang === "ar" ? item.nameAr || item.name : item.name}
                            </h3>

                            {item.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-2.5">
                              <span className="text-sm font-black text-indigo-650">{finalPrice} {t.egp}</span>
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-md">
                                <Clock size={11} /> 15-20 {lang === "ar" ? "دقيقة" : "mins"}
                              </span>
                            </div>

                          </div>

                          {/* Image & Plus controller */}
                          <div className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                            <span className="absolute inset-0 flex items-center justify-center text-3xl opacity-40">🍽️</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAdd(item);
                              }}
                              className="absolute bottom-1 left-1 w-7 h-7 rounded-full bg-indigo-600 text-white shadow-md flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer z-10"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                        </div>
                      );
                    })
                  ) : (
                    <div className="p-12 text-center text-slate-400 text-xs font-bold">{lang === "ar" ? "لا توجد نتائج تطابق بحثك" : "No results match search"}</div>
                  )}
                </div>

              </div>

              {/* RIGHT: DESKTOP FLOATING ORDER PANEL (35%) */}
              <div className="hidden lg:block lg:col-span-1 space-y-6 sticky top-24">
                <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5">
                  <h3 className="text-sm font-black text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-indigo-650" />
                    <span>{t.reviewOrder}</span>
                    <span className="mr-auto text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                      {totalItemCount}
                    </span>
                  </h3>

                  {cart.length > 0 ? (
                    <div className="space-y-4 max-h-[350px] overflow-y-auto scrollbar-none divide-y divide-slate-50">
                      {cart.map((item) => {
                        const itemPrice = item.price;
                        const modifiersPrice = (item.modifiers || []).reduce((acc: number, m: any) => acc + (m.price || 0), 0);
                        const singleTotal = itemPrice + modifiersPrice;

                        return (
                          <div key={item.id} className="pt-3 text-start">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-black text-slate-800 line-clamp-1">{lang === "ar" ? item.nameAr : item.name}</span>
                              <span className="text-xs font-black text-slate-900">{singleTotal * item.quantity} {t.egp}</span>
                            </div>

                            {/* Modifiers List */}
                            {item.modifiers.length > 0 && (
                              <p className="text-[10px] text-indigo-650 font-semibold mt-1">
                                + {item.modifiers.map((m: any) => lang === "ar" ? m.optionName : m.optionName).join(", ")}
                              </p>
                            )}

                            {item.notes && (
                              <p className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1">
                                💬 {item.notes}
                              </p>
                            )}

                            <div className="flex justify-between items-center mt-2.5">
                              <button 
                                onClick={() => updateCartQty(item.id, -1)}
                                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-xs font-black text-slate-800">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQty(item.id, 1)}
                                className="w-6 h-6 rounded-md bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-bold">{t.cartIsEmpty}</div>
                  )}

                  {cart.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-start">
                      <div className="flex justify-between text-xs text-slate-500 font-semibold">
                        <span>{t.subtotal}</span>
                        <span>{subtotal} {t.egp}</span>
                      </div>
                      {fulfillmentType === "delivery" && (
                        <div className="flex justify-between text-xs text-slate-500 font-semibold">
                          <span>{t.deliveryFee}</span>
                          <span>{deliveryFee} {t.egp}</span>
                        </div>
                      )}
                      {fulfillmentType === "dine_in" && (
                        <div className="flex justify-between text-xs text-slate-500 font-semibold">
                          <span>خدمة صالة</span>
                          <span>1.50 {t.egp}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-slate-500 font-semibold">
                        <span>{t.tax}</span>
                        <span>{taxAmount} {t.egp}</span>
                      </div>
                      <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                        <span>{t.total}</span>
                        <span>{grandTotal} {t.egp}</span>
                      </div>

                      {/* Go checkout button */}
                      <button
                        onClick={() => navigateTo(`/menu/${selectedBranch.slug}/order`)}
                        className="w-full h-11 bg-indigo-600 text-white font-black text-xs rounded-xl mt-4 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={14} />
                        <span>{t.reviewOrder} — {grandTotal} {t.egp}</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>
        )}

        {/* 4. DEDICATED CUSTOMER ACCOUNT & LIVE ORDERS VIEW */}
        {routeInfo.isAccountView && selectedBranch && (
          <div className="max-w-2xl mx-auto space-y-6 text-start">
            
            {!customerUser ? (
              /* IF NOT LOGGED IN, RENDER THE LOGIN & SIGNUP PORTAL INLINE! */
              <div className="bg-white border border-slate-200 shadow-md rounded-2xl overflow-hidden p-6 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                    👤
                  </div>
                  <h2 className="text-lg font-black text-slate-900">
                    {lang === "ar" ? "حساب عملاء المطعم" : "Customer Restaurant Account"}
                  </h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {lang === "ar" 
                      ? "سجل دخولك لمتابعة طلباتك الحالية، وتجميع نقاط الولاء، وإعادة طلب وجباتك المفضلة بضغطة واحدة!" 
                      : "Log in to track your live orders, earn loyalty points, and re-order your favorite meals in one tap!"}
                  </p>
                </div>

                {/* Switch between tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl max-w-xs mx-auto">
                  <button
                    onClick={() => { setAuthTab("login"); setAuthError(null); }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                      authTab === "login" ? "bg-white text-indigo-650 shadow-xs" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {lang === "ar" ? "تسجيل دخول" : "Log In"}
                  </button>
                  <button
                    onClick={() => { setAuthTab("signup"); setAuthError(null); }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                      authTab === "signup" ? "bg-white text-indigo-650 shadow-xs" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {lang === "ar" ? "إنشاء حساب" : "Sign Up"}
                  </button>
                </div>

                {authError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2 max-w-md mx-auto">
                    <AlertCircle size={15} className="shrink-0 text-rose-500" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setAuthError(null);
                  setAuthLoading(true);
                  try {
                    if (authTab === "login") {
                      if (!authPhone || !authPassword) {
                        throw new Error(lang === "ar" ? "يرجى ملء جميع الحقول" : "Please fill in all fields");
                      }
                      const res = await fetch("/api/customer/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ phone: authPhone, password: authPassword })
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        throw new Error(data.message || data.error || "Login failed");
                      }
                      localStorage.setItem("eplfood_customer_profile", JSON.stringify(data.customer));
                      setCustomerUser(data.customer);
                      setCustName(data.customer.name || "");
                      setCustPhone(data.customer.phone || "");
                      setCustEmail(data.customer.email || "");
                      showToast(lang === "ar" ? `مرحباً بك مجدداً، ${data.customer.name}` : `Welcome back, ${data.customer.name}`);
                    } else {
                      if (!authName || !authPhone || !authPassword) {
                        throw new Error(lang === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
                      }
                      const res = await fetch("/api/customer/signup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: authName, phone: authPhone, email: authEmail, password: authPassword })
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        throw new Error(data.message || data.error || "Sign up failed");
                      }
                      localStorage.setItem("eplfood_customer_profile", JSON.stringify(data.customer));
                      setCustomerUser(data.customer);
                      setCustName(data.customer.name || "");
                      setCustPhone(data.customer.phone || "");
                      setCustEmail(data.customer.email || "");
                      showToast(lang === "ar" ? `تم التسجيل بنجاح! مرحباً بك، ${data.customer.name}` : `Successfully signed up! Welcome, ${data.customer.name}`);
                    }
                  } catch (err: any) {
                    setAuthError(err.message);
                  } finally {
                    setAuthLoading(false);
                  }
                }} className="space-y-4 max-w-md mx-auto">
                  
                  {authTab === "signup" && (
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">
                        {lang === "ar" ? "الاسم الكامل" : "Full Name"} *
                      </label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder={lang === "ar" ? "أدخل اسمك بالكامل" : "e.g. John Doe"}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      {lang === "ar" ? "رقم الهاتف المحمول" : "Phone Number"} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder={lang === "ar" ? "مثال: 01xxxxxxxxx" : "e.g. 01xxxxxxxxx"}
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {authTab === "signup" && (
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">
                        {lang === "ar" ? "البريد الإلكتروني (اختياري)" : "Email Address (Optional)"}
                      </label>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="example@domain.com"
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      {lang === "ar" ? "كلمة المرور" : "Password"} *
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full h-12 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {authLoading ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <User size={15} />
                        <span>
                          {authTab === "login" 
                            ? (lang === "ar" ? "تسجيل دخول الآن" : "Log In Now") 
                            : (lang === "ar" ? "تأكيد وإنشاء حساب جديد" : "Create Account")}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* IF LOGGED IN, SHOW ACCOUNT PROFILE, ACTIVE TRACKING, AND ORDER HISTORY */
              <div className="space-y-6">
                
                {/* 1. Account welcome and loyalty card */}
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-850 to-indigo-800 text-white p-6 rounded-2xl shadow-md border border-indigo-950 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 translate-x-6 translate-y-6 text-9xl select-none font-black">
                    ⭐
                  </div>
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <span className="text-indigo-200 text-xxs font-bold uppercase tracking-widest block mb-0.5">
                        {lang === "ar" ? "بطاقة ولاء العملاء" : "Customer Loyalty Club"}
                      </span>
                      <h2 className="text-lg font-black">{customerUser.name}</h2>
                      <p className="text-[10px] text-indigo-200 mt-1 font-semibold">{customerUser.phone}</p>
                    </div>

                    <button
                      onClick={() => {
                        localStorage.removeItem("eplfood_customer_profile");
                        setCustomerUser(null);
                        setAccountOrders([]);
                        showToast(lang === "ar" ? "تم تسجيل الخروج" : "Logged out");
                      }}
                      className="h-8 px-2.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1.5"
                    >
                      <LogOut size={12} />
                      <span>{lang === "ar" ? "خروج" : "Logout"}</span>
                    </button>
                  </div>

                  <div className="mt-6 pt-5 border-t border-white/10 flex justify-between items-end relative z-10">
                    <div>
                      <span className="text-indigo-200 text-xxs block mb-1 font-bold">{lang === "ar" ? "النقاط الحالية" : "Current Points Balance"}</span>
                      <span className="text-3xl font-black text-amber-350 flex items-center gap-1">
                        <Sparkles size={24} className="text-amber-400 fill-amber-400 animate-pulse" />
                        <span>{customerUser.loyaltyPoints || 0}</span>
                        <span className="text-xs text-indigo-150 font-bold">{lang === "ar" ? "نقطة" : "pts"}</span>
                      </span>
                    </div>

                    <div className="text-end">
                      <p className="text-[10px] text-indigo-200 leading-normal font-semibold">
                        {lang === "ar" ? "10 جنيه = 1 نقطة" : "10 EGP = 1 Pt"}
                      </p>
                      <p className="text-[9px] text-indigo-300 leading-normal mt-0.5">
                        {lang === "ar" ? "استبدل نقاطك بخصومات على وجباتك" : "Redeem points for discounts on orders"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Active live orders tracking */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>{lang === "ar" ? "الطلبات قيد التنفيذ والمتابعة" : "Live & Active Orders"}</span>
                  </h3>

                  {loadingAccountOrders ? (
                    <div className="bg-white border border-slate-100 p-8 rounded-2xl flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xxs font-semibold text-slate-400">Loading orders...</span>
                    </div>
                  ) : accountOrders.filter(o => o.status !== "completed" && o.status !== "voided").length > 0 ? (
                    <div className="space-y-3">
                      {accountOrders.filter(o => o.status !== "completed" && o.status !== "voided").map(ord => {
                        const dateStr = new Date(ord.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div key={ord.id} className="bg-white border-2 border-indigo-50 hover:border-indigo-100 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-slate-800">#{ord.id.split("-").pop()}</span>
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black">
                                  {lang === "ar" ? (ord.fulfillmentType === "dine_in" ? "صالة 🍽️" : ord.fulfillmentType === "takeaway" ? "تيك أواي 🛍️" : "توصيل 🛵") : ord.fulfillmentType}
                                </span>
                                <span className="text-xxs text-slate-400 font-bold">{dateStr}</span>
                              </div>
                              <p className="text-xxs text-slate-500 font-bold mt-1.5 line-clamp-1">
                                {ord.items.map((it: any) => `${it.quantity}x ${lang === "ar" ? it.nameAr : it.name}`).join(", ")}
                              </p>
                              <p className="text-xs font-black text-slate-900 mt-1">{ord.totalAmount} {t.egp}</p>
                            </div>

                            <div className="flex items-center gap-2.5 w-full sm:w-auto">
                              <span className={`px-3 py-1.5 rounded-xl text-xxs font-black flex items-center gap-1 ${ORDER_STATUS_LABELS[ord.status]?.color || 'bg-slate-50 text-slate-700'}`}>
                                <span>{ORDER_STATUS_LABELS[ord.status]?.icon}</span>
                                <span>{lang === "ar" ? ORDER_STATUS_LABELS[ord.status]?.ar : ORDER_STATUS_LABELS[ord.status]?.en}</span>
                              </span>

                              <button
                                onClick={() => navigateTo(`/menu/${selectedBranch.slug}/track/${ord.id}`)}
                                className="flex-1 sm:flex-none h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xxs font-black transition-colors flex items-center justify-center gap-1"
                              >
                                <span>🔍</span>
                                <span>{lang === "ar" ? "تتبع مباشر" : "Live Track"}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-100 p-6 rounded-2xl text-center text-slate-400 text-xs font-bold">
                      {lang === "ar" ? "لا توجد طلبات جارية الآن" : "No live orders currently"}
                    </div>
                  )}
                </div>

                {/* 3. Past orders list */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <History size={14} className="text-slate-400" />
                    <span>{lang === "ar" ? "سجل طلباتك السابقة" : "Order History"}</span>
                  </h3>

                  {loadingAccountOrders ? (
                    null
                  ) : accountOrders.filter(o => o.status === "completed" || o.status === "voided").length > 0 ? (
                    <div className="space-y-3">
                      {accountOrders.filter(o => o.status === "completed" || o.status === "voided").map(ord => {
                        const dateStr = new Date(ord.placedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                        return (
                          <div key={ord.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex justify-between items-center gap-4 hover:shadow-xs transition-shadow">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-slate-800">#{ord.id.split("-").pop()}</span>
                                <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  {lang === "ar" ? (ord.fulfillmentType === "dine_in" ? "صالة" : ord.fulfillmentType === "takeaway" ? "تيك أواي" : "توصيل") : ord.fulfillmentType}
                                </span>
                                <span className="text-xxs text-slate-400 font-bold">{dateStr}</span>
                              </div>
                              <p className="text-xxs text-slate-500 font-bold mt-1 line-clamp-1">
                                {ord.items.map((it: any) => `${it.quantity}x ${lang === "ar" ? it.nameAr : it.name}`).join(", ")}
                              </p>
                              <p className="text-xs font-black text-slate-900 mt-1">{ord.totalAmount} {t.egp}</p>
                            </div>

                            <button
                              onClick={() => handleReorderPastOrder(ord)}
                              className="h-9 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl text-xxs font-black transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>🔁</span>
                              <span>{lang === "ar" ? "إعادة طلب" : "Reorder"}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-100 p-6 rounded-2xl text-center text-slate-400 text-xs font-bold">
                      {lang === "ar" ? "لا توجد طلبات سابقة في حسابك بعد" : "No past orders in your account yet"}
                    </div>
                  )}
                </div>

              </div>
            )}
            
          </div>
        )}

        {/* 3. ORDER BUILDER / CHECKOUT FORM VIEW */}
        {routeInfo.isOrderView && selectedBranch && (
          <div className="max-w-2xl mx-auto space-y-6 text-start">
            
            {/* Header back button */}
            <button 
              onClick={() => navigateTo(`/menu/${selectedBranch.slug}`)}
              className="text-xs font-black text-indigo-650 flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <ChevronRight size={16} className={lang === "ar" ? "" : "rotate-185"} />
              <span>{t.backToMenu}</span>
            </button>

            {/* CHECKOUT WIZARD CONTAINER */}
            <div className="bg-white border border-slate-100 shadow-md rounded-2xl overflow-hidden p-5 space-y-6">
              
              <h2 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100">
                {t.reviewOrder}
              </h2>

              {/* Cart review checklist */}
              <div className="divide-y divide-slate-100">
                {cart.map(item => (
                  <div key={item.id} className="py-3 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{lang === "ar" ? item.nameAr : item.name}</h4>
                      {item.modifiers.length > 0 && (
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          + {item.modifiers.map((m: any) => lang === "ar" ? m.optionName : m.optionName).join(", ")}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1 font-bold">
                        {item.quantity} x {item.price} {t.egp}
                      </p>
                    </div>
                    <span className="text-xs font-black text-slate-800">
                      {(item.price + item.modifiers.reduce((a: number, m: any) => a + m.price, 0)) * item.quantity} {t.egp}
                    </span>
                  </div>
                ))}
              </div>

              {/* CUSTOMER CONTACT FIELDS */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-indigo-600 rounded-xs"></span>
                  <span>{t.yourInfo}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.name}</label>
                    <input
                      type="text"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      placeholder={lang === "ar" ? "اكتب اسمك الثلاثي" : "Your full name"}
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.phone}</label>
                    <div className="flex gap-2">
                      <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 h-11 flex items-center text-xs font-bold text-slate-500">
                        🇪🇬 +20
                      </div>
                      <input
                        type="tel"
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        placeholder="01xxxxxxxxx"
                        className="flex-1 h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.email}</label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* SERVICE / FULFILLMENT TYPE SELECTOR ON CHECKOUT SCREEN */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-indigo-600 rounded-xs"></span>
                  <span>{lang === "ar" ? "تفاصيل استلام الطلب والخدمة" : "Order Fulfillment & Service"}</span>
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "dine_in", labelAr: "صالة", labelEn: "Dine-in", icon: "🍽️" },
                    { id: "takeaway", labelAr: "تيك أواي", labelEn: "Takeaway", icon: "🛍️" },
                    { id: "delivery", labelAr: "توصيل", labelEn: "Delivery", icon: "🛵" }
                  ].map((serv) => {
                    const isSel = fulfillmentType === serv.id;
                    return (
                      <button
                        key={serv.id}
                        type="button"
                        onClick={() => setFulfillmentType(serv.id as any)}
                        className={`h-16 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSel 
                            ? "border-indigo-600 bg-indigo-50/70 text-indigo-700 font-bold scale-[1.01] shadow-xs" 
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        <span className="text-xl">{serv.icon}</span>
                        <span className="text-[10px] font-black">{lang === "ar" ? serv.labelAr : serv.labelEn}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-fields for fulfillment type */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  {fulfillmentType === "dine_in" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-start">
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">{t.tableNo}</label>
                        <select
                          value={dineInTable}
                          onChange={(e) => setDineInTable(e.target.value)}
                          className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-bold focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="">{t.enterTableNo}</option>
                          {localTables.map(t => (
                            <option key={t.id} value={t.name.replace(/\D/g, '') || t.id}>
                              {t.name} ({lang === "ar" ? (t.status === "occupied" ? "مشغولة" : "شغالة/متاحة") : t.status})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">{t.guestCount}</label>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => setDineInGuests(Math.max(1, dineInGuests - 1))}
                            className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-black text-slate-800 w-6 text-center">{dineInGuests}</span>
                          <button 
                            type="button"
                            onClick={() => setDineInGuests(dineInGuests + 1)}
                            className="w-10 h-10 rounded-lg bg-indigo-650 text-white font-bold flex items-center justify-center hover:bg-indigo-700"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {fulfillmentType === "takeaway" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-start">
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">{t.pickupName}</label>
                        <input
                          type="text"
                          value={takeawayName}
                          onChange={(e) => setTakeawayName(e.target.value)}
                          placeholder={lang === "ar" ? "الاسم لتناديه عند التجهيز" : "Name for callout"}
                          className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">{t.pickupTime}</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setTakeawayTime("ASAP")}
                            className={`h-10 rounded-lg text-[10px] font-bold border transition-colors ${
                              takeawayTime === "ASAP" 
                                ? "bg-indigo-650 text-white border-indigo-650" 
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {t.asap} (~{selectedBranch?.estimatedWaitMinutes || 15} {lang === "ar" ? "دق" : "m"})
                          </button>
                          <button
                            type="button"
                            onClick={() => setTakeawayTime("specific")}
                            className={`h-10 rounded-lg text-[10px] font-bold border transition-colors ${
                              takeawayTime === "specific" 
                                ? "bg-indigo-650 text-white border-indigo-650" 
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {lang === "ar" ? "تحديد وقت" : "Specific time"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {fulfillmentType === "delivery" && (
                    <div className="space-y-3 text-start">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-600 mb-1 block">{t.selectZone}</label>
                          <select
                            value={deliveryZoneId}
                            onChange={(e) => setDeliveryZoneId(e.target.value)}
                            className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-bold focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="">{t.chooseZone}</option>
                            {selectedBranch?.deliveryZones?.map((z: any) => (
                              <option key={z.id} value={z.id}>
                                {lang === "ar" ? z.nameAr : z.name} (+{z.fee} {t.egp})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-600 mb-1 block">{t.deliveryAddress}</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={deliveryAddress}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDeliveryAddress(val);
                                const matchedZone = selectedBranch?.deliveryZones?.find((z: any) => 
                                  val.toLowerCase().includes(z.name.toLowerCase()) || 
                                  val.includes(z.nameAr)
                                );
                                if (matchedZone) {
                                  setDeliveryZoneId(matchedZone.id);
                                }
                              }}
                              placeholder={lang === "ar" ? "اكتب اسم الشارع، الحي" : "Street name, district..."}
                              className="w-full h-10 bg-white border border-slate-200 rounded-lg pl-3 pr-8 text-xs focus:border-indigo-500 focus:outline-none"
                            />
                            <MapPin size={14} className={`absolute ${lang === "ar" ? "left-3" : "right-3"} top-3 text-slate-400`} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">{t.building}</label>
                          <input type="text" value={deliveryBldg} onChange={(e) => setDeliveryBldg(e.target.value)} placeholder="رقم العمارة" className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2 text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">{t.floor}</label>
                          <input type="text" value={deliveryFloor} onChange={(e) => setDeliveryFloor(e.target.value)} placeholder="الدور" className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2 text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">{t.apartment}</label>
                          <input type="text" value={deliveryApt} onChange={(e) => setDeliveryApt(e.target.value)} placeholder="الشقة" className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2 text-xs focus:outline-none focus:border-indigo-500" />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">{t.landmark}</label>
                        <input type="text" value={deliveryLandmark} onChange={(e) => setDeliveryLandmark(e.target.value)} placeholder="علامة مميزة..." className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PAYMENT METHOD SELECTOR */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-indigo-600 rounded-xs"></span>
                  <span>{t.paymentMethod}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Cash Method */}
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "cash" ? "border-indigo-650 bg-indigo-50/50" : "border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input type="radio" name="payment" value="cash" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} className="sr-only" />
                    <Banknote size={20} className="text-green-600 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-slate-800">{t.cashOnDelivery}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{lang === "ar" ? "ادفع نقداً عند الاستلام" : "Pay cash directly"}</p>
                    </div>
                  </label>

                  {/* Card Method (Visa/Mastercard Mock gateway) */}
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "card" ? "border-indigo-650 bg-indigo-50/50" : "border-slate-200 hover:bg-slate-50"
                  }`}>
                    <input type="radio" name="payment" value="card" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} className="sr-only" />
                    <CreditCard size={20} className="text-indigo-650 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-slate-800">{t.payWithCard}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Paymob Visa Gateway ready</p>
                    </div>
                  </label>

                </div>

                {/* Secure Card input drawer (mocked) */}
                <AnimatePresence>
                  {paymentMethod === "card" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-hidden space-y-3"
                    >
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">{t.cardNumber}</label>
                        <input
                          type="text"
                          value={mockCardNo}
                          onChange={(e) => setMockCardNo(e.target.value.replace(/\D/g, "").substring(0, 16))}
                          placeholder="4000 1234 5678 9010"
                          className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 block mb-1">{t.expiry}</label>
                          <input
                            type="text"
                            value={mockCardExpiry}
                            onChange={(e) => setMockCardExpiry(e.target.value.substring(0, 5))}
                            placeholder="MM/YY"
                            className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs focus:outline-none text-center"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 block mb-1">{t.cvv}</label>
                          <input
                            type="password"
                            value={mockCardCvv}
                            onChange={(e) => setMockCardCvv(e.target.value.replace(/\D/g, "").substring(0, 3))}
                            placeholder="***"
                            className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs focus:outline-none text-center"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* SPECIAL RESTAURANT NOTES */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.specialInstructions}</label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder={lang === "ar" ? "أضف أي ملاحظات خاصة للمطعم هنا..." : "Any special requests..."}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none"
                />
              </div>

              {/* SECURE SUB-SUMMARY CALCULATOR PANEL */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-slate-500">
                  <span>{t.subtotal}</span>
                  <span>{subtotal} {t.egp}</span>
                </div>
                {fulfillmentType === "delivery" && (
                  <div className="flex justify-between font-semibold text-slate-500">
                    <span>{t.deliveryFee}</span>
                    <span>{deliveryFee} {t.egp}</span>
                  </div>
                )}
                {fulfillmentType === "dine_in" && (
                  <div className="flex justify-between font-semibold text-slate-500">
                    <span>خدمة صالة</span>
                    <span>1.50 {t.egp}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-slate-500">
                  <span>{t.tax}</span>
                  <span>{taxAmount} {t.egp}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-200 text-sm">
                  <span>{t.total}</span>
                  <span>{grandTotal} {t.egp}</span>
                </div>
              </div>

              {/* Validation helper tips */}
              {!isFormValid() && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 text-xs font-semibold space-y-1 text-start">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertCircle size={15} className="text-amber-550 shrink-0" />
                    <span>{lang === "ar" ? "يرجى استكمال البيانات التالية لتأكيد الطلب:" : "Please complete the following details to confirm your order:"}</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-700 pl-1.5">
                    {!custName && <li>{lang === "ar" ? "الاسم الكامل مطلوب" : "Your full name is required"}</li>}
                    {!custPhone && <li>{lang === "ar" ? "رقم الهاتف مطلوب" : "Your phone number is required"}</li>}
                    {fulfillmentType === "dine_in" && !dineInTable && <li>{lang === "ar" ? "رقم طاولة الصالة مطلوب" : "Table number for Dine-in is required"}</li>}
                    {fulfillmentType === "delivery" && (!deliveryAddress || !deliveryZoneId) && <li>{lang === "ar" ? "عنوان التوصيل ومنطقة التوصيل مطلوبين" : "Delivery address and zone are required"}</li>}
                    {fulfillmentType === "takeaway" && takeawayTime === "specific" && !takeawayName && <li>{lang === "ar" ? "الاسم مطلوب لاستلام التيك أواي" : "Name is required for Takeaway callout"}</li>}
                    {paymentMethod === "card" && (!mockCardNo || !mockCardExpiry || !mockCardCvv) && <li>{lang === "ar" ? "بيانات الفيزا/الماستر كارد غير كاملة" : "Credit card information is incomplete"}</li>}
                  </ul>
                </div>
              )}

              {/* SUBMIT ORDER BUTTON */}
              <button
                onClick={handlePlaceOrder}
                disabled={isSubmittingOrder || !isFormValid()}
                className="w-full h-13 bg-green-600 hover:bg-green-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-99 cursor-pointer"
              >
                {isSubmittingOrder ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t.placingOrder}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    <span>{t.confirmOrder} — {grandTotal} {t.egp}</span>
                  </>
                )}
              </button>

            </div>

          </div>
        )}

      </main>

      {/* MOBILE STICKY FLOATING BOTTOM BAR */}
      {!routeInfo.isTrackView && !routeInfo.isOrderView && cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 p-4 shadow-xl">
          <button
            onClick={() => navigateTo(`/menu/${selectedBranch?.slug}/order`)}
            className="w-full h-12 bg-indigo-600 text-white rounded-xl font-black text-xs flex items-center justify-between px-5 hover:bg-indigo-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white text-indigo-600 text-[10px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center">
                {totalItemCount}
              </span>
              <span>{t.reviewOrder}</span>
            </div>
            <span className="font-black text-sm">{grandTotal} {t.egp}</span>
          </button>
        </div>
      )}

      {/* PAST ORDERS LOOKUP POPUP MODAL */}
      <AnimatePresence>
        {showLookupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowLookupModal(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden z-10 m-4"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <History size={16} className="text-indigo-650" />
                  <span>{t.pastOrders}</span>
                </h3>
                <button onClick={() => setShowLookupModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-start">
                <p className="text-xs text-slate-500">{t.enterPhoneLookup}</p>
                
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="flex-1 h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none"
                  />
                  <button
                    onClick={triggerPhoneLookup}
                    className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl text-xs font-black"
                  >
                    {searchingLookup ? "..." : t.lookupBtn}
                  </button>
                </div>

                {searchingLookup && (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-650 rounded-full animate-spin"></div>
                  </div>
                )}

                {hasSearchedLookup && (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto">
                    {lookupResults.length > 0 ? (
                      lookupResults.map(ord => (
                        <div key={ord.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                          <div className="flex justify-between items-center text-xxs font-semibold">
                            <span className="text-slate-400">{new Date(ord.placedAt).toLocaleDateString()}</span>
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                              {ord.totalAmount} {t.egp}
                            </span>
                          </div>

                          {/* items bulleted */}
                          <p className="text-[10px] text-slate-600 line-clamp-2">
                            {ord.items.map((it: any) => `${it.quantity}x ${it.name}`).join(", ")}
                          </p>

                          <button
                            onClick={() => handleReorderPastOrder(ord)}
                            className="w-full py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black hover:bg-indigo-700 transition-colors"
                          >
                            {t.reorder}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-xs text-slate-400 font-bold py-6">{t.noPastOrders}</p>
                    )}
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ITEM DETAIL & MODIFIER DRAWER SHEET */}
      <AnimatePresence>
        {modifierItem && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={() => setModifierItem(null)} />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl max-h-[90vh] overflow-y-auto z-10 text-start"
            >
              
              {/* Image banner */}
              <div className="relative h-44 bg-slate-100 flex items-center justify-center text-4xl overflow-hidden">
                <span className="opacity-30">🍽️</span>
                <button 
                  onClick={() => setModifierItem(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Detail content */}
              <div className="p-5 space-y-5">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {lang === "ar" ? modifierItem.nameAr || modifierItem.name : modifierItem.name}
                  </h3>
                  {modifierItem.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {modifierItem.description}
                    </p>
                  )}
                </div>

                {/* MODIFIERS LIST INLAY */}
                {modifierItem.modifierGroupIds && modifierItem.modifierGroupIds.map((groupId: string) => {
                  const group = modifiersList.find(g => g.id === groupId);
                  if (!group) return null;

                  const selections = modifierSelections[groupId] || [];

                  return (
                    <div key={group.id} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-800">
                          {group.name}
                        </h4>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                          group.required ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
                        }`}>
                          {group.required ? t.required : t.optional}
                        </span>
                      </div>

                      {/* Display limit prompt */}
                      {group.maxSelections > 1 && (
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {t.selectRange.replace("{min}", String(group.minSelections)).replace("{max}", String(group.maxSelections))}
                        </p>
                      )}

                      <div className="space-y-2">
                        {group.options.map((opt: any) => {
                          const isSel = selections.includes(opt.id);
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                isSel ? "border-indigo-650 bg-indigo-50/30" : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                              }`}
                            >
                              <input
                                type={group.maxSelections === 1 ? "radio" : "checkbox"}
                                name={group.id}
                                checked={isSel}
                                onChange={() => {
                                  if (group.maxSelections === 1) {
                                    handleSelectModifierSingle(group.id, opt.id);
                                  } else {
                                    handleToggleModifierMulti(group.id, opt.id, group.maxSelections);
                                  }
                                }}
                                className="sr-only"
                              />

                              {/* Radio indicator circle or box */}
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSel ? "border-indigo-650 bg-indigo-600 text-white" : "border-slate-300 bg-white"
                              }`}>
                                {isSel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>

                              <span className="text-xs font-semibold text-slate-700 flex-1">{opt.name}</span>
                              {opt.price !== 0 && (
                                <span className="text-xs font-black text-indigo-650">
                                  {opt.price > 0 ? "+" : ""}{opt.price} {t.egp}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}

                {/* SPECIAL ITEM NOTE */}
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1.5 block">{t.specialNotes}</label>
                  <textarea
                    value={modifierNotes}
                    onChange={(e) => setModifierNotes(e.target.value)}
                    placeholder={t.notesPlaceholder}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none"
                  />
                </div>

                {/* QUANTITY & CONFIRM FOOTER */}
                <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
                    <button 
                      onClick={() => setModifierQty(Math.max(1, modifierQty - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-300"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-black text-slate-800 w-6 text-center">{modifierQty}</span>
                    <button 
                      onClick={() => setModifierQty(modifierQty + 1)}
                      className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center hover:bg-indigo-700"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={confirmAddToCart}
                    disabled={!isModifierFormValid()}
                    className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ShoppingBag size={14} />
                    <span>{t.addToCart} — {getModifierItemTotalPrice()} {t.egp}</span>
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOMER LOGIN & SIGN UP MODAL */}
      <AnimatePresence>
        {showCustomerAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowCustomerAuthModal(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden z-10 m-4 text-start"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <User size={16} className="text-indigo-650" />
                  <span>
                    {authTab === "login" 
                      ? (lang === "ar" ? "تسجيل دخول العميل" : "Customer Login") 
                      : (lang === "ar" ? "حساب جديد للعميل" : "Customer Sign Up")}
                  </span>
                </h3>
                <button onClick={() => setShowCustomerAuthModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-5 space-y-4">
                
                {/* Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => { setAuthTab("login"); setAuthError(null); }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      authTab === "login" ? "bg-white text-indigo-650 shadow-xs" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {lang === "ar" ? "تسجيل دخول" : "Log In"}
                  </button>
                  <button
                    onClick={() => { setAuthTab("signup"); setAuthError(null); }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      authTab === "signup" ? "bg-white text-indigo-650 shadow-xs" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {lang === "ar" ? "إنشاء حساب" : "Sign Up"}
                  </button>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setAuthError(null);
                  setAuthLoading(true);
                  try {
                    if (authTab === "login") {
                      if (!authPhone || !authPassword) {
                        throw new Error(lang === "ar" ? "يرجى ملء جميع الحقول" : "Please fill in all fields");
                      }
                      const res = await fetch("/api/customer/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ phone: authPhone, password: authPassword })
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        throw new Error(data.message || (lang === "ar" ? "رقم الهاتف أو كلمة المرور غير صحيحة" : "Invalid phone or password"));
                      }
                      localStorage.setItem("eplfood_customer_profile", JSON.stringify(data.customer));
                      setCustomerUser(data.customer);
                      setShowCustomerAuthModal(false);
                      showToast(lang === "ar" ? `مرحباً بك مجدداً، ${data.customer.name}` : `Welcome back, ${data.customer.name}`);
                    } else {
                      if (!authName || !authPhone || !authPassword) {
                        throw new Error(lang === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
                      }
                      const res = await fetch("/api/customer/signup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: authName, phone: authPhone, email: authEmail, password: authPassword })
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        throw new Error(data.message || (lang === "ar" ? "فشل إنشاء الحساب" : "Signup failed"));
                      }
                      localStorage.setItem("eplfood_customer_profile", JSON.stringify(data.customer));
                      setCustomerUser(data.customer);
                      setShowCustomerAuthModal(false);
                      showToast(lang === "ar" ? `تم التسجيل بنجاح! مرحباً بك، ${data.customer.name}` : `Successfully signed up! Welcome, ${data.customer.name}`);
                    }
                  } catch (err: any) {
                    setAuthError(err.message);
                  } finally {
                    setAuthLoading(false);
                  }
                }} className="space-y-3.5">
                  
                  {authTab === "signup" && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        {lang === "ar" ? "الاسم الكامل" : "Full Name"} *
                      </label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder={lang === "ar" ? "أدخل اسمك بالكامل" : "e.g. John Doe"}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      {lang === "ar" ? "رقم الهاتف" : "Phone Number"} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder={lang === "ar" ? "رقم المحمول" : "01xxxxxxxxx"}
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {authTab === "signup" && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        {lang === "ar" ? "البريد الإلكتروني (اختياري)" : "Email Address (Optional)"}
                      </label>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="example@domain.com"
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      {lang === "ar" ? "كلمة المرور" : "Password"} *
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full h-11 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {authLoading ? (
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <User size={15} />
                        <span>
                          {authTab === "login" 
                            ? (lang === "ar" ? "تسجيل دخول" : "Log In Now") 
                            : (lang === "ar" ? "تأكيد وإنشاء حساب" : "Create Account")}
                        </span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab(authTab === "login" ? "signup" : "login");
                        setAuthError(null);
                      }}
                      className="text-xs text-indigo-600 hover:underline font-bold"
                    >
                      {authTab === "login"
                        ? (lang === "ar" ? "ليس لديك حساب؟ سجل الآن" : "Don't have an account? Sign Up")
                        : (lang === "ar" ? "لديك حساب بالفعل؟ سجل دخول" : "Already have an account? Log In")}
                    </button>
                  </div>

                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REQUIRED BRANCH SELECTOR OVERLAY / MODAL */}
      <AnimatePresence>
        {showBranchSelectorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" 
              onClick={() => {
                if (hasConfirmedBranch) {
                  setShowBranchSelectorModal(false);
                }
              }} 
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10 m-4 text-start flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <MapPin size={18} className="text-indigo-650 animate-bounce" />
                    <span>
                      {lang === "ar" ? "اختر فرع المطعم" : "Select Restaurant Branch"}
                    </span>
                  </h3>
                  <p className="text-xxs text-slate-400 mt-0.5">
                    {lang === "ar" 
                      ? "يجب اختيار الفرع لمشاهدة المنيو وعمل الطلب بنجاح" 
                      : "Selecting a branch is required to view menu and place order"}
                  </p>
                </div>
                {hasConfirmedBranch && (
                  <button 
                    onClick={() => setShowBranchSelectorModal(false)} 
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="p-5 overflow-y-auto space-y-3.5 flex-1 bg-slate-50/50">
                {branches.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    {lang === "ar" ? "جاري تحميل الفروع..." : "Loading branches..."}
                  </div>
                ) : (
                  branches.map((b: any) => {
                    const isSelected = selectedBranch?.id === b.id;
                    return (
                      <div
                        key={b.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-white hover:shadow-md ${
                          isSelected 
                            ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500" 
                            : "border-slate-100 bg-white"
                        }`}
                        onClick={() => {
                          setSelectedBranch(b);
                          setHasConfirmedBranch(true);
                          localStorage.setItem("epl_confirmed_branch_id", b.id);
                          setShowBranchSelectorModal(false);
                          navigateTo(`/menu/${b.slug}`);
                          showToast(
                            lang === "ar" 
                              ? `تم اختيار فرع: ${b.nameAr}` 
                              : `Selected branch: ${b.name}`
                          );
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <img 
                            src={b.logo} 
                            alt={b.name} 
                            className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-xs shrink-0" 
                          />
                          <div>
                            <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                              <span>{lang === "ar" ? b.nameAr : b.name}</span>
                              {isSelected && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                  {lang === "ar" ? "نشط" : "Active"}
                                </span>
                              )}
                            </h4>
                            <p className="text-xxs text-slate-500 mt-1 max-w-[280px]">
                              {lang === "ar" ? b.address : b.address || "Cairo, Egypt"}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                <Clock size={10} className="text-indigo-600" />
                                <span>~{b.estimatedWaitMinutes || 25} {lang === "ar" ? "دقيقة لتجهيز الطلب" : "mins wait"}</span>
                              </span>
                              {b.minOrderDelivery !== undefined && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  <span>{lang === "ar" ? "حد أدنى للتوصيل:" : "Min Order:"} {b.minOrderDelivery} {t.egp}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                        >
                          {lang === "ar" ? "اختر وبدء" : "Select & View"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
