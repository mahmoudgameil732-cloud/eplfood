import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { TalabatAdapter } from "./integrations/aggregators/talabat.adapter";
import { CareemAdapter } from "./integrations/aggregators/careem.adapter";

// Import Drizzle DB client and schemas for foundational module integration
import { db, tenants, staffUsers as staffUsersTable } from "./src/db/index";
import { syncFoundationalData } from "./src/db/sync";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = 3000;

app.use(express.json());

// --- Internationalization (i18n) Backend Middleware ---
const SERVER_MESSAGES: Record<"ar" | "en", Record<string, string>> = {
  ar: {
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    suspended: "تم إيقاف حسابك مؤقتاً",
    invalidPin: "الرمز التعريفي (PIN) غير صحيح",
    restaurantSuspended: "المطعم التابع لك موقوف حالياً",
    incompleteCredentials: "بيانات تسجيل الدخول غير مكتملة",
    unauthorized: "غير مصرح لك بالوصول إلى هذه الصفحة. يرجى تسجيل الدخول.",
    forbidden: "مرفوض: هذه العملية تتطلب صلاحيات مالك المنصة.",
    missingFields: "يرجى ملء جميع الحقول المطلوبة.",
    notFound: "المورد المطلوب غير موجود."
  },
  en: {
    invalidCredentials: "Email or password is incorrect",
    suspended: "Your account is temporarily suspended",
    invalidPin: "Incorrect PIN code",
    restaurantSuspended: "Your associated restaurant is currently suspended",
    incompleteCredentials: "Incomplete login credentials",
    unauthorized: "You are not authorized to access this page. Please log in.",
    forbidden: "Forbidden: This operation requires Platform Owner permissions.",
    missingFields: "Please fill in all required fields.",
    notFound: "The requested resource was not found."
  }
};

const MENU_ITEM_TRANSLATIONS: Record<string, { ar: string, en: string }> = {
  "Truffle Herb Parmesan Fries": {
    en: "Truffle Herb Parmesan Fries",
    ar: "بطاطس مقرمشة بزيت الترافل والأعشاب والبارميزان"
  },
  "Golden crispy fries tossed with white truffle oil, grated parmesan cheese, and farm-fresh chives.": {
    en: "Golden crispy fries tossed with white truffle oil, grated parmesan cheese, and farm-fresh chives.",
    ar: "بطاطس ذهبية مقرمشة ممزوجة بزيت الكمأة البيضاء، جبن البارميزان المبشور، والثوم المعمر الطازج."
  },
  "Crispy Calamari": {
    en: "Crispy Calamari",
    ar: "كالاماري مقرمش"
  },
  "Tender Atlantic squid lightly dusted with seasoned flour, served with lemon-garlic aioli.": {
    en: "Tender Atlantic squid lightly dusted with seasoned flour, served with lemon-garlic aioli.",
    ar: "حبار الأطلسي الطري مغطى بالدقيق المتبل، يقدم مع أيولي الليمون والثوم."
  },
  "Roasted Garlic Hummus Plate": {
    en: "Roasted Garlic Hummus Plate",
    ar: "طبق حمص بالثوم المشوي"
  },
  "Creamy chickpea hummus drizzled with cold-pressed olive oil, kalamata olives, served with warm pita bread.": {
    en: "Creamy chickpea hummus drizzled with cold-pressed olive oil, kalamata olives, served with warm pita bread.",
    ar: "حمص كريمي مغطى بزيت الزيتون المعصور على البارد، زيتون كالاماتا، يقدم مع خبز البيتا الدافئ."
  },
  "Cast Iron Ribeye Steak": {
    en: "Cast Iron Ribeye Steak",
    ar: "ستيك ريب آي مشوي"
  },
  "12oz grain-fed prime ribeye seared in fresh garlic herb butter, served with roasted asparagus and garlic mash.": {
    en: "12oz grain-fed prime ribeye seared in fresh garlic herb butter, served with roasted asparagus and garlic mash.",
    ar: "ستيك ريب آي مشوي بفرن الزهر مع الثوم والزبدة والأعشاب والبطاطس المهروسة."
  }
};

function translateField(value: any, locale: "ar" | "en"): string {
  if (!value) return "";
  if (typeof value === "object") {
    return value[locale] || value["ar"] || value["en"] || "";
  }
  if (typeof value === "string") {
    const mapped = MENU_ITEM_TRANSLATIONS[value];
    if (mapped) {
      return mapped[locale];
    }
  }
  return value;
}

app.use((req: any, res: any, next: any) => {
  const queryLang = req.query.lang || req.query.locale;
  const acceptLang = req.headers["accept-language"];
  let lang: "ar" | "en" = "ar"; // default

  if (queryLang === "en") {
    lang = "en";
  } else if (queryLang === "ar") {
    lang = "ar";
  } else if (acceptLang) {
    const primary = acceptLang.split(",")[0].toLowerCase();
    if (primary.startsWith("en")) {
      lang = "en";
    }
  }
  req.locale = lang;
  next();
});

// Import staff routes
import staffRouter from "./routes/staff.routes";
app.use(staffRouter);

// Import menu and order routes
import apiRouter from "./src/routes/index";
app.use(apiRouter);

// Initialize Gemini SDK with telemetry header
const ai = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// File Paths for local JSON DB
const DATA_DIR = path.join(process.cwd(), "db-data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MENU_FILE = path.join(DATA_DIR, "menu.json");
const TABLES_FILE = path.join(DATA_DIR, "tables.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const MODIFIERS_FILE = path.join(DATA_DIR, "modifiers.json");
const PROMOTIONS_FILE = path.join(DATA_DIR, "promotions.json");
const AUDITS_FILE = path.join(DATA_DIR, "audits.json");
const RECONCILIATION_FILE = path.join(DATA_DIR, "reconciliation.json");
const INGREDIENTS_FILE = path.join(DATA_DIR, "ingredients.json");
const RECIPES_FILE = path.join(DATA_DIR, "recipes.json");
const SHIFTS_FILE = path.join(DATA_DIR, "shifts.json");
const AGGREGATOR_LOGS_FILE = path.join(DATA_DIR, "aggregator_logs.json");
const AGGREGATOR_SETTINGS_FILE = path.join(DATA_DIR, "aggregator_settings.json");
const WASTE_LOGS_FILE = path.join(DATA_DIR, "waste_logs.json");
const STAFF_USERS_FILE = path.join(DATA_DIR, "staff_users.json");
const ATTENDANCE_LOGS_FILE = path.join(DATA_DIR, "attendance_logs.json");
const STAFF_SCHEDULES_FILE = path.join(DATA_DIR, "staff_schedules.json");
const LEAVE_REQUESTS_FILE = path.join(DATA_DIR, "leave_requests.json");
const PAYROLL_RUNS_FILE = path.join(DATA_DIR, "payroll_runs.json");
const BIOMETRIC_DEVICES_FILE = path.join(DATA_DIR, "biometric_devices.json");
const BRANCHES_FILE = path.join(DATA_DIR, "branches.json");

// Default initial data matches types.ts
const DEFAULT_MODIFIERS = [
  {
    id: "mod-size",
    name: "Portion Size",
    minSelections: 1,
    maxSelections: 1,
    required: true,
    options: [
      { id: "sz-sm", name: "Half/Starter Portion", price: -2.00 },
      { id: "sz-reg", name: "Standard Portion", price: 0.00 },
      { id: "sz-lg", name: "Double/Premium Portion", price: 4.50 }
    ]
  },
  {
    id: "mod-doneness",
    name: "Steak Temp",
    minSelections: 1,
    maxSelections: 1,
    required: true,
    options: [
      { id: "temp-r", name: "Rare", price: 0.00 },
      { id: "temp-mr", name: "Medium Rare", price: 0.00 },
      { id: "temp-m", name: "Medium", price: 0.00 },
      { id: "temp-wd", name: "Well Done", price: 0.00 }
    ]
  },
  {
    id: "mod-extras",
    name: "Add-Ons & Customizations",
    minSelections: 0,
    maxSelections: 4,
    required: false,
    options: [
      { id: "ext-truf", name: "Extra White Truffle Drizzle", price: 3.00 },
      { id: "ext-avoc", name: "Fresh Hass Avocado", price: 2.50 },
      { id: "ext-gf", name: "Gluten-Free Alternative", price: 2.00 },
      { id: "ext-cheese", name: "Melted Sharp Cheddar", price: 1.50 }
    ]
  },
  {
    id: "mod-coffee",
    name: "Brew Additions",
    minSelections: 0,
    maxSelections: 3,
    required: false,
    options: [
      { id: "cof-oat", name: "Organic Oat Milk", price: 1.00 },
      { id: "cof-shot", name: "Extra Espresso Shot", price: 1.50 },
      { id: "cof-sweet", name: "Sugar Free Vanilla Syrup", price: 0.75 }
    ]
  }
];

const DEFAULT_MENU = [
  {
    id: "dish-1",
    name: "Truffle Herb Parmesan Fries",
    description: "Golden crispy fries tossed with white truffle oil, grated parmesan cheese, and farm-fresh chives.",
    price: 9.50,
    category: "Appetizers",
    image: "French Fries",
    isAvailable: true,
    modifierGroupIds: ["mod-size", "mod-extras"],
    channelPricing: {
      "aggregator:talabat": 11.00,
      "aggregator:careem": 11.50
    }
  },
  {
    id: "dish-2",
    name: "Crispy Calamari",
    description: "Tender Atlantic squid lightly dusted with seasoned flour, served with lemon-garlic aioli.",
    price: 14.00,
    category: "Appetizers",
    image: "Seafood",
    isAvailable: true,
    modifierGroupIds: ["mod-size", "mod-extras"]
  },
  {
    id: "dish-3",
    name: "Roasted Garlic Hummus Plate",
    description: "Creamy chickpea hummus drizzled with cold-pressed olive oil, kalamata olives, served with warm pita bread.",
    price: 12.00,
    category: "Appetizers",
    image: "Salad",
    isAvailable: true,
    modifierGroupIds: ["mod-extras"]
  },
  {
    id: "dish-4",
    name: "Cast Iron Ribeye Steak",
    description: "12oz grain-fed prime ribeye seared in fresh garlic herb butter, served with roasted asparagus and garlic mash.",
    price: 34.00,
    category: "Mains",
    image: "Steak",
    isAvailable: true,
    modifierGroupIds: ["mod-doneness", "mod-extras"],
    channelPricing: {
      "aggregator:talabat": 38.00,
      "aggregator:careem": 39.00
    }
  },
  {
    id: "dish-5",
    name: "Creamy Wild Mushroom Penne",
    description: "Al dente penne pasta tossed in a luxurious roasted mushroom and truffle cream sauce, topped with shaved pecorino.",
    price: 22.00,
    category: "Mains",
    image: "Pasta",
    isAvailable: true,
    modifierGroupIds: ["mod-size", "mod-extras"]
  },
  {
    id: "dish-6",
    name: "Pan-Seared Atlantic Salmon",
    description: "Crispy skin salmon fillet over wild grain rice and buttered baby spinach, with lemon-dill emulsion.",
    price: 27.50,
    category: "Mains",
    image: "Salmon",
    isAvailable: true,
    modifierGroupIds: ["mod-extras"]
  },
  {
    id: "dish-7",
    name: "Madagascar Vanilla Bean Crème Brûlée",
    description: "Rich baked vanilla custard topped with a hand-torched, brittle caramelized sugar crust.",
    price: 11.00,
    category: "Desserts",
    image: "Cake",
    isAvailable: true
  },
  {
    id: "dish-8",
    name: "Warm Chocolate Fudge Torte",
    description: "Elegant flourless dark chocolate torte with wild berry coulis and fresh vanilla whipped cream.",
    price: 10.50,
    category: "Desserts",
    image: "Chocolate",
    isAvailable: true
  },
  {
    id: "dish-9",
    name: "House-Brewed Hibiscus Soda",
    description: "Cold sweetened hibiscus herbal tea infused with fresh lime juice, mint leaves, and effervescent sparkling soda.",
    price: 6.50,
    category: "Drinks",
    image: "Cocktail",
    isAvailable: true
  },
  {
    id: "dish-10",
    name: "Organic Cold Brew Coffee",
    description: "Steeped for 18 hours in mountain spring water, served over artisanal crystal ice spheres.",
    price: 6.00,
    category: "Drinks",
    image: "Coffee",
    isAvailable: true,
    modifierGroupIds: ["mod-coffee"]
  }
];

const DEFAULT_TABLES = [
  { id: "table-1", name: "Table 1", seats: 2, status: "empty", currentOrderId: null },
  { id: "table-2", name: "Table 2", seats: 2, status: "occupied", currentOrderId: "ord-initial-1" },
  { id: "table-3", name: "Table 3", seats: 4, status: "ordering", currentOrderId: null },
  { id: "table-4", name: "Table 4", seats: 4, status: "bill_requested", currentOrderId: "ord-initial-2" },
  { id: "table-5", name: "Table 5", seats: 6, status: "reserved", currentOrderId: null },
  { id: "table-6", name: "Table 6", seats: 8, status: "dirty", currentOrderId: null }
];

const DEFAULT_ORDERS = [
  {
    id: "ord-initial-1",
    tableId: "table-2",
    tableName: "Table 2",
    fulfillmentType: "dine_in",
    orderSource: "pos",
    items: [
      { 
        id: "dish-1", 
        name: "Truffle Herb Parmesan Fries", 
        price: 9.50, 
        quantity: 1, 
        notes: "No extra salt", 
        course: "appetizer", 
        fired: true, 
        modifiers: [
          { groupId: "mod-size", groupName: "Portion Size", optionId: "sz-reg", optionName: "Standard Portion", price: 0.00 }
        ] 
      },
      { 
        id: "dish-5", 
        name: "Creamy Wild Mushroom Penne", 
        price: 22.00, 
        quantity: 1, 
        course: "main", 
        fired: false, 
        modifiers: [
          { groupId: "mod-size", groupName: "Portion Size", optionId: "sz-lg", optionName: "Double/Premium Portion", price: 4.50 }
        ] 
      }
    ],
    status: "preparing",
    totalAmount: 36.00,
    placedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    id: "ord-initial-2",
    tableId: "table-4",
    tableName: "Table 4",
    fulfillmentType: "dine_in",
    orderSource: "app",
    items: [
      { 
        id: "dish-4", 
        name: "Cast Iron Ribeye Steak", 
        price: 34.00, 
        quantity: 2, 
        course: "main", 
        fired: true, 
        modifiers: [
          { groupId: "mod-doneness", groupName: "Steak Temp", optionId: "temp-mr", optionName: "Medium Rare", price: 0.00 },
          { groupId: "mod-extras", groupName: "Add-Ons & Customizations", optionId: "ext-truf", optionName: "Extra White Truffle Drizzle", price: 3.00 }
        ] 
      }
    ],
    status: "delivered",
    totalAmount: 74.00,
    payment: {
      method: "split",
      splits: [
        { method: "cash", amount: 37.00 },
        { method: "card", amount: 37.00 }
      ],
      subtotal: 74.00,
      taxAmount: 7.40,
      surcharge: 1.50,
      discountAmount: 0.00,
      totalPaid: 82.90,
      tipAmount: 10.00
    },
    placedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: "ord-agg-1",
    tableId: null,
    tableName: null,
    fulfillmentType: "delivery",
    orderSource: "aggregator:talabat",
    items: [
      { 
        id: "dish-1", 
        name: "Truffle Herb Parmesan Fries", 
        price: 11.00, // Surge/channel pricing
        quantity: 2, 
        course: "main", 
        fired: true, 
        modifiers: [] 
      }
    ],
    status: "completed",
    totalAmount: 22.00,
    delivery: {
      address: "Marina Heights Tower, Floor 42, Dubai Marina",
      latitude: 25.0858,
      longitude: 55.1434,
      distanceKm: 3.8,
      deliveryFee: 5.00,
      riderName: "Ahmad Shah",
      riderPhone: "+971501234567"
    },
    placedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
    preparedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    dispatchedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
  }
];

const DEFAULT_PROMOTIONS = [
  { code: "HAPPYHOUR", discountType: "percentage", value: 15, minimumOrderAmount: 15, isActive: true },
  { code: "TALABAT25", discountType: "percentage", value: 25, minimumOrderAmount: 20, channelRestrictions: ["aggregator:talabat"], isActive: true },
  { code: "SAVEMORE", discountType: "fixed", value: 5.00, minimumOrderAmount: 30, isActive: true }
];

const DEFAULT_AUDITS = [
  {
    id: "aud-1",
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    action: "PRICE_OVERRIDE",
    orderId: "ord-initial-2",
    userRole: "manager",
    reason: "VIP Customer preference waiver",
    details: "Discounted item Ribeye Steak override manually."
  },
  {
    id: "aud-2",
    timestamp: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
    action: "FORCE_86",
    userRole: "chef",
    reason: "Run-out of Fresh Salmon raw stock",
    details: "Marked Atlantic Salmon availability status as OFF in SaaS terminal."
  }
];

const DEFAULT_RECONCILIATION = [
  {
    id: "rec-1",
    aggregatorName: "talabat",
    externalOrderId: "tal-908123",
    systemOrderId: "ord-agg-1",
    totalAmount: 22.00,
    commissionRatePercent: 18,
    commissionAmount: 3.96,
    netPayoutExpected: 18.04,
    netPayoutReported: 18.04,
    status: "reconciled",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  },
  {
    id: "rec-2",
    aggregatorName: "talabat",
    externalOrderId: "tal-991283",
    systemOrderId: "ord-failed-sync",
    totalAmount: 45.00,
    commissionRatePercent: 18,
    commissionAmount: 8.10,
    netPayoutExpected: 36.90,
    netPayoutReported: 32.50, // Flagged discrepancy!
    status: "discrepancy",
    discrepancyNotes: "Aggregator deducted unrecognized rider delay fine ($4.40). Dispute triggered.",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];


const DEFAULT_INGREDIENTS = [
  { id: "ing-steak", name: "Prime Ribeye Steak", category: "Protein", baseUom: "kg", costPerBaseUnit: 35.00, yieldPercent: 95, allergens: [], shelfLifeDays: 5, spoilageClass: "High" },
  { id: "ing-salmon", name: "Atlantic Salmon Fillet", category: "Protein", baseUom: "kg", costPerBaseUnit: 28.00, yieldPercent: 90, allergens: ["Fish"], shelfLifeDays: 3, spoilageClass: "High" },
  { id: "ing-squid", name: "Atlantic Squid", category: "Protein", baseUom: "kg", costPerBaseUnit: 18.00, yieldPercent: 85, allergens: ["Molluscs"], shelfLifeDays: 3, spoilageClass: "High" },
  { id: "ing-potato", name: "Idaho Potatoes", category: "Produce", baseUom: "kg", costPerBaseUnit: 1.50, yieldPercent: 88, allergens: [], shelfLifeDays: 30, spoilageClass: "Low" },
  { id: "ing-mushroom", name: "Wild Mushrooms Mix", category: "Produce", baseUom: "kg", costPerBaseUnit: 12.00, yieldPercent: 95, allergens: [], shelfLifeDays: 7, spoilageClass: "Medium" },
  { id: "ing-asparagus", name: "Fresh Asparagus", category: "Produce", baseUom: "kg", costPerBaseUnit: 6.00, yieldPercent: 80, allergens: [], shelfLifeDays: 6, spoilageClass: "Medium" },
  { id: "ing-chives", name: "Fresh Chives", category: "Produce", baseUom: "kg", costPerBaseUnit: 15.00, yieldPercent: 95, allergens: [], shelfLifeDays: 10, spoilageClass: "Medium" },
  { id: "ing-dill", name: "Fresh Dill", category: "Produce", baseUom: "kg", costPerBaseUnit: 12.00, yieldPercent: 95, allergens: [], shelfLifeDays: 10, spoilageClass: "Medium" },
  { id: "ing-garlic", name: "Fresh Garlic", category: "Produce", baseUom: "kg", costPerBaseUnit: 4.00, yieldPercent: 90, allergens: [], shelfLifeDays: 45, spoilageClass: "Low" },
  { id: "ing-lemon", name: "Fresh Lemon", category: "Produce", baseUom: "kg", costPerBaseUnit: 3.00, yieldPercent: 60, allergens: [], shelfLifeDays: 20, spoilageClass: "Low" },
  { id: "ing-truffle-oil", name: "White Truffle Oil", category: "Pantry", baseUom: "l", costPerBaseUnit: 80.00, yieldPercent: 100, allergens: [], shelfLifeDays: 180, spoilageClass: "Low" },
  { id: "ing-cream", name: "Heavy Cream", category: "Dairy", baseUom: "l", costPerBaseUnit: 4.50, yieldPercent: 100, allergens: ["Dairy"], shelfLifeDays: 14, spoilageClass: "High" },
  { id: "ing-parmesan", name: "Grated Parmesan", category: "Dairy", baseUom: "kg", costPerBaseUnit: 22.00, yieldPercent: 100, allergens: ["Dairy"], shelfLifeDays: 60, spoilageClass: "Low" },
  { id: "ing-pecorino", name: "Pecorino Romano Shaved", category: "Dairy", baseUom: "kg", costPerBaseUnit: 24.00, yieldPercent: 100, allergens: ["Dairy"], shelfLifeDays: 60, spoilageClass: "Low" },
  { id: "ing-butter", name: "Unsalted Butter", category: "Dairy", baseUom: "kg", costPerBaseUnit: 8.50, yieldPercent: 100, allergens: ["Dairy"], shelfLifeDays: 90, spoilageClass: "Medium" },
  { id: "ing-egg-yolk", name: "Organic Egg Yolks", category: "Dairy", baseUom: "kg", costPerBaseUnit: 6.00, yieldPercent: 100, allergens: ["Egg"], shelfLifeDays: 7, spoilageClass: "High" },
  { id: "ing-olive-oil", name: "Cold-Pressed Olive Oil", category: "Pantry", baseUom: "l", costPerBaseUnit: 10.00, yieldPercent: 100, allergens: [], shelfLifeDays: 360, spoilageClass: "Low" },
  { id: "ing-penne", name: "Penne Pasta", category: "Pantry", baseUom: "kg", costPerBaseUnit: 2.50, yieldPercent: 100, allergens: ["Gluten"], shelfLifeDays: 365, spoilageClass: "Low" },
  { id: "ing-rice", name: "Wild Grain Rice", category: "Pantry", baseUom: "kg", costPerBaseUnit: 3.00, yieldPercent: 100, allergens: [], shelfLifeDays: 365, spoilageClass: "Low" },
  { id: "ing-spinach", name: "Baby Spinach", category: "Produce", baseUom: "kg", costPerBaseUnit: 8.00, yieldPercent: 90, allergens: [], shelfLifeDays: 5, spoilageClass: "High" },
  { id: "ing-flour", name: "Plain Baking Flour", category: "Pantry", baseUom: "kg", costPerBaseUnit: 1.20, yieldPercent: 100, allergens: ["Gluten"], shelfLifeDays: 365, spoilageClass: "Low" }
];

const DEFAULT_RECIPES = [
  {
    id: "rec-sub-aioli",
    menuItemId: null,
    isSubRecipe: true,
    name: "House Garlic Aioli Prep",
    ingredients: [
      { ingredientId: "ing-egg-yolk", isSubRecipeLink: false, quantity: 0.15 },
      { ingredientId: "ing-olive-oil", isSubRecipeLink: false, quantity: 0.75 },
      { ingredientId: "ing-lemon", isSubRecipeLink: false, quantity: 0.05 },
      { ingredientId: "ing-garlic", isSubRecipeLink: false, quantity: 0.05 }
    ],
    yieldQuantity: 1.0,
    baseUom: "kg",
    version: 1,
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: "rec-dish-1",
    menuItemId: "dish-1",
    isSubRecipe: false,
    name: "Truffle Herb Parmesan Fries Recipe",
    ingredients: [
      { ingredientId: "ing-potato", isSubRecipeLink: false, quantity: 0.25 },
      { ingredientId: "ing-truffle-oil", isSubRecipeLink: false, quantity: 0.01 },
      { ingredientId: "ing-parmesan", isSubRecipeLink: false, quantity: 0.02 },
      { ingredientId: "ing-chives", isSubRecipeLink: false, quantity: 0.005 }
    ],
    yieldQuantity: 1.0,
    baseUom: "unit",
    version: 1,
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: "rec-dish-2",
    menuItemId: "dish-2",
    isSubRecipe: false,
    name: "Crispy Calamari Recipe",
    ingredients: [
      { ingredientId: "ing-squid", isSubRecipeLink: false, quantity: 0.18 },
      { ingredientId: "ing-flour", isSubRecipeLink: false, quantity: 0.05 },
      { ingredientId: "rec-sub-aioli", isSubRecipeLink: true, quantity: 0.04 }
    ],
    yieldQuantity: 1.0,
    baseUom: "unit",
    version: 1,
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: "rec-dish-4",
    menuItemId: "dish-4",
    isSubRecipe: false,
    name: "Cast Iron Ribeye Steak Recipe",
    ingredients: [
      { ingredientId: "ing-steak", isSubRecipeLink: false, quantity: 0.34 },
      { ingredientId: "ing-butter", isSubRecipeLink: false, quantity: 0.03 },
      { ingredientId: "ing-garlic", isSubRecipeLink: false, quantity: 0.01 },
      { ingredientId: "ing-asparagus", isSubRecipeLink: false, quantity: 0.15 },
      { ingredientId: "ing-potato", isSubRecipeLink: false, quantity: 0.20 }
    ],
    yieldQuantity: 1.0,
    baseUom: "unit",
    version: 1,
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: "rec-dish-5",
    menuItemId: "dish-5",
    isSubRecipe: false,
    name: "Creamy Wild Mushroom Penne Recipe",
    ingredients: [
      { ingredientId: "ing-penne", isSubRecipeLink: false, quantity: 0.12 },
      { ingredientId: "ing-mushroom", isSubRecipeLink: false, quantity: 0.08 },
      { ingredientId: "ing-cream", isSubRecipeLink: false, quantity: 0.10 },
      { ingredientId: "ing-truffle-oil", isSubRecipeLink: false, quantity: 0.005 },
      { ingredientId: "ing-pecorino", isSubRecipeLink: false, quantity: 0.015 }
    ],
    yieldQuantity: 1.0,
    baseUom: "unit",
    version: 1,
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: "rec-dish-6",
    menuItemId: "dish-6",
    isSubRecipe: false,
    name: "Pan-Seared Atlantic Salmon Recipe",
    ingredients: [
      { ingredientId: "ing-salmon", isSubRecipeLink: false, quantity: 0.20 },
      { ingredientId: "ing-rice", isSubRecipeLink: false, quantity: 0.08 },
      { ingredientId: "ing-spinach", isSubRecipeLink: false, quantity: 0.10 },
      { ingredientId: "ing-lemon", isSubRecipeLink: false, quantity: 0.02 },
      { ingredientId: "ing-dill", isSubRecipeLink: false, quantity: 0.005 }
    ],
    yieldQuantity: 1.0,
    baseUom: "unit",
    version: 1,
    isActive: true,
    updatedAt: new Date().toISOString()
  }
];

// Database Helper functions
function readJSON(file: string, fallback: any) {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
  }
  return fallback;
}

function writeJSON(file: string, data: any) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error(`Error writing ${file}:`, error);
  }
}

function addAuditLog(action: string, details: string, reason?: string, orderId?: string, userRole: "waiter" | "cashier" | "chef" | "manager" = "manager") {
  const newAudit = {
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    orderId: orderId || null,
    userRole,
    reason: reason || "Manual action override",
    details
  };
  if (typeof audits !== "undefined" && Array.isArray(audits)) {
    audits.push(newAudit);
    writeJSON(AUDITS_FILE, audits);
  }
  return newAudit;
}

// Load current records
let modifiers = readJSON(MODIFIERS_FILE, DEFAULT_MODIFIERS);
if (!Array.isArray(modifiers)) modifiers = DEFAULT_MODIFIERS;

let menu = readJSON(MENU_FILE, DEFAULT_MENU);
if (!Array.isArray(menu)) menu = DEFAULT_MENU;

let tables = readJSON(TABLES_FILE, DEFAULT_TABLES);
if (!Array.isArray(tables)) tables = DEFAULT_TABLES;

let orders = readJSON(ORDERS_FILE, DEFAULT_ORDERS);
if (!Array.isArray(orders)) orders = DEFAULT_ORDERS;

let promotions = readJSON(PROMOTIONS_FILE, DEFAULT_PROMOTIONS);
if (!Array.isArray(promotions)) promotions = DEFAULT_PROMOTIONS;

let audits = readJSON(AUDITS_FILE, DEFAULT_AUDITS);
if (!Array.isArray(audits)) audits = DEFAULT_AUDITS;

let reconciliation = readJSON(RECONCILIATION_FILE, DEFAULT_RECONCILIATION);
if (!Array.isArray(reconciliation)) reconciliation = DEFAULT_RECONCILIATION;

let ingredients = readJSON(INGREDIENTS_FILE, DEFAULT_INGREDIENTS);
if (!Array.isArray(ingredients)) ingredients = DEFAULT_INGREDIENTS;

let recipes = readJSON(RECIPES_FILE, DEFAULT_RECIPES);
if (!Array.isArray(recipes)) recipes = DEFAULT_RECIPES;

let shifts = readJSON(SHIFTS_FILE, []);
if (!Array.isArray(shifts)) shifts = [];

const FIXED_EXPENSES_FILE = path.join(DATA_DIR, "fixed_expenses.json");
const DEFAULT_FIXED_EXPENSES = [
  {
    id: "exp-1",
    branchId: "branch-a",
    name: "إيجار فرع المعادي",
    nameAr: "إيجار فرع المعادي",
    category: "rent",
    amount: 800000,
    frequency: "monthly",
    effectiveFrom: "2025-01",
    notes: "العقد السنوي"
  },
  {
    id: "exp-2",
    branchId: "branch-a",
    name: "كهرباء ومياه المعادي",
    nameAr: "كهرباء ومياه المعادي",
    category: "utilities",
    amount: 320000,
    frequency: "monthly",
    effectiveFrom: "2025-01",
    notes: "متوسط الفواتير"
  },
  {
    id: "exp-3",
    branchId: "branch-b",
    name: "رواتب فرع مصر الجديدة",
    nameAr: "رواتب فرع مصر الجديدة",
    category: "salaries",
    amount: 2840000,
    frequency: "monthly",
    effectiveFrom: "2025-01"
  }
];
let fixedExpenses = readJSON(FIXED_EXPENSES_FILE, DEFAULT_FIXED_EXPENSES);
if (!Array.isArray(fixedExpenses)) fixedExpenses = DEFAULT_FIXED_EXPENSES;

let aggregatorLogs = readJSON(AGGREGATOR_LOGS_FILE, []);
if (!Array.isArray(aggregatorLogs)) aggregatorLogs = [];

const DEFAULT_SETTINGS = { autoAccept: true, talabatCommission: 15, careemCommission: 18, deliverySurcharge: 5.00 };
let aggregatorSettings = readJSON(AGGREGATOR_SETTINGS_FILE, DEFAULT_SETTINGS);
if (typeof aggregatorSettings !== "object" || aggregatorSettings === null) {
  aggregatorSettings = DEFAULT_SETTINGS;
} else {
  // Ensure all keys are defined
  if (aggregatorSettings.autoAccept === undefined) aggregatorSettings.autoAccept = true;
  if (aggregatorSettings.talabatCommission === undefined) aggregatorSettings.talabatCommission = 15;
  if (aggregatorSettings.careemCommission === undefined) aggregatorSettings.careemCommission = 18;
  if (aggregatorSettings.deliverySurcharge === undefined) aggregatorSettings.deliverySurcharge = 5.00;
}

let wasteLogs = readJSON(WASTE_LOGS_FILE, []);
if (!Array.isArray(wasteLogs)) wasteLogs = [];

const DEFAULT_STAFF_USERS = [
  {
    id: "staff-1",
    name: "أحمد محمد",
    role: "cashier",
    pin: "1234",
    employeeCode: "EMP-001",
    nationalId: "29501010101234",
    phone: "01012345678",
    address: "شبرا، القاهرة",
    hireDate: "2024-01-15T00:00:00.000Z",
    jobTitle: "Senior Cashier",
    department: "FOH",
    branchId: "branch-a",
    employmentType: "full_time",
    salaryType: "monthly",
    baseSalary: 300000,
    hourlyRate: 1500,
    overtimeRate: 1.5,
    biometricId: "1",
    biometricDeviceId: "dev-1",
    allowances: [
      { id: "allow-trans", name: "مواصلات", amount: 30000, type: "fixed", active: true },
      { id: "allow-meal", name: "وجبات", amount: 20000, type: "fixed", active: true }
    ],
    deductions: [
      { id: "ded-ins", name: "تأمين", amount: 15000, type: "fixed", active: true }
    ],
    status: "active",
    createdBy: "system",
    updatedAt: "2026-06-25T10:00:00.000Z",
    lastModifiedBy: "system"
  },
  {
    id: "staff-2",
    name: "سارة علي",
    role: "chef",
    pin: "5678",
    employeeCode: "EMP-002",
    nationalId: "29802020205678",
    phone: "01123456789",
    address: "المهندسين، الجيزة",
    hireDate: "2024-03-01T00:00:00.000Z",
    jobTitle: "Line Cook",
    department: "BOH",
    branchId: "branch-a",
    employmentType: "full_time",
    salaryType: "monthly",
    baseSalary: 450000,
    hourlyRate: 2200,
    overtimeRate: 1.5,
    biometricId: "2",
    biometricDeviceId: "dev-1",
    allowances: [
      { id: "allow-trans", name: "مواصلات", amount: 30000, type: "fixed", active: true },
      { id: "allow-housing", name: "سكن", amount: 50000, type: "fixed", active: false }
    ],
    deductions: [
      { id: "ded-ins", name: "تأمين", amount: 15000, type: "fixed", active: true }
    ],
    status: "active",
    createdBy: "system",
    updatedAt: "2026-06-25T10:00:00.000Z",
    lastModifiedBy: "system"
  },
  {
    id: "staff-3",
    name: "محمود جمال",
    role: "manager",
    pin: "9999",
    employeeCode: "EMP-003",
    nationalId: "29103030309999",
    phone: "01234567890",
    address: "مصر الجديدة، القاهرة",
    hireDate: "2023-05-10T00:00:00.000Z",
    jobTitle: "General Manager",
    department: "Management",
    branchId: "branch-a",
    employmentType: "full_time",
    salaryType: "monthly",
    baseSalary: 600000,
    hourlyRate: 3000,
    overtimeRate: 1.5,
    biometricId: "3",
    biometricDeviceId: "dev-1",
    allowances: [
      { id: "allow-trans", name: "مواصلات", amount: 30000, type: "fixed", active: true },
      { id: "allow-meal", name: "وجبات", amount: 20000, type: "fixed", active: true }
    ],
    deductions: [
      { id: "ded-ins", name: "تأمين", amount: 15000, type: "fixed", active: true }
    ],
    status: "active",
    createdBy: "system",
    updatedAt: "2026-06-25T10:00:00.000Z",
    lastModifiedBy: "system"
  },
  {
    id: "staff-4",
    name: "طارق سعيد",
    role: "rider",
    pin: "0000",
    employeeCode: "EMP-004",
    nationalId: "29904040400000",
    phone: "01512345678",
    address: "المعادي، القاهرة",
    hireDate: "2025-01-01T00:00:00.000Z",
    jobTitle: "Delivery Rider",
    department: "Delivery",
    branchId: "branch-a",
    employmentType: "full_time",
    salaryType: "hourly",
    baseSalary: 250000,
    hourlyRate: 1200,
    overtimeRate: 1.5,
    biometricId: "4",
    biometricDeviceId: "dev-2",
    allowances: [
      { id: "allow-trans", name: "مواصلات", amount: 40000, type: "fixed", active: true }
    ],
    deductions: [
      { id: "ded-ins", name: "تأمين", amount: 10000, type: "fixed", active: true }
    ],
    status: "active",
    createdBy: "system",
    updatedAt: "2026-06-25T10:00:00.000Z",
    lastModifiedBy: "system"
  }
];

const DEFAULT_ATTENDANCE_LOGS = [
  {
    id: "att-1",
    employeeId: "staff-1",
    employeeCode: "EMP-001",
    employeeName: "أحمد محمد",
    branchId: "branch-a",
    date: "2026-06-25",
    checkIn: "2026-06-25T09:02:15.000Z",
    checkOut: "2026-06-25T17:05:30.000Z",
    checkInSource: "biometric",
    checkOutSource: "biometric",
    hoursWorked: 8.05,
    regularHours: 8,
    overtimeHours: 0.05,
    status: "present",
    lateMinutes: 2,
    earlyDepartureMinutes: 0,
    createdAt: "2026-06-25T09:02:15.000Z",
    updatedAt: "2026-06-25T17:05:30.000Z"
  },
  {
    id: "att-2",
    employeeId: "staff-2",
    employeeCode: "EMP-002",
    employeeName: "سارة علي",
    branchId: "branch-a",
    date: "2026-06-25",
    checkIn: "2026-06-25T09:45:00.000Z",
    checkOut: "2026-06-25T17:00:00.000Z",
    checkInSource: "biometric",
    checkOutSource: "biometric",
    hoursWorked: 7.25,
    regularHours: 7.25,
    overtimeHours: 0,
    status: "late",
    lateMinutes: 45,
    earlyDepartureMinutes: 0,
    createdAt: "2026-06-25T09:45:00.000Z",
    updatedAt: "2026-06-25T17:00:00.000Z"
  },
  {
    id: "att-3",
    employeeId: "staff-3",
    employeeCode: "EMP-003",
    employeeName: "محمود جمال",
    branchId: "branch-a",
    date: "2026-06-25",
    checkIn: "2026-06-25T08:58:00.000Z",
    checkOut: "2026-06-25T17:30:00.000Z",
    checkInSource: "biometric",
    checkOutSource: "biometric",
    hoursWorked: 8.53,
    regularHours: 8,
    overtimeHours: 0.53,
    status: "present",
    lateMinutes: 0,
    earlyDepartureMinutes: 0,
    createdAt: "2026-06-25T08:58:00.000Z",
    updatedAt: "2026-06-25T17:30:00.000Z"
  },
  {
    id: "att-4",
    employeeId: "staff-4",
    employeeCode: "EMP-004",
    employeeName: "طارق سعيد",
    branchId: "branch-a",
    date: "2026-06-25",
    checkIn: "2026-06-25T09:00:00.000Z",
    checkOut: "2026-06-25T18:15:00.000Z",
    checkInSource: "biometric",
    checkOutSource: "biometric",
    hoursWorked: 9.25,
    regularHours: 8,
    overtimeHours: 1.25,
    status: "present",
    lateMinutes: 0,
    earlyDepartureMinutes: 0,
    createdAt: "2026-06-25T09:00:00.000Z",
    updatedAt: "2026-06-25T18:15:00.000Z"
  }
];

const DEFAULT_BIOMETRIC_DEVICES = [
  {
    id: "dev-1",
    name: "Main Entrance - Branch A",
    branchId: "branch-a",
    ipAddress: "192.168.1.100",
    port: 4370,
    deviceSecret: "zkteco-secret-key-1",
    syncMethod: "both",
    lastSyncAt: "2026-06-25T18:30:00.000Z",
    status: "online",
    createdAt: "2026-06-24T12:00:00.000Z"
  },
  {
    id: "dev-2",
    name: "Kitchen - Branch A",
    branchId: "branch-a",
    ipAddress: "192.168.1.101",
    port: 4370,
    deviceSecret: "zkteco-secret-key-2",
    syncMethod: "push",
    lastSyncAt: "2026-06-25T18:30:00.000Z",
    status: "online",
    createdAt: "2026-06-24T12:00:00.000Z"
  }
];

const DEFAULT_SCHEDULES = [
  {
    id: "sch-1",
    employeeId: "staff-1",
    branchId: "branch-a",
    weekStartDate: "2026-06-22",
    days: {
      monday: { isWorkDay: true, shiftStart: "09:00", shiftEnd: "17:00", contractedHours: 8, breakMinutes: 60, location: "branch-a" },
      tuesday: { isWorkDay: true, shiftStart: "09:00", shiftEnd: "17:00", contractedHours: 8, breakMinutes: 60, location: "branch-a" },
      wednesday: { isWorkDay: true, shiftStart: "09:00", shiftEnd: "17:00", contractedHours: 8, breakMinutes: 60, location: "branch-a" },
      thursday: { isWorkDay: true, shiftStart: "09:00", shiftEnd: "17:00", contractedHours: 8, breakMinutes: 60, location: "branch-a" },
      friday: { isWorkDay: true, shiftStart: "09:00", shiftEnd: "17:00", contractedHours: 8, breakMinutes: 60, location: "branch-a" },
      saturday: { isWorkDay: false, shiftStart: "09:00", shiftEnd: "17:00", contractedHours: 0, breakMinutes: 0, location: "branch-a" },
      sunday: { isWorkDay: false, shiftStart: "09:00", shiftEnd: "17:00", contractedHours: 0, breakMinutes: 0, location: "branch-a" }
    },
    createdBy: "system",
    createdAt: "2026-06-20T12:00:00.000Z"
  },
  {
    id: "sch-2",
    employeeId: "staff-2",
    branchId: "branch-a",
    weekStartDate: "2026-06-22",
    days: {
      monday: { isWorkDay: true, shiftStart: "09:00", shiftEnd: "17:00", contractedHours: 8, breakMinutes: 60, location: "branch-a" },
      tuesday: { isWorkDay: true, shiftStart: "09:00", shiftEnd: "17:00", contractedHours: 8, breakMinutes: 60, location: "branch-a" },
      wednesday: { isWorkDay: true, shiftStart: "09:00", shiftEnd: "17:00", contractedHours: 8, breakMinutes: 60, location: "branch-a" },
      thursday: { isWorkDay: true, shiftStart: "09:00", shiftEnd: "17:00", contractedHours: 8, breakMinutes: 60, location: "branch-a" },
      friday: { isWorkDay: true, shiftStart: "09:00", shiftEnd: "17:00", contractedHours: 8, breakMinutes: 60, location: "branch-a" },
      saturday: { isWorkDay: false, shiftStart: "09:00", shiftEnd: "17:00", contractedHours: 0, breakMinutes: 0, location: "branch-a" },
      sunday: { isWorkDay: false, shiftStart: "09:00", shiftEnd: "17:00", contractedHours: 0, breakMinutes: 0, location: "branch-a" }
    },
    createdBy: "system",
    createdAt: "2026-06-20T12:00:00.000Z"
  }
];

const DEFAULT_LEAVE_REQUESTS = [
  {
    id: "leave-1",
    employeeId: "staff-2",
    employeeName: "سارة علي",
    branchId: "branch-a",
    leaveType: "sick",
    startDate: "2026-06-29",
    endDate: "2026-06-30",
    totalDays: 2,
    reason: "إجازة مرضية لظروف صحية طارئة ومرفق شهادة طبية",
    status: "pending",
    createdAt: "2026-06-25T15:00:00.000Z"
  }
];

let staffUsers = readJSON(STAFF_USERS_FILE, DEFAULT_STAFF_USERS);
if (!Array.isArray(staffUsers)) staffUsers = DEFAULT_STAFF_USERS;

function isAuthorizedManagerPin(pin: string | undefined | null): boolean {
  if (!pin) return false;
  const staff = readJSON(STAFF_USERS_FILE, DEFAULT_STAFF_USERS);
  const found = staff.find((s: any) => s.pin === pin && s.status === "active" && (s.role === "manager" || s.role === "owner" || s.role === "admin" || s.role === "org_admin" || s.role === "super_admin"));
  return !!found;
}

let attendanceLogs = readJSON(ATTENDANCE_LOGS_FILE, DEFAULT_ATTENDANCE_LOGS);
if (!Array.isArray(attendanceLogs)) attendanceLogs = DEFAULT_ATTENDANCE_LOGS;

let staffSchedules = readJSON(STAFF_SCHEDULES_FILE, DEFAULT_SCHEDULES);
if (!Array.isArray(staffSchedules)) staffSchedules = DEFAULT_SCHEDULES;

let leaveRequests = readJSON(LEAVE_REQUESTS_FILE, DEFAULT_LEAVE_REQUESTS);
if (!Array.isArray(leaveRequests)) leaveRequests = DEFAULT_LEAVE_REQUESTS;

let payrollRuns = readJSON(PAYROLL_RUNS_FILE, []);
if (!Array.isArray(payrollRuns)) payrollRuns = [];

let biometricDevices = readJSON(BIOMETRIC_DEVICES_FILE, DEFAULT_BIOMETRIC_DEVICES);
if (!Array.isArray(biometricDevices)) biometricDevices = DEFAULT_BIOMETRIC_DEVICES;

// Save initial setups
if (!fs.existsSync(MODIFIERS_FILE)) writeJSON(MODIFIERS_FILE, modifiers);
if (!fs.existsSync(MENU_FILE)) writeJSON(MENU_FILE, menu);
if (!fs.existsSync(TABLES_FILE)) writeJSON(TABLES_FILE, tables);
if (!fs.existsSync(ORDERS_FILE)) writeJSON(ORDERS_FILE, orders);
if (!fs.existsSync(PROMOTIONS_FILE)) writeJSON(PROMOTIONS_FILE, promotions);
if (!fs.existsSync(AUDITS_FILE)) writeJSON(AUDITS_FILE, audits);
if (!fs.existsSync(RECONCILIATION_FILE)) writeJSON(RECONCILIATION_FILE, reconciliation);
if (!fs.existsSync(INGREDIENTS_FILE)) writeJSON(INGREDIENTS_FILE, ingredients);
if (!fs.existsSync(RECIPES_FILE)) writeJSON(RECIPES_FILE, recipes);
if (!fs.existsSync(SHIFTS_FILE)) writeJSON(SHIFTS_FILE, shifts);
if (!fs.existsSync(AGGREGATOR_LOGS_FILE)) writeJSON(AGGREGATOR_LOGS_FILE, aggregatorLogs);
if (!fs.existsSync(AGGREGATOR_SETTINGS_FILE)) writeJSON(AGGREGATOR_SETTINGS_FILE, aggregatorSettings);
if (!fs.existsSync(WASTE_LOGS_FILE)) writeJSON(WASTE_LOGS_FILE, wasteLogs);
if (!fs.existsSync(STAFF_USERS_FILE)) writeJSON(STAFF_USERS_FILE, staffUsers);
if (!fs.existsSync(ATTENDANCE_LOGS_FILE)) writeJSON(ATTENDANCE_LOGS_FILE, attendanceLogs);
if (!fs.existsSync(STAFF_SCHEDULES_FILE)) writeJSON(STAFF_SCHEDULES_FILE, staffSchedules);
if (!fs.existsSync(LEAVE_REQUESTS_FILE)) writeJSON(LEAVE_REQUESTS_FILE, leaveRequests);
if (!fs.existsSync(PAYROLL_RUNS_FILE)) writeJSON(PAYROLL_RUNS_FILE, payrollRuns);
if (!fs.existsSync(BIOMETRIC_DEVICES_FILE)) writeJSON(BIOMETRIC_DEVICES_FILE, biometricDevices);

/* ==================== API ENDPOINTS ==================== */

// --- SaaS Plans configuration ---
const PLANS: Record<string, any> = {
  starter: {
    name: "Starter",
    nameAr: "المبتدئ",
    revenueSharePercent: 1.0,
    maxBranches: 1,
    maxUsers: 5,
    maxMenuItems: 50,
    features: ["pos_basic", "kds", "menu_management", "basic_reports", "shift_management"]
  },
  growth: {
    name: "Growth",
    nameAr: "النمو",
    revenueSharePercent: 1.5,
    maxBranches: 3,
    maxUsers: 20,
    maxMenuItems: 200,
    features: ["pos_basic", "kds", "menu_management", "basic_reports", "shift_management", "delivery_management", "guest_portal", "cost_control", "inventory", "multi_branch"]
  },
  professional: {
    name: "Professional",
    nameAr: "الاحترافي",
    revenueSharePercent: 2.0,
    maxBranches: 10,
    maxUsers: 100,
    maxMenuItems: 500,
    features: ["pos_basic", "kds", "menu_management", "basic_reports", "shift_management", "delivery_management", "guest_portal", "cost_control", "inventory", "multi_branch", "hr_payroll", "crm_loyalty", "aggregator_integration", "advanced_reports"]
  },
  enterprise: {
    name: "Enterprise",
    nameAr: "المؤسسي",
    revenueSharePercent: 2.5,
    maxBranches: 999,
    maxUsers: 999,
    maxMenuItems: 9999,
    features: ["pos_basic", "kds", "menu_management", "basic_reports", "shift_management", "delivery_management", "guest_portal", "cost_control", "inventory", "multi_branch", "hr_payroll", "crm_loyalty", "aggregator_integration", "advanced_reports", "white_label", "api_access", "dedicated_support", "custom_integrations"]
  }
};

// --- Multi-Tenant Files & Lists Initialization ---
const ORGANIZATIONS_FILE = path.join(DATA_DIR, "organizations.json");
const REVENUE_SHARE_ENTRIES_FILE = path.join(DATA_DIR, "revenue_share_entries.json");
const REVENUE_SHARE_INVOICES_FILE = path.join(DATA_DIR, "revenue_share_invoices.json");
const FEATURE_REQUESTS_FILE = path.join(DATA_DIR, "feature_requests.json");

const DEFAULT_ORGANIZATIONS = [
  {
    id: "org-default",
    name: "سلسلة مطاعم النيل",
    legalName: "شركة النيل للأغذية والمشروبات ذ.م.م",
    logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&auto=format&fit=crop&q=60",
    primaryColor: "#4f46e5", // Indigo-600
    ownerEmail: "owner@eplfood.com",
    ownerPassword: "owner",
    ownerPhone: "01012345678",
    plan: "growth",
    revenueSharePercent: 1.5,
    customFeatures: [
      { key: "pos_basic", enabled: true },
      { key: "kds", enabled: true },
      { key: "menu_management", enabled: true },
      { key: "basic_reports", enabled: true },
      { key: "shift_management", enabled: true },
      { key: "delivery_management", enabled: true },
      { key: "guest_portal", enabled: true },
      { key: "cost_control", enabled: true },
      { key: "inventory", enabled: true },
      { key: "multi_branch", enabled: true }
    ],
    billingCycle: "monthly",
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: "active",
    totalRevenueShareOwed: 145000, // stored in piasters (1,450 EGP)
    totalRevenueSharePaid: 75000,
    status: "active",
    maxBranches: 3,
    maxUsers: 20,
    maxMenuItems: 200,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  },
  {
    id: "org-starter",
    name: "كافيه الأميرة",
    legalName: "كافيه الأميرة السياحي",
    logo: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=100&auto=format&fit=crop&q=60",
    primaryColor: "#ec4899", // Pink-500
    ownerEmail: "starter@eplfood.com",
    ownerPassword: "owner",
    ownerPhone: "01198765432",
    plan: "starter",
    revenueSharePercent: 1.0,
    customFeatures: [
      { key: "pos_basic", enabled: true },
      { key: "kds", enabled: true },
      { key: "menu_management", enabled: true },
      { key: "basic_reports", enabled: true },
      { key: "shift_management", enabled: true }
    ],
    billingCycle: "monthly",
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    paymentStatus: "active",
    totalRevenueShareOwed: 32000, // 320 EGP
    totalRevenueSharePaid: 0,
    status: "active",
    maxBranches: 1,
    maxUsers: 5,
    maxMenuItems: 50,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  }
];

let organizations = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
if (!Array.isArray(organizations) || organizations.length === 0) {
  organizations = DEFAULT_ORGANIZATIONS;
  writeJSON(ORGANIZATIONS_FILE, organizations);
}

let revenueShareEntries = readJSON(REVENUE_SHARE_ENTRIES_FILE, []);
if (!Array.isArray(revenueShareEntries)) revenueShareEntries = [];

let revenueShareInvoices = readJSON(REVENUE_SHARE_INVOICES_FILE, []);
if (!Array.isArray(revenueShareInvoices)) revenueShareInvoices = [];

let featureRequests = readJSON(FEATURE_REQUESTS_FILE, []);
if (!Array.isArray(featureRequests)) featureRequests = [];

// Dynamic Migration for existing records to ensure organizationId is present
const defaultOrgId = "org-default";
let migrationHappened = false;

function migrateList(list: any[]) {
  let changed = false;
  if (!Array.isArray(list)) return { migrated: list, changed: false };
  const migrated = list.map(item => {
    if (item && typeof item === "object" && !item.organizationId) {
      item.organizationId = defaultOrgId;
      changed = true;
    }
    return item;
  });
  return { migrated, changed };
}

const modifiersRes = migrateList(modifiers);
if (modifiersRes.changed) { modifiers = modifiersRes.migrated; writeJSON(MODIFIERS_FILE, modifiers); migrationHappened = true; }

const menuRes = migrateList(menu);
if (menuRes.changed) { menu = menuRes.migrated; writeJSON(MENU_FILE, menu); migrationHappened = true; }

const tablesRes = migrateList(tables);
if (tablesRes.changed) { tables = tablesRes.migrated; writeJSON(TABLES_FILE, tables); migrationHappened = true; }

const ordersRes = migrateList(orders);
if (ordersRes.changed) { orders = ordersRes.migrated; writeJSON(ORDERS_FILE, orders); migrationHappened = true; }

const promotionsRes = migrateList(promotions);
if (promotionsRes.changed) { promotions = promotionsRes.migrated; writeJSON(PROMOTIONS_FILE, promotions); migrationHappened = true; }

const auditsRes = migrateList(audits);
if (auditsRes.changed) { audits = auditsRes.migrated; writeJSON(AUDITS_FILE, audits); migrationHappened = true; }

const ingredientsRes = migrateList(ingredients);
if (ingredientsRes.changed) { ingredients = ingredientsRes.migrated; writeJSON(INGREDIENTS_FILE, ingredients); migrationHappened = true; }

const recipesRes = migrateList(recipes);
if (recipesRes.changed) { recipes = recipesRes.migrated; writeJSON(RECIPES_FILE, recipes); migrationHappened = true; }

const shiftsRes = migrateList(shifts);
if (shiftsRes.changed) { shifts = shiftsRes.migrated; writeJSON(SHIFTS_FILE, shifts); migrationHappened = true; }

const wasteLogsRes = migrateList(wasteLogs);
if (wasteLogsRes.changed) { wasteLogs = wasteLogsRes.migrated; writeJSON(WASTE_LOGS_FILE, wasteLogs); migrationHappened = true; }

const staffUsersRes = migrateList(staffUsers);
if (staffUsersRes.changed) { staffUsers = staffUsersRes.migrated; writeJSON(STAFF_USERS_FILE, staffUsers); migrationHappened = true; }

const attendanceLogsRes = migrateList(attendanceLogs);
if (attendanceLogsRes.changed) { attendanceLogs = attendanceLogsRes.migrated; writeJSON(ATTENDANCE_LOGS_FILE, attendanceLogs); migrationHappened = true; }

const staffSchedulesRes = migrateList(staffSchedules);
if (staffSchedulesRes.changed) { staffSchedules = staffSchedulesRes.migrated; writeJSON(STAFF_SCHEDULES_FILE, staffSchedules); migrationHappened = true; }

const leaveRequestsRes = migrateList(leaveRequests);
if (leaveRequestsRes.changed) { leaveRequests = leaveRequestsRes.migrated; writeJSON(LEAVE_REQUESTS_FILE, leaveRequests); migrationHappened = true; }

const payrollRunsRes = migrateList(payrollRuns);
if (payrollRunsRes.changed) { payrollRuns = payrollRunsRes.migrated; writeJSON(PAYROLL_RUNS_FILE, payrollRuns); migrationHappened = true; }

const biometricDevicesRes = migrateList(biometricDevices);
if (biometricDevicesRes.changed) { biometricDevices = biometricDevicesRes.migrated; writeJSON(BIOMETRIC_DEVICES_FILE, biometricDevices); migrationHappened = true; }

if (migrationHappened) {
  console.log("[Restaurant SaaS] Successfully migrated legacy single-tenant data to multi-tenant structure!");
}

// --- Session & Cookie helper functions ---
function getCookie(req: any, name: string) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";");
  for (let c of cookies) {
    const [k, v] = c.trim().split("=");
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}

function getContext(req: any) {
  let orgId = "org-default";
  let branchId = undefined;
  let role = undefined;
  
  // Try to parse active session from header or cookie
  let sessionStr = req.headers["x-eplfood-session"];
  if (!sessionStr) {
    sessionStr = getCookie(req, "eplfood_session");
  }
  
  if (sessionStr) {
    try {
      const claims = JSON.parse(sessionStr);
      orgId = claims.organizationId || "org-default";
      branchId = claims.branchId || undefined;
      role = claims.role;
    } catch (e) {}
  } else {
    // Guest or public access resolved via custom domain or query param
    const host = req.headers.host || req.hostname || "";
    const organizationsList = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
    const matchingOrg = organizationsList.find((o: any) => o.customDomain === host);
    if (matchingOrg) {
      orgId = matchingOrg.id;
    } else {
      orgId = req.query.orgId || req.headers["x-organization-id"] || "org-default";
    }
  }
  
  return { orgId, branchId, role };
}

// Helper to check features
function checkFeatureEnabled(orgId: string, featureKey: string): boolean {
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const org = orgs.find((o: any) => o.id === orgId);
  if (!org) return false;
  if (org.status === "suspended") return false;
  const f = org.customFeatures.find((flag: any) => flag.key === featureKey);
  return !!f?.enabled;
}

// --- Middlewares ---

const verifyAuth = (req: any, res: any, next: any) => {
  const { orgId, role } = getContext(req);
  if (!role) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "يرجى تسجيل الدخول أولاً" });
  }
  req.user = { organizationId: orgId, role };
  next();
};

const requireFeature = (featureKey: string) => {
  return (req: any, res: any, next: any) => {
    const { orgId } = getContext(req);
    const enabled = checkFeatureEnabled(orgId, featureKey);
    if (!enabled) {
      return res.status(403).json({
        error: "FEATURE_NOT_ENABLED",
        message: "هذه الميزة غير متاحة في خطتك الحالية",
        feature: featureKey,
        upgradeUrl: "/upgrade"
      });
    }
    next();
  };
};

const requireSuperAdmin = (req: any, res: any, next: any) => {
  const { role } = getContext(req);
  if (role !== "super_admin") {
    return res.status(403).json({ error: "FORBIDDEN", message: "هذه العملية تتطلب صلاحيات مالك المنصة" });
  }
  next();
};

// --- Multi-Tenant Dynamic Interception Middleware ---
app.use((req: any, res: any, next: any) => {
  const { orgId, branchId, role } = getContext(req);
  req.tenantContext = { orgId, branchId, role };

  // Automatically inject organizationId into POST requests
  if (req.body && typeof req.body === "object" && req.method === "POST" && !req.body.organizationId) {
    req.body.organizationId = orgId;
    if (branchId && !req.body.branchId) {
      req.body.branchId = branchId;
    }
  }

  // Intercept json responses to filter array responses
  const originalJson = res.json;
  res.json = function (data: any) {
    if (data && !req.path.startsWith("/platform") && !req.path.startsWith("/api/auth")) {
      if (Array.isArray(data)) {
        data = data.filter((item: any) => {
          if (item && typeof item === "object") {
            const matchesOrg = !item.organizationId || item.organizationId === orgId;
            const matchesBranch = !branchId || !item.branchId || item.branchId === branchId || role === "org_admin" || role === "super_admin";
            return matchesOrg && matchesBranch;
          }
          return true;
        });
      } else if (typeof data === "object") {
        if (data.organizationId && data.organizationId !== orgId) {
          return res.status(403).json({ error: "FORBIDDEN", message: "ليس لديك صلاحية للوصول إلى هذه البيانات" });
        }
      }
    }
    return originalJson.call(this, data);
  };

  next();
});

// --- Authentication Endpoints ---

app.post("/api/auth/login", (req, res) => {
  const { email, password, pin, role } = req.body;
  
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "superadmin@eplfood.com";
  const superAdminPassword = process.env.SUPER_ADMIN_INITIAL_PASSWORD || "admin";

  const locale = (req as any).locale || "ar";

  // 1. Super Admin login
  if (email === superAdminEmail && password === superAdminPassword) {
    const claims = {
      role: "super_admin",
      organizationId: "",
      branchId: "",
      features: Object.keys(PLANS.enterprise.features)
    };
    res.setHeader("Set-Cookie", `eplfood_session=${encodeURIComponent(JSON.stringify(claims))}; Path=/; HttpOnly; SameSite=None; Secure`);
    return res.json({ success: true, user: claims });
  }

  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);

  // 2. Tenant Owner login
  if (email && password) {
    const org = orgs.find((o: any) => o.ownerEmail === email && (o.ownerPassword || "owner") === password);
    if (!org) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS", message: SERVER_MESSAGES[locale].invalidCredentials });
    }
    if (org.status === "suspended") {
      return res.status(403).json({ 
        error: "SUSPENDED", 
        message: locale === "ar" 
          ? `تم إيقاف حسابك مؤقتاً: ${org.suspendedReason || "مراجعة الدعم"}` 
          : `Your account has been temporarily suspended: ${org.suspendedReason || "contact support"}`
      });
    }
    const claims = {
      role: "org_admin",
      organizationId: org.id,
      branchId: "",
      features: org.customFeatures.filter((f: any) => f.enabled).map((f: any) => f.key)
    };
    res.setHeader("Set-Cookie", `eplfood_session=${encodeURIComponent(JSON.stringify(claims))}; Path=/; HttpOnly; SameSite=None; Secure`);
    return res.json({ success: true, user: claims, org });
  }

  // 3. Staff PIN login
  if (pin) {
    const staff = readJSON(STAFF_USERS_FILE, DEFAULT_STAFF_USERS);
    const user = staff.find((s: any) => s.pin === pin);
    if (!user) {
      return res.status(401).json({ error: "INVALID_PIN", message: SERVER_MESSAGES[locale].invalidPin });
    }
    const org = orgs.find((o: any) => o.id === user.organizationId);
    if (org && org.status === "suspended") {
      return res.status(403).json({ error: "SUSPENDED", message: SERVER_MESSAGES[locale].restaurantSuspended });
    }
    const claims = {
      role: user.role,
      organizationId: user.organizationId,
      branchId: user.branchId,
      features: org ? org.customFeatures.filter((f: any) => f.enabled).map((f: any) => f.key) : []
    };
    res.setHeader("Set-Cookie", `eplfood_session=${encodeURIComponent(JSON.stringify(claims))}; Path=/; HttpOnly; SameSite=None; Secure`);
    return res.json({ success: true, user: claims, staffName: user.name });
  }

  return res.status(400).json({ error: "BAD_REQUEST", message: SERVER_MESSAGES[locale].incompleteCredentials });
});

app.post("/api/auth/logout", (req, res) => {
  res.setHeader("Set-Cookie", "eplfood_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly");
  res.json({ success: true });
});

app.get("/api/auth/me", (req, res) => {
  const { orgId, branchId, role } = getContext(req);
  if (!role) {
    return res.json({ user: null });
  }
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const org = orgs.find((o: any) => o.id === orgId);
  res.json({
    user: {
      role,
      organizationId: orgId,
      branchId,
      features: org ? org.customFeatures.filter((f: any) => f.enabled).map((f: any) => f.key) : []
    },
    org: org || null
  });
});

app.get("/api/auth/tenant-config", (req, res) => {
  const { orgId } = getContext(req);
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const org = orgs.find((o: any) => o.id === orgId);
  if (!org) {
    return res.status(404).json({ error: "TENANT_NOT_FOUND" });
  }
  res.json({
    id: org.id,
    name: org.name,
    logo: org.logo,
    primaryColor: org.primaryColor,
    plan: org.plan,
    status: org.status
  });
});

// --- Feature requests Endpoints ---

app.post("/api/tenant/feature-request", verifyAuth, (req, res) => {
  const { orgId } = getContext(req);
  const { featureKey } = req.body;
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const org = orgs.find((o: any) => o.id === orgId);
  if (!org) return res.status(404).json({ error: "Organization not found" });

  const newReq = {
    id: `freq-${Date.now()}`,
    organizationId: orgId,
    organizationName: org.name,
    featureKey,
    requestedAt: new Date().toISOString(),
    status: "pending"
  };

  featureRequests.unshift(newReq);
  writeJSON(FEATURE_REQUESTS_FILE, featureRequests);
  res.json(newReq);
});

// --- Platform Owner (Super Admin) Endpoints ---

app.get("/platform/organizations", requireSuperAdmin, (req, res) => {
  try {
    const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
    // Attach sales stats
    const allOrders = readJSON(ORDERS_FILE, []);
    const withStats = orgs.map((org: any) => {
      const orgOrders = allOrders.filter((o: any) => o.organizationId === org.id && o.status === "paid");
      const totalSales = orgOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
      return {
        ...org,
        totalSales,
        orderCount: orgOrders.length
      };
    });
    res.json(withStats);
  } catch (err: any) {
    console.error("Error in GET /platform/organizations:", err);
    res.status(500).json({ error: err.message || "Failed to load organizations" });
  }
});

app.post("/platform/organizations", requireSuperAdmin, async (req, res) => {
  try {
    const { name, legalName, ownerEmail, ownerPassword, ownerPhone, plan, logo, primaryColor, revenueSharePercent, maxBranches } = req.body;
    if (!name || !ownerEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const selectedPlan = PLANS[plan || "growth"] || PLANS.growth;
    const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);

    if (orgs.some((o: any) => o.ownerEmail === ownerEmail)) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const newOrg = {
      id: `org-${Date.now()}`,
      name,
      legalName: legalName || name,
      logo: logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&auto=format&fit=crop&q=60",
      primaryColor: primaryColor || "#4f46e5",
      ownerEmail,
      ownerPassword: ownerPassword || "owner",
      ownerPhone: ownerPhone || "",
      plan: plan || "growth",
      revenueSharePercent: revenueSharePercent !== undefined ? parseFloat(revenueSharePercent) : selectedPlan.revenueSharePercent,
      customFeatures: selectedPlan.features.map((f: string) => ({ key: f, enabled: true })),
      billingCycle: "monthly",
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      paymentStatus: "active",
      totalRevenueShareOwed: 0,
      totalRevenueSharePaid: 0,
      status: "active",
      maxBranches: maxBranches || selectedPlan.maxBranches,
      maxUsers: selectedPlan.maxUsers,
      maxMenuItems: selectedPlan.maxMenuItems,
      createdBy: "super_admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    orgs.push(newOrg);
    writeJSON(ORGANIZATIONS_FILE, orgs);

    // Write tenant and owner user to relational database (PostgreSQL) using Drizzle in the background (non-blocking)
    (async () => {
      try {
        const featureFlags: Record<string, boolean> = {};
        newOrg.customFeatures.forEach((f: any) => {
          featureFlags[f.key] = !!f.enabled;
        });

        await db.insert(tenants).values({
          tenantId: newOrg.id,
          legalName: newOrg.legalName,
          brandName: newOrg.name,
          subscriptionPlan: newOrg.plan,
          subscriptionStatus: newOrg.status,
          billingEmail: newOrg.ownerEmail,
          defaultCurrency: "EGP",
          defaultTimezone: "Africa/Cairo",
          defaultLocale: "ar-EG",
          supportedLocales: ["ar-EG", "en-US"],
          featureFlags: featureFlags,
          createdAt: new Date(newOrg.createdAt),
          metadata: {
            logo: newOrg.logo,
            primaryColor: newOrg.primaryColor,
            ownerPhone: newOrg.ownerPhone,
            ownerPassword: newOrg.ownerPassword,
            revenueSharePercent: newOrg.revenueSharePercent,
            maxBranches: newOrg.maxBranches,
            maxUsers: newOrg.maxUsers,
            maxMenuItems: newOrg.maxMenuItems,
          },
        });

        const names = (newOrg.name || "Owner").split(" ");
        const firstName = names[0];
        const lastName = names.slice(1).join(" ") || "Owner";

        await db.insert(staffUsersTable).values({
          uid: `staff-${Date.now()}`,
          tenantId: newOrg.id,
          branchId: null,
          allBranchIds: [],
          role: "owner",
          displayName: `${newOrg.name} Owner`,
          firstName: firstName,
          lastName: lastName,
          phone: newOrg.ownerPhone,
          email: newOrg.ownerEmail,
          pin: "1234",
          isActive: true,
          hireDate: new Date(),
          hourlyRate: 0,
          weeklyHourTarget: 40,
          emergencyContact: { name: "Emergency", phone: newOrg.ownerPhone },
          photoUrl: null,
          customClaims: { role: "owner", tenantId: newOrg.id, branchId: null },
          createdAt: new Date(),
          createdBy: "super_admin",
          updatedAt: new Date(),
        });

        console.log(`[Database Sync] Successfully persisted organization ${newOrg.id} and its owner to PostgreSQL.`);
      } catch (dbErr: any) {
        console.error("[Database Sync] Failed to write new organization to SQL database:", dbErr);
      }
    })();

    res.status(201).json(newOrg);
  } catch (err: any) {
    console.error("Error in POST /platform/organizations:", err);
    res.status(500).json({ error: err.message || "Failed to create organization" });
  }
});

app.get("/platform/organizations/:id", requireSuperAdmin, (req, res) => {
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const org = orgs.find((o: any) => o.id === req.params.id);
  if (!org) return res.status(404).json({ error: "Organization not found" });
  res.json(org);
});

app.patch("/platform/organizations/:id", requireSuperAdmin, (req, res) => {
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const idx = orgs.findIndex((o: any) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Organization not found" });

  orgs[idx] = {
    ...orgs[idx],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  writeJSON(ORGANIZATIONS_FILE, orgs);
  res.json(orgs[idx]);
});

app.patch("/platform/organizations/:id/suspend", requireSuperAdmin, (req, res) => {
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const idx = orgs.findIndex((o: any) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Organization not found" });

  orgs[idx].status = "suspended";
  orgs[idx].suspendedReason = req.body.reason || "Billing delinquency";
  orgs[idx].suspendedAt = new Date().toISOString();
  orgs[idx].updatedAt = new Date().toISOString();

  writeJSON(ORGANIZATIONS_FILE, orgs);
  res.json(orgs[idx]);
});

app.patch("/platform/organizations/:id/unsuspend", requireSuperAdmin, (req, res) => {
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const idx = orgs.findIndex((o: any) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Organization not found" });

  orgs[idx].status = "active";
  orgs[idx].suspendedReason = undefined;
  orgs[idx].suspendedAt = undefined;
  orgs[idx].updatedAt = new Date().toISOString();

  writeJSON(ORGANIZATIONS_FILE, orgs);
  res.json(orgs[idx]);
});

app.delete("/platform/organizations/:id", requireSuperAdmin, (req, res) => {
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const idx = orgs.findIndex((o: any) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Organization not found" });

  orgs[idx].status = "cancelled";
  orgs[idx].updatedAt = new Date().toISOString();

  writeJSON(ORGANIZATIONS_FILE, orgs);
  res.json({ success: true, message: "Organization soft-deleted" });
});

app.patch("/platform/organizations/:id/features", requireSuperAdmin, (req, res) => {
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const idx = orgs.findIndex((o: any) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Organization not found" });

  const { featureKey, enabled } = req.body;
  const fIdx = orgs[idx].customFeatures.findIndex((f: any) => f.key === featureKey);
  if (fIdx !== -1) {
    orgs[idx].customFeatures[fIdx].enabled = !!enabled;
    orgs[idx].customFeatures[fIdx].enabledAt = new Date().toISOString();
  } else {
    orgs[idx].customFeatures.push({
      key: featureKey,
      enabled: !!enabled,
      enabledAt: new Date().toISOString()
    });
  }

  orgs[idx].updatedAt = new Date().toISOString();
  writeJSON(ORGANIZATIONS_FILE, orgs);
  res.json(orgs[idx]);
});

app.get("/platform/feature-requests", requireSuperAdmin, (req, res) => {
  res.json(featureRequests);
});

app.post("/platform/feature-requests/:id/approve", requireSuperAdmin, (req, res) => {
  const fReqIdx = featureRequests.findIndex((r: any) => r.id === req.params.id);
  if (fReqIdx === -1) return res.status(404).json({ error: "Request not found" });

  featureRequests[fReqIdx].status = "approved";
  writeJSON(FEATURE_REQUESTS_FILE, featureRequests);

  // Toggle on the feature
  const { organizationId, featureKey } = featureRequests[fReqIdx];
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const idx = orgs.findIndex((o: any) => o.id === organizationId);
  if (idx !== -1) {
    // Increase revenue share percent slightly as add-on fee
    const addOnMap: Record<string, number> = {
      hr_payroll: 0.5,
      crm_loyalty: 0.3,
      aggregator_integration: 0.5,
      white_label: 1.0
    };
    const increment = addOnMap[featureKey] || 0;
    orgs[idx].revenueSharePercent = parseFloat((orgs[idx].revenueSharePercent + increment).toFixed(2));

    const fIdx = orgs[idx].customFeatures.findIndex((f: any) => f.key === featureKey);
    if (fIdx !== -1) {
      orgs[idx].customFeatures[fIdx].enabled = true;
    } else {
      orgs[idx].customFeatures.push({ key: featureKey, enabled: true, enabledAt: new Date().toISOString() });
    }
    orgs[idx].updatedAt = new Date().toISOString();
    writeJSON(ORGANIZATIONS_FILE, orgs);
  }

  res.json({ success: true, request: featureRequests[fReqIdx] });
});

app.post("/platform/feature-requests/:id/reject", requireSuperAdmin, (req, res) => {
  const fReqIdx = featureRequests.findIndex((r: any) => r.id === req.params.id);
  if (fReqIdx === -1) return res.status(404).json({ error: "Request not found" });

  featureRequests[fReqIdx].status = "rejected";
  writeJSON(FEATURE_REQUESTS_FILE, featureRequests);
  res.json({ success: true, request: featureRequests[fReqIdx] });
});

// --- Billing and Earnings API ---

app.get("/platform/revenue", requireSuperAdmin, (req, res) => {
  const { period, orgId } = req.query;
  let filtered = readJSON(REVENUE_SHARE_ENTRIES_FILE, []);
  if (period) filtered = filtered.filter((e: any) => e.period === period);
  if (orgId) filtered = filtered.filter((e: any) => e.organizationId === orgId);
  res.json(filtered);
});

app.get("/platform/revenue/invoices", requireSuperAdmin, (req, res) => {
  const invoices = readJSON(REVENUE_SHARE_INVOICES_FILE, []);
  res.json(invoices);
});

app.post("/platform/revenue/invoices/generate", requireSuperAdmin, (req, res) => {
  const { period } = req.body;
  if (!period) return res.status(400).json({ error: "Missing period YYYY-MM" });

  const entries = readJSON(REVENUE_SHARE_ENTRIES_FILE, []);
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const invoices = readJSON(REVENUE_SHARE_INVOICES_FILE, []);

  const periodEntries = entries.filter((e: any) => e.period === period && e.status === "pending");
  if (periodEntries.length === 0) {
    return res.json({ message: "No pending entries to invoice for this period." });
  }

  // Group entries by organization
  const grouped: Record<string, any[]> = {};
  for (const e of periodEntries) {
    if (!grouped[e.organizationId]) grouped[e.organizationId] = [];
    grouped[e.organizationId].push(e);
  }

  const generatedCount = Object.keys(grouped).length;

  for (const oId of Object.keys(grouped)) {
    const org = orgs.find((o: any) => o.id === oId);
    if (!org) continue;

    const orgEntries = grouped[oId];
    const totalSales = orgEntries.reduce((sum, e) => sum + e.orderTotal, 0);
    const revenueShareDue = orgEntries.reduce((sum, e) => sum + e.revenueShareAmount, 0);

    const invoice = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      organizationId: oId,
      period,
      totalSales,
      revenueSharePercent: org.revenueSharePercent,
      revenueShareDue,
      orderCount: orgEntries.length,
      branchBreakdown: [
        {
          branchId: "branch-a",
          branchName: "الفرع الرئيسي",
          sales: totalSales,
          shareAmount: revenueShareDue
        }
      ],
      status: "sent",
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    invoices.unshift(invoice);

    // Update entries status
    orgEntries.forEach(e => {
      e.status = "invoiced";
    });
  }

  writeJSON(REVENUE_SHARE_ENTRIES_FILE, entries);
  writeJSON(REVENUE_SHARE_INVOICES_FILE, invoices);

  res.json({ success: true, message: `Generated ${generatedCount} invoices successfully!` });
});

app.patch("/platform/revenue/invoices/:id/mark-paid", requireSuperAdmin, (req, res) => {
  const invoices = readJSON(REVENUE_SHARE_INVOICES_FILE, []);
  const idx = invoices.findIndex((i: any) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Invoice not found" });

  invoices[idx].status = "paid";
  invoices[idx].paidAt = new Date().toISOString();
  invoices[idx].paymentMethod = req.body.method || "bank_transfer";
  invoices[idx].paymentReference = req.body.reference || `REF-${Date.now()}`;

  // Update Org running totals
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const oIdx = orgs.findIndex((o: any) => o.id === invoices[idx].organizationId);
  if (oIdx !== -1) {
    orgs[oIdx].totalRevenueSharePaid += invoices[idx].revenueShareDue;
    orgs[oIdx].totalRevenueShareOwed = Math.max(0, orgs[oIdx].totalRevenueShareOwed - invoices[idx].revenueShareDue);
    writeJSON(ORGANIZATIONS_FILE, orgs);
  }

  writeJSON(REVENUE_SHARE_INVOICES_FILE, invoices);
  res.json(invoices[idx]);
});

app.get("/platform/revenue/my-earnings", requireSuperAdmin, (req, res) => {
  const invoices = readJSON(REVENUE_SHARE_INVOICES_FILE, []);
  const paidInvoices = invoices.filter((i: any) => i.status === "paid");
  
  const totalEarned = paidInvoices.reduce((sum: number, i: any) => sum + i.revenueShareDue, 0);
  const totalPending = invoices.filter((i: any) => i.status !== "paid").reduce((sum: number, i: any) => sum + i.revenueShareDue, 0);

  res.json({
    totalEarned,
    totalPending,
    currencies: "EGP"
  });
});

app.post("/platform/organizations/:id/reset-password", requireSuperAdmin, (req, res) => {
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const idx = orgs.findIndex((o: any) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Organization not found" });

  orgs[idx].ownerPassword = req.body.password || "owner";
  writeJSON(ORGANIZATIONS_FILE, orgs);
  res.json({ success: true, message: "Password reset completed" });
});

app.get("/platform/analytics/overview", requireSuperAdmin, (req, res) => {
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS).filter((o: any) => o.status === "active");
  const allOrders = readJSON(ORDERS_FILE, []);
  const completedOrders = allOrders.filter((o: any) => o.status === "paid");
  const totalSales = completedOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  
  const invoices = readJSON(REVENUE_SHARE_INVOICES_FILE, []);
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthPaid = invoices.filter((i: any) => i.period === currentMonth && i.status === "paid").reduce((sum: number, i: any) => sum + i.revenueShareDue, 0);
  const totalOwed = orgs.reduce((sum: number, o: any) => sum + (o.totalRevenueShareOwed || 0), 0);

  res.json({
    activeRestaurantsCount: orgs.length,
    totalPlatformSales: totalSales,
    commissionsThisMonth: currentMonthPaid,
    totalUnpaidCommissions: totalOwed
  });
});

// Helper to record commission share on completed order
function processOrderCommission(order: any) {
  if (!order || (order.status !== "completed" && order.status !== "paid")) return;
  
  const orgs = readJSON(ORGANIZATIONS_FILE, DEFAULT_ORGANIZATIONS);
  const org = orgs.find((o: any) => o.id === order.organizationId);
  if (!org || org.status !== "active") return;

  const entries = readJSON(REVENUE_SHARE_ENTRIES_FILE, []);
  if (entries.some((e: any) => e.orderId === order.id)) return; // prevent duplicates

  const commissionPercent = org.revenueSharePercent || 1.5;
  const commissionAmount = Math.round((order.totalAmount * commissionPercent) / 100);

  const newEntry = {
    id: `reventry-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    organizationId: order.organizationId,
    branchId: order.branchId || "branch-a",
    orderId: order.id,
    orderTotal: order.totalAmount,
    revenueSharePercent: commissionPercent,
    revenueShareAmount: commissionAmount,
    period: new Date().toISOString().substring(0, 7), // "YYYY-MM"
    status: "pending",
    createdAt: new Date().toISOString()
  };

  entries.push(newEntry);
  writeJSON(REVENUE_SHARE_ENTRIES_FILE, entries);

  // Update Org totals
  org.totalRevenueShareOwed += commissionAmount;
  writeJSON(ORGANIZATIONS_FILE, orgs);
  console.log(`[Commission Engine] Processed ${commissionAmount} piasters for order ${order.id} under org ${order.organizationId}`);
}

// 1. Menu Endpoints
app.get("/api/menu", (req, res) => {
  const locale = (req as any).locale || "ar";
  const mapItem = (item: any) => ({
    ...item,
    name: translateField(item.name, locale),
    description: translateField(item.description, locale),
    category: locale === "ar" 
      ? (item.category === "Appetizers" ? "المقبلات" : item.category === "Mains" ? "الأطباق الرئيسية" : item.category) 
      : item.category
  });

  if (req.query.channel === "guest_portal") {
    const filteredMenu = menu.filter((item: any) => item.isAvailable !== false);
    return res.json(filteredMenu.map(mapItem));
  }
  res.json(menu.map(mapItem));
});

app.post("/api/menu", (req, res) => {
  const { name, description, price, category, image, modifierGroupIds, channelPricing } = req.body;
  
  if (!name || !price || !category) {
    return res.status(400).json({ error: "Missing required fields (name, price, category)" });
  }

  const newItem = {
    id: `dish-${Date.now()}`,
    name,
    description: description || "",
    price: parseFloat(price),
    category,
    image: image || "Other",
    isAvailable: true,
    modifierGroupIds: modifierGroupIds || [],
    channelPricing: channelPricing || {}
  };

  menu.push(newItem);
  writeJSON(MENU_FILE, menu);
  res.status(201).json(newItem);
});

app.put("/api/menu/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, image, isAvailable, modifierGroupIds, channelPricing } = req.body;

  const itemIdx = menu.findIndex((item: any) => item.id === id);
  if (itemIdx === -1) {
    return res.status(404).json({ error: "Menu item not found" });
  }

  const updatedItem = {
    ...menu[itemIdx],
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(price !== undefined && { price: parseFloat(price) }),
    ...(category !== undefined && { category }),
    ...(image !== undefined && { image }),
    ...(isAvailable !== undefined && { isAvailable: !!isAvailable }),
    ...(modifierGroupIds !== undefined && { modifierGroupIds }),
    ...(channelPricing !== undefined && { channelPricing })
  };

  menu[itemIdx] = updatedItem;
  writeJSON(MENU_FILE, menu);
  res.json(updatedItem);
});

app.delete("/api/menu/:id", (req, res) => {
  const { id } = req.params;
  const itemIdx = menu.findIndex((item: any) => item.id === id);
  
  if (itemIdx === -1) {
    return res.status(404).json({ error: "Item not found" });
  }

  const deleted = menu.splice(itemIdx, 1)[0];
  writeJSON(MENU_FILE, menu);
  res.json({ message: "Item deleted successfully", item: deleted });
});

// 2. Modifier Groups Endpoints
app.get("/api/modifiers", (req, res) => {
  res.json(modifiers);
});

// 3. Tables Endpoints
app.get("/api/tables", (req, res) => {
  res.json(tables);
});

app.put("/api/tables/:id", (req, res) => {
  const { id } = req.params;
  const { status, currentOrderId } = req.body;

  const tableIdx = tables.findIndex((t: any) => t.id === id);
  if (tableIdx === -1) {
    return res.status(404).json({ error: "Table not found" });
  }

  if (status !== undefined) tables[tableIdx].status = status;
  if (currentOrderId !== undefined) tables[tableIdx].currentOrderId = currentOrderId;

  writeJSON(TABLES_FILE, tables);
  res.json(tables[tableIdx]);
});

// 4. Orders Endpoints (UPGRADED)
app.get("/api/orders", (req, res) => {
  res.json(orders);
});

app.post("/api/orders", (req, res) => {
  const { 
    tableId, 
    fulfillmentType, 
    orderSource, 
    items, 
    payment, 
    delivery,
    branchId,
    registerId,
    shiftId
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Missing items list" });
  }

  const finalSource = orderSource || "pos";
  const bId = branchId || "main";
  const rId = registerId || "register_1";

  // Find active open shift for branch and register
  const activeShift = shifts.find((s: any) => s.branchId === bId && s.registerId === rId && s.status === "open");

  // Strict POS rule: POS / Cashier Terminal orders require an open shift
  if (finalSource === "pos" && !activeShift && !shiftId) {
    return res.status(400).json({ error: "No active shift open on this register. Please open a cashier shift first to receive POS payments." });
  }

  // Tag order with shift id
  const finalShiftId = shiftId || (activeShift ? activeShift.id : null);

  let matchedTable = null;
  if (tableId) {
    matchedTable = tables.find((t: any) => t.id === tableId);
  }

  const orderId = `ord-${Date.now()}`;
  
  // Dynamic Total Calculation including modifiers
  let subtotal = 0;
  const mappedItems = items.map((it: any) => {
    let itemModifiersPrice = 0;
    const itMods = it.modifiers || [];
    itMods.forEach((m: any) => {
      itemModifiersPrice += parseFloat(m.price || 0);
    });

    let itemBasePrice = parseFloat(it.price || 0);
    
    // Verify item price against master menu configuration (to prevent client-side price tampering)
    const menuItem = menu.find((m: any) => m.id === it.id);
    if (menuItem) {
      const originalPrice = parseFloat(menuItem.price || 0);
      if (Math.abs(itemBasePrice - originalPrice) > 0.01) {
        // Price discrepancy! Check for authorized manager override PIN
        if (isAuthorizedManagerPin(req.body.managerPin)) {
          const authMgr = staffUsers.find((s: any) => s.pin === req.body.managerPin && s.status === "active" && (s.role === "manager" || s.role === "owner" || s.role === "admin" || s.role === "org_admin"));
          const managerName = authMgr ? authMgr.name : "Authorized Manager";
          addAuditLog(
            "PRICE_OVERRIDE",
            `Manual price override for '${menuItem.name}' (ID: ${menuItem.id}) in order ${orderId} approved by manager ${managerName}. Changed from $${originalPrice.toFixed(2)} to $${itemBasePrice.toFixed(2)}`,
            req.body.reason || "Staff preference override",
            orderId,
            "manager"
          );
        } else {
          // Revert back to the secure system-of-record price
          itemBasePrice = originalPrice;
        }
      }
    }

    const itemTotalSingle = itemBasePrice + itemModifiersPrice;
    subtotal += (itemTotalSingle * parseInt(it.quantity || 1));

    return {
      id: it.id,
      name: it.name,
      price: itemBasePrice,
      quantity: parseInt(it.quantity || 1),
      notes: it.notes || "",
      course: it.course || "unassigned",
      fired: it.course === "appetizer" || it.fulfillmentType !== "dine_in", // Appetizers automatically fired
      modifiers: itMods
    };
  });

  const finalFulfillment = fulfillmentType || (tableId ? "dine_in" : "takeaway");

  // Fee additions
  const deliveryCost = finalFulfillment === "delivery" ? (delivery?.deliveryFee || 5.00) : 0;
  const surchargeCost = finalFulfillment === "dine_in" ? 1.50 : 0;
  const taxCost = Math.round((subtotal * 0.10) * 100) / 100;
  const finalTotal = subtotal + deliveryCost + surchargeCost + taxCost;

  // Enforce secure, server-calculated totals for the payment object to prevent client-submitted totals manipulation
  const paymentMethod = payment?.method || "cash";
  const tipAmount = parseFloat(payment?.tipAmount || 0);
  const discountAmount = parseFloat(payment?.discountAmount || 0);
  const serverPayment = {
    method: paymentMethod,
    subtotal,
    taxAmount: taxCost,
    surcharge: surchargeCost,
    discountAmount,
    totalPaid: Math.max(0, finalTotal - discountAmount) + tipAmount,
    tipAmount,
    splits: payment?.splits || null
  };

  const newOrder = {
    id: orderId,
    tableId: tableId || null,
    tableName: matchedTable ? matchedTable.name : null,
    fulfillmentType: finalFulfillment,
    orderSource: finalSource,
    items: mappedItems,
    status: "placed" as const,
    totalAmount: finalTotal,
    shiftId: finalShiftId,
    placedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customerName: req.body.customerName || null,
    customerPhone: req.body.customerPhone || null,
    ...(finalFulfillment === "delivery" && {
      delivery: {
        address: delivery?.address || "Dine-in Default",
        latitude: delivery?.latitude || 25.0,
        longitude: delivery?.longitude || 55.0,
        distanceKm: delivery?.distanceKm || 2.0,
        deliveryFee: deliveryCost,
        riderName: delivery?.riderName || "Pending Rider Dispatch",
        riderPhone: delivery?.riderPhone || "",
        region: delivery?.region || "",
        street: delivery?.street || "",
        lid: delivery?.lid || "",
        app: delivery?.app || "",
        floor: delivery?.floor || ""
      }
    }),
    payment: serverPayment
  };

  orders.push(newOrder);
  writeJSON(ORDERS_FILE, orders);

  if (matchedTable) {
    matchedTable.status = "occupied";
    matchedTable.currentOrderId = orderId;
    writeJSON(TABLES_FILE, tables);
  }

  res.status(201).json(newOrder);
});

app.put("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // placed, confirmed, preparing, ready_for_rider, rider_assigned, picked_up, delivered, completed, paid, voided

  const orderIdx = orders.findIndex((o: any) => o.id === id);
  if (orderIdx === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const currentOrder = orders[orderIdx];
  currentOrder.status = status;
  currentOrder.updatedAt = new Date().toISOString();

  if (req.body.delivery) {
    currentOrder.delivery = {
      ...(currentOrder.delivery || {}),
      ...req.body.delivery
    };
  } else if (req.body.riderName) {
    currentOrder.delivery = {
      ...(currentOrder.delivery || {}),
      riderName: req.body.riderName,
      riderPhone: req.body.riderPhone || ""
    };
  }

  // Audit timestamps on SLA transition points
  if (status === "confirmed") currentOrder.confirmedAt = new Date().toISOString();
  if (status === "preparing") currentOrder.confirmedAt = currentOrder.confirmedAt || new Date().toISOString();
  if (status === "ready_for_rider") currentOrder.preparedAt = new Date().toISOString();
  if (status === "picked_up") currentOrder.dispatchedAt = new Date().toISOString();
  if (status === "delivered") currentOrder.deliveredAt = new Date().toISOString();
  if (status === "completed" || status === "paid") {
    currentOrder.completedAt = new Date().toISOString();
    
    // Assign shift if not already assigned
    if (!currentOrder.shiftId) {
      const bId = req.body.branchId || "main";
      const rId = req.body.registerId || "register_1";
      const activeShift = shifts.find((s: any) => s.branchId === bId && s.registerId === rId && s.status === "open");
      if (activeShift) {
        currentOrder.shiftId = activeShift.id;
      }
    }

    if (currentOrder.tableId) {
      const table = tables.find((t: any) => t.id === currentOrder.tableId);
      if (table) {
        table.status = "dirty"; // POS standard: mark dirty for cleanup after guest leaves!
        table.currentOrderId = null;
        writeJSON(TABLES_FILE, tables);
      }
    }

    // Trigger Multi-Tenant Commission tracking
    try {
      processOrderCommission(currentOrder);
    } catch (err) {
      console.error("Error processing order commission: ", err);
    }
  }

  // Aggregator status sync
  if (currentOrder.orderSource && currentOrder.orderSource.startsWith("aggregator:")) {
    const platform = currentOrder.orderSource.split(":")[1];
    const adapter = platform === "talabat" ? talabatAdapter : (platform === "careem" ? careemAdapter : null);
    if (adapter) {
      const pushStatus = async (attemptsRemaining = 10, delay = 1000) => {
        try {
          // In a real API we would invoke the outbound request
          const resSync = await adapter.pushStatusUpdate(currentOrder.id, status);
          
          aggregatorLogs.unshift({
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toISOString(),
            platform,
            direction: "outbound",
            action: "order_status_sync",
            systemOrderId: currentOrder.id,
            rawPayload: resSync.payload,
            status: "success",
            message: `Pushed status '${status}' to ${platform} API. URL: ${resSync.url}`
          });
          writeJSON(AGGREGATOR_LOGS_FILE, aggregatorLogs);
        } catch (err: any) {
          if (attemptsRemaining > 1) {
            const nextDelay = Math.min(delay * 2, 5 * 60 * 1000);
            setTimeout(() => pushStatus(attemptsRemaining - 1, nextDelay), delay);
          } else {
            aggregatorLogs.unshift({
              id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              timestamp: new Date().toISOString(),
              platform,
              direction: "outbound",
              action: "order_status_sync",
              systemOrderId: currentOrder.id,
              rawPayload: { orderId: currentOrder.id, status },
              status: "error",
              message: `Status sync failed after 10 attempts (Dead-Letter Queue): ${err.message || "Timeout"}`
            });
            writeJSON(AGGREGATOR_LOGS_FILE, aggregatorLogs);
          }
        }
      };
      pushStatus();
    }
  }

  writeJSON(ORDERS_FILE, orders);
  res.json(currentOrder);
});

// Dine-in: Fire Course Endpoint
app.post("/api/orders/:id/fire-course", (req, res) => {
  const { id } = req.params;
  const { course } = req.body; // appetizer, main, dessert, drink

  const orderIdx = orders.findIndex((o: any) => o.id === id);
  if (orderIdx === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const ord = orders[orderIdx];
  ord.items.forEach((item: any) => {
    if (item.course === course) {
      item.fired = true;
    }
  });

  ord.updatedAt = new Date().toISOString();
  writeJSON(ORDERS_FILE, orders);
  res.json(ord);
});

// Dine-in: Split Bill Endpoint
app.post("/api/orders/:id/split", (req, res) => {
  const { id } = req.params;
  const { type, seatsCount, seatPayments } = req.body; // "even" or "seat"

  const orderIdx = orders.findIndex((o: any) => o.id === id);
  if (orderIdx === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const ord = orders[orderIdx];
  if (!ord.payment) {
    return res.status(400).json({ error: "No billing config found on order" });
  }

  if (type === "even") {
    const splitAmount = ord.totalAmount / (seatsCount || 2);
    const splits = Array.from({ length: seatsCount }).map((_, idx) => ({
      method: "card" as const,
      amount: splitAmount
    }));

    ord.payment.method = "split";
    ord.payment.splits = splits;
  } else if (type === "seat") {
    ord.payment.method = "split";
    ord.payment.splits = seatPayments.map((p: any) => ({
      method: p.method,
      amount: p.amount
    }));
  }

  ord.updatedAt = new Date().toISOString();
  writeJSON(ORDERS_FILE, orders);
  res.json(ord);
});

// Dine-in: Void / Comp Workflow with Manager override
app.post("/api/orders/:id/void", (req, res) => {
  try {
    const { id } = req.params;
    const { reason, managerPin, managerApproved } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "A clear void justification is required." });
    }

    // Strict backend security rule: order voids require an authorized manager PIN
    if (!isAuthorizedManagerPin(managerPin)) {
      return res.status(403).json({ error: "Action denied. Invalid or missing Manager PIN required to authorize order voids." });
    }

    const orderIdx = orders.findIndex((o: any) => o.id === id);
    if (orderIdx === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const authMgr = staffUsers.find((s: any) => s.pin === managerPin && s.status === "active" && (s.role === "manager" || s.role === "owner" || s.role === "admin" || s.role === "org_admin"));
    const actualManagerName = authMgr ? authMgr.name : "Authorized Manager";

    const ord = orders[orderIdx];
    ord.status = "voided";
    ord.voidReason = reason;
    ord.managerApproved = true;
    ord.updatedAt = new Date().toISOString();
    writeJSON(ORDERS_FILE, orders);

    // Clear Table
    if (ord.tableId) {
      const table = tables.find((t: any) => t.id === ord.tableId);
      if (table) {
        table.status = "empty";
        table.currentOrderId = null;
        writeJSON(TABLES_FILE, tables);
      }
    }

    // Log Audit trail
    const totalAmt = typeof ord.totalAmount === "number" ? ord.totalAmount : parseFloat(ord.totalAmount || 0);
    const newAudit = addAuditLog(
      "VOID_ORDER",
      `Order total of $${totalAmt.toFixed(2)} voided. Approved override by manager ${actualManagerName}`,
      reason,
      id,
      "manager"
    );

    return res.json({ order: ord, audit: newAudit });
  } catch (error: any) {
    console.error("Error in void order endpoint:", error);
    return res.status(500).json({ error: error?.message || "Internal server error during void operation." });
  }
});

// --- GUEST PORTAL PUBLIC ENDPOINTS ---

// Statically defined branches for the customer portal
const DEFAULT_BRANCHES = [
  {
    id: "branch-a",
    slug: "maadi-branch",
    name: "Maadi Branch",
    nameAr: "فرع المعادي",
    logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200",
    primaryColor: "#4f46e5",
    phone: "+201001234567",
    address: "9 Road 151, Maadi, Cairo",
    isOpen: true,
    estimatedWaitMinutes: 20,
    deliveryZones: [
      { id: "zone-maadi-1", name: "Sarayat El Maadi", nameAr: "سرايات المعادي", fee: 15, minOrder: 50 },
      { id: "zone-maadi-2", name: "Degla Maadi", nameAr: "دجلة المعادي", fee: 20, minOrder: 60 },
      { id: "zone-maadi-3", name: "Zahraa El Maadi", nameAr: "زهراء المعادي", fee: 25, minOrder: 70 }
    ],
    minOrderDelivery: 50,
    deliveryFeeBase: 15,
    registers: [
      { id: "register_1", name: "Register 1 (POS)", nameAr: "جهاز كاشير 1" },
      { id: "register_2", name: "Register 2 (POS)", nameAr: "جهاز كاشير 2" },
      { id: "register_3", name: "Register 3 (POS)", nameAr: "جهاز كاشير 3" }
    ]
  },
  {
    id: "branch-b",
    slug: "heliopolis-branch",
    name: "Heliopolis Branch",
    nameAr: "فرع مصر الجديدة",
    logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200",
    primaryColor: "#059669",
    phone: "+201009876543",
    address: "24 El-Ahram Street, Heliopolis, Cairo",
    isOpen: true,
    estimatedWaitMinutes: 15,
    deliveryZones: [
      { id: "zone-helio-1", name: "Korba", nameAr: "الكوربة", fee: 10, minOrder: 40 },
      { id: "zone-helio-2", name: "Triumph", nameAr: "ميدان تريومف", fee: 15, minOrder: 50 },
      { id: "zone-helio-3", name: "Sheraton", nameAr: "شيراتون", fee: 25, minOrder: 70 }
    ],
    minOrderDelivery: 40,
    deliveryFeeBase: 10,
    registers: [
      { id: "register_1", name: "Register 1 (POS)", nameAr: "جهاز كاشير 1" },
      { id: "register_2", name: "Register 2 (POS)", nameAr: "جهاز كاشير 2" }
    ]
  }
];

let branchesList = readJSON(BRANCHES_FILE, DEFAULT_BRANCHES);

// GET /api/branches -> Get all branches list
app.get("/api/branches", (req, res) => {
  const { orgId } = req.query;
  if (orgId) {
    const filtered = branchesList.filter(b => b.orgId === orgId || (!b.orgId && orgId === "org-default"));
    return res.json(filtered);
  }
  res.json(branchesList);
});

// POST /api/branches -> Create new branch
app.post("/api/branches", (req, res) => {
  const { name, nameAr, slug, phone, address, primaryColor, logo, estimatedWaitMinutes, deliveryZones, minOrderDelivery, deliveryFeeBase, orgId } = req.body;
  if (!name || !nameAr) {
    return res.status(400).json({ error: "Branch name (EN & AR) are required." });
  }
  const id = `branch-${Math.random().toString(36).substr(2, 9)}`;
  const newBranch = {
    id,
    orgId: orgId || "org-default",
    slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
    name,
    nameAr,
    logo: logo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=200",
    primaryColor: primaryColor || "#4f46e5",
    phone: phone || "",
    address: address || "",
    isOpen: true,
    estimatedWaitMinutes: estimatedWaitMinutes ? parseInt(estimatedWaitMinutes) : 15,
    deliveryZones: deliveryZones || [],
    minOrderDelivery: minOrderDelivery ? parseFloat(minOrderDelivery) : 40,
    deliveryFeeBase: deliveryFeeBase ? parseFloat(deliveryFeeBase) : 10,
    registers: [
      { id: "register_1", name: "Register 1 (POS)", nameAr: "جهاز كاشير 1" },
      { id: "register_2", name: "Register 2 (POS)", nameAr: "جهاز كاشير 2" }
    ]
  };
  branchesList.push(newBranch);
  writeJSON(BRANCHES_FILE, branchesList);
  res.status(201).json({ success: true, branch: newBranch });
});

// PUT /api/branches/:id -> Update branch
app.put("/api/branches/:id", (req, res) => {
  const branchIdx = branchesList.findIndex(b => b.id === req.params.id);
  if (branchIdx === -1) {
    return res.status(404).json({ error: "Branch not found." });
  }
  branchesList[branchIdx] = {
    ...branchesList[branchIdx],
    ...req.body
  };
  writeJSON(BRANCHES_FILE, branchesList);
  res.json({ success: true, branch: branchesList[branchIdx] });
});

// DELETE /api/branches/:id -> Delete branch
app.delete("/api/branches/:id", (req, res) => {
  const branchIdx = branchesList.findIndex(b => b.id === req.params.id);
  if (branchIdx === -1) {
    return res.status(404).json({ error: "Branch not found." });
  }
  branchesList.splice(branchIdx, 1);
  writeJSON(BRANCHES_FILE, branchesList);
  res.json({ success: true });
});

// POST /api/branches/:id/registers -> Add a register device to branch
app.post("/api/branches/:id/registers", (req, res) => {
  const branch = branchesList.find(b => b.id === req.params.id);
  if (!branch) return res.status(404).json({ error: "Branch not found." });
  if (!branch.registers) branch.registers = [];
  
  const { name, nameAr } = req.body;
  const regId = `register_${Date.now()}`;
  const newReg = {
    id: regId,
    name: name || `Register ${branch.registers.length + 1}`,
    nameAr: nameAr || `جهاز كاشير ${branch.registers.length + 1}`
  };
  branch.registers.push(newReg);
  writeJSON(BRANCHES_FILE, branchesList);
  res.json({ success: true, register: newReg });
});

// DELETE /api/branches/:id/registers/:regId -> Remove register from branch
app.delete("/api/branches/:id/registers/:regId", (req, res) => {
  const branch = branchesList.find(b => b.id === req.params.id);
  if (!branch) return res.status(404).json({ error: "Branch not found." });
  if (!branch.registers) return res.status(400).json({ error: "No registers defined on this branch." });

  const idx = branch.registers.findIndex(r => r.id === req.params.regId);
  if (idx === -1) return res.status(404).json({ error: "Register device not found." });
  
  branch.registers.splice(idx, 1);
  writeJSON(BRANCHES_FILE, branchesList);
  res.json({ success: true });
});

// GET /api/branches/:slug -> Get a single branch
app.get("/api/branches/:slug", (req, res) => {
  const branch = branchesList.find(b => b.slug === req.params.slug);
  if (!branch) {
    return res.status(404).json({ error: "Branch not found" });
  }
  res.json(branch);
});

// POST /api/orders/validate-address -> Validate delivery address zone and return fee
app.post("/api/orders/validate-address", (req, res) => {
  const { branchId, address, deliveryZoneId } = req.body;
  const branch = branchesList.find(b => b.id === branchId);
  if (!branch) {
    return res.status(404).json({ error: "Branch not found" });
  }

  let zone = null;
  if (deliveryZoneId) {
    zone = branch.deliveryZones.find(z => z.id === deliveryZoneId);
  } else if (address) {
    const addrUpper = address.toUpperCase();
    zone = branch.deliveryZones.find(z => 
      addrUpper.includes(z.name.toUpperCase()) || 
      addrUpper.includes(z.nameAr)
    );
  }

  if (!zone) {
    return res.json({
      valid: false,
      message: "Address outside delivery zones",
      messageAr: "العنوان خارج نطاق توصيل هذا الفرع"
    });
  }

  res.json({
    valid: true,
    zone,
    deliveryFee: zone.fee,
    minOrder: zone.minOrder
  });
});

// GET /api/orders/lookup?phone=xxx -> Past orders customer history phone lookup (re-ordering helper)
app.get("/api/orders/lookup", (req, res) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ error: "Phone parameter is required" });
  }
  const cleanPhone = String(phone).trim();
  const pastOrders = orders.filter((o: any) => 
    o.customerPhone === cleanPhone || 
    (o.customerPhone && o.customerPhone.replace(/\D/g, '').endsWith(cleanPhone.replace(/\D/g, '')))
  );
  // Sort descending by placedAt
  pastOrders.sort((a: any, b: any) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
  res.json(pastOrders);
});

// GET /api/orders/:id/track -> Public order tracking endpoint
app.get("/api/orders/:id/track", (req, res) => {
  const order = orders.find((o: any) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  const branch = branchesList.find(b => b.id === (order.branchId || "branch-a"));
  res.json({ order, branch });
});

// Statically defined customer file and endpoints
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");

app.post("/api/customer/signup", (req, res) => {
  const { name, phone, email, password } = req.body;
  const locale = (req as any).locale || "ar";
  if (!name || !phone || !password) {
    return res.status(400).json({ error: "Missing required fields (name, phone, password)" });
  }

  let list = readJSON(CUSTOMERS_FILE, []);
  if (!Array.isArray(list)) list = [];

  const exists = list.find((c: any) => c.phone === phone);
  if (exists) {
    return res.status(400).json({ 
      error: "PHONE_EXISTS", 
      message: locale === "ar" ? "رقم الهاتف مسجل بالفعل" : "Phone number already registered" 
    });
  }

  const newCust = {
    id: `cust-${Date.now()}`,
    name,
    phone,
    email: email || "",
    password,
    loyaltyPoints: 50, // 50 loyalty points signup bonus!
    createdAt: new Date().toISOString()
  };

  list.push(newCust);
  writeJSON(CUSTOMERS_FILE, list);

  res.status(201).json({ 
    success: true, 
    customer: { 
      id: newCust.id, 
      name: newCust.name, 
      phone: newCust.phone, 
      email: newCust.email, 
      loyaltyPoints: newCust.loyaltyPoints 
    } 
  });
});

app.post("/api/customer/login", (req, res) => {
  const { phone, password } = req.body;
  const locale = (req as any).locale || "ar";
  if (!phone || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  let list = readJSON(CUSTOMERS_FILE, []);
  if (!Array.isArray(list)) list = [];

  const customer = list.find((c: any) => c.phone === phone && c.password === password);
  if (!customer) {
    return res.status(401).json({ 
      error: "INVALID_CREDENTIALS", 
      message: locale === "ar" ? "رقم الهاتف أو كلمة المرور غير صحيحة" : "Invalid phone or password" 
    });
  }

  res.json({
    success: true,
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      loyaltyPoints: customer.loyaltyPoints || 0
    }
  });
});

// POST /api/orders/customer -> Public Guest Portal Order Submission (Fully self-contained validation & calculation)
app.post("/api/orders/customer", (req, res) => {
  const { 
    branchId, 
    fulfillmentType, 
    items, 
    paymentMethod, 
    customer, 
    tableId, 
    tableNumber,
    pickupTime, 
    pickupName,
    deliveryAddress, 
    deliveryZoneId,
    specialInstructions 
  } = req.body;

  if (!branchId) {
    return res.status(400).json({ error: "branchId is required" });
  }
  const branch = branchesList.find(b => b.id === branchId);
  if (!branch) {
    return res.status(400).json({ error: "Invalid branch selected" });
  }

  if (!customer || !customer.name || !customer.phone) {
    return res.status(400).json({ error: "Customer name and phone are required" });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Order items cannot be empty" });
  }

  // Recalculate everything safely against system database record to prevent client price tampering
  let calculatedSubtotal = 0;
  const mappedItems = [];

  for (const it of items) {
    const menuItem = menu.find((m: any) => m.id === it.id || m.id === it.menuItemId);
    if (!menuItem) {
      return res.status(400).json({ error: `Menu item '${it.name}' not found` });
    }
    if (menuItem.isAvailable === false) {
      return res.status(400).json({ error: `Dish '${menuItem.name}' is currently sold out (86'd)` });
    }

    // Secure base price lookup
    let basePrice = parseFloat(menuItem.price || 0);
    if (fulfillmentType === "delivery" && menuItem.channelPricing && menuItem.channelPricing.delivery) {
      basePrice = parseFloat(menuItem.channelPricing.delivery);
    }

    // Handle modifier additions
    let modifierPriceAdjustment = 0;
    const itemModifiers = [];
    if (it.modifiers && Array.isArray(it.modifiers)) {
      for (const mod of it.modifiers) {
        itemModifiers.push({
          groupId: mod.groupId,
          groupName: mod.groupName,
          optionId: mod.optionId,
          optionName: mod.optionName,
          price: parseFloat(mod.price || 0)
        });
        modifierPriceAdjustment += parseFloat(mod.price || 0);
      }
    }

    const itemPriceTotal = basePrice + modifierPriceAdjustment;
    const qty = parseInt(it.quantity || 1);
    calculatedSubtotal += itemPriceTotal * qty;

    mappedItems.push({
      id: menuItem.id,
      name: menuItem.name,
      price: basePrice,
      quantity: qty,
      notes: it.notes || it.itemNote || "",
      course: "main",
      fired: true,
      modifiers: itemModifiers
    });
  }

  // Delivery-specific rules
  let deliveryFee = 0;
  if (fulfillmentType === "delivery") {
    let zone = null;
    if (deliveryZoneId) {
      zone = branch.deliveryZones.find(z => z.id === deliveryZoneId);
    }
    if (!zone && deliveryAddress && deliveryAddress.fullAddress) {
      const addrUpper = deliveryAddress.fullAddress.toUpperCase();
      zone = branch.deliveryZones.find(z => 
        addrUpper.includes(z.name.toUpperCase()) || addrUpper.includes(z.nameAr)
      );
    }

    if (zone) {
      deliveryFee = zone.fee;
      if (calculatedSubtotal < zone.minOrder) {
        return res.status(400).json({ 
          error: `Minimum order of ${zone.minOrder} EGP not met for delivery zone ${zone.nameAr}` 
        });
      }
    } else {
      deliveryFee = branch.deliveryFeeBase;
    }
  }

  // Tax calculation: 14% Egypt tax standard
  const taxAmount = Math.round((calculatedSubtotal * 0.14) * 100) / 100;
  const surcharge = fulfillmentType === "dine_in" ? 1.50 : 0;
  const totalAmount = calculatedSubtotal + taxAmount + deliveryFee + surcharge;

  const orderId = `ord-guest-${Date.now()}`;
  
  // Assign to branch active open shift so that it is visible inside Cashier/Waiter and Kitchen queues
  const activeShift = (shifts || []).find((s: any) => s.branchId === branch.id && s.status === "open");

  const newOrder = {
    id: orderId,
    tableId: tableId || null,
    tableName: tableNumber ? `Table ${tableNumber}` : (tableId ? `Table ${tableId}` : null),
    fulfillmentType,
    orderSource: "guest_portal" as const,
    shiftId: activeShift ? activeShift.id : null,
    items: mappedItems,
    status: "placed" as const,
    totalAmount,
    placedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email || null,
    specialInstructions: specialInstructions || null,
    branchId: branch.id,
    ...(fulfillmentType === "delivery" && {
      delivery: {
        address: deliveryAddress?.fullAddress || "Delivery Address",
        floor: deliveryAddress?.floor || "",
        apartment: deliveryAddress?.apartment || "",
        landmark: deliveryAddress?.landmark || "",
        building: deliveryAddress?.building || "",
        latitude: deliveryAddress?.lat || 30.0444,
        longitude: deliveryAddress?.lng || 31.2357,
        distanceKm: 3.5,
        deliveryFee,
        riderName: "Pending Rider Dispatch",
        riderPhone: ""
      }
    }),
    ...(fulfillmentType === "takeaway" && {
      takeaway: {
        pickupTime: pickupTime || "ASAP",
        pickupName: pickupName || customer.name
      }
    }),
    payment: {
      method: paymentMethod || "cash",
      subtotal: calculatedSubtotal,
      taxAmount,
      surcharge,
      discountAmount: 0,
      totalPaid: paymentMethod === "card" ? totalAmount : 0,
      tipAmount: 0
    }
  };

  orders.push(newOrder);
  writeJSON(ORDERS_FILE, orders);

  // Auto-mark table as occupied for dine-in
  if (tableId) {
    const table = tables.find((t: any) => t.id === tableId || String(t.id) === String(tableId));
    if (table) {
      table.status = "occupied";
      table.currentOrderId = orderId;
      writeJSON(TABLES_FILE, tables);
    }
  }

  // Award loyalty points to the registered customer if applicable
  let earnedPoints = Math.floor(calculatedSubtotal / 10);
  let updatedLoyaltyPoints = 0;
  if (customer && customer.phone) {
    let list = readJSON(CUSTOMERS_FILE, []);
    if (!Array.isArray(list)) list = [];
    const idx = list.findIndex((c: any) => c.phone === customer.phone);
    if (idx !== -1) {
      list[idx].loyaltyPoints = (list[idx].loyaltyPoints || 0) + earnedPoints;
      updatedLoyaltyPoints = list[idx].loyaltyPoints;
      writeJSON(CUSTOMERS_FILE, list);
    }
  }

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    orderId,
    orderNumber: orders.length + 100,
    estimatedMinutes: branch.estimatedWaitMinutes,
    earnedPoints,
    updatedLoyaltyPoints
  });
});

// Audit trail endpoints
app.get("/api/audits", (req, res) => {
  res.json(audits);
});

// Promos endpoints
app.get("/api/promotions", (req, res) => {
  res.json(promotions);
});

// Aggregator Payout Reconciliation endpoints
app.get("/api/reconciliation", (req, res) => {
  res.json(reconciliation);
});

app.post("/api/reconciliation/dispute", (req, res) => {
  const { recordId, notes } = req.body;
  const idx = reconciliation.findIndex((r: any) => r.id === recordId);
  if (idx !== -1) {
    reconciliation[idx].status = "discrepancy";
    reconciliation[idx].discrepancyNotes = notes;
    writeJSON(RECONCILIATION_FILE, reconciliation);
    res.json(reconciliation[idx]);
  } else {
    res.status(404).json({ error: "Record not found" });
  }
});


// === AGGREGATOR PLATFORM INTEGRATION ===
const talabatAdapter = new TalabatAdapter();
const careemAdapter = new CareemAdapter();

// 1. Get current settings and logs
app.all("/api/aggregators/settings", (req, res) => {
  if (req.method === "GET") {
    return res.json(aggregatorSettings);
  }
  if (req.method === "POST" || req.method === "PUT") {
    const { autoAccept, talabatCommission, careemCommission, deliverySurcharge } = req.body;
    if (autoAccept !== undefined) aggregatorSettings.autoAccept = !!autoAccept;
    if (talabatCommission !== undefined) aggregatorSettings.talabatCommission = parseFloat(talabatCommission) || 15;
    if (careemCommission !== undefined) aggregatorSettings.careemCommission = parseFloat(careemCommission) || 18;
    if (deliverySurcharge !== undefined) aggregatorSettings.deliverySurcharge = parseFloat(deliverySurcharge) || 5.00;
    
    writeJSON(AGGREGATOR_SETTINGS_FILE, aggregatorSettings);
    return res.json(aggregatorSettings);
  }
  res.status(405).json({ error: "Method not allowed" });
});

app.get("/api/aggregators/logs", (req, res) => {
  res.json(aggregatorLogs);
});

// Clear aggregator logs
app.post("/api/aggregators/logs/clear", (req, res) => {
  aggregatorLogs = [];
  writeJSON(AGGREGATOR_LOGS_FILE, aggregatorLogs);
  res.json({ success: true, logs: [] });
});

// 2. Inbound Webhook: Talabat
app.post("/api/webhooks/talabat", async (req, res) => {
  const rawOrder = req.body.order || req.body;
  const rawId = rawOrder.id || `tal-${Date.now()}`;
  const systemOrderId = `tal-${rawId}`;

  // Log receipt of webhook
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    platform: "talabat",
    direction: "inbound",
    action: "webhook_order_received",
    rawPayload: req.body,
    systemOrderId,
    status: "success",
    message: "Webhook processed, order mapped."
  };

  // Idempotency: Check if order already exists
  const existingOrder = orders.find((o: any) => o.id === systemOrderId);
  if (existingOrder) {
    newLog.message = "Duplicate webhook discarded (idempotent).";
    aggregatorLogs.unshift(newLog);
    writeJSON(AGGREGATOR_LOGS_FILE, aggregatorLogs);
    return res.status(200).json({ status: "success", duplicated: true, message: "Order already processed" });
  }

  try {
    const unifiedOrder = talabatAdapter.mapToUnifiedOrder(req.body);
    // Overwrite status based on auto-accept setting
    unifiedOrder.status = aggregatorSettings.autoAccept ? "confirmed" : "placed";
    if (unifiedOrder.status === "confirmed") {
      unifiedOrder.confirmedAt = new Date().toISOString();
    }

    orders.push(unifiedOrder);
    writeJSON(ORDERS_FILE, orders);

    // Also auto-reconcile for reporting
    const commissionAmount = unifiedOrder.totalAmount * (aggregatorSettings.talabatCommission / 100);
    const payoutRecord = {
      id: `payout-${Date.now()}`,
      aggregatorName: "talabat",
      externalOrderId: rawId.toString(),
      systemOrderId: unifiedOrder.id,
      totalAmount: unifiedOrder.totalAmount,
      commissionRatePercent: aggregatorSettings.talabatCommission,
      commissionAmount: Number(commissionAmount.toFixed(2)),
      payoutAmountExpected: Number((unifiedOrder.totalAmount - commissionAmount).toFixed(2)),
      payoutAmountReported: Number((unifiedOrder.totalAmount - commissionAmount).toFixed(2)),
      netPayoutReported: Number((unifiedOrder.totalAmount - commissionAmount).toFixed(2)),
      status: "matched" as const,
      discrepancyNotes: "",
      reconciledAt: new Date().toISOString()
    };
    reconciliation.unshift(payoutRecord);
    writeJSON(RECONCILIATION_FILE, reconciliation);

    newLog.message = `Unified order appended. Status is ${unifiedOrder.status}.`;
    aggregatorLogs.unshift(newLog);
    writeJSON(AGGREGATOR_LOGS_FILE, aggregatorLogs);

    res.status(201).json({ status: "success", orderId: systemOrderId });
  } catch (err: any) {
    newLog.status = "error";
    newLog.message = err.message || "Failed mapping Talabat payload";
    aggregatorLogs.unshift(newLog);
    writeJSON(AGGREGATOR_LOGS_FILE, aggregatorLogs);
    res.status(500).json({ error: "Failed to map order", details: err.message });
  }
});

// 3. Inbound Webhook: Careem
app.post("/api/webhooks/careem", async (req, res) => {
  const rawOrder = req.body.order || req.body;
  const rawId = rawOrder.id || `car-${Date.now()}`;
  const systemOrderId = `car-${rawId}`;

  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    platform: "careem",
    direction: "inbound",
    action: "webhook_order_received",
    rawPayload: req.body,
    systemOrderId,
    status: "success",
    message: "Webhook processed, order mapped."
  };

  const existingOrder = orders.find((o: any) => o.id === systemOrderId);
  if (existingOrder) {
    newLog.message = "Duplicate webhook discarded (idempotent).";
    aggregatorLogs.unshift(newLog);
    writeJSON(AGGREGATOR_LOGS_FILE, aggregatorLogs);
    return res.status(200).json({ status: "success", duplicated: true, message: "Order already processed" });
  }

  try {
    const unifiedOrder = careemAdapter.mapToUnifiedOrder(req.body);
    unifiedOrder.status = aggregatorSettings.autoAccept ? "confirmed" : "placed";
    if (unifiedOrder.status === "confirmed") {
      unifiedOrder.confirmedAt = new Date().toISOString();
    }

    orders.push(unifiedOrder);
    writeJSON(ORDERS_FILE, orders);

    // Auto-reconcile Careem payout
    const commissionAmount = unifiedOrder.totalAmount * (aggregatorSettings.careemCommission / 100);
    const payoutRecord = {
      id: `payout-${Date.now()}`,
      aggregatorName: "careem",
      externalOrderId: rawId.toString(),
      systemOrderId: unifiedOrder.id,
      totalAmount: unifiedOrder.totalAmount,
      commissionRatePercent: aggregatorSettings.careemCommission,
      commissionAmount: Number(commissionAmount.toFixed(2)),
      payoutAmountExpected: Number((unifiedOrder.totalAmount - commissionAmount).toFixed(2)),
      payoutAmountReported: Number((unifiedOrder.totalAmount - commissionAmount).toFixed(2)),
      netPayoutReported: Number((unifiedOrder.totalAmount - commissionAmount).toFixed(2)),
      status: "matched" as const,
      discrepancyNotes: "",
      reconciledAt: new Date().toISOString()
    };
    reconciliation.unshift(payoutRecord);
    writeJSON(RECONCILIATION_FILE, reconciliation);

    newLog.message = `Unified order appended. Status is ${unifiedOrder.status}.`;
    aggregatorLogs.unshift(newLog);
    writeJSON(AGGREGATOR_LOGS_FILE, aggregatorLogs);

    res.status(201).json({ status: "success", orderId: systemOrderId });
  } catch (err: any) {
    newLog.status = "error";
    newLog.message = err.message || "Failed mapping Careem payload";
    aggregatorLogs.unshift(newLog);
    writeJSON(AGGREGATOR_LOGS_FILE, aggregatorLogs);
    res.status(500).json({ error: "Failed to map order", details: err.message });
  }
});

// 4. Outbound Manual Trigger: Sync full menu
app.post("/api/aggregators/sync-menu", async (req, res) => {
  const { platform } = req.body;
  if (platform !== "talabat" && platform !== "careem" && platform !== "all") {
    return res.status(400).json({ error: "Invalid platform value" });
  }

  try {
    const results = [];
    if (platform === "talabat" || platform === "all") {
      const result = await talabatAdapter.syncMenu(menu);
      results.push(result);
      aggregatorLogs.unshift({
        id: `log-${Date.now()}-ts`,
        timestamp: new Date().toISOString(),
        platform: "talabat",
        direction: "outbound",
        action: "menu_sync",
        rawPayload: { menuItemsCount: menu.length },
        status: "success",
        message: `Synced catalog of ${menu.length} items to Talabat`
      });
    }

    if (platform === "careem" || platform === "all") {
      const result = await careemAdapter.syncMenu(menu);
      results.push(result);
      aggregatorLogs.unshift({
        id: `log-${Date.now()}-cs`,
        timestamp: new Date().toISOString(),
        platform: "careem",
        direction: "outbound",
        action: "menu_sync",
        rawPayload: { menuItemsCount: menu.length },
        status: "success",
        message: `Synced catalog of ${menu.length} items to Careem`
      });
    }

    writeJSON(AGGREGATOR_LOGS_FILE, aggregatorLogs);
    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ error: "Sync failed", details: err.message });
  }
});

// 5. Outbound Manual Status Update Retry (Dead Letter Queue Handler)
app.post("/api/aggregators/retry-log/:id", async (req, res) => {
  const { id } = req.params;
  const logIdx = aggregatorLogs.findIndex((l: any) => l.id === id);
  if (logIdx === -1) return res.status(404).json({ error: "Log entry not found" });

  const log = aggregatorLogs[logIdx];
  const orderId = log.systemOrderId;
  const order = orders.find((o: any) => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: "Associated order not found for retry" });
  }

  try {
    const adapter = log.platform === "talabat" ? talabatAdapter : careemAdapter;
    const result = await adapter.pushStatusUpdate(order.id, order.status);
    
    // Update log
    log.status = "success";
    log.message = `Manually retried status sync. Response: OK. Remote URL: ${result.url}`;
    log.timestamp = new Date().toISOString();
    
    writeJSON(AGGREGATOR_LOGS_FILE, aggregatorLogs);
    res.json({ success: true, log });
  } catch (err: any) {
    log.message = `Retry failed: ${err.message}`;
    writeJSON(AGGREGATOR_LOGS_FILE, aggregatorLogs);
    res.status(500).json({ error: "Manual retry failed", details: err.message });
  }
});


// 5. Premium SaaS Features with AI - Menu Planning via Google Gemini
app.post("/api/gemini/generate-menu", async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: "Gemini API integration is unconfigured. Please add your GEMINI_API_KEY inside Settings > Secrets.",
    });
  }

  const { chefProfile, cuisineTheme, itemType } = req.body;

  if (!cuisineTheme || !itemType) {
    return res.status(400).json({ error: "cuisineTheme and itemType parameters are required." });
  }

  const systemInstruction = 
    "You are an elegant culinary consultant for Michelin-level and high-tier SaaS restaurants. " +
    "You create distinctive dish recipes with elegant descriptive phrasing and reasonable pricing. " +
    "Deliver strict structured JSON representation only. No markdown surrounding block wrappers, raw JSON only.";

  const prompt = `Develop 3 exquisite, new menu items for a restaurant. 
Theme / Cuisine Style: ${cuisineTheme}
Item Type (Appetizers, Mains, Desserts, Drinks): ${itemType}
Chef or Restaurant Tone/Style: ${chefProfile || "Modern Bistro fine dining"}
Ensure prices are logical matching high-end cuisine values (Appetizers $10-$18, Mains $20-$45, Desserts $8-$15, Drinks $5-$14).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of 3 suggested dishes for the menu",
          items: {
            type: Type.OBJECT,
            required: ["name", "description", "price", "imagePlaceholder"],
            properties: {
              name: {
                type: Type.STRING,
                description: "Name of the gourmet dish",
              },
              description: {
                type: Type.STRING,
                description: "Appetizing, sensory definition of ingredients, textures, and culinary methods.",
              },
              price: {
                type: Type.NUMBER,
                description: "A rational decimal dollar price recommendation based on ingredient quality.",
              },
              imagePlaceholder: {
                type: Type.STRING,
                description: "A keyword representation for food visual. Value MUST be exactly one of: Steak, Pasta, Salad, Dessert, Seafood, Burger, Pizza, Chicken, Cocktail, Coffee, Soup, Cake.",
              }
            },
          },
        },
      },
    });

    const itemsStr = response.text;
    if (!itemsStr) {
      throw new Error("Empty response returned from Gemini API");
    }

    const parsedItems = JSON.parse(itemsStr.trim());
    res.json({ items: parsedItems });
  } catch (err: any) {
    console.error("Gemini Generate Error:", err);
    res.status(500).json({
      error: "Failed to generate AI dishes.",
      details: err.message || err,
    });
  }
});

// AI Marketing Post Generator for Owners
app.post("/api/gemini/marketing", async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: "Gemini API integration is unconfigured. Please add your GEMINI_API_KEY inside Settings > Secrets.",
    });
  }

  const { dishName, promotionType, customPrompt } = req.body;

  if (!dishName || !promotionType) {
    return res.status(400).json({ error: "dishName and promotionType are required" });
  }

  const prompt = `Write a compelling, engaging fine-dining social media marketing post or email newsletter section.
Dish being promoted: ${dishName}
Campaign Objective: ${promotionType} (e.g. Weekend special, 15% discount, Seasonal launch, Storytelling)
Additional client specifications: ${customPrompt || "Keep it warm, classy, and highly enticing. Use elegant spacing & 2 tasteful hashtags."}
Make it conversational, human, and tailored to food lovers. Limit the response to 120-150 words total.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite copywriter and digital marketer for prime restaurateurs and digital SaaS systems. Create beautiful copy with excellent spacing.",
      }
    });

    res.json({ copy: response.text });
  } catch (err: any) {
    console.error("Gemini Marketing Error:", err);
    res.status(500).json({
      error: "Failed to generate AI marketing campaign.",
      details: err.message || err
    });
  }
});

// 6. Stats Endpoints (UPGRADED)
app.get("/api/stats", (req, res) => {
  const { branchId, orgId } = req.query;

  let filteredOrders = orders;

  if (branchId && branchId !== "all") {
    filteredOrders = orders.filter((o: any) => o.branchId === branchId);
  } else if (orgId) {
    const orgBranches = branchesList.filter(b => b.orgId === orgId || (!b.orgId && orgId === "org-default")).map(b => b.id);
    filteredOrders = orders.filter((o: any) => orgBranches.includes(o.branchId || "branch-a"));
  }

  const activeOrders = filteredOrders.filter((o: any) => o.status !== "paid" && o.status !== "voided");
  const paidOrders = filteredOrders.filter((o: any) => o.status === "paid" || o.status === "completed");

  const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
  const ordersCount = filteredOrders.length;
  const activeOrdersCount = activeOrders.length;

  const popularDishes: { [key: string]: { count: number; name: string } } = {};
  filteredOrders.forEach((ord: any) => {
    ord.items.forEach((it: any) => {
      if (!popularDishes[it.id]) {
        popularDishes[it.id] = { count: 0, name: it.name };
      }
      popularDishes[it.id].count += it.quantity;
    });
  });

  const popularSorted = Object.values(popularDishes)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const occupiedCount = tables.filter((t: any) => t.status !== "empty" && t.status !== "dirty").length;
  const totalTables = tables.length;
  const occupancyRate = totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0;

  // Average SLA Calculation: placedAt -> completedAt / deliveredAt in minutes
  let totalSlaMinutes = 0;
  let closedOrdersWithSla = 0;

  filteredOrders.forEach((o: any) => {
    const endT = o.completedAt || o.deliveredAt;
    if (o.placedAt && endT) {
      const diffMs = new Date(endT).getTime() - new Date(o.placedAt).getTime();
      const diffMins = diffMs / (60 * 1000);
      if (diffMins > 0) {
        totalSlaMinutes += diffMins;
        closedOrdersWithSla++;
      }
    }
  });

  const averageSlaMinutes = closedOrdersWithSla > 0 ? Math.round(totalSlaMinutes / closedOrdersWithSla) : 18;
  const discrepanciesCount = reconciliation.filter((r: any) => r.status === "discrepancy").length;

  res.json({
    totalRevenue,
    ordersCount,
    activeOrdersCount,
    popularDishes: popularSorted,
    occupancyRate,
    averageSlaMinutes,
    discrepanciesCount
  });
});

// ==================== RECIPE & COST ENGINE API ====================

// Recursive recipe cost calculator
function calculateRecipeCost(recipe: any, allRecipes: any[], allIngredients: any[]): number {
  if (!recipe || !recipe.ingredients) return 0;
  let totalCost = 0;
  for (const link of recipe.ingredients) {
    if (link.isSubRecipeLink) {
      const subRec = allRecipes.find((r: any) => r.id === link.ingredientId);
      if (subRec) {
        const subCost = calculateRecipeCost(subRec, allRecipes, allIngredients);
        const subUnitCost = subRec.yieldQuantity > 0 ? subCost / subRec.yieldQuantity : 0;
        totalCost += subUnitCost * link.quantity;
      }
    } else {
      const ing = allIngredients.find((i: any) => i.id === link.ingredientId);
      if (ing) {
        const yieldCoeff = (ing.yieldPercent || 100) / 100;
        const realUnitCost = yieldCoeff > 0 ? ing.costPerBaseUnit / yieldCoeff : ing.costPerBaseUnit;
        totalCost += realUnitCost * link.quantity;
      }
    }
  }
  return totalCost;
}

// 7. Raw Ingredients
app.get("/api/ingredients", (req, res) => {
  res.json(ingredients);
});

app.post("/api/ingredients", (req, res) => {
  const { name, category, baseUom, costPerBaseUnit, yieldPercent, allergens, supplierReference, shelfLifeDays, spoilageClass } = req.body;
  if (!name || !category || !baseUom || costPerBaseUnit === undefined) {
    return res.status(400).json({ error: "Missing required raw ingredient details" });
  }
  const newIng = {
    id: `ing-${Date.now()}`,
    name,
    category,
    baseUom,
    costPerBaseUnit: parseFloat(costPerBaseUnit),
    yieldPercent: parseInt(yieldPercent || 100),
    allergens: Array.isArray(allergens) ? allergens : [],
    supplierReference: supplierReference || "",
    shelfLifeDays: parseInt(shelfLifeDays || 7),
    spoilageClass: spoilageClass || "Medium"
  };
  ingredients.push(newIng);
  writeJSON(INGREDIENTS_FILE, ingredients);
  res.status(201).json(newIng);
});

app.put("/api/ingredients/:id", (req, res) => {
  const { id } = req.params;
  const idx = ingredients.findIndex((i: any) => i.id === id);
  if (idx === -1) return res.status(404).json({ error: "Ingredient not found" });

  ingredients[idx] = {
    ...ingredients[idx],
    ...req.body,
    id // preserve ID
  };
  writeJSON(INGREDIENTS_FILE, ingredients);
  res.json(ingredients[idx]);
});

app.delete("/api/ingredients/:id", (req, res) => {
  const { id } = req.params;
  const idx = ingredients.findIndex((i: any) => i.id === id);
  if (idx === -1) return res.status(404).json({ error: "Ingredient not found" });

  const deleted = ingredients.splice(idx, 1)[0];
  writeJSON(INGREDIENTS_FILE, ingredients);
  res.json(deleted);
});

// 8. Recipes
app.get("/api/recipes", (req, res) => {
  res.json(recipes);
});

app.post("/api/recipes", (req, res) => {
  const { menuItemId, isSubRecipe, name, ingredients: recIngredients, yieldQuantity, baseUom } = req.body;
  if (!name || !recIngredients || !Array.isArray(recIngredients)) {
    return res.status(400).json({ error: "Invalid recipe BOM data" });
  }

  const newRec = {
    id: `rec-${Date.now()}`,
    menuItemId: menuItemId || null,
    isSubRecipe: !!isSubRecipe,
    name,
    ingredients: recIngredients,
    yieldQuantity: parseFloat(yieldQuantity || 1),
    baseUom: baseUom || "unit",
    version: 1,
    isActive: true,
    updatedAt: new Date().toISOString()
  };

  // If there's an existing recipe for this menuItem, we deactivate it or replace it (history preservation)
  if (menuItemId) {
    recipes.forEach((r: any) => {
      if (r.menuItemId === menuItemId) {
        r.isActive = false; // deactivate historical recipe
      }
    });
  }

  recipes.push(newRec);
  writeJSON(RECIPES_FILE, recipes);
  res.status(201).json(newRec);
});

app.put("/api/recipes/:id", (req, res) => {
  const { id } = req.params;
  const idx = recipes.findIndex((r: any) => r.id === id);
  if (idx === -1) return res.status(404).json({ error: "Recipe not found" });

  recipes[idx] = {
    ...recipes[idx],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  writeJSON(RECIPES_FILE, recipes);
  res.json(recipes[idx]);
});

app.delete("/api/recipes/:id", (req, res) => {
  const { id } = req.params;
  const idx = recipes.findIndex((r: any) => r.id === id);
  if (idx === -1) return res.status(404).json({ error: "Recipe not found" });

  const deleted = recipes.splice(idx, 1)[0];
  writeJSON(RECIPES_FILE, recipes);
  res.json(deleted);
});

// ==================== THEORETICAL VS ACTUAL VARIANCE & WASTE LOGS ====================

function accumulateTheoreticalUsage(
  recipe: any,
  quantitySold: number,
  allRecipes: any[],
  usageMap: { [key: string]: number }
) {
  if (!recipe || !recipe.ingredients) return;
  for (const link of recipe.ingredients) {
    const linkQty = parseFloat(link.quantity || 0) * quantitySold;
    if (link.isSubRecipeLink) {
      const subRec = allRecipes.find((r: any) => r.id === link.ingredientId);
      if (subRec) {
        const scale = subRec.yieldQuantity > 0 ? linkQty / subRec.yieldQuantity : 1;
        accumulateTheoreticalUsage(subRec, scale, allRecipes, usageMap);
      }
    } else {
      usageMap[link.ingredientId] = (usageMap[link.ingredientId] || 0) + linkQty;
    }
  }
}

app.get("/api/inventory-variance", (req, res) => {
  const usageMap: { [key: string]: number } = {};

  // Find all ingredients and set defaults
  ingredients.forEach((ing: any) => {
    if (ing.openingStock === undefined) ing.openingStock = 100;
    if (ing.receivedStock === undefined) ing.receivedStock = 0;
    if (ing.closingStock === undefined) ing.closingStock = null;
  });

  // Calculate theoretical usage from non-voided orders
  const activeOrders = orders.filter((o: any) => o.status !== "voided");
  activeOrders.forEach((o: any) => {
    o.items.forEach((item: any) => {
      const rec = recipes.find((r: any) => r.menuItemId === item.id && r.isActive);
      if (rec) {
        accumulateTheoreticalUsage(rec, parseFloat(item.quantity || 1), recipes, usageMap);
      }
    });
  });

  const varianceData = ingredients.map((ing: any) => {
    const theoreticalUsage = usageMap[ing.id] || 0;
    const expectedClosingStock = Math.max(0, (ing.openingStock || 0) + (ing.receivedStock || 0) - theoreticalUsage);
    const actualClosingStock = ing.closingStock !== null && ing.closingStock !== undefined ? ing.closingStock : expectedClosingStock;
    const actualUsage = (ing.openingStock || 0) + (ing.receivedStock || 0) - actualClosingStock;
    
    const varianceQty = theoreticalUsage - actualUsage; // If negative, we used more raw materials than recipes dictated
    const varianceCost = varianceQty * (ing.costPerBaseUnit || 0);

    const totalWasted = wasteLogs
      .filter((w: any) => w.ingredientId === ing.id)
      .reduce((sum: number, w: any) => sum + parseFloat(w.quantity || 0), 0);
    const wasteCost = totalWasted * (ing.costPerBaseUnit || 0);

    return {
      ingredientId: ing.id,
      name: ing.name,
      category: ing.category,
      baseUom: ing.baseUom,
      costPerBaseUnit: ing.costPerBaseUnit,
      openingStock: ing.openingStock,
      receivedStock: ing.receivedStock,
      expectedClosingStock,
      closingStock: ing.closingStock,
      theoreticalUsage,
      actualUsage,
      varianceQty,
      varianceCost,
      totalWasted,
      wasteCost,
      isReconciled: ing.closingStock !== null
    };
  });

  res.json(varianceData);
});

app.post("/api/inventory-variance/stocktake", (req, res) => {
  const { ingredientId, openingStock, receivedStock, closingStock } = req.body;

  const idx = ingredients.findIndex((i: any) => i.id === ingredientId);
  if (idx === -1) return res.status(404).json({ error: "Ingredient not found" });

  if (openingStock !== undefined) ingredients[idx].openingStock = parseFloat(openingStock);
  if (receivedStock !== undefined) ingredients[idx].receivedStock = parseFloat(receivedStock);
  if (closingStock !== undefined) {
    ingredients[idx].closingStock = closingStock === null ? null : parseFloat(closingStock);
  }

  writeJSON(INGREDIENTS_FILE, ingredients);
  res.json({ success: true, ingredient: ingredients[idx] });
});

app.post("/api/inventory-variance/rollover", (req, res) => {
  const { managerPin, reason } = req.body;

  if (!isAuthorizedManagerPin(managerPin)) {
    return res.status(403).json({ error: "Action denied. Invalid or missing Manager PIN required to rollover inventory period." });
  }

  const usageMap: { [key: string]: number } = {};
  
  // Calculate theoretical usage to find expected closing stock if they didn't input a physical count
  const activeOrders = orders.filter((o: any) => o.status !== "voided");
  activeOrders.forEach((o: any) => {
    o.items.forEach((item: any) => {
      const rec = recipes.find((r: any) => r.menuItemId === item.id && r.isActive);
      if (rec) {
        accumulateTheoreticalUsage(rec, parseFloat(item.quantity || 1), recipes, usageMap);
      }
    });
  });

  ingredients.forEach((ing: any) => {
    const theoreticalUsage = usageMap[ing.id] || 0;
    const expectedClosingStock = Math.max(0, (ing.openingStock || 0) + (ing.receivedStock || 0) - theoreticalUsage);
    const actualClosingStock = ing.closingStock !== null && ing.closingStock !== undefined ? ing.closingStock : expectedClosingStock;

    // Shift current actual closing stock to opening stock of the new period
    ing.openingStock = actualClosingStock;
    ing.receivedStock = 0;
    ing.closingStock = null;
  });

  writeJSON(INGREDIENTS_FILE, ingredients);

  // Add audit trail log
  const authMgr = staffUsers.find((s: any) => s.pin === managerPin && s.status === "active" && (s.role === "manager" || s.role === "owner" || s.role === "admin" || s.role === "org_admin"));
  const actualManagerName = authMgr ? authMgr.name : "Authorized Manager";
  addAuditLog(
    "INVENTORY_ROLLOVER",
    `Rollover inventory period executed by manager ${actualManagerName}. Current closing stocks moved to opening floats, received stock reset to 0.`,
    reason || "Scheduled periodic inventory cycle rollover",
    undefined,
    "manager"
  );

  res.json({ success: true, ingredients });
});

app.get("/api/waste-logs", (req, res) => {
  res.json(wasteLogs);
});

app.post("/api/waste-logs", (req, res) => {
  const { ingredientId, quantity, reason, recordedBy } = req.body;
  if (!ingredientId || quantity === undefined || !reason) {
    return res.status(400).json({ error: "Ingredient, quantity, and reason are required to log waste." });
  }

  const ing = ingredients.find((i: any) => i.id === ingredientId);
  if (!ing) return res.status(404).json({ error: "Ingredient not found" });

  const qtyVal = parseFloat(quantity);
  const cost = qtyVal * (ing.costPerBaseUnit || 0);

  const newLog = {
    id: `wst-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ingredientId,
    ingredientName: ing.name,
    quantity: qtyVal,
    baseUom: ing.baseUom,
    cost,
    reason,
    recordedBy: recordedBy || "Manager"
  };

  wasteLogs.push(newLog);
  writeJSON(WASTE_LOGS_FILE, wasteLogs);

  addAuditLog(
    "WASTE_RECORDED",
    `Logged waste: ${qtyVal} ${ing.baseUom} of '${ing.name}' for reason '${reason}' (Cost: $${cost.toFixed(2)})`,
    reason,
    undefined,
    "manager"
  );

  res.status(201).json(newLog);
});

// 9. Menu Engineering Matrix (BCG Matrix)
app.get("/api/menu-engineering", (req, res) => {
  // Compute popularity of all menu items
  const popularDishes: { [key: string]: number } = {};
  orders.forEach((ord: any) => {
    ord.items.forEach((it: any) => {
      popularDishes[it.id] = (popularDishes[it.id] || 0) + it.quantity;
    });
  });

  const matrix: any[] = menu.map((item: any) => {
    const rec = recipes.find((r: any) => r.menuItemId === item.id && r.isActive);
    const theoreticalCost = rec ? calculateRecipeCost(rec, recipes, ingredients) : 0;
    const margin = item.price - theoreticalCost;
    const foodCostPercent = item.price > 0 ? (theoreticalCost / item.price) * 100 : 0;
    const popularity = popularDishes[item.id] || 0;

    return {
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      theoreticalCost,
      margin,
      foodCostPercent,
      popularity,
      classification: "Dog" // default placeholder
    };
  });

  // Calculate averages for classification
  const totalPopularity = matrix.reduce((sum, item) => sum + item.popularity, 0);
  const avgPopularity = matrix.length > 0 ? totalPopularity / matrix.length : 0;

  const totalMargin = matrix.reduce((sum, item) => sum + item.margin, 0);
  const avgMargin = matrix.length > 0 ? totalMargin / matrix.length : 0;

  matrix.forEach((item: any) => {
    const isPopular = item.popularity >= avgPopularity;
    const isProfitable = item.margin >= avgMargin;

    if (isPopular && isProfitable) {
      item.classification = "Star";
    } else if (isPopular && !isProfitable) {
      item.classification = "Plowhorse";
    } else if (!isPopular && isProfitable) {
      item.classification = "Puzzle";
    } else {
      item.classification = "Dog";
    }
  });

  res.json({
    matrix,
    avgPopularity,
    avgMargin
  });
});

function getShiftFlags(shift: any, stats: any, allOrders: any[]) {
  const flags: any[] = [];
  const variance = shift.variance !== null ? shift.variance : (shift.declaredCash !== null ? (shift.declaredCash - stats.cashSummary.expectedInDrawer) : 0);
  
  // 1. Cash Variance Flag
  if (shift.status !== "open") {
    if (variance < -5.00) {
      flags.push({
        type: "cash_shortage",
        severity: Math.abs(variance) > 50.00 ? "critical" : "warning",
        description: `Cash shortage of $${Math.abs(variance).toFixed(2)} in drawer.`,
        descriptionAr: `عجز نقدي بقيمة $${Math.abs(variance).toFixed(2)} في الدرج.`,
        value: variance,
        detectedAt: new Date().toISOString()
      });
    } else if (variance > 5.00) {
      flags.push({
        type: "cash_surplus",
        severity: Math.abs(variance) > 50.00 ? "critical" : "warning",
        description: `Cash surplus of $${variance.toFixed(2)} in drawer.`,
        descriptionAr: `زيادة نقدية بقيمة $${variance.toFixed(2)} في الدرج.`,
        value: variance,
        detectedAt: new Date().toISOString()
      });
    }
    if (Math.abs(variance) > 50.00) {
      flags.push({
        type: "high_variance",
        severity: "critical",
        description: `Critical cash variance mismatch: $${variance.toFixed(2)}.`,
        descriptionAr: `فرق نقدي حرج غير متطابق: $${variance.toFixed(2)}.`,
        value: variance,
        detectedAt: new Date().toISOString()
      });
    }
  }

  // 2. High Void rate
  const completedCount = stats.orderCount || 0;
  const voidedCount = stats.ordersByStatus?.voided?.count || 0;
  const totalCount = completedCount + voidedCount;
  if (totalCount > 3) {
    const voidRate = voidedCount / totalCount;
    if (voidRate > 0.15) {
      flags.push({
        type: "high_void_rate",
        severity: voidRate > 0.30 ? "critical" : "warning",
        description: `Unusual high order cancellation rate of ${(voidRate * 100).toFixed(1)}%.`,
        descriptionAr: `نسبة إلغاء طلبات مرتفعة بشكل غير معتاد: ${(voidRate * 100).toFixed(1)}%.`,
        value: voidRate,
        detectedAt: new Date().toISOString()
      });
    }
  }

  // 3. Outstanding Rider Cash
  if (shift.status !== "open" && stats.deliverySummary?.aggregate?.totalOutstanding > 0) {
    flags.push({
      type: "missing_rider_settlement",
      severity: "warning",
      description: `Shift closed with uncollected rider cash of $${stats.deliverySummary.aggregate.totalOutstanding.toFixed(2)}.`,
      descriptionAr: `تم إغلاق الوردية مع كاش ديليفري معلق لدى المناديب بقيمة $${stats.deliverySummary.aggregate.totalOutstanding.toFixed(2)}.`,
      value: stats.deliverySummary.aggregate.totalOutstanding,
      detectedAt: new Date().toISOString()
    });
  }

  // 4. Large Discounts
  const totalRevenue = stats.totalSales || 0;
  const shiftOrders = allOrders.filter((o: any) => o.shiftId === shift.id);
  let totalDiscounts = 0;
  shiftOrders.forEach((o: any) => {
    totalDiscounts += o.discountAmount || (o.payment ? parseFloat(o.payment.discountAmount || 0) : 0);
  });
  if (totalRevenue > 50 && (totalDiscounts / totalRevenue) > 0.15) {
    flags.push({
      type: "large_discount",
      severity: "warning",
      description: `Discounts exceeded 15% of net revenue (${((totalDiscounts / totalRevenue) * 100).toFixed(1)}%).`,
      descriptionAr: `تجاوزت الخصومات 15% من صافي الإيرادات (${((totalDiscounts / totalRevenue) * 100).toFixed(1)}%).`,
      value: totalDiscounts,
      detectedAt: new Date().toISOString()
    });
  }

  // 5. Short Shift
  if (shift.status !== "open") {
    const start = new Date(shift.openedAt).getTime();
    const end = shift.closedAt ? new Date(shift.closedAt).getTime() : Date.now();
    const durationMins = (end - start) / (1000 * 60);
    if (durationMins < 15) {
      flags.push({
        type: "short_shift",
        severity: "info",
        description: `Very short shift session: ${Math.round(durationMins)} minutes.`,
        descriptionAr: `جلسة وردية قصيرة جداً: ${Math.round(durationMins)} دقيقة.`,
        value: durationMins,
        detectedAt: new Date().toISOString()
      });
    }
  }

  return flags;
}

// ==================== SHIFT (CASHIER SESSION) MANAGEMENT ====================

function calculateShiftStats(shift: any, allOrders: any[]) {
  const shiftId = shift.id;
  const shiftOrders = allOrders.filter((o: any) => o.shiftId === shiftId);

  let totalSales = 0;
  let orderCount = 0;

  const fulfillment: any = {
    dine_in: { count: 0, revenue: 0, avg: 0 },
    takeaway: { count: 0, revenue: 0, avg: 0 },
    delivery: { count: 0, revenue: 0, avg: 0 },
  };

  const sources: { [key: string]: { count: number; revenue: number } } = {};
  
  const statusCounts = {
    completed: 0,
    paid: 0,
    voided: { count: 0, value: 0 },
    refunded: { count: 0, value: 0 }
  };

  let cashSales = 0;
  let cardSales = 0;
  let loyaltySales = 0;
  let cashRefunds = 0;

  const itemsMap: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

  shiftOrders.forEach((o: any) => {
    const isPaidOrCompleted = o.status === "paid" || o.status === "completed";
    const isVoided = o.status === "voided";

    if (isPaidOrCompleted) {
      orderCount++;
      totalSales += o.totalAmount;

      const fType = o.fulfillmentType || "takeaway";
      if (fulfillment[fType]) {
        fulfillment[fType].count++;
        fulfillment[fType].revenue += o.totalAmount;
      }

      const src = o.orderSource || "pos";
      if (!sources[src]) sources[src] = { count: 0, revenue: 0 };
      sources[src].count++;
      sources[src].revenue += o.totalAmount;

      if (o.status === "completed") statusCounts.completed++;
      if (o.status === "paid") statusCounts.paid++;

      if (o.payment) {
        const pm = o.payment.method;
        if (pm === "cash") {
          cashSales += o.payment.totalPaid || o.totalAmount;
        } else if (pm === "card") {
          cardSales += o.payment.totalPaid || o.totalAmount;
        } else if (pm === "loyalty") {
          loyaltySales += o.payment.totalPaid || o.totalAmount;
        } else if (pm === "split" && o.payment.splits) {
          o.payment.splits.forEach((sp: any) => {
            if (sp.method === "cash") cashSales += sp.amount;
            if (sp.method === "card") cardSales += sp.amount;
            if (sp.method === "loyalty") loyaltySales += sp.amount;
          });
        }
      } else {
        cashSales += o.totalAmount;
      }

      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((it: any) => {
          if (!itemsMap[it.id]) {
            itemsMap[it.id] = { name: it.name, quantity: 0, revenue: 0 };
          }
          itemsMap[it.id].quantity += it.quantity;
          itemsMap[it.id].revenue += it.price * it.quantity;
        });
      }
    } else if (isVoided) {
      statusCounts.voided.count++;
      statusCounts.voided.value += o.totalAmount;

      if (o.payment) {
        statusCounts.refunded.count++;
        statusCounts.refunded.value += o.totalAmount;

        const pm = o.payment.method;
        if (pm === "cash") {
          cashRefunds += o.payment.totalPaid || o.totalAmount;
        } else if (pm === "split" && o.payment.splits) {
          o.payment.splits.forEach((sp: any) => {
            if (sp.method === "cash") cashRefunds += sp.amount;
          });
        }
      }
    }
  });

  Object.keys(fulfillment).forEach((key) => {
    const f = fulfillment[key];
    f.avg = f.count > 0 ? f.revenue / f.count : 0;
  });

  const topItems = Object.values(itemsMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  let paidIn = 0;
  let paidOut = 0;
  let safeDrops = 0;
  let expenses = 0;

  if (shift.cashMovements && Array.isArray(shift.cashMovements)) {
    shift.cashMovements.forEach((m: any) => {
      if (m.type === "paid_in") paidIn += m.amount;
      else if (m.type === "paid_out") paidOut += m.amount;
      else if (m.type === "safe_drop") safeDrops += m.amount;
      else if (m.type === "expense") expenses += m.amount;
    });
  }

  const expectedInDrawer = shift.openingFloat + cashSales - cashRefunds + paidIn - paidOut - safeDrops - expenses;

  const riderBreakdown: { [key: string]: any } = {};
  let totalDeliveries = 0;
  let totalFoodValue = 0;
  let totalDeliveryFees = 0;

  const deliveryOrders = shiftOrders.filter((o: any) => (o.status === "paid" || o.status === "completed") && o.fulfillmentType === "delivery");

  deliveryOrders.forEach((o: any) => {
    const rName = o.delivery?.riderName || "Unassigned Rider";
    const dFee = o.delivery?.deliveryFee || 0;
    const foodVal = o.totalAmount - dFee;

    const isCOD = o.payment?.method === "cash" || (o.payment?.method === "split" && o.payment.splits?.some((s: any) => s.method === "cash"));
    const isPlatformPaid = o.orderSource?.startsWith("aggregator:");

    let collectedAmt = 0;
    if (isCOD && !isPlatformPaid) {
      if (o.payment?.method === "split" && o.payment.splits) {
        const cashSplit = o.payment.splits.find((s: any) => s.method === "cash");
        collectedAmt = cashSplit ? cashSplit.amount : 0;
      } else {
        collectedAmt = o.totalAmount;
      }
    }

    if (!riderBreakdown[rName]) {
      riderBreakdown[rName] = {
        riderName: rName,
        deliveryCount: 0,
        totalValue: 0,
        deliveryFees: 0,
        cashLiability: 0,
        settledCash: 0,
        outstandingCash: 0,
        platformSettled: 0
      };
    }

    riderBreakdown[rName].deliveryCount++;
    riderBreakdown[rName].totalValue += o.totalAmount;
    riderBreakdown[rName].deliveryFees += dFee;
    if (isPlatformPaid) {
      riderBreakdown[rName].platformSettled += o.totalAmount;
    } else {
      riderBreakdown[rName].cashLiability += collectedAmt;
    }

    totalDeliveries++;
    totalFoodValue += foodVal;
    totalDeliveryFees += dFee;
  });

  let totalSettled = 0;
  if (shift.riderSettlements && Array.isArray(shift.riderSettlements)) {
    shift.riderSettlements.forEach((s: any) => {
      const rName = s.riderName;
      if (riderBreakdown[rName]) {
        riderBreakdown[rName].settledCash += s.amount;
      } else {
        riderBreakdown[rName] = {
          riderName: rName,
          deliveryCount: 0,
          totalValue: 0,
          deliveryFees: 0,
          cashLiability: 0,
          settledCash: s.amount,
          outstandingCash: 0,
          platformSettled: 0
        };
      }
      totalSettled += s.amount;
    });
  }

  let totalOutstanding = 0;
  Object.keys(riderBreakdown).forEach((key) => {
    const r = riderBreakdown[key];
    r.outstandingCash = Math.max(0, r.cashLiability - r.settledCash);
    totalOutstanding += r.outstandingCash;
  });

  const basicStats = {
    totalSales,
    orderCount,
    salesByFulfillment: fulfillment,
    salesBySource: sources,
    ordersByStatus: statusCounts,
    paymentsBreakdown: {
      cash: cashSales,
      card: cardSales,
      loyalty: loyaltySales,
    },
    cashSummary: {
      openingFloat: shift.openingFloat,
      cashSales,
      cashRefunds,
      paidIn,
      paidOut,
      safeDrops,
      expenses,
      expectedInDrawer,
    },
    deliverySummary: {
      riderBreakdown: Object.values(riderBreakdown),
      aggregate: {
        totalDeliveries,
        totalFoodValue,
        totalDeliveryFees,
        totalOutstanding,
        totalSettled,
      }
    },
    itemSummary: topItems
  };

  const flags = getShiftFlags(shift, basicStats, allOrders);

  return {
    ...basicStats,
    flags
  };
}

// Routes
app.get("/api/shifts", (req, res) => {
  const {
    branchId,
    cashierId,
    status,
    from,
    to,
    hasFlags,
    varianceType,
    sortBy = "openedAt",
    sortDir = "desc",
    page,
    limit,
    paged
  } = req.query;

  // Compute liveStats for all shifts to perform filtering
  let results = shifts.map((s: any) => ({
    ...s,
    liveStats: calculateShiftStats(s, orders)
  }));

  // Apply filters
  if (branchId) {
    results = results.filter((s: any) => s.branchId === branchId);
  }
  if (cashierId) {
    results = results.filter((s: any) => s.cashierId === cashierId);
  }
  if (status) {
    results = results.filter((s: any) => s.status === status);
  }
  if (from) {
    const fromTime = new Date(from as string).getTime();
    if (!isNaN(fromTime)) {
      results = results.filter((s: any) => new Date(s.openedAt).getTime() >= fromTime);
    }
  }
  if (to) {
    const toTime = new Date(to as string).getTime();
    if (!isNaN(toTime)) {
      results = results.filter((s: any) => new Date(s.openedAt).getTime() <= toTime);
    }
  }
  if (hasFlags === "true") {
    results = results.filter((s: any) => s.liveStats && s.liveStats.flags && s.liveStats.flags.length > 0);
  }
  if (varianceType) {
    results = results.filter((s: any) => {
      if (s.status === "open") return false;
      const v = s.variance || 0;
      if (varianceType === "exact") return Math.abs(v) < 0.05;
      if (varianceType === "shortage") return v < -5.00;
      if (varianceType === "surplus") return v > 5.00;
      if (varianceType === "large") return Math.abs(v) > 50.00;
      return true;
    });
  }

  // Apply sorting
  results.sort((a: any, b: any) => {
    let valA = a[sortBy as string];
    let valB = b[sortBy as string];

    // Fallback if sorting by nested stats
    if (sortBy === "totalSales") {
      valA = a.liveStats?.totalSales || 0;
      valB = b.liveStats?.totalSales || 0;
    } else if (sortBy === "variance") {
      valA = a.variance || 0;
      valB = b.variance || 0;
    }

    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    if (typeof valA === "string") {
      return sortDir === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    } else {
      return sortDir === "asc" ? valA - valB : valB - valA;
    }
  });

  // Check if paging is requested
  if (page || limit || paged === "true") {
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const total = results.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const pagedShifts = results.slice(startIndex, startIndex + limitNum);

    return res.json({
      shifts: pagedShifts,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages
    });
  }

  res.json(results);
});

app.get("/api/shifts/analytics/overview", (req, res) => {
  const { branchId, from, to } = req.query;
  let filteredShifts = shifts.map((s: any) => ({
    ...s,
    liveStats: calculateShiftStats(s, orders)
  }));
  
  if (branchId) {
    filteredShifts = filteredShifts.filter((s: any) => s.branchId === branchId);
  }
  if (from) {
    const fromTime = new Date(from as string).getTime();
    if (!isNaN(fromTime)) {
      filteredShifts = filteredShifts.filter((s: any) => new Date(s.openedAt).getTime() >= fromTime);
    }
  }
  if (to) {
    const toTime = new Date(to as string).getTime();
    if (!isNaN(toTime)) {
      filteredShifts = filteredShifts.filter((s: any) => new Date(s.openedAt).getTime() <= toTime);
    }
  }

  let totalRevenue = 0;
  let totalOrders = 0;
  let totalCashSales = 0;
  let totalCardSales = 0;
  let totalLoyaltySales = 0;
  let totalVariance = 0;
  let totalDiscounts = 0;
  let openShiftsCount = 0;
  let completedShiftsCount = 0;
  let unresolvedCriticalFlagsCount = 0;

  const trendMap: { [key: string]: { date: string; netRevenue: number; cashRevenue: number } } = {};

  filteredShifts.forEach((s: any) => {
    const stats = s.liveStats;
    totalRevenue += stats.totalSales || 0;
    totalOrders += stats.orderCount || 0;
    totalCashSales += stats.paymentsBreakdown?.cash || 0;
    totalCardSales += stats.paymentsBreakdown?.card || 0;
    totalLoyaltySales += stats.paymentsBreakdown?.loyalty || 0;
    totalVariance += s.variance || 0;

    if (s.status === "open") {
      openShiftsCount++;
    } else {
      completedShiftsCount++;
    }

    if (stats.flags) {
      unresolvedCriticalFlagsCount += stats.flags.filter((f: any) => f.severity === "critical").length;
    }

    // Accumulate total discounts for this shift
    const shiftOrders = orders.filter((o: any) => o.shiftId === s.id);
    shiftOrders.forEach((o: any) => {
      totalDiscounts += o.discountAmount || (o.payment ? parseFloat(o.payment.discountAmount || 0) : 0);
    });

    // Trend date grouping
    const dateStr = new Date(s.openedAt).toISOString().split("T")[0];
    if (!trendMap[dateStr]) {
      trendMap[dateStr] = { date: dateStr, netRevenue: 0, cashRevenue: 0 };
    }
    trendMap[dateStr].netRevenue += stats.totalSales || 0;
    trendMap[dateStr].cashRevenue += stats.paymentsBreakdown?.cash || 0;
  });

  const dailyRevenueTrend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  res.json({
    totalRevenue,
    netRevenue: totalRevenue - totalDiscounts,
    avgOrderValue,
    totalOrders,
    completedShiftsCount,
    openShiftsCount,
    totalVariance,
    totalDiscounts,
    unresolvedCriticalFlagsCount,
    paymentsBreakdown: {
      cash: totalCashSales,
      card: totalCardSales,
      loyalty: totalLoyaltySales
    },
    dailyRevenueTrend
  });
});

app.get("/api/shifts/analytics/cashier-comparison", (req, res) => {
  const { branchId, from, to } = req.query;
  let filteredShifts = shifts.map((s: any) => ({
    ...s,
    liveStats: calculateShiftStats(s, orders)
  }));
  
  if (branchId) {
    filteredShifts = filteredShifts.filter((s: any) => s.branchId === branchId);
  }
  if (from) {
    const fromTime = new Date(from as string).getTime();
    if (!isNaN(fromTime)) {
      filteredShifts = filteredShifts.filter((s: any) => new Date(s.openedAt).getTime() >= fromTime);
    }
  }
  if (to) {
    const toTime = new Date(to as string).getTime();
    if (!isNaN(toTime)) {
      filteredShifts = filteredShifts.filter((s: any) => new Date(s.openedAt).getTime() <= toTime);
    }
  }

  const comparisonMap: { [key: string]: any } = {};

  filteredShifts.forEach((s: any) => {
    const cId = s.cashierId || "unknown";
    const cName = s.cashierName || "Unknown Cashier";
    const stats = s.liveStats;

    if (!comparisonMap[cId]) {
      comparisonMap[cId] = {
        cashierId: cId,
        cashierName: cName,
        shiftCount: 0,
        totalSales: 0,
        avgSales: 0,
        variance: 0,
        flagsCount: 0
      };
    }

    const data = comparisonMap[cId];
    data.shiftCount++;
    data.totalSales += stats.totalSales || 0;
    data.variance += s.variance || 0;
    if (stats.flags) {
      data.flagsCount += stats.flags.length;
    }
  });

  const result = Object.values(comparisonMap);
  result.forEach((r: any) => {
    r.avgSales = r.shiftCount > 0 ? r.totalSales / r.shiftCount : 0;
  });

  res.json(result);
});

app.get("/api/shifts/analytics/timing-heatmap", (req, res) => {
  const { branchId, from, to } = req.query;
  let filteredShifts = shifts.map((s: any) => ({
    ...s,
    liveStats: calculateShiftStats(s, orders)
  }));
  
  if (branchId) {
    filteredShifts = filteredShifts.filter((s: any) => s.branchId === branchId);
  }
  if (from) {
    const fromTime = new Date(from as string).getTime();
    if (!isNaN(fromTime)) {
      filteredShifts = filteredShifts.filter((s: any) => new Date(s.openedAt).getTime() >= fromTime);
    }
  }
  if (to) {
    const toTime = new Date(to as string).getTime();
    if (!isNaN(toTime)) {
      filteredShifts = filteredShifts.filter((s: any) => new Date(s.openedAt).getTime() <= toTime);
    }
  }

  const shiftIds = new Set(filteredShifts.map((s: any) => s.id));
  const relevantOrders = orders.filter((o: any) => o.shiftId && shiftIds.has(o.shiftId) && (o.status === "paid" || o.status === "completed"));

  const heatmap: { [key: string]: { day: string; hour: number; revenue: number; orderCount: number } } = {};
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  relevantOrders.forEach((o: any) => {
    const date = new Date(o.createdAt || o.timestamp || Date.now());
    const day = days[date.getDay()];
    const hour = date.getHours();
    const key = `${day}-${hour}`;

    if (!heatmap[key]) {
      heatmap[key] = { day, hour, revenue: 0, orderCount: 0 };
    }

    heatmap[key].revenue += o.totalAmount || 0;
    heatmap[key].orderCount++;
  });

  res.json(Object.values(heatmap));
});

app.get("/api/shifts/analytics/void-analysis", (req, res) => {
  const { branchId, from, to } = req.query;
  let filteredShifts = shifts.map((s: any) => ({
    ...s,
    liveStats: calculateShiftStats(s, orders)
  }));
  
  if (branchId) {
    filteredShifts = filteredShifts.filter((s: any) => s.branchId === branchId);
  }
  if (from) {
    const fromTime = new Date(from as string).getTime();
    if (!isNaN(fromTime)) {
      filteredShifts = filteredShifts.filter((s: any) => new Date(s.openedAt).getTime() >= fromTime);
    }
  }
  if (to) {
    const toTime = new Date(to as string).getTime();
    if (!isNaN(toTime)) {
      filteredShifts = filteredShifts.filter((s: any) => new Date(s.openedAt).getTime() <= toTime);
    }
  }

  let totalVoidedOrders = 0;
  let totalVoidedAmount = 0;
  const voidRateTrendMap: { [key: string]: { date: string; completed: number; voided: number } } = {};
  const cashierVoidsMap: { [key: string]: any } = {};
  const voidReasonsMap: { [key: string]: { reason: string; count: number; value: number } } = {};

  filteredShifts.forEach((s: any) => {
    const stats = s.liveStats;
    totalVoidedOrders += stats.ordersByStatus?.voided?.count || 0;
    totalVoidedAmount += stats.ordersByStatus?.voided?.value || 0;

    const shiftOrders = orders.filter((o: any) => o.shiftId === s.id);
    shiftOrders.forEach((o: any) => {
      const dateStr = new Date(o.createdAt || s.openedAt).toISOString().split("T")[0];
      if (!voidRateTrendMap[dateStr]) {
        voidRateTrendMap[dateStr] = { date: dateStr, completed: 0, voided: 0 };
      }

      if (o.status === "voided") {
        voidRateTrendMap[dateStr].voided++;
        // Reason breakdown
        const reason = o.voidReason || "Unspecified Reason";
        if (!voidReasonsMap[reason]) {
          voidReasonsMap[reason] = { reason, count: 0, value: 0 };
        }
        voidReasonsMap[reason].count++;
        voidReasonsMap[reason].value += o.totalAmount || 0;
      } else if (o.status === "paid" || o.status === "completed") {
        voidRateTrendMap[dateStr].completed++;
      }
    });

    const cId = s.cashierId || "unknown";
    const cName = s.cashierName || "Unknown Cashier";
    if (!cashierVoidsMap[cId]) {
      cashierVoidsMap[cId] = {
        cashierId: cId,
        cashierName: cName,
        completedCount: 0,
        voidCount: 0,
        voidValue: 0,
        voidRate: 0
      };
    }

    const cv = cashierVoidsMap[cId];
    cv.completedCount += stats.orderCount || 0;
    cv.voidCount += stats.ordersByStatus?.voided?.count || 0;
    cv.voidValue += stats.ordersByStatus?.voided?.value || 0;
  });

  const voidRateTrend = Object.values(voidRateTrendMap).map((item: any) => {
    const total = item.completed + item.voided;
    return {
      date: item.date,
      voidRate: total > 0 ? (item.voided / total) * 100 : 0
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  const cashierVoidRates = Object.values(cashierVoidsMap);
  cashierVoidRates.forEach((cv: any) => {
    const total = cv.completedCount + cv.voidCount;
    cv.voidRate = total > 0 ? (cv.voidCount / total) * 100 : 0;
  });

  res.json({
    totalVoidedOrders,
    totalVoidedAmount,
    voidRateTrend,
    cashierVoidRates,
    voidReasons: Object.values(voidReasonsMap)
  });
});

app.get("/api/shifts/analytics/insights", (req, res) => {
  const { branchId, from, to } = req.query;
  let filteredShifts = shifts.map((s: any) => ({
    ...s,
    liveStats: calculateShiftStats(s, orders)
  }));
  
  if (branchId) {
    filteredShifts = filteredShifts.filter((s: any) => s.branchId === branchId);
  }
  if (from) {
    const fromTime = new Date(from as string).getTime();
    if (!isNaN(fromTime)) {
      filteredShifts = filteredShifts.filter((s: any) => new Date(s.openedAt).getTime() >= fromTime);
    }
  }
  if (to) {
    const toTime = new Date(to as string).getTime();
    if (!isNaN(toTime)) {
      filteredShifts = filteredShifts.filter((s: any) => new Date(s.openedAt).getTime() <= toTime);
    }
  }

  const insights: any[] = [];

  // Insight 1: Perfect Matching Cashiers
  const cashierVarianceMap: { [key: string]: { name: string; totalVariance: number; count: number } } = {};
  const cashierVoidsMap: { [key: string]: { name: string; voids: number; total: number } } = {};
  let outstandingRiderCash = 0;

  filteredShifts.forEach((s: any) => {
    const stats = s.liveStats;
    const cId = s.cashierId || "unknown";
    const cName = s.cashierName || "Unknown Cashier";

    if (!cashierVarianceMap[cId]) {
      cashierVarianceMap[cId] = { name: cName, totalVariance: 0, count: 0 };
    }
    cashierVarianceMap[cId].totalVariance += Math.abs(s.variance || 0);
    cashierVarianceMap[cId].count++;

    if (!cashierVoidsMap[cId]) {
      cashierVoidsMap[cId] = { name: cName, voids: 0, total: 0 };
    }
    cashierVoidsMap[cId].voids += stats.ordersByStatus?.voided?.count || 0;
    cashierVoidsMap[cId].total += (stats.orderCount || 0) + (stats.ordersByStatus?.voided?.count || 0);

    outstandingRiderCash += stats.deliverySummary?.aggregate?.totalOutstanding || 0;
  });

  // Perfect Cash matching
  Object.keys(cashierVarianceMap).forEach((key) => {
    const cv = cashierVarianceMap[key];
    if (cv.count >= 2 && cv.totalVariance < 5) {
      insights.push({
        type: "positive",
        title: "Pristine Cash Control",
        titleAr: "رقابة نقدية مثالية",
        description: `${cv.name} shows excellent cash handling with total variance of only $${cv.totalVariance.toFixed(2)} across ${cv.count} shifts.`,
        descriptionAr: `يظهر ${cv.name} تعاملاً ممتازاً مع النقد بعجز/زيادة إجمالي $${cv.totalVariance.toFixed(2)} عبر ${cv.count} ورديات.`
      });
    }
  });

  // High Voids
  Object.keys(cashierVoidsMap).forEach((key) => {
    const cv = cashierVoidsMap[key];
    if (cv.total > 5) {
      const rate = cv.voids / cv.total;
      if (rate > 0.12) {
        insights.push({
          type: "negative",
          title: "High Cancellation Alert",
          titleAr: "تنبيه إلغاءات مرتفع",
          description: `${cv.name} has a high order void rate of ${(rate * 100).toFixed(1)}% (${cv.voids} voids out of ${cv.total} orders). Consider auditing canceled order reasons.`,
          descriptionAr: `لدى ${cv.name} معدل إلغاء طلبات مرتفع بنسبة ${(rate * 100).toFixed(1)}% (${cv.voids} إلغاء من أصل ${cv.total} طلبات). يوصى بمراجعة أسباب إلغاء الطلبات.`
        });
      }
    }
  });

  // Outstanding rider COD
  if (outstandingRiderCash > 10) {
    insights.push({
      type: "warning",
      title: "Outstanding Rider Collections",
      titleAr: "تحصيلات معلقة لدى الديليفري",
      description: `There is currently $${outstandingRiderCash.toFixed(2)} in outstanding COD collections with delivery riders. Ensure all riders are fully settled before shift handovers.`,
      descriptionAr: `يوجد حالياً $${outstandingRiderCash.toFixed(2)} تحصيلات معلقة كاش مع مناديب الديليفري. يرجى تصفية الحسابات بالكامل مع المناديب.`
    });
  }

  // Fallback if no specific insights
  if (insights.length === 0) {
    insights.push({
      type: "neutral",
      title: "All Core Systems Stable",
      titleAr: "جميع الأنظمة الأساسية مستقرة",
      description: "Shift audits show normal transaction variance and healthy operation patterns.",
      descriptionAr: "تظهر تقارير الوردية تباينات معاملات طبيعية وأنماط تشغيل صحية."
    });
  }

  res.json(insights);
});

app.get("/api/shifts/:id", (req, res) => {
  const { id } = req.params;
  const shift = shifts.find((s: any) => s.id === id);
  if (!shift) {
    return res.status(404).json({ error: "Shift not found" });
  }
  res.json({
    ...shift,
    liveStats: calculateShiftStats(shift, orders)
  });
});

app.get("/api/shifts/:id/orders", (req, res) => {
  const { id } = req.params;
  const shift = shifts.find((s: any) => s.id === id);
  if (!shift) {
    return res.status(404).json({ error: "Shift not found" });
  }
  const shiftOrders = orders.filter((o: any) => o.shiftId === id);
  res.json(shiftOrders);
});

app.get("/api/shifts/:id/cash-movements", (req, res) => {
  const { id } = req.params;
  const shift = shifts.find((s: any) => s.id === id);
  if (!shift) {
    return res.status(404).json({ error: "Shift not found" });
  }
  res.json(shift.cashMovements || []);
});

app.get("/api/shifts/:id/audit-log", (req, res) => {
  const { id } = req.params;
  const shift = shifts.find((s: any) => s.id === id);
  if (!shift) {
    return res.status(404).json({ error: "Shift not found" });
  }
  
  const shiftOrders = orders.filter((o: any) => o.shiftId === id);
  const shiftOrderIds = new Set(shiftOrders.map((o: any) => o.id));
  
  const shiftAudits = audits.filter((aud: any) => {
    const isWithinTime = aud.timestamp >= shift.openedAt && (shift.closedAt ? aud.timestamp <= shift.closedAt : true);
    const isShiftOrder = aud.orderId && shiftOrderIds.has(aud.orderId);
    const mentionsShift = aud.details?.includes(id) || aud.details?.includes(`Shift #${shift.shiftNumber}`);
    return isWithinTime || isShiftOrder || mentionsShift;
  });
  
  res.json(shiftAudits);
});

// =========================================================================
// FINANCIAL REPORTS CENTER API ENDPOINTS (PART 9)
// =========================================================================

const getOrderBranchId = (order: any, allShifts: any[]) => {
  if (order.branchId) return order.branchId;
  if (order.shiftId) {
    const s = allShifts.find((sh: any) => sh.id === order.shiftId);
    if (s) return s.branchId;
  }
  return "branch-a"; // default fallback
};

const filterOrders = (allOrders: any[], allShifts: any[], from?: string, to?: string, branchIds?: string[], fulfillmentTypes?: string[], orderSources?: string[]) => {
  return allOrders.filter((o: any) => {
    if (o.status === "voided") return false;
    const dateStr = o.placedAt || o.completedAt || o.timestamp;
    if (!dateStr) return false;
    
    if (from && dateStr < from) return false;
    if (to && dateStr > to) return false;
    
    if (branchIds && branchIds.length > 0 && !branchIds.includes("all")) {
      const bId = getOrderBranchId(o, allShifts);
      if (!branchIds.includes(bId)) return false;
    }
    
    if (fulfillmentTypes && fulfillmentTypes.length > 0 && !fulfillmentTypes.includes("all")) {
      if (!fulfillmentTypes.includes(o.fulfillmentType)) return false;
    }
    
    if (orderSources && orderSources.length > 0 && !orderSources.includes("all")) {
      const source = o.orderSource || "pos";
      const matched = orderSources.some(src => {
        if (src === "aggregator") return source.startsWith("aggregator");
        return source === src;
      });
      if (!matched) return false;
    }
    return true;
  });
};

const getDatesInRange = (from: string, to: string) => {
  const dates = [];
  const start = new Date(from.substring(0, 10));
  const end = new Date(to.substring(0, 10));
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().substring(0, 10));
  }
  return dates;
};

// 1. Overview Dashboard
app.get("/api/reports/overview", (req, res) => {
  const { from, to, compareFrom, compareTo, branchId, fulfillmentType, orderSource } = req.query;
  const branchIds = branchId ? (branchId as string).split(",") : [];
  const fulfillmentTypes = fulfillmentType ? (fulfillmentType as string).split(",") : [];
  const orderSources = orderSource ? (orderSource as string).split(",") : [];

  const currentOrders = filterOrders(orders, shifts, from as string, to as string, branchIds, fulfillmentTypes, orderSources);
  const previousOrders = compareFrom && compareTo ? filterOrders(orders, shifts, compareFrom as string, compareTo as string, branchIds, fulfillmentTypes, orderSources) : [];

  const getKPIs = (ords: any[]) => {
    let grossSales = 0;
    let taxAmount = 0;
    let discountAmount = 0;
    let netRevenue = 0;
    let cashSales = 0;
    
    ords.forEach((o: any) => {
      const subtotal = o.payment?.subtotal || o.totalAmount || 0;
      const discount = o.payment?.discountAmount || 0;
      const tax = o.payment?.taxAmount || 0;
      const total = o.payment?.totalPaid || o.totalAmount || 0;

      grossSales += subtotal;
      taxAmount += tax;
      discountAmount += discount;
      netRevenue += total - tax;

      const method = o.payment?.method || "cash";
      if (method === "cash") {
        cashSales += total;
      } else if (method === "split" && o.payment?.splits) {
        o.payment.splits.forEach((sp: any) => {
          if (sp.method === "cash") cashSales += sp.amount;
        });
      }
    });

    const voidedList = orders.filter(o => {
      if (o.status !== "voided") return false;
      const dateStr = o.placedAt || o.completedAt || o.timestamp;
      if (!dateStr) return false;
      if (from && dateStr < from) return false;
      if (to && dateStr > to) return false;
      if (branchIds.length > 0 && !branchIds.includes("all")) {
        const bId = getOrderBranchId(o, shifts);
        if (!branchIds.includes(bId)) return false;
      }
      return true;
    });
    const voidedAmount = voidedList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const ordersCount = ords.length;
    const averageOrderValue = ordersCount > 0 ? (grossSales / ordersCount) : 0;

    return {
      grossSales,
      taxAmount,
      discountAmount,
      netRevenue,
      cashSales,
      voidedAmount,
      ordersCount,
      averageOrderValue
    };
  };

  const currentKPIs = getKPIs(currentOrders);
  const previousKPIs = compareFrom && compareTo ? getKPIs(previousOrders) : undefined;

  const days = getDatesInRange(from as string, to as string);
  const revenueByDay = days.map(d => {
    const dayOrders = currentOrders.filter(o => (o.placedAt || o.completedAt || o.timestamp || "").startsWith(d));
    const revenue = dayOrders.reduce((sum, o) => sum + (o.payment?.totalPaid || o.totalAmount || 0), 0);
    const count = dayOrders.length;
    return { date: d, revenue, count };
  });

  let compareRevenueByDay = undefined;
  if (compareFrom && compareTo) {
    const compDays = getDatesInRange(compareFrom as string, compareTo as string);
    compareRevenueByDay = compDays.map((d, index) => {
      const dayOrders = previousOrders.filter(o => (o.placedAt || o.completedAt || o.timestamp || "").startsWith(d));
      const revenue = dayOrders.reduce((sum, o) => sum + (o.payment?.totalPaid || o.totalAmount || 0), 0);
      const count = dayOrders.length;
      return { date: d, revenue, count, correspondingIndex: index };
    });
  }

  const getBreakdowns = (ords: any[]) => {
    const fulfillment = { dine_in: 0, takeaway: 0, delivery: 0 };
    const paymentBreakdown = { cash: 0, card: 0, digital_wallet: 0, split: 0 };
    const source = { pos: 0, app: 0, aggregator: 0 };

    ords.forEach((o: any) => {
      if (o.fulfillmentType === "dine_in") fulfillment.dine_in += (o.payment?.totalPaid || o.totalAmount || 0);
      else if (o.fulfillmentType === "delivery") fulfillment.delivery += (o.payment?.totalPaid || o.totalAmount || 0);
      else fulfillment.takeaway += (o.payment?.totalPaid || o.totalAmount || 0);

      const method = o.payment?.method || "cash";
      if (method === "cash") paymentBreakdown.cash += (o.payment?.totalPaid || o.totalAmount || 0);
      else if (method === "card" || method === "visa" || method === "credit_card") paymentBreakdown.card += (o.payment?.totalPaid || o.totalAmount || 0);
      else if (method === "digital_wallet" || method === "wallet") paymentBreakdown.digital_wallet += (o.payment?.totalPaid || o.totalAmount || 0);
      else if (method === "split") paymentBreakdown.split += (o.payment?.totalPaid || o.totalAmount || 0);
      else paymentBreakdown.cash += (o.payment?.totalPaid || o.totalAmount || 0);

      const src = o.orderSource || "pos";
      if (src === "pos") source.pos += (o.payment?.totalPaid || o.totalAmount || 0);
      else if (src === "app") source.app += (o.payment?.totalPaid || o.totalAmount || 0);
      else if (src.startsWith("aggregator")) source.aggregator += (o.payment?.totalPaid || o.totalAmount || 0);
      else source.pos += (o.payment?.totalPaid || o.totalAmount || 0);
    });

    return { fulfillment, payment: paymentBreakdown, source };
  };

  const currentBreakdowns = getBreakdowns(currentOrders);
  const previousBreakdowns = compareFrom && compareTo ? getBreakdowns(previousOrders) : undefined;

  const itemCounts: { [key: string]: { name: string, quantity: number, revenue: number } } = {};
  currentOrders.forEach((o: any) => {
    o.items.forEach((it: any) => {
      if (!itemCounts[it.id]) {
        itemCounts[it.id] = { name: it.name, quantity: 0, revenue: 0 };
      }
      itemCounts[it.id].quantity += (it.quantity || 1);
      itemCounts[it.id].revenue += ((it.price || 0) * (it.quantity || 1));
    });
  });
  const topItems = Object.values(itemCounts)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const branchSales: { [key: string]: number } = {};
  currentOrders.forEach((o: any) => {
    const bId = getOrderBranchId(o, shifts);
    branchSales[bId] = (branchSales[bId] || 0) + (o.payment?.totalPaid || o.totalAmount || 0);
  });
  let topBranchId = "branch-a";
  let topBranchSales = 0;
  Object.keys(branchSales).forEach(bId => {
    if (branchSales[bId] > topBranchSales) {
      topBranchSales = branchSales[bId];
      topBranchId = bId;
    }
  });
  const topBranchObj = branchesList.find(b => b.id === topBranchId) || branchesList[0];
  const topBranch = {
    id: topBranchId,
    name: topBranchObj?.name || topBranchId,
    nameAr: topBranchObj?.nameAr || topBranchId,
    sales: topBranchSales
  };

  res.json({
    current: currentKPIs,
    previous: previousKPIs,
    revenueByDay,
    compareRevenueByDay,
    breakdowns: {
      current: currentBreakdowns,
      previous: previousBreakdowns
    },
    topItems,
    topBranch
  });
});

// 2. Sales & Revenue Report
app.get("/api/reports/sales", (req, res) => {
  const { from, to, compareFrom, compareTo, branchId, fulfillmentType, orderSource, granularity } = req.query;
  const branchIds = branchId ? (branchId as string).split(",") : [];
  const fulfillmentTypes = fulfillmentType ? (fulfillmentType as string).split(",") : [];
  const orderSources = orderSource ? (orderSource as string).split(",") : [];

  const currentOrders = filterOrders(orders, shifts, from as string, to as string, branchIds, fulfillmentTypes, orderSources);

  const groupedData: { [key: string]: any } = {};
  currentOrders.forEach((o: any) => {
    const dateStr = o.placedAt || o.completedAt || o.timestamp;
    if (!dateStr) return;
    let key = "";
    if (granularity === "hourly") {
      key = dateStr.substring(11, 13) + ":00";
    } else if (granularity === "weekly") {
      const d = new Date(dateStr);
      const day = d.getDay();
      const diff = d.getDate() - day;
      const startOfWeek = new Date(d.setDate(diff));
      key = "Week " + startOfWeek.toISOString().substring(0, 10);
    } else if (granularity === "monthly") {
      key = dateStr.substring(0, 7);
    } else {
      key = dateStr.substring(0, 10);
    }

    if (!groupedData[key]) {
      groupedData[key] = {
        period: key,
        orders: 0,
        totalSales: 0,
        discounts: 0,
        netRevenue: 0,
        tax: 0,
        dineIn: 0,
        takeaway: 0,
        delivery: 0
      };
    }

    groupedData[key].orders++;
    groupedData[key].totalSales += (o.payment?.subtotal || o.totalAmount || 0);
    groupedData[key].discounts += (o.payment?.discountAmount || 0);
    groupedData[key].netRevenue += (o.payment?.totalPaid || o.totalAmount || 0) - (o.payment?.taxAmount || 0);
    groupedData[key].tax += (o.payment?.taxAmount || 0);

    if (o.fulfillmentType === "dine_in") groupedData[key].dineIn += (o.payment?.totalPaid || o.totalAmount || 0);
    else if (o.fulfillmentType === "delivery") groupedData[key].delivery += (o.payment?.totalPaid || o.totalAmount || 0);
    else groupedData[key].takeaway += (o.payment?.totalPaid || o.totalAmount || 0);
  });

  const periodBreakdown = Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period));

  const heatmap: any[] = [];
  const daysOfWeekAr = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  daysOfWeekAr.forEach((dayName, dayIndex) => {
    const hourData: { [key: number]: number } = {};
    for (let h = 9; h <= 22; h++) {
      hourData[h] = 0;
    }
    heatmap.push({ day: dayName, dayIndex, hours: hourData });
  });

  currentOrders.forEach((o: any) => {
    const dateStr = o.placedAt || o.completedAt || o.timestamp;
    if (!dateStr) return;
    const d = new Date(dateStr);
    const day = d.getDay();
    const hour = d.getHours();
    if (hour >= 9 && hour <= 22) {
      heatmap[day].hours[hour] += (o.payment?.totalPaid || o.totalAmount || 0);
    }
  });

  const flatHeatmap: any[] = [];
  heatmap.forEach(row => {
    Object.keys(row.hours).forEach(h => {
      flatHeatmap.push({
        day: row.day,
        hour: h + (parseInt(h) >= 12 ? "م" : "ص"),
        sales: row.hours[h]
      });
    });
  });

  res.json({
    periodBreakdown,
    flatHeatmap
  });
});

// 3. Payment Methods Report
app.get("/api/reports/payments", (req, res) => {
  const { from, to, compareFrom, compareTo, branchId, fulfillmentType, orderSource } = req.query;
  const branchIds = branchId ? (branchId as string).split(",") : [];
  const fulfillmentTypes = fulfillmentType ? (fulfillmentType as string).split(",") : [];
  const orderSources = orderSource ? (orderSource as string).split(",") : [];

  const currentOrders = filterOrders(orders, shifts, from as string, to as string, branchIds, fulfillmentTypes, orderSources);

  const methods = {
    cash: { amount: 0, transactions: 0, avg: 0 },
    card: { amount: 0, transactions: 0, avg: 0 },
    digital_wallet: { amount: 0, transactions: 0, avg: 0 },
    split: { amount: 0, transactions: 0, avg: 0 }
  };

  currentOrders.forEach((o: any) => {
    const total = o.payment?.totalPaid || o.totalAmount || 0;
    const method = o.payment?.method || "cash";

    if (method === "cash") {
      methods.cash.amount += total;
      methods.cash.transactions++;
    } else if (method === "card" || method === "visa" || method === "credit_card") {
      methods.card.amount += total;
      methods.card.transactions++;
    } else if (method === "digital_wallet" || method === "wallet") {
      methods.digital_wallet.amount += total;
      methods.digital_wallet.transactions++;
    } else if (method === "split") {
      methods.split.amount += total;
      methods.split.transactions++;
    } else {
      methods.cash.amount += total;
      methods.cash.transactions++;
    }
  });

  Object.keys(methods).forEach((k: any) => {
    const m = (methods as any)[k];
    m.avg = m.transactions > 0 ? (m.amount / m.transactions) : 0;
  });

  const cardNetworks = {
    Visa: 0,
    Mastercard: 0,
    Meeza: 0
  };
  currentOrders.forEach((o: any) => {
    const total = o.payment?.totalPaid || o.totalAmount || 0;
    const method = o.payment?.method || "cash";
    if (method === "card" || method === "visa" || method === "credit_card") {
      const rem = parseInt(o.id.replace(/\D/g, "") || "0") % 100;
      if (rem < 58) cardNetworks.Visa += total;
      else if (rem < 93) cardNetworks.Mastercard += total;
      else cardNetworks.Meeza += total;
    }
  });

  const aggregatorSettlement: { [key: string]: { name: string, orders: number, sales: number, commission: number, net: number, status: string } } = {
    "talabat": { name: "طلبات", orders: 0, sales: 0, commission: 0, net: 0, status: "✅ مسوّى" },
    "careem": { name: "Careem", orders: 0, sales: 0, commission: 0, net: 0, status: "⏳ في الانتظار" }
  };

  currentOrders.forEach((o: any) => {
    const total = o.payment?.totalPaid || o.totalAmount || 0;
    const source = o.orderSource || "pos";
    if (source.startsWith("aggregator:")) {
      const aggName = source.split(":")[1] || "talabat";
      const commRate = aggName === "talabat" ? (aggregatorSettings.talabatCommission || 15) : (aggregatorSettings.careemCommission || 18);
      const commission = total * (commRate / 100);
      const net = total - commission;

      if (!aggregatorSettlement[aggName]) {
        aggregatorSettlement[aggName] = { name: aggName.toUpperCase(), orders: 0, sales: 0, commission: 0, net: 0, status: "⏳ في الانتظار" };
      }

      aggregatorSettlement[aggName].orders++;
      aggregatorSettlement[aggName].sales += total;
      aggregatorSettlement[aggName].commission += commission;
      aggregatorSettlement[aggName].net += net;
    }
  });

  res.json({
    methods,
    cardNetworks,
    aggregatorSettlement: Object.values(aggregatorSettlement)
  });
});

// 4. Item Performance Report
app.get("/api/reports/items", (req, res) => {
  const { from, to, branchId, categoryId, sortBy, sortDir } = req.query;
  const branchIds = branchId ? (branchId as string).split(",") : [];

  const currentOrders = filterOrders(orders, shifts, from as string, to as string, branchIds, [], []);

  const popularDishes: { [key: string]: number } = {};
  currentOrders.forEach((ord: any) => {
    ord.items.forEach((it: any) => {
      popularDishes[it.id] = (popularDishes[it.id] || 0) + it.quantity;
    });
  });

  const matrix: any[] = menu.map((item: any) => {
    const rec = recipes.find((r: any) => r.menuItemId === item.id && r.isActive);
    const theoreticalCost = rec ? calculateRecipeCost(rec, recipes, ingredients) : 0;
    const price = item.price || 0;
    const margin = price - theoreticalCost;
    const foodCostPercent = price > 0 ? (theoreticalCost / price) * 100 : 0;
    const quantity = popularDishes[item.id] || 0;
    const revenue = quantity * price;
    const totalCost = quantity * theoreticalCost;
    const totalProfit = quantity * margin;

    return {
      id: item.id,
      name: item.name,
      price,
      category: item.category,
      theoreticalCost,
      margin,
      foodCostPercent,
      quantity,
      revenue,
      totalCost,
      totalProfit,
      classification: "Dog"
    };
  });

  const totalPopularity = matrix.reduce((sum, item) => sum + item.quantity, 0);
  const avgPopularity = matrix.length > 0 ? totalPopularity / matrix.length : 0;

  const totalMargin = matrix.reduce((sum, item) => sum + item.margin, 0);
  const avgMargin = matrix.length > 0 ? totalMargin / matrix.length : 0;

  matrix.forEach((item: any) => {
    const isPopular = item.quantity >= avgPopularity;
    const isProfitable = item.margin >= avgMargin;

    if (isPopular && isProfitable) {
      item.classification = "Star";
    } else if (isPopular && !isProfitable) {
      item.classification = "Plowhorse";
    } else if (!isPopular && isProfitable) {
      item.classification = "Puzzle";
    } else {
      item.classification = "Dog";
    }
  });

  const catSummary: { [key: string]: any } = {};
  matrix.forEach((item: any) => {
    const cat = item.category || "Uncategorized";
    if (!catSummary[cat]) {
      catSummary[cat] = {
        category: cat,
        itemsCount: 0,
        quantity: 0,
        revenue: 0,
        totalCost: 0,
        totalProfit: 0,
        avgMarginPercent: 0
      };
    }
    catSummary[cat].itemsCount++;
    catSummary[cat].quantity += item.quantity;
    catSummary[cat].revenue += item.revenue;
    catSummary[cat].totalCost += item.totalCost;
    catSummary[cat].totalProfit += item.totalProfit;
  });

  Object.keys(catSummary).forEach(cat => {
    const rev = catSummary[cat].revenue;
    const cost = catSummary[cat].totalCost;
    catSummary[cat].avgMarginPercent = rev > 0 ? ((rev - cost) / rev) * 100 : 0;
  });

  let filteredMatrix = matrix;
  if (categoryId && categoryId !== "All") {
    filteredMatrix = matrix.filter((item: any) => item.category === categoryId);
  }

  if (sortBy) {
    const dir = sortDir === "desc" ? -1 : 1;
    filteredMatrix.sort((a, b) => {
      const valA = a[sortBy as string];
      const valB = b[sortBy as string];
      if (typeof valA === "string") {
        return valA.localeCompare(valB) * dir;
      }
      return ((valA || 0) - (valB || 0)) * dir;
    });
  } else {
    filteredMatrix.sort((a, b) => b.quantity - a.quantity);
  }

  res.json({
    matrix: filteredMatrix,
    avgPopularity,
    avgMargin,
    categoryAnalysis: Object.values(catSummary)
  });
});

// 5. Inventory & Stock Report
app.get("/api/reports/inventory", (req, res) => {
  const { from, to, branchId } = req.query;
  const branchIds = branchId ? (branchId as string).split(",") : [];

  const currentOrders = filterOrders(orders, shifts, from as string, to as string, branchIds, [], []);

  const usageMap: { [key: string]: number } = {};
  currentOrders.forEach((o: any) => {
    o.items.forEach((item: any) => {
      const rec = recipes.find((r: any) => r.menuItemId === item.id && r.isActive);
      if (rec) {
        accumulateTheoreticalUsage(rec, parseFloat(item.quantity || 1), recipes, usageMap);
      }
    });
  });

  let stockValue = 0;
  let inStockCount = 0;
  let underMinCount = 0;
  let outOfStockCount = 0;

  ingredients.forEach((ing: any) => {
    if (ing.openingStock === undefined) ing.openingStock = 100;
    if (ing.receivedStock === undefined) ing.receivedStock = 0;
    if (ing.closingStock === undefined) ing.closingStock = null;
    if (ing.minStock === undefined) ing.minStock = 10;

    const currentStock = ing.closingStock !== null ? ing.closingStock : Math.max(0, ing.openingStock + ing.receivedStock - (usageMap[ing.id] || 0));
    const cost = currentStock * (ing.costPerBaseUnit || 0);
    stockValue += cost;

    if (currentStock <= 0) {
      outOfStockCount++;
    } else if (currentStock <= ing.minStock) {
      underMinCount++;
    } else {
      inStockCount++;
    }
  });

  const movements = ingredients.map((ing: any) => {
    const theoreticalUsage = usageMap[ing.id] || 0;
    const expectedClosingStock = Math.max(0, (ing.openingStock || 0) + (ing.receivedStock || 0) - theoreticalUsage);
    const actualClosingStock = ing.closingStock !== null ? ing.closingStock : expectedClosingStock;
    const actualUsage = (ing.openingStock || 0) + (ing.receivedStock || 0) - actualClosingStock;
    const varianceQty = theoreticalUsage - actualUsage;
    const varianceCost = varianceQty * (ing.costPerBaseUnit || 0);

    const wasteQty = wasteLogs
      .filter((w: any) => w.ingredientId === ing.id && (!from || w.timestamp >= from) && (!to || w.timestamp <= to))
      .reduce((sum: number, w: any) => sum + parseFloat(w.quantity || 0), 0);
    const wasteCost = wasteQty * (ing.costPerBaseUnit || 0);

    return {
      id: ing.id,
      name: ing.name,
      baseUom: ing.baseUom,
      openingStock: ing.openingStock || 0,
      receivedStock: ing.receivedStock || 0,
      theoreticalUsage,
      actualClosingStock,
      varianceQty,
      varianceCost,
      wasteQty,
      wasteCost
    };
  });

  const wasteReasons: { [key: string]: number } = {};
  const wasteIngredients: { [key: string]: number } = {};
  let totalWasteCost = 0;

  wasteLogs
    .filter((w: any) => (!from || w.timestamp >= from) && (!to || w.timestamp <= to))
    .forEach((w: any) => {
      const reason = w.reason || "أخرى";
      const ingName = w.ingredientName || "غير معروف";
      const cost = w.cost || 0;

      wasteReasons[reason] = (wasteReasons[reason] || 0) + cost;
      wasteIngredients[ingName] = (wasteIngredients[ingName] || 0) + cost;
      totalWasteCost += cost;
    });

  const purchaseOrders = [
    { id: "PO-0041", supplier: "شركة الفراخ المتحدة", amount: 7200, orders: 4, date: "2026-06-25", status: "⚠️ متأخر يومان" },
    { id: "PO-0044", supplier: "سوق خضار الجملة", amount: 4100, orders: 5, date: "2026-06-26", status: "✅ تم التسليم" },
    { id: "PO-0045", supplier: "شركة الأبيض للألبان", amount: 3200, orders: 2, date: "2026-06-27", status: "⏳ في الموعد" },
    { id: "PO-0046", supplier: "شركة النيل للزيوت", amount: 2400, orders: 1, date: "2026-06-27", status: "⏳ في الموعد" }
  ];

  res.json({
    status: {
      inStockCount,
      underMinCount,
      outOfStockCount,
      stockValue
    },
    movements,
    waste: {
      totalWasteCost,
      reasons: Object.keys(wasteReasons).map(k => ({ name: k, cost: wasteReasons[k] })),
      ingredients: Object.keys(wasteIngredients).map(k => ({ name: k, cost: wasteIngredients[k] }))
    },
    purchase: {
      purchaseOrders,
      totalPurchase: purchaseOrders.reduce((sum, p) => sum + p.amount, 0),
      purchaseCount: purchaseOrders.length,
      averageOrder: purchaseOrders.length > 0 ? purchaseOrders.reduce((sum, p) => sum + p.amount, 0) / purchaseOrders.length : 0
    }
  });
});

// 6. Costs & Profitability Report
app.get("/api/reports/profitability", (req, res) => {
  const { from, to, compareFrom, compareTo, branchId } = req.query;
  const branchIds = branchId ? (branchId as string).split(",") : [];

  const currentOrders = filterOrders(orders, shifts, from as string, to as string, branchIds, [], []);
  
  let grossSales = 0;
  let taxAmount = 0;
  let discountAmount = 0;
  let voidsAmount = 0;

  currentOrders.forEach((o: any) => {
    grossSales += (o.payment?.subtotal || o.totalAmount || 0);
    taxAmount += (o.payment?.taxAmount || 0);
    discountAmount += (o.payment?.discountAmount || 0);
  });

  orders.filter(o => {
    if (o.status !== "voided") return false;
    const d = o.placedAt || o.completedAt || o.timestamp;
    if (!d || (from && d < from) || (to && d > to)) return false;
    if (branchIds.length && !branchIds.includes("all")) {
      const bId = getOrderBranchId(o, shifts);
      if (!branchIds.includes(bId)) return false;
    }
    return true;
  }).forEach(o => {
    voidsAmount += (o.totalAmount || 0);
  });

  const netRevenue = grossSales - taxAmount - discountAmount;

  let theoreticalMaterialCost = 0;
  currentOrders.forEach((o: any) => {
    o.items.forEach((item: any) => {
      const rec = recipes.find((r: any) => r.menuItemId === item.id && r.isActive);
      const singleCost = rec ? calculateRecipeCost(rec, recipes, ingredients) : 0;
      theoreticalMaterialCost += singleCost * (item.quantity || 1);
    });
  });

  const wasteCost = wasteLogs
    .filter((w: any) => (!from || w.timestamp >= from) && (!to || w.timestamp <= to))
    .reduce((sum: number, w: any) => sum + (w.cost || 0), 0);

  const totalCOGS = theoreticalMaterialCost + wasteCost;
  const grossProfit = netRevenue - totalCOGS;

  let rentExpense = 0;
  let utilitiesExpense = 0;
  let salariesExpense = 0;
  let marketingExpense = 0;
  let maintenanceExpense = 0;
  let otherExpense = 0;

  fixedExpenses.forEach((exp: any) => {
    if (branchIds.length > 0 && !branchIds.includes("all") && exp.branchId !== "all" && !branchIds.includes(exp.branchId)) {
      return;
    }
    const amountEgp = (exp.amount || 0) / 100;
    if (exp.category === "rent") rentExpense += amountEgp;
    else if (exp.category === "utilities") utilitiesExpense += amountEgp;
    else if (exp.category === "salaries") salariesExpense += amountEgp;
    else if (exp.category === "marketing") marketingExpense += amountEgp;
    else if (exp.category === "maintenance") maintenanceExpense += amountEgp;
    else otherExpense += amountEgp;
  });

  let hrSalaries = 0;
  try {
    const staff = readJSON(path.join(DATA_DIR, "staff_users.json"), []);
    staff.forEach((emp: any) => {
      if (emp.status !== "terminated" && (branchIds.length === 0 || branchIds.includes("all") || branchIds.includes(emp.branchId || "branch-a"))) {
        hrSalaries += (emp.baseSalary || 0) / 100;
      }
    });
  } catch (e) {}

  if (salariesExpense === 0) {
    salariesExpense = hrSalaries || 28400;
  }

  let aggregatorCommission = 0;
  currentOrders.forEach((o: any) => {
    const total = o.payment?.totalPaid || o.totalAmount || 0;
    const source = o.orderSource || "pos";
    if (source.startsWith("aggregator:")) {
      const aggName = source.split(":")[1] || "talabat";
      const rate = aggName === "talabat" ? (aggregatorSettings.talabatCommission || 15) : (aggregatorSettings.careemCommission || 18);
      aggregatorCommission += total * (rate / 100);
    }
  });

  const eplfoodCommission = netRevenue * 0.01;
  const cashierPettyCash = 1100;

  const totalOpex = rentExpense + utilitiesExpense + salariesExpense + marketingExpense + maintenanceExpense + otherExpense + aggregatorCommission + eplfoodCommission + cashierPettyCash;
  const ebitda = grossProfit - totalOpex;
  const netProfit = ebitda - eplfoodCommission;

  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(m => `2026-${m}`);
  const foodCostTrend = months.map(m => {
    const mOrders = orders.filter((o: any) => o.status !== "voided" && (o.placedAt || "").startsWith(m));
    let mRevenue = 0;
    let mCost = 0;
    mOrders.forEach((o: any) => {
      mRevenue += (o.payment?.totalPaid || o.totalAmount || 0);
      o.items.forEach((item: any) => {
        const rec = recipes.find((r: any) => r.menuItemId === item.id && r.isActive);
        mCost += (rec ? calculateRecipeCost(rec, recipes, ingredients) : 0) * (item.quantity || 1);
      });
    });
    const percent = mRevenue > 0 ? (mCost / mRevenue) * 100 : 30;
    return { month: m, percent };
  });

  const fixedCosts = rentExpense + utilitiesExpense + salariesExpense;
  const contributionMarginPercent = netRevenue > 0 ? (grossProfit / netRevenue) : 0.673;
  const breakEvenPoint = contributionMarginPercent > 0 ? (fixedCosts / contributionMarginPercent) : 58842;
  const safetyMargin = netRevenue - breakEvenPoint;
  const safetyMarginPercent = netRevenue > 0 ? (safetyMargin / netRevenue) * 100 : 0;
  const breakEvenOrdersDaily = (breakEvenPoint / 30) / 145;

  res.json({
    pl: {
      revenue: { grossSales, taxAmount, discountAmount, voidsAmount, netRevenue },
      cogs: { theoreticalMaterialCost, wasteCost, totalCOGS },
      grossProfit,
      opex: { rentExpense, utilitiesExpense, salariesExpense, marketingExpense, maintenanceExpense, otherExpense, aggregatorCommission, eplfoodCommission, cashierPettyCash, totalOpex },
      ebitda,
      netProfit
    },
    foodCostTrend,
    breakEven: {
      fixedCosts,
      contributionMarginPercent,
      breakEvenPoint,
      safetyMargin,
      safetyMarginPercent,
      breakEvenOrdersDaily
    }
  });
});

// 7. Branch Comparison Report
app.get("/api/reports/branches", (req, res) => {
  const { from, to } = req.query;

  const currentOrders = filterOrders(orders, shifts, from as string, to as string, [], [], []);

  const data = branchesList.map((branch: any) => {
    const bOrders = currentOrders.filter(o => getOrderBranchId(o, shifts) === branch.id);
    const sales = bOrders.reduce((sum, o) => sum + (o.payment?.totalPaid || o.totalAmount || 0), 0);
    const ordersCount = bOrders.length;
    const avgOrderValue = ordersCount > 0 ? sales / ordersCount : 0;

    let theoreticalCost = 0;
    bOrders.forEach((o: any) => {
      o.items.forEach((item: any) => {
        const rec = recipes.find((r: any) => r.menuItemId === item.id && r.isActive);
        theoreticalCost += (rec ? calculateRecipeCost(rec, recipes, ingredients) : 0) * (item.quantity || 1);
      });
    });
    const costPercent = sales > 0 ? (theoreticalCost / sales) * 100 : 31.9;

    const bAllOrdersWithVoids = orders.filter(o => {
      const d = o.placedAt || o.completedAt || o.timestamp;
      if (!d || (from && d < from) || (to && d > to)) return false;
      return getOrderBranchId(o, shifts) === branch.id;
    });
    const voidedCount = bAllOrdersWithVoids.filter(o => o.status === "voided").length;
    const totalCountWithVoids = bAllOrdersWithVoids.length;
    const cancellationRate = totalCountWithVoids > 0 ? (voidedCount / totalCountWithVoids) * 100 : 0;

    let cashSales = 0;
    bOrders.forEach((o: any) => {
      const method = o.payment?.method || "cash";
      if (method === "cash") cashSales += (o.payment?.totalPaid || o.totalAmount || 0);
      else if (method === "split" && o.payment?.splits) {
        o.payment.splits.forEach((sp: any) => {
          if (sp.method === "cash") cashSales += sp.amount;
        });
      }
    });
    const cashPercent = sales > 0 ? (cashSales / sales) * 100 : 60;
    const cardPercent = 100 - cashPercent;

    return {
      id: branch.id,
      name: branch.name,
      nameAr: branch.nameAr,
      sales,
      ordersCount,
      avgOrderValue,
      costPercent,
      cancellationRate,
      cashPercent,
      cardPercent,
      growth: 12,
      percentOfTotal: 0
    };
  });

  const totalSalesAll = data.reduce((sum, b) => sum + b.sales, 0);
  data.forEach(b => {
    b.percentOfTotal = totalSalesAll > 0 ? (b.sales / totalSalesAll) * 100 : 0;
  });

  const anomalies: any[] = [];
  data.forEach(b => {
    if (b.cancellationRate > 4.0) {
      anomalies.push({
        branchId: b.id,
        branchName: b.nameAr,
        severity: "warning",
        message: `نسبة إلغاء ${b.cancellationRate.toFixed(1)}% — ضعف متوسط بقية الفروع`
      });
    }
    if (b.costPercent > 33.0) {
      anomalies.push({
        branchId: b.id,
        branchName: b.nameAr,
        severity: "warning",
        message: `متوسط تكلفة ${b.costPercent.toFixed(1)}% — أعلى من نسبة التكلفة المستهدفة 30%`
      });
    }
    if (b.growth > 15) {
      anomalies.push({
        branchId: b.id,
        branchName: b.nameAr,
        severity: "success",
        message: `نمو مبيعات ممتاز بنسبة ${b.growth}% مقارنة بالفترة السابقة!`
      });
    }
  });

  res.json({
    branches: data,
    anomalies
  });
});

// Fixed Expenses Configuration APIs
app.get("/api/reports/fixed-expenses", (req, res) => {
  res.json(fixedExpenses);
});

app.post("/api/reports/fixed-expenses", (req, res) => {
  const { branchId, name, nameAr, category, amount, frequency, effectiveFrom, notes } = req.body;
  if (!name || !category || amount === undefined) {
    return res.status(400).json({ error: "Name, category and amount are required" });
  }

  const newExp = {
    id: `exp-${Date.now()}`,
    branchId: branchId || "all",
    name,
    nameAr: nameAr || name,
    category,
    amount: parseInt(amount) || 0,
    frequency: frequency || "monthly",
    effectiveFrom: effectiveFrom || new Date().toISOString().substring(0, 7),
    notes
  };

  fixedExpenses.push(newExp);
  writeJSON(FIXED_EXPENSES_FILE, fixedExpenses);
  res.status(201).json(newExp);
});

app.delete("/api/reports/fixed-expenses/:id", (req, res) => {
  const { id } = req.params;
  const idx = fixedExpenses.findIndex((e: any) => e.id === id);
  if (idx === -1) return res.status(404).json({ error: "Expense not found" });

  fixedExpenses.splice(idx, 1);
  writeJSON(FIXED_EXPENSES_FILE, fixedExpenses);
  res.json({ success: true });
});

app.post("/api/shifts/open", (req, res) => {
  const { branchId, branchName, registerId, registerName, cashierId, cashierName, pin, openingFloat } = req.body;

  if (!branchId || !registerId || !cashierName || openingFloat === undefined) {
    return res.status(400).json({ error: "Missing required fields to open shift." });
  }

  // Enforce Cashier PIN Password validation if any cashiers are configured for the branch
  const staff = readJSON(STAFF_USERS_FILE, []);
  const branchCashiers = staff.filter((s: any) => s.branchId === branchId && s.role === "cashier" && s.status !== "terminated");
  
  if (branchCashiers.length > 0) {
    if (!pin) {
      return res.status(401).json({ error: "برجاء إدخال الرقم السري (PIN) الخاص بالكاشير المصرح له." });
    }
    const matchedCashier = staff.find((s: any) => 
      (s.id === cashierId || s.name.toLowerCase() === cashierName.toLowerCase()) && 
      s.branchId === branchId && 
      s.role === "cashier" && 
      s.status !== "terminated"
    );

    if (!matchedCashier) {
      return res.status(404).json({ error: "موظف الكاشير المحدد غير مسجل في هذا الفرع!" });
    }

    if (matchedCashier.pin !== pin) {
      return res.status(401).json({ error: "الرقم السري المدخل غير صحيح! برجاء التحقق والمحاولة مرة أخرى." });
    }
  }

  const alreadyOpen = shifts.find((s: any) => s.branchId === branchId && s.registerId === registerId && s.status === "open");
  if (alreadyOpen) {
    return res.status(400).json({ error: `Register '${registerName || registerId}' already has an active open shift (#${alreadyOpen.shiftNumber}).` });
  }

  const branchShifts = shifts.filter((s: any) => s.branchId === branchId);
  const maxNum = branchShifts.reduce((max: number, s: any) => s.shiftNumber > max ? s.shiftNumber : max, 0);
  const nextNum = maxNum + 1;

  const newShift = {
    id: `shift-${Date.now()}`,
    shiftNumber: nextNum,
    branchId,
    branchName: branchName || "Main Branch",
    registerId,
    registerName: registerName || "Register 1",
    cashierId: cashierId || "user-1",
    cashierName,
    openedAt: new Date().toISOString(),
    closedAt: null,
    openingFloat: parseFloat(openingFloat),
    declaredCash: null,
    expectedCash: null,
    variance: null,
    status: "open" as const,
    cashMovements: [],
    riderSettlements: []
  };

  shifts.push(newShift);
  writeJSON(SHIFTS_FILE, shifts);

  res.status(201).json({
    ...newShift,
    liveStats: calculateShiftStats(newShift, orders)
  });
});

app.post("/api/shifts/:id/close", (req, res) => {
  const { id } = req.params;
  const { declaredCash, managerPin, managerName } = req.body;

  if (declaredCash === undefined) {
    return res.status(400).json({ error: "Please enter counted cash in drawer to close shift." });
  }

  const shiftIdx = shifts.findIndex((s: any) => s.id === id);
  if (shiftIdx === -1) {
    return res.status(404).json({ error: "Shift not found." });
  }

  const shift = shifts[shiftIdx];
  if (shift.status !== "open") {
    return res.status(400).json({ error: "This shift is already closed." });
  }

  const stats = calculateShiftStats(shift, orders);
  const expectedCash = stats.cashSummary.expectedInDrawer;
  const variance = parseFloat(declaredCash) - expectedCash;

  const absVariance = Math.abs(variance);
  if (absVariance > 5.00) {
    if (!managerPin) {
      return res.status(400).json({
        error: `Variance of $${variance.toFixed(2)} exceeds threshold ($5.00). Manager PIN is required to approve closing.`,
        requiresApproval: true
      });
    }
    if (!isAuthorizedManagerPin(managerPin)) {
      return res.status(400).json({ error: "Invalid Manager PIN." });
    }
    const authMgr = staffUsers.find((s: any) => s.pin === managerPin && s.status === "active" && (s.role === "manager" || s.role === "owner" || s.role === "admin" || s.role === "org_admin"));
    shift.voidApprovedBy = authMgr ? authMgr.name : (managerName || "Authorized Manager");
  }

  shift.status = "closed" as const;
  shift.closedAt = new Date().toISOString();
  shift.declaredCash = parseFloat(declaredCash);
  shift.expectedCash = expectedCash;
  shift.variance = variance;

  writeJSON(SHIFTS_FILE, shifts);
  res.json({
    ...shift,
    liveStats: calculateShiftStats(shift, orders)
  });
});

app.post("/api/shifts/:id/force-close", (req, res) => {
  const { id } = req.params;
  const { managerName, managerPin } = req.body;

  const { role } = getContext(req);
  const isPlatformOwner = role === "org_admin" || role === "super_admin" || role === "owner";

  if (!isPlatformOwner && !isAuthorizedManagerPin(managerPin)) {
    return res.status(403).json({ error: "Action denied. Invalid or missing Manager PIN required to force close cashier shifts." });
  }

  const shiftIdx = shifts.findIndex((s: any) => s.id === id);
  if (shiftIdx === -1) return res.status(404).json({ error: "Shift not found." });

  const shift = shifts[shiftIdx];
  if (shift.status !== "open") {
    return res.status(400).json({ error: "Shift is not open." });
  }

  const stats = calculateShiftStats(shift, orders);
  const expectedCash = stats.cashSummary.expectedInDrawer;

  const authMgr = staffUsers.find((s: any) => s.pin === managerPin && s.status === "active" && (s.role === "manager" || s.role === "owner" || s.role === "admin" || s.role === "org_admin"));
  const actualManagerName = authMgr ? authMgr.name : (isPlatformOwner ? "Platform Owner / Auditor" : (managerName || "Admin"));

  shift.status = "force_closed" as const;
  shift.closedAt = new Date().toISOString();
  shift.declaredCash = expectedCash;
  shift.expectedCash = expectedCash;
  shift.variance = 0;
  shift.forceClosedBy = actualManagerName;
  shift.forceClosedAt = new Date().toISOString();

  writeJSON(SHIFTS_FILE, shifts);

  addAuditLog(
    "FORCE_CLOSE_SHIFT",
    `Shift #${shift.shiftNumber} force closed by manager ${actualManagerName}. Expected cash in drawer: $${expectedCash.toFixed(2)}`,
    "Discrepancy audit override",
    undefined,
    "manager"
  );

  res.json({
    ...shift,
    liveStats: calculateShiftStats(shift, orders)
  });
});

app.post("/api/shifts/:id/void", (req, res) => {
  try {
    const { id } = req.params;
    const { reason, managerName, managerPin } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Reason is required to void a shift." });
    }

    if (!isAuthorizedManagerPin(managerPin)) {
      return res.status(403).json({ error: "Action denied. Invalid or missing Manager PIN required to void shifts." });
    }

    const shiftIdx = shifts.findIndex((s: any) => s.id === id);
    if (shiftIdx === -1) return res.status(404).json({ error: "Shift not found." });

    const shift = shifts[shiftIdx];
    const authMgr = staffUsers.find((s: any) => s.pin === managerPin && s.status === "active" && (s.role === "manager" || s.role === "owner" || s.role === "admin" || s.role === "org_admin"));
    const actualManagerName = authMgr ? authMgr.name : (managerName || "Manager");

    shift.status = "voided" as const;
    shift.voidReason = reason;
    shift.voidApprovedBy = actualManagerName;

    writeJSON(SHIFTS_FILE, shifts);

    addAuditLog(
      "VOID_SHIFT",
      `Shift #${shift.shiftNumber} voided and archived by manager ${actualManagerName}.`,
      reason,
      undefined,
      "manager"
    );

    return res.json({
      ...shift,
      liveStats: calculateShiftStats(shift, orders)
    });
  } catch (error: any) {
    console.error("Error in void shift endpoint:", error);
    return res.status(500).json({ error: error?.message || "Internal server error during shift void operation." });
  }
});

app.post("/api/shifts/:id/movements", (req, res) => {
  const { id } = req.params;
  const { type, amount, category, reason, userId, userName, managerApproved, managerName, managerPin } = req.body;

  if (!type || amount === undefined || !reason || !category) {
    return res.status(400).json({ error: "Missing required fields for cash movement." });
  }

  const shiftIdx = shifts.findIndex((s: any) => s.id === id);
  if (shiftIdx === -1) return res.status(404).json({ error: "Shift not found." });

  const shift = shifts[shiftIdx];
  if (shift.status !== "open") {
    return res.status(400).json({ error: "Cannot add cash movements to a closed shift." });
  }

  const amtVal = parseFloat(amount);
  if ((type === "paid_out" || type === "expense") && amtVal > 50.00) {
    if (!isAuthorizedManagerPin(managerPin)) {
      return res.status(400).json({
        error: `Cash transaction of $${amtVal.toFixed(2)} exceeds petty cash approval threshold ($50.00). Manager PIN is required to authorize.`,
        requiresApproval: true
      });
    }
  }

  const authMgr = staffUsers.find((s: any) => s.pin === managerPin && s.status === "active" && (s.role === "manager" || s.role === "owner" || s.role === "admin" || s.role === "org_admin"));
  const actualManagerName = authMgr ? authMgr.name : (managerName || "Authorized Manager");

  const newMovement = {
    id: `mvt-${Date.now()}`,
    type,
    amount: amtVal,
    category,
    reason,
    timestamp: new Date().toISOString(),
    userId: userId || "cashier",
    userName: userName || "Cashier",
    managerApproved: ((type === "paid_out" || type === "expense") && amtVal > 50.00) ? true : !!managerApproved,
    managerName: ((type === "paid_out" || type === "expense") && amtVal > 50.00) ? actualManagerName : (managerName || null)
  };

  shift.cashMovements.push(newMovement);
  writeJSON(SHIFTS_FILE, shifts);

  if ((type === "paid_out" || type === "expense") && amtVal > 50.00) {
    addAuditLog(
      "PETTY_CASH_EXPENSE",
      `Large cash movement of $${amtVal.toFixed(2)} (${category}: ${reason}) approved by manager ${actualManagerName}`,
      reason,
      undefined,
      "manager"
    );
  }

  res.status(201).json({
    ...shift,
    liveStats: calculateShiftStats(shift, orders)
  });
});

app.post("/api/shifts/:id/rider-settlements", (req, res) => {
  const { id } = req.params;
  const { riderName, recordedBy } = req.body;
  const amount = req.body.amount !== undefined ? req.body.amount : req.body.settledAmount;

  if (!riderName || amount === undefined) {
    return res.status(400).json({ error: "Rider name and settlement amount are required." });
  }

  const shiftIdx = shifts.findIndex((s: any) => s.id === id);
  if (shiftIdx === -1) return res.status(404).json({ error: "Shift not found." });

  const shift = shifts[shiftIdx];
  if (shift.status !== "open") {
    return res.status(400).json({ error: "Cannot settle riders on a closed shift." });
  }

  const newSettlement = {
    id: `stl-${Date.now()}`,
    riderName,
    amount: parseFloat(amount),
    timestamp: new Date().toISOString(),
    recordedBy: recordedBy || "Cashier"
  };

  shift.riderSettlements.push(newSettlement);
  writeJSON(SHIFTS_FILE, shifts);

  res.status(201).json({
    ...shift,
    liveStats: calculateShiftStats(shift, orders)
  });
});

/* ==================== HR, ATTENDANCE, PAYROLL & BIOMETRIC API ENDPOINTS ==================== */

// --- Staff Endpoints ---
app.get("/api/staff", (req, res) => {
  const list = readJSON(STAFF_USERS_FILE, []);
  res.json(list);
});

app.post("/api/staff", (req, res) => {
  const list = readJSON(STAFF_USERS_FILE, []);
  const newStaff = {
    id: `staff-${Date.now()}`,
    name: req.body.name,
    role: req.body.role || "cashier",
    pin: req.body.pin || "1234",
    employeeCode: req.body.employeeCode || `EMP-${String(list.length + 1).padStart(3, "0")}`,
    nationalId: req.body.nationalId || "",
    phone: req.body.phone || "",
    address: req.body.address || "",
    hireDate: req.body.hireDate || new Date().toISOString(),
    jobTitle: req.body.jobTitle || req.body.role || "Staff",
    department: req.body.department || "FOH",
    branchId: req.body.branchId || "branch-a",
    employmentType: req.body.employmentType || "full_time",
    salaryType: req.body.salaryType || "monthly",
    baseSalary: parseInt(req.body.baseSalary) || 0,
    hourlyRate: parseInt(req.body.hourlyRate) || 0,
    overtimeRate: parseFloat(req.body.overtimeRate) || 1.5,
    biometricId: req.body.biometricId || "",
    biometricDeviceId: req.body.biometricDeviceId || "",
    allowances: req.body.allowances || [],
    deductions: req.body.deductions || [],
    status: req.body.status || "active",
    createdBy: req.body.createdBy || "owner",
    updatedAt: new Date().toISOString(),
    lastModifiedBy: "owner"
  };

  list.push(newStaff);
  writeJSON(STAFF_USERS_FILE, list);
  res.status(201).json(newStaff);
});

app.patch("/api/staff/:id", (req, res) => {
  const list = readJSON(STAFF_USERS_FILE, []);
  const idx = list.findIndex((s: any) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Staff not found" });

  list[idx] = {
    ...list[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
    lastModifiedBy: "owner"
  };

  writeJSON(STAFF_USERS_FILE, list);
  res.json(list[idx]);
});

app.delete("/api/staff/:id", (req, res) => {
  const list = readJSON(STAFF_USERS_FILE, []);
  const idx = list.findIndex((s: any) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Staff not found" });

  list[idx].status = "terminated";
  list[idx].terminationDate = new Date().toISOString();
  list[idx].terminationReason = req.body.reason || "Terminated by manager";
  list[idx].updatedAt = new Date().toISOString();

  writeJSON(STAFF_USERS_FILE, list);
  res.json(list[idx]);
});

// --- Attendance Endpoints ---
app.get("/api/attendance", (req, res) => {
  const logs = readJSON(ATTENDANCE_LOGS_FILE, []);
  const { branchId, date, employeeId } = req.query;
  let filtered = logs;

  if (branchId) filtered = filtered.filter((l: any) => l.branchId === branchId);
  if (date) filtered = filtered.filter((l: any) => l.date === date);
  if (employeeId) filtered = filtered.filter((l: any) => l.employeeId === employeeId);

  res.json(filtered);
});

app.get("/api/attendance/live", (req, res) => {
  const logs = readJSON(ATTENDANCE_LOGS_FILE, []);
  const todayStr = new Date().toISOString().split("T")[0];
  const live = logs.filter((l: any) => l.date === todayStr && l.checkIn && !l.checkOut);
  res.json(live);
});

app.get("/api/attendance/summary", (req, res) => {
  const logs = readJSON(ATTENDANCE_LOGS_FILE, []);
  const staff = readJSON(STAFF_USERS_FILE, []);
  const { branchId, from, to } = req.query;

  const summary = staff.map((emp: any) => {
    const empLogs = logs.filter((l: any) => {
      const isEmp = l.employeeId === emp.id;
      const matchesBranch = !branchId || l.branchId === branchId;
      const matchesFrom = !from || l.date >= from;
      const matchesTo = !to || l.date <= to;
      return isEmp && matchesBranch && matchesFrom && matchesTo;
    });

    const presentDays = empLogs.filter((l: any) => l.status === "present").length;
    const absentDays = empLogs.filter((l: any) => l.status === "absent").length;
    const lateDays = empLogs.filter((l: any) => l.status === "late").length;
    const leaveDays = empLogs.filter((l: any) => l.status === "leave").length;
    const totalHoursWorked = empLogs.reduce((sum: number, l: any) => sum + (l.hoursWorked || 0), 0);
    const overtimeHours = empLogs.reduce((sum: number, l: any) => sum + (l.overtimeHours || 0), 0);

    return {
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.name,
      presentDays,
      absentDays,
      lateDays,
      leaveDays,
      totalHoursWorked,
      overtimeHours
    };
  });

  res.json(summary);
});

app.post("/api/attendance/manual-entry", (req, res) => {
  const logs = readJSON(ATTENDANCE_LOGS_FILE, []);
  const staff = readJSON(STAFF_USERS_FILE, []);
  const { employeeId, date, checkIn, checkOut, manualEntryNote, checkInSource, checkOutSource, status } = req.body;

  const emp = staff.find((s: any) => s.id === employeeId);
  if (!emp) return res.status(404).json({ error: "Employee not found" });

  const hoursWorked = checkIn && checkOut ? (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60) : 0;
  const regularHours = Math.min(8, hoursWorked);
  const overtimeHours = Math.max(0, hoursWorked - 8);

  const newLog = {
    id: `att-${Date.now()}`,
    employeeId,
    employeeCode: emp.employeeCode,
    employeeName: emp.name,
    branchId: emp.branchId,
    date: date || new Date().toISOString().split("T")[0],
    checkIn: checkIn || null,
    checkOut: checkOut || null,
    checkInSource: checkInSource || "manual",
    checkOutSource: checkOutSource || "manual",
    checkInEnteredBy: "owner",
    checkOutEnteredBy: "owner",
    manualEntryNote,
    hoursWorked: parseFloat(hoursWorked.toFixed(2)),
    regularHours: parseFloat(regularHours.toFixed(2)),
    overtimeHours: parseFloat(overtimeHours.toFixed(2)),
    status: status || "present",
    lateMinutes: 0,
    earlyDepartureMinutes: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  logs.push(newLog);
  writeJSON(ATTENDANCE_LOGS_FILE, logs);
  res.status(201).json(newLog);
});

app.patch("/api/attendance/:id/correct", (req, res) => {
  const logs = readJSON(ATTENDANCE_LOGS_FILE, []);
  const idx = logs.findIndex((l: any) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Log not found" });

  const { checkIn, checkOut, manualEntryNote, status } = req.body;
  const log = logs[idx];

  const updatedCheckIn = checkIn !== undefined ? checkIn : log.checkIn;
  const updatedCheckOut = checkOut !== undefined ? checkOut : log.checkOut;

  const hoursWorked = updatedCheckIn && updatedCheckOut ? (new Date(updatedCheckOut).getTime() - new Date(updatedCheckIn).getTime()) / (1000 * 60 * 60) : 0;
  const regularHours = Math.min(8, hoursWorked);
  const overtimeHours = Math.max(0, hoursWorked - 8);

  logs[idx] = {
    ...log,
    checkIn: updatedCheckIn,
    checkOut: updatedCheckOut,
    status: status || log.status,
    hoursWorked: parseFloat(hoursWorked.toFixed(2)),
    regularHours: parseFloat(regularHours.toFixed(2)),
    overtimeHours: parseFloat(overtimeHours.toFixed(2)),
    manualEntryNote: manualEntryNote || log.manualEntryNote,
    checkInEnteredBy: "owner",
    checkOutEnteredBy: "owner",
    checkInSource: "manual",
    checkOutSource: "manual",
    updatedAt: new Date().toISOString()
  };

  writeJSON(ATTENDANCE_LOGS_FILE, logs);
  res.json(logs[idx]);
});

// --- Schedule Endpoints ---
app.get("/api/schedules", (req, res) => {
  const schedules = readJSON(STAFF_SCHEDULES_FILE, []);
  const { branchId, week } = req.query;
  let filtered = schedules;

  if (branchId) filtered = filtered.filter((s: any) => s.branchId === branchId);
  if (week) filtered = filtered.filter((s: any) => s.weekStartDate === week);

  res.json(filtered);
});

app.post("/api/schedules", (req, res) => {
  const schedules = readJSON(STAFF_SCHEDULES_FILE, []);
  const { employeeId, branchId, weekStartDate, days } = req.body;

  const filtered = schedules.filter((s: any) => !(s.employeeId === employeeId && s.weekStartDate === weekStartDate));

  const newSchedule = {
    id: `sch-${Date.now()}`,
    employeeId,
    branchId: branchId || "branch-a",
    weekStartDate,
    days,
    createdBy: "owner",
    createdAt: new Date().toISOString()
  };

  filtered.push(newSchedule);
  writeJSON(STAFF_SCHEDULES_FILE, filtered);
  res.status(201).json(newSchedule);
});

// --- Leave Endpoints ---
app.get("/api/leave", (req, res) => {
  const requests = readJSON(LEAVE_REQUESTS_FILE, []);
  const { branchId, status } = req.query;
  let filtered = requests;

  if (branchId) filtered = filtered.filter((r: any) => r.branchId === branchId);
  if (status) filtered = filtered.filter((r: any) => r.status === status);

  res.json(filtered);
});

app.post("/api/leave", (req, res) => {
  const requests = readJSON(LEAVE_REQUESTS_FILE, []);
  const staff = readJSON(STAFF_USERS_FILE, []);
  const { employeeId, leaveType, startDate, endDate, reason } = req.body;

  const emp = staff.find((s: any) => s.id === employeeId);
  if (!emp) return res.status(404).json({ error: "Employee not found" });

  const totalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const newRequest = {
    id: `leave-${Date.now()}`,
    employeeId,
    employeeName: emp.name,
    branchId: emp.branchId,
    leaveType,
    startDate,
    endDate,
    totalDays,
    reason,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  requests.push(newRequest);
  writeJSON(LEAVE_REQUESTS_FILE, requests);
  res.status(201).json(newRequest);
});

app.patch("/api/leave/:id/approve", (req, res) => {
  const requests = readJSON(LEAVE_REQUESTS_FILE, []);
  const idx = requests.findIndex((r: any) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Leave request not found" });

  const { reviewNote } = req.body;
  requests[idx].status = "approved";
  requests[idx].reviewedBy = "owner";
  requests[idx].reviewedAt = new Date().toISOString();
  requests[idx].reviewNote = reviewNote || "Approved";

  const logs = readJSON(ATTENDANCE_LOGS_FILE, []);
  const reqObj = requests[idx];
  const start = new Date(reqObj.startDate);
  const end = new Date(reqObj.endDate);
  const staff = readJSON(STAFF_USERS_FILE, []);
  const emp = staff.find((s: any) => s.id === reqObj.employeeId);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dStr = d.toISOString().split("T")[0];
    const logIdx = logs.findIndex((l: any) => l.employeeId === reqObj.employeeId && l.date === dStr);
    
    const leaveLog = {
      id: logIdx !== -1 ? logs[logIdx].id : `att-leave-${Date.now()}-${dStr}`,
      employeeId: reqObj.employeeId,
      employeeCode: emp ? emp.employeeCode : "EMP-000",
      employeeName: emp ? emp.name : reqObj.employeeName,
      branchId: reqObj.branchId,
      date: dStr,
      checkIn: null,
      checkOut: null,
      checkInSource: "system" as const,
      checkOutSource: "system" as const,
      hoursWorked: 0,
      regularHours: 0,
      overtimeHours: 0,
      status: "leave" as const,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      leaveRequestId: reqObj.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (logIdx !== -1) {
      logs[logIdx] = leaveLog;
    } else {
      logs.push(leaveLog);
    }
  }

  writeJSON(ATTENDANCE_LOGS_FILE, logs);
  writeJSON(LEAVE_REQUESTS_FILE, requests);
  res.json(requests[idx]);
});

app.patch("/api/leave/:id/reject", (req, res) => {
  const requests = readJSON(LEAVE_REQUESTS_FILE, []);
  const idx = requests.findIndex((r: any) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Leave request not found" });

  const { reviewNote } = req.body;
  requests[idx].status = "rejected";
  requests[idx].reviewedBy = "owner";
  requests[idx].reviewedAt = new Date().toISOString();
  requests[idx].reviewNote = reviewNote || "Rejected";

  writeJSON(LEAVE_REQUESTS_FILE, requests);
  res.json(requests[idx]);
});

app.get("/api/leave/balance/:employeeId", (req, res) => {
  const requests = readJSON(LEAVE_REQUESTS_FILE, []);
  const approved = requests.filter((r: any) => r.employeeId === req.params.employeeId && r.status === "approved");
  const totalDaysUsed = approved.reduce((sum: number, r: any) => sum + r.totalDays, 0);
  const entitlement = parseInt(process.env.HR_ANNUAL_LEAVE_DAYS || "21");
  res.json({
    entitlement,
    used: totalDaysUsed,
    remaining: entitlement - totalDaysUsed
  });
});

// --- Payroll Endpoints ---
app.get("/api/payroll/:period", (req, res) => {
  const runs = readJSON(PAYROLL_RUNS_FILE, []);
  const run = runs.find((r: any) => r.period === req.params.period);
  if (!run) return res.status(404).json({ error: "Payroll run not found for this period" });
  res.json(run);
});

app.post("/api/payroll/calculate", (req, res) => {
  const { branchId, period } = req.body;
  const staff = readJSON(STAFF_USERS_FILE, []);
  const logs = readJSON(ATTENDANCE_LOGS_FILE, []);

  const activeStaff = staff.filter((s: any) => s.branchId === branchId && s.status !== "terminated");

  const [year, month] = period.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  
  let workingDaysCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    if (dayOfWeek !== 5 && dayOfWeek !== 6) { // Exclude Fri/Sat
      workingDaysCount++;
    }
  }
  if (workingDaysCount === 0) workingDaysCount = 26;

  const entries: any[] = [];
  let grossPayroll = 0;
  let totalAllowances = 0;
  let totalDeductions = 0;
  let totalOvertimePay = 0;
  let netPayroll = 0;

  for (const emp of activeStaff) {
    const empLogs = logs.filter((l: any) => {
      const logYearMonth = l.date.substring(0, 7);
      return l.employeeId === emp.id && logYearMonth === period;
    });

    const presentLogs = empLogs.filter((l: any) => l.status === "present" || l.status === "late");
    const absentLogs = empLogs.filter((l: any) => l.status === "absent");
    const leaveLogs = empLogs.filter((l: any) => l.status === "leave");
    
    const presentDays = presentLogs.length;
    const absentDays = absentLogs.length;
    const leaveDays = leaveLogs.length;
    const lateDays = empLogs.filter((l: any) => l.status === "late").length;
    
    const totalHoursWorked = empLogs.reduce((sum: number, l: any) => sum + (l.hoursWorked || 0), 0);
    const overtimeHours = empLogs.reduce((sum: number, l: any) => sum + (l.overtimeHours || 0), 0);

    const baseSalary = emp.baseSalary || 0;
    const dailyRate = Math.round(baseSalary / workingDaysCount);
    
    const absentDeduction = absentDays * dailyRate;
    
    const totalLateMinutes = empLogs.reduce((sum: number, l: any) => sum + (l.lateMinutes || 0), 0);
    const hourlyRateCalculated = emp.hourlyRate || Math.round(baseSalary / (workingDaysCount * 8));
    const lateDeduction = Math.round(totalLateMinutes * (hourlyRateCalculated / 60));

    const overtimePay = Math.round(overtimeHours * hourlyRateCalculated * (emp.overtimeRate || 1.5));

    const empAllowancesSum = (emp.allowances || [])
      .filter((a: any) => a.active)
      .reduce((sum: number, a: any) => {
        if (a.type === "fixed") return sum + a.amount;
        return sum + Math.round((baseSalary * a.amount) / 100);
      }, 0);

    const empDeductionsSum = (emp.deductions || [])
      .filter((d: any) => d.active)
      .reduce((sum: number, d: any) => {
        if (d.type === "fixed") return sum + d.amount;
        return sum + Math.round((baseSalary * d.amount) / 100);
      }, 0);

    const grossPay = baseSalary - absentDeduction - lateDeduction + overtimePay + empAllowancesSum;
    const netPay = grossPay - empDeductionsSum;

    grossPayroll += grossPay;
    totalAllowances += empAllowancesSum;
    totalDeductions += (empDeductionsSum + absentDeduction + lateDeduction);
    totalOvertimePay += overtimePay;
    netPayroll += netPay;

    entries.push({
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.name,
      workingDays: workingDaysCount,
      presentDays,
      absentDays,
      lateDays,
      leaveDays,
      totalHoursWorked: parseFloat(totalHoursWorked.toFixed(2)),
      overtimeHours: parseFloat(overtimeHours.toFixed(2)),
      baseSalary,
      dailyRate,
      absentDeduction,
      lateDeduction,
      overtimePay,
      totalAllowances: empAllowancesSum,
      totalDeductions: empDeductionsSum + absentDeduction + lateDeduction,
      grossPay,
      netPay,
      payslipId: `slip-${emp.id}-${period}`
    });
  }

  const runs = readJSON(PAYROLL_RUNS_FILE, []);
  const filteredRuns = runs.filter((r: any) => !(r.period === period && r.branchId === branchId));

  const newRun = {
    id: `pay-${Date.now()}`,
    branchId,
    period,
    status: "draft" as const,
    employees: entries,
    totals: {
      grossPayroll,
      totalAllowances,
      totalDeductions,
      totalOvertimePay,
      netPayroll,
      employeeCount: activeStaff.length
    },
    createdBy: "owner",
    createdAt: new Date().toISOString()
  };

  filteredRuns.push(newRun);
  writeJSON(PAYROLL_RUNS_FILE, filteredRuns);
  res.status(201).json(newRun);
});

app.patch("/api/payroll/:id/approve", (req, res) => {
  const runs = readJSON(PAYROLL_RUNS_FILE, []);
  const idx = runs.findIndex((r: any) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Payroll run not found" });

  runs[idx].status = "approved";
  runs[idx].approvedBy = "owner";
  runs[idx].approvedAt = new Date().toISOString();

  writeJSON(PAYROLL_RUNS_FILE, runs);
  res.json(runs[idx]);
});

app.patch("/api/payroll/:id/mark-paid", (req, res) => {
  const runs = readJSON(PAYROLL_RUNS_FILE, []);
  const idx = runs.findIndex((r: any) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Payroll run not found" });

  runs[idx].status = "paid";
  runs[idx].paidAt = new Date().toISOString();
  runs[idx].paymentMethod = req.body.paymentMethod || "bank_transfer";

  writeJSON(PAYROLL_RUNS_FILE, runs);
  res.json(runs[idx]);
});

// --- Biometric Device Endpoints ---
app.get("/api/biometric/devices", (req, res) => {
  const list = readJSON(BIOMETRIC_DEVICES_FILE, []);
  res.json(list);
});

app.post("/api/biometric/devices", (req, res) => {
  const list = readJSON(BIOMETRIC_DEVICES_FILE, []);
  const newDev = {
    id: `dev-${Date.now()}`,
    name: req.body.name,
    branchId: req.body.branchId || "branch-a",
    ipAddress: req.body.ipAddress || "127.0.0.1",
    port: parseInt(req.body.port) || 4370,
    deviceSecret: req.body.deviceSecret || `sec-${Date.now()}`,
    syncMethod: req.body.syncMethod || "push",
    lastSyncAt: new Date().toISOString(),
    status: "online" as const,
    createdAt: new Date().toISOString()
  };
  list.push(newDev);
  writeJSON(BIOMETRIC_DEVICES_FILE, list);
  res.status(201).json(newDev);
});

app.post("/api/biometric/devices/:id/sync", (req, res) => {
  const list = readJSON(BIOMETRIC_DEVICES_FILE, []);
  const idx = list.findIndex((d: any) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Device not found" });

  list[idx].lastSyncAt = new Date().toISOString();
  list[idx].status = "online";
  writeJSON(BIOMETRIC_DEVICES_FILE, list);

  const logs = readJSON(ATTENDANCE_LOGS_FILE, []);
  const staff = readJSON(STAFF_USERS_FILE, []);
  const todayStr = new Date().toISOString().split("T")[0];

  let syncedCount = 0;
  staff.forEach((emp: any) => {
    if (emp.status === "active") {
      const hasLog = logs.some((l: any) => l.employeeId === emp.id && l.date === todayStr);
      if (!hasLog) {
        const randHour = 9 + Math.floor(Math.random() * 2);
        const randMin = Math.floor(Math.random() * 60);
        const checkInTime = new Date();
        checkInTime.setHours(randHour, randMin, 0, 0);

        const checkOutTime = new Date(checkInTime);
        checkOutTime.setHours(randHour + 8, randMin + 15, 0, 0);

        const hoursWorked = 8.25;
        const status = randHour === 9 && randMin <= 15 ? "present" : "late";

        logs.push({
          id: `att-zk-${Date.now()}-${emp.id}`,
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: emp.name,
          branchId: emp.branchId,
          date: todayStr,
          checkIn: checkInTime.toISOString(),
          checkOut: checkOutTime.toISOString(),
          checkInSource: "biometric",
          checkOutSource: "biometric",
          hoursWorked,
          regularHours: 8,
          overtimeHours: 0.25,
          status,
          lateMinutes: status === "late" ? randMin : 0,
          earlyDepartureMinutes: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        syncedCount++;
      }
    }
  });

  if (syncedCount > 0) {
    writeJSON(ATTENDANCE_LOGS_FILE, logs);
  }

  res.json({ success: true, syncedCount, device: list[idx] });
});

app.post("/integrations/biometric/punch", (req, res) => {
  const { deviceId, biometricId, punchTime, punchType, secret } = req.body;
  
  const devices = readJSON(BIOMETRIC_DEVICES_FILE, []);
  const dev = devices.find((d: any) => d.id === deviceId);
  if (!dev || (dev.deviceSecret && dev.deviceSecret !== secret)) {
    return res.status(401).json({ error: "Unauthorized / Device secret verification failed" });
  }

  const staff = readJSON(STAFF_USERS_FILE, []);
  const emp = staff.find((s: any) => s.biometricId === biometricId);
  if (!emp) return res.status(404).json({ error: "Employee biometricId mapping not found" });

  const punchDate = punchTime ? punchTime.split("T")[0] : new Date().toISOString().split("T")[0];
  const logs = readJSON(ATTENDANCE_LOGS_FILE, []);

  const logIdx = logs.findIndex((l: any) => l.employeeId === emp.id && l.date === punchDate);

  if (punchType === 0) {
    const newLog = {
      id: logIdx !== -1 ? logs[logIdx].id : `att-push-${Date.now()}`,
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.name,
      branchId: emp.branchId,
      date: punchDate,
      checkIn: punchTime || new Date().toISOString(),
      checkOut: logIdx !== -1 ? logs[logIdx].checkOut : null,
      checkInSource: "biometric" as const,
      checkOutSource: logIdx !== -1 ? logs[logIdx].checkOutSource : "biometric",
      hoursWorked: 0,
      regularHours: 0,
      overtimeHours: 0,
      status: "present" as const,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (logIdx !== -1) {
      logs[logIdx] = newLog;
    } else {
      logs.push(newLog);
    }
  } else {
    if (logIdx !== -1) {
      const checkInStr = logs[logIdx].checkIn;
      const checkOutStr = punchTime || new Date().toISOString();
      const hours = checkInStr ? (new Date(checkOutStr).getTime() - new Date(checkInStr).getTime()) / (1000 * 60 * 60) : 0;
      logs[logIdx].checkOut = checkOutStr;
      logs[logIdx].checkOutSource = "biometric";
      logs[logIdx].hoursWorked = parseFloat(hours.toFixed(2));
      logs[logIdx].regularHours = parseFloat(Math.min(8, hours).toFixed(2));
      logs[logIdx].overtimeHours = parseFloat(Math.max(0, hours - 8).toFixed(2));
      logs[logIdx].updatedAt = new Date().toISOString();
    } else {
      logs.push({
        id: `att-push-${Date.now()}`,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.name,
        branchId: emp.branchId,
        date: punchDate,
        checkIn: null,
        checkOut: punchTime || new Date().toISOString(),
        checkInSource: "biometric",
        checkOutSource: "biometric",
        hoursWorked: 0,
        regularHours: 0,
        overtimeHours: 0,
        status: "present",
        lateMinutes: 0,
        earlyDepartureMinutes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  writeJSON(ATTENDANCE_LOGS_FILE, logs);
  res.json({ success: true, message: "Punch logged successfully" });
});

// Configure Vite or Production asset serving
const configureVite = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
};

// Start Server
configureVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Restaurant SaaS Server] Running at http://localhost:${PORT}`);
    syncFoundationalData(branchesList).catch((err) => {
      console.error("[Database Sync] Failed during startup sync execution:", err);
    });
  });
});
