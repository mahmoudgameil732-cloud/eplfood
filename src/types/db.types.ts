/**
 * MULTI-TENANT SAAS RESTAURANT MANAGEMENT PLATFORM - DATABASE SCHEMA TYPES
 * 
 * This file serves as the Single Source of Truth for database types across all system modules:
 * POS, KDS, Guest Portal, Rider App, Cost Control, Admin, Aggregators, HR, CRM, and Analytics.
 * All monetary amounts are stored in minor currency units (e.g., piastres, fils, cents as integers)
 * to avoid floating-point inaccuracies. All timestamps are standard ISO-8601 strings or Firestore Timestamps.
 */

// ==========================================
// COMMON ENUMS & LITERALS
// ==========================================

export type SubscriptionPlan = "starter" | "growth" | "professional" | "enterprise" | "custom";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "suspended" | "cancelled";

export type StaffRole = 
  | "platform_admin" 
  | "admin" 
  | "branch_manager" 
  | "cashier" 
  | "kitchen" 
  | "rider" 
  | "hr_manager" 
  | "accountant";

export type ManagerVerificationAction = 
  | "void_order" 
  | "void_item" 
  | "refund" 
  | "shift_close_variance" 
  | "cash_movement" 
  | "manual_price_override" 
  | "comp_item" 
  | "force_close_shift" 
  | "staff_role_change" 
  | "expense_above_threshold";

export type OrderChannel = "pos" | "guest_portal" | "kiosk" | "aggregator";

export type KdsStation = "grill" | "fryer" | "cold" | "drinks" | "expo";

export type Allergen = 
  | "gluten" 
  | "dairy" 
  | "eggs" 
  | "nuts" 
  | "peanuts" 
  | "soy" 
  | "fish" 
  | "shellfish" 
  | "sesame";

export type FulfillmentType = "dine_in" | "takeaway" | "delivery";

export type OrderSource = 
  | "pos" 
  | "guest_portal" 
  | "kiosk" 
  | "aggregator_talabat" 
  | "aggregator_careem" 
  | "aggregator_hungerstation" 
  | "aggregator_other";

export type OrderStatus = 
  | "new" 
  | "confirmed" 
  | "preparing" 
  | "ready_for_rider" 
  | "ready_for_pickup" 
  | "rider_assigned" 
  | "picked_up" 
  | "delivered" 
  | "completed" 
  | "cancelled" 
  | "voided" 
  | "refunded";

export type LineItemKdsStatus = "pending" | "in_progress" | "done" | "voided";

export type TableStatus = 
  | "available" 
  | "occupied" 
  | "bill_requested" 
  | "dirty" 
  | "reserved" 
  | "inactive";

export type ShiftStatus = "open" | "closed" | "force_closed";

export type CashMovementType = "paid_in" | "paid_out" | "safe_drop" | "opening_float" | "closing_float";

export type IngredientBaseUnit = "kg" | "g" | "liter" | "ml" | "piece" | "portion" | "box" | "case";

export type SupplierPaymentTerms = "cod" | "net_7" | "net_15" | "net_30" | "net_60";

export type StockTakeStatus = "draft" | "in_progress" | "completed" | "cancelled";

export type PurchaseOrderStatus = 
  | "draft" 
  | "pending_approval" 
  | "approved" 
  | "sent" 
  | "partially_received" 
  | "fully_received" 
  | "cancelled";

export type GoodsReceivedStatus = "draft" | "confirmed" | "invoice_matched" | "discrepancy_flagged";

export type GrnItemCondition = "accepted" | "partial_rejection" | "full_rejection";

export type ExpensePaymentMethod = "cash" | "card" | "bank_transfer";

export type CustomerGender = "male" | "female" | "unspecified";

export type LoyaltyTransactionType = "accrual" | "redemption" | "expiry" | "manual_adjustment" | "bonus";

export type PromotionType = 
  | "percentage_off" 
  | "fixed_amount_off" 
  | "bogo" 
  | "combo_bundle" 
  | "free_item" 
  | "happy_hour" 
  | "delivery_fee_off" 
  | "loyalty_multiplier";

export type ClockInOutMethod = "pin" | "qr_code" | "manager_override" | "auto_shift_close";

export type PayrollStatus = "draft" | "approved" | "paid";

export type NotificationLogChannel = "sms" | "push" | "email" | "in_app";

export type NotificationType = 
  | "order_ready" 
  | "order_status_update" 
  | "driver_assigned" 
  | "loyalty_earned" 
  | "promo" 
  | "low_stock_alert" 
  | "food_cost_alert" 
  | "shift_variance_alert" 
  | "order_auto_accept";


// ==========================================
// PHASE 0 — PLATFORM TOPOLOGY
// ==========================================

export interface Tenant {
  tenantId: string; // Time-sorted ULID doc ID
  legalName: string; // Official company name
  brandName: string; // Customer-facing brand name
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  billingEmail: string;
  defaultCurrency: string; // ISO 4217 code e.g. "EGP", "SAR"
  defaultTimezone: string; // IANA timezone e.g. "Africa/Cairo"
  defaultLocale: string; // BCP 47 locale e.g. "ar-EG"
  supportedLocales: string[]; // Enabled translations e.g. ["ar-EG", "en-US"]
  featureFlags: {
    loyalty?: boolean;
    aggregatorIntegration?: boolean;
    kiosk?: boolean;
    inventoryManagement?: boolean;
    payroll?: boolean;
    [key: string]: boolean | undefined;
  };
  createdAt: any; // Firestore server Timestamp
  suspendedAt: any | null;
  metadata?: Record<string, any>; // Internal SaaS operator audit metadata
}

export interface Register {
  registerId: string; // UUID
  name: string; // e.g. "Register 1", "Drive-Through"
  isActive: boolean;
  currentShiftId: string | null; // FK to Shifts
  lastActivityAt: any;
}

export interface DeliveryZone {
  zoneId: string;
  name: string;
  polygonCoordinates: { lat: number; lng: number }[];
  deliveryFee: number; // minor currency units
  minimumOrderValue: number; // minor currency units
}

export interface Branch {
  branchId: string; // Doc ID
  tenantId: string; // FK to Tenants
  name: Record<string, string>; // Multilingual e.g. { ar: "فرع المعادي", en: "Maadi Branch" }
  address: {
    street: string;
    city: string;
    governorate: string;
    country: string;
    postalCode?: string;
  };
  geoPoint: {
    latitude: number;
    longitude: number;
  };
  phone: string;
  email: string;
  timezone: string; // Overrides tenant level if customized
  currency: string; // Overrides tenant level if customized
  isActive: boolean;
  openingHours: Record<string, { open: string; close: string; closed: boolean }>;
  taxNumber: string; // Printed on thermal receipts
  receiptFooter?: string;
  registers: Register[];
  kdsStations: string[]; // e.g., ["grill", "fryer", "cold", "drinks"]
  deliveryZones: DeliveryZone[];
  createdAt: any;
  updatedAt: any;
}

export interface SystemSettings {
  tenantId: string; // Doc ID = tenantId
  defaultTaxRate: number; // percentage, e.g. 14 for 14% VAT
  taxInclusivePricing: boolean;
  shiftVarianceThreshold: number; // variance in minor units triggering PIN authorization
  cashMovementPinThreshold: number; // amount above which manager PIN is required
  voidPinThreshold: number; // void line item value requiring manager PIN
  refundPinRequired: boolean;
  receiptFormat: "thermal_80mm" | "thermal_58mm" | "a4";
  loyaltyPointsPerCurrency: number; // loyalty points awarded per 1 unit of currency spent
  loyaltyRedemptionRate: number; // currency multiplier equivalent per point
  foodCostTargetPercent: number; // warning limit e.g. 30%
  wasteReasonCodes: string[];
  expenseCategories: string[];
  cashMovementCategories: string[];
  orderAutoAcceptDelay: number; // seconds, 0 = manual accept
  defaultPrepTimeMinutes: number;
  updatedAt: any;
  updatedBy: string; // Staff UID
}


// ==========================================
// PHASE 1 — AUTHENTICATION & STAFF
// ==========================================

export interface ScopeHistoryEntry {
  changeId: string;
  changedAt: string;
  changedBy: string; // Staff UID
  changedByRole: StaffRole;
  previousRole: string;
  newRole: string;
  previousBranchIds: string[];
  newBranchIds: string[];
  reason: string;
  cryptographicSignature?: string; // Verification fingerprint
}

export interface StaffUser {
  uid: string; // Matches Firebase Auth UID
  tenantId: string; // Structural tenant partitioning
  branchId: string | null; // Primary branch assignment (null for enterprise managers)
  allBranchIds: string[] | null; // Multi-location visibility scopes
  role: StaffRole;
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  pin: string; // Hashed PIN for in-register transactions (Stored server-side only)
  isActive: boolean;
  hireDate: any;
  terminatedAt: any | null;
  hourlyRate: number | null; // payroll rate (minor units)
  weeklyHourTarget: number | null;
  emergencyContact: {
    name: string;
    phone: string;
  };
  photoUrl: string | null;
  customClaims: {
    role: StaffRole;
    tenantId: string;
    branchId: string | null;
  };
  lastLoginAt?: any;
  createdAt: any;
  createdBy: string; // Staff UID
  updatedAt: any;
  scopeHistory?: ScopeHistoryEntry[];
}

export interface ManagerPinVerification {
  verificationId: string; // Time-sequential trace ID
  tenantId: string;
  branchId: string;
  requestedBy: string; // Staff UID of cashier
  approvedBy: string; // Staff UID of authorizing manager
  action: ManagerVerificationAction;
  targetDocumentId: string; // Related orderId, shiftId, expenseId etc.
  approvedAt: any;
  ipAddress: string;
}


// ==========================================
// PHASE 2 — MENU SYSTEM
// ==========================================

export interface MenuCategory {
  categoryId: string; // Doc ID
  tenantId: string;
  name: Record<string, string>; // Multilingual name
  displayOrder: number;
  isArchived: boolean;
  imageUrl: string | null;
  availableChannels: OrderChannel[];
  createdAt: any;
  updatedAt: any;
  updatedBy: string;
}

export interface ModifierOption {
  optionId: string; // UUID
  name: Record<string, string>;
  priceAdjustment: number; // minor units (e.g. +500 for extra cheese)
  isDefault: boolean;
  isAvailable: boolean;
  displayOrder: number;
  allergens?: Allergen[];
  calories?: number | null;
}

export interface ModifierGroup {
  groupId: string; // UUID
  name: Record<string, string>;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  displayOrder: number;
  options: ModifierOption[];
  conditionalLogic?: {
    visibleWhen: {
      groupId: string;
      optionId: string;
    };
  } | null;
}

export interface MenuItem {
  itemId: string; // Doc ID
  tenantId: string;
  branchId: string | null; // Specific branch override (null = global menu item)
  categoryId: string; // FK to menu_categories
  name: Record<string, string>; // Multilingual name e.g., { en: "Classic Burger", ar: "برجر كلاسيك" }
  description: Record<string, string>;
  imageUrl: string | null;
  displayOrder: number;
  basePrice: number; // Base price in minor units
  channelPricing?: Record<string, number>; // Overrides per channel e.g., { delivery: 6500, talabat: 7000 }
  taxRate: number | null; // Null inherits branch system settings default
  taxIncluded: boolean | null; // Null inherits system settings
  recipeBomId: string | null; // FK to recipe_boms for inventory deductions
  theoreticalCostPrice: number | null; // minor units (calculated dynamically)
  foodCostPercent: number | null; // calculated: theoreticalCostPrice / basePrice * 100
  isAvailable: boolean; // Master 86ing flag (instant disabling)
  availableChannels: OrderChannel[];
  availableHours: Record<string, { open: string; close: string }[]> | null; // Timing windows
  kdsStation: KdsStation | null; // Routing for KDS display
  prepTimeMinutes: number;
  modifierGroups: ModifierGroup[];
  allergens: Allergen[];
  calories: number | null;
  isArchived: boolean;
  isFeatured: boolean;
  menuEngineeringClass: "star" | "plowhorse" | "puzzle" | "dog" | null;
  aggregatorMappings?: Record<string, string>; // External provider mapping IDs
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  lastModifiedBy: string;
}


// ==========================================
// PHASE 3 — ORDER SYSTEM
// ==========================================

export interface OrderItemModifierSelection {
  groupId: string;
  groupName: Record<string, string>;
  optionId: string;
  optionName: Record<string, string>;
  priceAdjustment: number; // snapshot at time of checkout
}

export interface OrderLineItem {
  lineId: string; // UUID
  menuItemId: string; // FK to menu_items
  itemName: Record<string, string>; // Denormalized name snapshot
  quantity: number;
  unitPrice: number; // snapshot (minor units)
  selectedModifiers: OrderItemModifierSelection[];
  lineSubtotal: number; // (unitPrice + modifierSum) * quantity
  taxRate: number; // snapshot tax rate
  taxAmount: number;
  discountAmount: number; // snapshot discount allocation
  lineTotal: number; // lineSubtotal + tax - discount
  kdsStation: KdsStation | null;
  kdsStatus: LineItemKdsStatus;
  kdsSentAt: any | null;
  kdsStartedAt: any | null;
  kdsDoneAt: any | null;
  courseNumber?: number | null; // Dine-in firing stage sequence
  isFired: boolean;
  isVoided: boolean;
  voidedAt: any | null;
  voidedBy: string | null;
  voidReason?: string | null;
  isComped: boolean;
  compReason?: string | null;
  theoreticalCostAtOrderTime: number | null; // Snapshot of ingredient cost values
  notes: string | null;
}

export interface PaymentRecord {
  paymentId: string; // UUID
  method: 
    | "cash" 
    | "card_visa" 
    | "card_mastercard" 
    | "card_amex" 
    | "card_other" 
    | "wallet_vodafone" 
    | "wallet_orange" 
    | "wallet_etisalat" 
    | "wallet_instapay" 
    | "loyalty_points" 
    | "aggregator_prepaid" 
    | "voucher" 
    | "complimentary";
  amount: number; // minor units
  referenceNumber: string | null; // Authorization trace codes or transaction receipts
  processedAt: any;
  isCod: boolean; // Cash on delivery status
  isSettled: boolean; // Settled status for riders
}

export interface Order {
  orderId: string; // Time-sortable ULID doc ID
  tenantId: string;
  branchId: string;
  orderNumber: number; // Sequential branch counter per day
  dailySequenceKey: string; // e.g., "branchA_2026-06-27"
  idempotencyKey: string; // Client UUID deduplication lock
  fulfillmentType: FulfillmentType;
  orderSource: OrderSource;
  status: OrderStatus;
  tableId: string | null; // FK to Tables
  tableLabel: string | null; // Denormalized display text e.g. "Table 5"
  coverCount: number | null;
  courseFireSequence?: any[] | null;
  cashierId: string; // Staff UID who initialized order
  cashierName: string;
  shiftId: string; // FK to Shifts
  registerId: string;
  customerId: string | null; // FK to Customers
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: {
    street: string;
    building: string;
    floor?: string;
    apartment?: string;
    city: string;
    geoPoint?: { latitude: number; longitude: number };
  } | null;
  deliveryZoneId: string | null;
  deliveryFee: number | null; // minor units
  riderId: string | null; // Staff UID of rider
  riderName: string | null;
  estimatedPickupTime: any | null;
  estimatedDeliveryTime: any | null;
  orderItems: OrderLineItem[];
  subtotal: number; // minor units
  taxAmount: number;
  discountAmount: number;
  discountId: string | null; // FK to promotions
  discountCode: string | null;
  deliveryFeeTotal: number;
  roundingAdjustment: number;
  totalAmount: number; // final amount in minor units
  payments: PaymentRecord[];
  totalPaid: number;
  changeGiven: number;
  loyaltyPointsEarned: number | null;
  loyaltyPointsRedeemed: number | null;
  loyaltyPointsValue: number | null; // monetary equivalent in minor units
  notes: string | null;
  internalNotes?: string | null;
  aggregatorOrderId: string | null; // External aggregator reference ID
  aggregatorCommissionRate?: number | null;
  aggregatorCommissionAmount?: number | null;
  statusHistory: { status: OrderStatus; timestamp: any; updatedBy: string }[];
  kdsCompletedAt: any | null;
  readyAt: any | null;
  pickedUpAt: any | null;
  deliveredAt: any | null;
  completedAt: any | null;
  voidedAt: any | null;
  voidedBy: string | null;
  voidReason: string | null;
  voidManagerPinVerificationId: string | null; // FK to ManagerPinVerifications
  refundedAt: any | null;
  refundedBy: string | null;
  refundReason: string | null;
  refundAmount: number | null;
  parentOrderId?: string | null; // Splitting trace
  splitType?: "by_item" | "by_seat" | "even_split" | null;
  mergedFromOrderIds?: string[] | null;
  isOfflineCreated: boolean;
  offlineSyncedAt: any | null;
  receiptPrintedAt?: any | null;
  createdAt: any; // Server timestamp
  updatedAt: any;
}


// ==========================================
// PHASE 4 — TABLE MANAGEMENT
// ==========================================

export interface Table {
  tableId: string; // Doc ID
  tenantId: string;
  branchId: string;
  label: string; // e.g. "T-05", "Bar 2"
  seatingCapacity: number;
  section: string; // e.g. "Terrace", "Main Hall"
  positionX: number; // horizontal layout percentage
  positionY: number; // vertical layout percentage
  shape: "rectangle" | "circle" | "square";
  width: number;
  height: number;
  status: TableStatus;
  currentOrderId: string | null; // FK to active Order
  reservationId: string | null;
  occupiedSince: any | null;
  isActive: boolean;
  updatedAt: any;
}


// ==========================================
// PHASE 5 — SHIFT MANAGEMENT
// ==========================================

export interface Shift {
  shiftId: string; // Doc ID
  tenantId: string;
  branchId: string;
  registerId: string;
  shiftNumber: number; // Gapless sequential counter per branch
  cashierId: string; // Staff UID
  cashierName: string;
  status: ShiftStatus;
  openedAt: any;
  closedAt: any | null;
  openingFloat: number; // minor units
  declaredCash: number | null;
  expectedCash: number | null;
  variance: number | null; // declaredCash - expectedCash
  varianceApprovedBy: string | null; // Staff UID of manager
  variancePinVerificationId: string | null; // FK to ManagerPinVerifications
  totalSales: number; // minor units
  totalOrders: number;
  totalVoids: number;
  totalRefunds: number;
  totalComps: number;
  totalCashIn: number; // Sum of paid ins
  totalCashOut: number; // Sum of paid outs / drops
  totalExpenses: number;
  paymentBreakdown: Record<string, number>; // method mapping -> total minor units
  fulfillmentBreakdown: Record<string, number>; // type mapping -> total minor units
  zReportGeneratedAt: any | null;
  zReportData: Record<string, any> | null; // Serialized daily snapshot payload
  forceClosedBy: string | null;
  forceCloseReason: string | null;
  createdAt: any;
}

export interface CashMovement {
  movementId: string; // Doc ID
  tenantId: string;
  branchId: string;
  shiftId: string; // FK to Shifts
  registerId: string;
  type: CashMovementType;
  category: string; // e.g. "Change Fund", "Supplies"
  description: string;
  amount: number; // minor units (always positive)
  actorId: string; // Staff UID
  actorName: string;
  managerPinVerificationId: string | null; // FK to ManagerPinVerifications
  receiptPhotoUrl: string | null;
  createdAt: any;
}


// ==========================================
// PHASE 6 — COST CONTROL
// ==========================================

export interface UnitConversion {
  fromUnit: string;
  toUnit: string;
  factor: number; // e.g. conversion from "piece" to "g" is 150 (g per piece)
}

export interface Ingredient {
  ingredientId: string; // Doc ID
  tenantId: string;
  branchId: string | null; // null = global template, string = branch specific inventory
  name: Record<string, string>; // Multilingual e.g., { ar: "بصل", en: "Onion" }
  sku: string; // Unique within tenant
  category: string; // e.g. Proteins, Produce
  baseUnit: IngredientBaseUnit;
  unitConversions: UnitConversion[];
  costPerBaseUnit: number; // minor units
  currentStockLevel: number; // in base units
  parLevel: number | null; // trigger limit
  reorderPoint: number | null;
  reorderQuantity: number | null;
  primarySupplierId: string | null; // FK to Suppliers
  alternativeSupplierIds: string[];
  shelfLifeDays: number | null;
  allergens: Allergen[];
  storageLocation: string | null; // e.g. "Walk-in Cooler"
  isActive: boolean;
  isArchived: boolean;
  createdAt: any;
  updatedAt: any;
  updatedBy: string;
}

export interface BomLine {
  lineId: string; // UUID
  ingredientId: string | null; // FK to ingredients
  subRecipeId: string | null; // FK to sub_recipes for nested nested recipes
  quantity: number; // in the ingredient's base unit
  unit: string;
  yieldPercent: number; // usage yield factor (default 100)
  netQuantity: number; // quantity * (yieldPercent / 100)
  costAtLastCalculation: number; // minor units
}

export interface RecipeBom {
  bomId: string; // Doc ID
  tenantId: string;
  menuItemId: string; // FK to menu_items (Only one active BOM per item)
  version: number;
  isCurrentVersion: boolean;
  displayName: string;
  portionYieldGrams: number | null;
  lines: BomLine[];
  theoreticalCostPerPortion: number; // calculated sum of line costs (minor units)
  calculatedAt: any;
  createdAt: any;
  createdBy: string;
  archivedAt: any | null;
}

export interface SubRecipe {
  subRecipeId: string; // Doc ID
  tenantId: string;
  name: Record<string, string>;
  batchYield: number;
  batchUnit: string;
  lines: BomLine[];
  theoreticalCostPerBatchUnit: number; // minor units
  linkedBomIds: string[]; // FK to RecipeBoms for recursive update triggers
  isArchived: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Supplier {
  supplierId: string; // Doc ID
  tenantId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    country: string;
  };
  taxNumber: string | null;
  paymentTerms: SupplierPaymentTerms;
  currency: string;
  rating: number | null; // calculated score (1-5)
  onTimeDeliveryRate: number | null;
  priceConsistencyScore: number | null;
  rejectionRate: number | null;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface SupplierPriceHistory {
  priceHistoryId: string; // Doc ID
  tenantId: string;
  supplierId: string;
  ingredientId: string;
  previousCostPerBaseUnit: number; // minor units
  newCostPerBaseUnit: number;
  effectiveDate: any;
  recordedBy: string; // Staff UID
  purchaseOrderId: string | null; // Link to PO if price updated during receiving
  createdAt: any;
}

export interface WasteEntry {
  wasteId: string; // Doc ID
  tenantId: string;
  branchId: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  costAtWasteTime: number; // minor units per unit
  totalWasteCost: number; // quantity * costAtWasteTime
  reasonCode: string; // from system_settings.wasteReasonCodes
  notes: string | null;
  photoUrl: string | null;
  loggedBy: string; // Staff UID
  shiftId: string | null;
  createdAt: any;
}

export interface StockTakeLine {
  lineId: string; // UUID
  ingredientId: string;
  ingredientName: string;
  unit: string;
  theoreticalQuantity: number; // system expected stock level
  countedQuantity: number | null;
  variance: number | null; // countedQuantity - theoreticalQuantity
  varianceCost: number | null; // variance * costPerBaseUnit
  countedAt: any | null;
  countedBy: string | null;
}

export interface StockTake {
  stockTakeId: string; // Doc ID
  tenantId: string;
  branchId: string;
  type: "full" | "cycle_count";
  status: StockTakeStatus;
  scheduledDate: any;
  startedAt: any | null;
  completedAt: any | null;
  conductedBy: string; // Staff UID
  approvedBy: string | null; // Manager UID
  storageLocations: string[]; // Areas counted e.g., ["Freezer", "Dry Store"]
  lines: StockTakeLine[];
  totalVarianceCost: number | null;
  notes: string | null;
  createdAt: any;
}

export interface PurchaseOrderLine {
  lineId: string;
  ingredientId: string;
  ingredientName: string;
  orderedQuantity: number;
  unit: string;
  unitCost: number; // in minor units
  lineTotal: number;
  receivedQuantity: number; // updated on GRN reception
  receivedCost: number | null;
  discrepancyFlagged: boolean;
  discrepancyNotes: string | null;
}

export interface PurchaseOrder {
  poId: string; // Doc ID
  poNumber: string; // sequential formatted string e.g. "PO-2026-0001"
  tenantId: string;
  branchId: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  subtotal: number; // minor units
  taxAmount: number;
  totalAmount: number;
  currency: string;
  expectedDeliveryDate: any;
  actualDeliveryDate: any | null;
  notes: string | null;
  createdBy: string; // Staff UID
  approvedBy: string | null;
  approvedAt: any | null;
  sentAt: any | null;
  isAutoGenerated: boolean;
  linkedLowStockIngredientIds: string[] | null;
  createdAt: any;
  updatedAt: any;
}

export interface GrnLineItem {
  lineId: string;
  poLineId: string;
  ingredientId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  unit: string;
  invoicedUnitCost: number; // minor units
  condition: GrnItemCondition;
  rejectionReason: string | null;
  rejectedQuantity: number;
}

export interface GoodsReceivedNote {
  grnId: string; // Doc ID
  tenantId: string;
  branchId: string;
  poId: string; // FK to PurchaseOrders
  supplierId: string;
  status: GoodsReceivedStatus;
  receivedAt: any;
  receivedBy: string; // Staff UID
  lines: GrnLineItem[];
  supplierInvoiceNumber: string | null;
  supplierInvoiceAmount: number | null; // minor units
  invoicePhotoUrl: string | null;
  discrepancyNotes: string | null;
  createdAt: any;
}

export interface Expense {
  expenseId: string; // Doc ID
  tenantId: string;
  branchId: string;
  shiftId: string | null; // linked open register shift (if recorded inside drawer)
  category: string; // e.g. "Supplies", "Repairs"
  description: string;
  amount: number; // minor units
  paymentMethod: ExpensePaymentMethod;
  receiptPhotoUrl: string | null;
  vendorName: string | null;
  loggedBy: string; // Staff UID
  managerPinVerificationId: string | null; // FK to ManagerPinVerifications (if above threshold)
  expenseDate: any;
  createdAt: any;
}


// ==========================================
// PHASE 7 — DELIVERY & RIDERS
// ==========================================

export interface RiderSettlement {
  settlementId: string; // Doc ID
  tenantId: string;
  branchId: string;
  riderId: string; // Staff UID (role=rider)
  riderName: string;
  settledOrderIds: string[]; // FK to Orders (delivered COD orders)
  totalCodAmount: number; // minor units (expected cash)
  amountHandedOver: number; // minor units (actual cash received)
  variance: number; // amountHandedOver - totalCodAmount
  settledAt: any;
  recordedBy: string; // Staff UID of manager
  notes: string | null;
  createdAt: any;
}


// ==========================================
// PHASE 8 — CRM & LOYALTY
// ==========================================

export interface Customer {
  customerId: string; // Doc ID
  tenantId: string;
  firstName: string;
  lastName: string | null;
  phone: string; // Unique within tenant
  email: string | null;
  dateOfBirth: any | null;
  gender: CustomerGender | null;
  defaultDeliveryAddress: {
    street: string;
    building: string;
    floor?: string;
    city: string;
    geoPoint?: { latitude: number; longitude: number };
  } | null;
  savedAddresses: {
    addressId: string;
    label: string; // e.g. "Home", "Office"
    street: string;
    building: string;
    floor?: string;
    city: string;
    geoPoint?: { latitude: number; longitude: number };
  }[];
  preferredLocale: string | null; // BCP 47
  loyaltyBalance: number; // current available points
  totalLifetimeSpend: number; // minor units
  totalOrderCount: number;
  lastOrderAt: any | null;
  firstOrderAt: any | null;
  acquisitionChannel: "pos" | "guest_portal" | "aggregator" | "kiosk" | "referral";
  tags: string[]; // e.g. ["vip", "high_frequency"]
  marketingOptIn: boolean;
  notes: string | null;
  isBlocked: boolean;
  firebaseAuthUid: string | null; // linked client login Auth credential
  createdAt: any;
  updatedAt: any;
}

export interface LoyaltyTransaction {
  txId: string; // Doc ID
  tenantId: string;
  customerId: string; // FK to Customers
  orderId: string | null; // FK to Orders (null if manually adjusted)
  type: LoyaltyTransactionType;
  points: number; // Positive for earning, negative for redemptions
  monetaryValue: number | null; // value in minor units for redemption
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  adjustedBy: string | null; // Staff UID (if manual)
  expiresAt: any | null;
  createdAt: any;
}


// ==========================================
// PHASE 9 — PROMOTIONS & DISCOUNTS
// ==========================================

export interface Promotion {
  promotionId: string; // Doc ID
  tenantId: string;
  branchIds: string[] | null; // Null applies to all branches
  name: Record<string, string>; // Multilingual name
  code: string | null; // promo code (null = auto applied in checkout)
  type: PromotionType;
  discountValue: number; // percentage (e.g. 15 for 15%) or absolute amount (minor units)
  minimumOrderAmount: number | null; // minor units
  maximumDiscountAmount: number | null; // cap for percentage-based promos (minor units)
  applicableChannels: OrderChannel[];
  applicableItemIds: string[] | null; // specific items only (null = whole order)
  applicableCategoryIds: string[] | null;
  happyHourSchedule: Record<string, { start: string; end: string }[]> | null;
  startDate: any;
  endDate: any | null;
  usageLimit: number | null;
  usageLimitPerCustomer: number | null;
  currentUsageCount: number;
  isActive: boolean;
  createdBy: string; // Staff UID
  createdAt: any;
  updatedAt: any;
}


// ==========================================
// PHASE 10 — AGGREGATOR INTEGRATION
// ==========================================

export interface AggregatorConfig {
  configId: string; // Doc ID
  tenantId: string;
  branchId: string;
  platform: "talabat" | "careem" | "hungerstation" | "noon_food" | "otlob" | "instashop" | "other";
  isEnabled: boolean;
  apiKey: string; // Encrypted in DB (Never sent back in standard read pathways)
  webhookSecret: string; // Signed hashing webhook secret
  externalBranchId: string; // reference on provider's servers
  commissionRate: number; // percentage
  autoAccept: boolean;
  autoAcceptDelaySeconds: number; // range 0-90
  menuSyncEnabled: boolean;
  lastMenuSyncAt: any | null;
  lastMenuSyncStatus: "success" | "partial" | "failed" | null;
  updatedAt: any;
}

export interface AggregatorOrderLog {
  logId: string; // Doc ID
  tenantId: string;
  branchId: string;
  platform: string;
  direction: "inbound" | "outbound";
  eventType: string; // e.g. "order.created"
  externalOrderId: string;
  internalOrderId: string | null; // FK to Orders
  rawPayload: Record<string, any>; // Full inbound audit snapshot
  processingStatus: "success" | "duplicate_ignored" | "mapping_failed" | "signature_invalid" | "retrying" | "dead_letter";
  attemptCount: number;
  lastAttemptAt: any;
  errorMessage: string | null;
  createdAt: any;
}


// ==========================================
// PHASE 11 — HR & ATTENDANCE
// ==========================================

export interface AttendanceRecord {
  attendanceId: string; // Doc ID
  tenantId: string;
  branchId: string;
  staffId: string; // FK to StaffUsers
  staffName: string;
  shiftId: string | null; // active drawer shift (if cashier clocked in)
  clockInAt: any;
  clockOutAt: any | null;
  scheduledStartAt: any | null;
  scheduledEndAt: any | null;
  lateMinutes: number | null; // calculated
  earlyDepartureMinutes: number | null;
  workedMinutes: number | null; // clockOutAt - clockInAt
  overtimeMinutes: number | null;
  breakMinutes: number | null;
  clockInMethod: ClockInOutMethod;
  clockOutMethod: ClockInOutMethod | null;
  notes: string | null;
  createdAt: any;
}

export interface PayrollPeriod {
  payrollId: string; // Doc ID
  tenantId: string;
  branchId: string;
  staffId: string; // FK to StaffUsers
  staffName: string;
  periodStart: any;
  periodEnd: any;
  regularHours: number;
  overtimeHours: number;
  regularPay: number; // minor units
  overtimePay: number;
  tipAmount: number | null;
  deductions: number;
  netPay: number; // calculated (minor units)
  status: PayrollStatus;
  approvedBy: string | null; // Staff UID of manager
  paidAt: any | null;
  notes: string | null;
  createdAt: any;
}


// ==========================================
// PHASE 12 — NOTIFICATIONS & ALERTS
// ==========================================

export interface NotificationLog {
  notificationId: string; // Doc ID
  tenantId: string;
  branchId: string | null;
  recipientType: "staff" | "customer" | "manager_group";
  recipientId: string; // UID or CustomerId
  channel: NotificationLogChannel;
  type: NotificationType;
  title: string;
  body: string;
  relatedDocumentId: string | null; // related OrderId, IngredientId etc.
  status: "queued" | "sent" | "delivered" | "failed";
  externalMessageId: string | null; // SMS gateway ID or FCM ID
  errorMessage: string | null;
  sentAt: any | null;
  createdAt: any;
}


// ==========================================
// PHASE 13 — REPORTING & ANALYTICS AGGREGATES
// ==========================================

export interface DailySalesSummary {
  summaryId: string; // formatted: "tenantId_branchId_YYYY-MM-DD"
  tenantId: string;
  branchId: string;
  date: string; // YYYY-MM-DD
  totalRevenue: number; // minor units
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  voidedOrders: number;
  averageOrderValue: number; // minor units
  revenueByFulfillmentType: Record<FulfillmentType, number>;
  revenueByPaymentMethod: Record<string, number>;
  revenueByChannel: Record<string, number>;
  totalDiscountAmount: number;
  totalTaxCollected: number;
  totalRefundAmount: number;
  totalWasteCost: number;
  totalExpenses: number;
  theoreticalCOGS: number; // minor units (quantity sold * BOM item costs)
  actualCOGS: number | null; // determined from stock takes
  foodCostPercent: number | null; // actualCOGS / totalRevenue * 100
  createdAt: any;
  updatedAt: any;
}


// ==========================================
// PHASE 14 — IDEMPOTENCY & AUDIT
// ==========================================

export interface IdempotencyKey {
  key: string; // Doc ID e.g., "tenantId_endpoint_clientKey"
  tenantId: string;
  endpoint: string; // e.g. "/api/orders"
  responseCached: Record<string, any>; // cached JSON response
  statusCode: number;
  createdAt: any;
  expiresAt: any; // TTL indexed
}

export interface AuditLog {
  logId: string; // Doc ID
  tenantId: string;
  branchId: string | null;
  actorId: string; // Staff UID
  actorRole: string;
  actorIp: string;
  action: string; // e.g., "ORDER_VOIDED", "MENU_ITEM_PRICE_CHANGED"
  targetCollection: string; // Firestore collection path e.g. "orders"
  targetDocumentId: string;
  changeSummary: Record<string, { before: any; after: any }> | null;
  metadata?: Record<string, any>;
  createdAt: any;
}
