export type FulfillmentType = "dine_in" | "takeaway" | "delivery";

export type OrderSource = "pos" | "app" | "web" | "kiosk" | "aggregator:talabat" | "aggregator:careem" | "aggregator:deliveroo";

export type TableStatus = "empty" | "occupied" | "ordering" | "bill_requested" | "dirty" | "reserved";

export type OrderStatus = 
  | "placed" 
  | "confirmed" 
  | "preparing" 
  | "ready_for_rider" 
  | "rider_assigned" 
  | "picked_up" 
  | "delivered" 
  | "completed" 
  | "paid" 
  | "voided";

export type CourseType = "appetizer" | "main" | "dessert" | "drink" | "unassigned";

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  required: boolean;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string; // Theme reference e.g. Steak, Pasta, Salad, Dessert, Cocktail, Coffee, etc.
  isAvailable: boolean;
  modifierGroupIds?: string[];
  channelPricing?: {
    [source in OrderSource]?: number; // Override price per channel
  };
}

export interface Table {
  id: string;
  name: string;
  seats: number;
  status: TableStatus;
  currentOrderId: string | null;
}

export interface OrderItemModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  course: CourseType;
  fired: boolean; // For dine-in course sequence control
  modifiers: OrderItemModifier[];
}

export interface DeliveryDetails {
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  deliveryFee: number;
  riderName?: string;
  riderPhone?: string;
  region?: string;
  street?: string;
  lid?: string;
  app?: string;
  floor?: string;
}

export interface PaymentDetails {
  method: "cash" | "card" | "loyalty" | "split";
  splits?: {
    method: "cash" | "card" | "loyalty";
    amount: number;
  }[];
  subtotal: number;
  taxAmount: number;
  surcharge: number;
  discountAmount: number;
  totalPaid: number;
  tipAmount: number;
}

export interface Order {
  id: string;
  tableId: string | null; // Null if takeaway/delivery
  tableName: string | null;
  fulfillmentType: FulfillmentType;
  orderSource: OrderSource;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  payment?: PaymentDetails;
  delivery?: DeliveryDetails;
  customerName?: string | null;
  customerPhone?: string | null;
  
  // Shift assignment
  shiftId?: string | null;
  branchId?: string | null;

  // Audits and manager voids
  voidReason?: string;
  managerApproved?: boolean;

  // SLA Timestamps
  placedAt: string;
  confirmedAt?: string;
  preparedAt?: string;
  dispatchedAt?: string; // rider picked up / counter ready
  deliveredAt?: string; // delivered to customer/dine-in complete
  completedAt?: string;
  updatedAt: string;
}

export interface Promotion {
  code: string;
  discountType: "percentage" | "fixed" | "bogo";
  value: number; // e.g. 15 for 15% or 5 for $5
  minimumOrderAmount: number;
  channelRestrictions?: OrderSource[];
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string; // "VOID_ORDER", "COMP_DISH", "PRICE_OVERRIDE", "FORCE_86"
  orderId?: string;
  userRole: "manager" | "waiter" | "chef";
  reason: string;
  details: string;
}


export interface RawIngredient {
  id: string;
  name: string;
  category: string; // e.g. Protein, Dairy, Produce, Pantry, Herbs
  baseUom: string; // e.g. kg, g, l, ml, unit
  costPerBaseUnit: number; // e.g. 15.00 per kg
  yieldPercent: number; // e.g. 90% (usable weight)
  allergens: string[]; // e.g. Dairy, Gluten, Nuts
  supplierReference?: string;
  shelfLifeDays: number;
  spoilageClass: "High" | "Medium" | "Low";
}

export interface RecipeIngredientLink {
  ingredientId: string; // References RawIngredient.id OR Recipe.id if isSubRecipeLink is true
  isSubRecipeLink: boolean;
  quantity: number; // Quantity in baseUom of the ingredient / sub-recipe
}

export interface Recipe {
  id: string;
  menuItemId: string | null; // null if this is a standalone sub-recipe (prep item)
  isSubRecipe: boolean; // if true, this is a nested sub-recipe (prep item) e.g., "house sauce"
  name: string; // Name of the recipe or sub-recipe
  ingredients: RecipeIngredientLink[];
  yieldQuantity: number; // The yield of this recipe in its baseUom (e.g., yields 1000g of House Sauce, or 1 unit of Plated Ribeye)
  baseUom: string; // e.g., "unit" for final plate, or "g", "l" for sub-recipes
  version: number;
  isActive: boolean;
  updatedAt: string;
}

export interface MenuEngineeringItem {
  menuItemId: string;
  name: string;
  price: number;
  theoreticalCost: number;
  margin: number;
  foodCostPercent: number;
  popularity: number; // Number of orders
  classification: "Star" | "Plowhorse" | "Puzzle" | "Dog";
}

export interface AggregatorPayoutRecord {
  id: string;
  aggregatorName: string; // e.g. talabat
  externalOrderId: string;
  systemOrderId: string;
  totalAmount: number;
  commissionRatePercent: number;
  commissionAmount: number;
  netPayoutExpected: number;
  netPayoutReported: number;
  status: "reconciled" | "discrepancy" | "pending";
  discrepancyNotes?: string;
  createdAt: string;
}

export interface DynamicStats {
  totalRevenue: number;
  ordersCount: number;
  activeOrdersCount: number;
  popularDishes: { name: string; count: number }[];
  occupancyRate: number;
  averageSlaMinutes: number; // Average dispatch/prep delay
  discrepanciesCount: number; // For aggregator audit flags
}

export interface CashMovement {
  id: string;
  type: "paid_in" | "paid_out" | "safe_drop" | "expense";
  amount: number;
  category: string; // e.g. "Change Fund", "Supplies", "Maintenance", "Delivery Tip", "Petty Cash Misc", "Safe Deposit"
  reason: string;
  timestamp: string;
  userId: string;
  userName: string;
  managerApproved: boolean;
  managerName?: string | null;
  receiptPhoto?: string | null;
}

export interface RiderSettlement {
  id: string;
  riderName: string;
  amount: number; // Amount of cash collected from rider on return
  timestamp: string;
  recordedBy: string; // Cashier or Manager name
}

export interface Shift {
  id: string;
  shiftNumber: number;
  branchId: string;
  branchName: string;
  registerId: string;
  registerName: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt: string | null;
  openingFloat: number;
  declaredCash: number | null;
  expectedCash: number | null;
  variance: number | null;
  status: "open" | "closed" | "force_closed" | "voided";
  voidReason?: string | null;
  voidApprovedBy?: string | null;
  forceClosedBy?: string | null;
  forceClosedAt?: string | null;
  cashMovements: CashMovement[];
  riderSettlements: RiderSettlement[];
}

export interface Allowance {
  id: string;
  name: string;                  // "مواصلات" | "وجبات" | "سكن"
  amount: number;                // in piasters
  type: "fixed" | "percentage"; // percentage of base salary
  active: boolean;
}

export interface Deduction {
  id: string;
  name: string;                  // "سلفة" | "تأمين" | "غياب"
  amount: number;
  type: "fixed" | "percentage";
  active: boolean;
}

export interface StaffUser {
  id: string;
  name: string;
  role: "manager" | "cashier" | "chef" | "rider";
  pin: string;                   // pin used for authorization e.g. "1234"
  employeeCode: string;          // unique code per employee (e.g. EMP-001)
  nationalId: string;            // encrypted at rest
  phone: string;
  address: string;
  hireDate: string;              // ISO string
  jobTitle: string;              // "Cashier" | "Chef" | "Rider" | "Manager" | custom
  department: string;            // "FOH" | "BOH" | "Delivery" | "Management"
  branchId: string;
  employmentType: "full_time" | "part_time" | "hourly" | "contract";
  
  // Salary config:
  salaryType: "monthly" | "hourly" | "daily";
  baseSalary: number;            // monthly amount in piasters (avoid float)
  hourlyRate: number;            // if salaryType === "hourly"
  overtimeRate: number;          // multiplier e.g. 1.5 = 150% of hourly rate
  
  // Biometric:
  biometricId: string;           // ID registered on the ZKTeco device
  biometricDeviceId: string;     // which device this employee is registered on
  
  // Deductions & allowances:
  allowances: Allowance[];       // recurring additions (transport, meals, housing)
  deductions: Deduction[];       // recurring subtractions (loans, insurance)
  
  // Status:
  status: "active" | "on_leave" | "suspended" | "terminated";
  terminationDate?: string;      // ISO string
  terminationReason?: string;
  
  // Audit:
  createdBy: string;
  updatedAt: string;             // ISO string
  lastModifiedBy: string;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName?: string;         // added for ease of display
  branchId: string;
  date: string;                  // "YYYY-MM-DD" for easy querying
  
  checkIn: string | null;        // ISO string
  checkOut: string | null;       // ISO string
  
  // Source of record:
  checkInSource: "biometric" | "manual" | "system";
  checkOutSource: "biometric" | "manual" | "system";
  
  // If manual — who entered it:
  checkInEnteredBy?: string;     // manager userId
  checkOutEnteredBy?: string;
  manualEntryNote?: string;
  
  // Calculated fields (server-computed on checkout or end of day):
  hoursWorked: number;           // decimal hours e.g. 8.5
  regularHours: number;          // up to contractedHoursPerDay
  overtimeHours: number;         // beyond contractedHoursPerDay
  
  // Status:
  status: "present" | "absent" | "late" | "half_day" | "leave" | "holiday";
  lateMinutes: number;           // minutes after scheduled start
  earlyDepartureMinutes: number;
  
  // Leave reference if applicable:
  leaveRequestId?: string;
  
  // Audit:
  createdAt: string;             // ISO string
  updatedAt: string;             // ISO string
}

export interface ScheduleDay {
  isWorkDay: boolean;
  shiftStart: string;            // "09:00"
  shiftEnd: string;              // "17:00"
  contractedHours: number;       // 8
  breakMinutes: number;          // 60
  location: string;              // branchId or "remote"
}

export interface StaffSchedule {
  id: string;
  employeeId: string;
  branchId: string;
  weekStartDate: string;         // "YYYY-MM-DD" Monday of the week
  
  days: {
    monday:    ScheduleDay;
    tuesday:   ScheduleDay;
    wednesday: ScheduleDay;
    thursday:  ScheduleDay;
    friday:    ScheduleDay;
    saturday:  ScheduleDay;
    sunday:    ScheduleDay;
  };
  
  createdBy: string;
  createdAt: string;             // ISO string
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;         // added helper
  branchId: string;
  
  leaveType: "annual" | "sick" | "emergency" | "unpaid" | "maternity" | "other";
  startDate: string;
  endDate: string;
  totalDays: number;
  
  reason: string;
  attachmentUrl?: string;        // medical certificate etc.
  
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;           // ISO string
  reviewNote?: string;
  
  createdAt: string;             // ISO string
}

export interface PayrollEntry {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  
  // Attendance summary for the period:
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  totalHoursWorked: number;
  overtimeHours: number;
  
  // Salary calculation (all in piasters):
  baseSalary: number;
  dailyRate: number;             // baseSalary / workingDaysInMonth
  absentDeduction: number;       // absentDays * dailyRate
  lateDeduction: number;         // based on lateMinutes policy
  overtimePay: number;           // overtimeHours * hourlyRate * overtimeMultiplier
  totalAllowances: number;
  totalDeductions: number;       // loans, insurance, etc.
  
  grossPay: number;
  netPay: number;
  
  // Payslip reference:
  payslipId: string;
}

export interface PayrollRun {
  id: string;
  branchId: string;              // or "all" for consolidated run
  period: string;                // "2025-01" (YYYY-MM)
  
  status: "draft" | "approved" | "paid" | "cancelled";
  
  employees: PayrollEntry[];
  
  totals: {
    grossPayroll: number;
    totalAllowances: number;
    totalDeductions: number;
    totalOvertimePay: number;
    netPayroll: number;
    employeeCount: number;
  };
  
  approvedBy?: string;
  approvedAt?: string;           // ISO string
  paidAt?: string;               // ISO string
  paymentMethod?: string;        // "bank_transfer" | "cash" | "mixed"
  
  notes: string;
  createdBy: string;
  createdAt: string;             // ISO string
}

export interface BiometricDevice {
  id: string;
  name: string;                  // "Main Entrance - Branch A"
  branchId: string;
  ipAddress: string;              // for TCP pull
  port: number;                  // default 4370
  deviceSecret: string;          // for push verification
  syncMethod: "push" | "tcp_pull" | "both";
  lastSyncAt: string;            // ISO string
  status: "online" | "offline" | "error";
  createdAt: string;             // ISO string
}

// --- SaaS Multi-Tenant & Billing Models ---

export type FeatureKey =
  | "pos_basic"
  | "kds"
  | "menu_management"
  | "basic_reports"
  | "delivery_management"
  | "guest_portal"
  | "cost_control"
  | "shift_management"
  | "inventory"
  | "hr_payroll"
  | "crm_loyalty"
  | "aggregator_integration"
  | "multi_branch"
  | "advanced_reports"
  | "white_label"
  | "api_access"
  | "dedicated_support"
  | "custom_integrations";

export interface FeatureFlag {
  key: FeatureKey;
  enabled: boolean;
  enabledAt?: string;
  enabledBy?: string;
  note?: string;
}

export type PlanKey = "starter" | "growth" | "professional" | "enterprise" | "custom";

export interface SaaSPlan {
  name: string;
  nameAr: string;
  revenueSharePercent: number; // e.g. 1.5 = 1.5%
  maxBranches: number;
  maxUsers: number;
  maxMenuItems: number;
  features: FeatureKey[];
}

export interface Organization {
  id: string;
  name: string;
  legalName: string;
  logo: string;
  primaryColor: string;
  ownerEmail: string;
  ownerPhone: string;
  plan: PlanKey;
  revenueSharePercent: number; // e.g. 1.5
  customFeatures: FeatureFlag[];
  billingCycle: "monthly" | "annual";
  nextBillingDate: string;
  paymentStatus: "active" | "overdue" | "suspended" | "cancelled";
  totalRevenueShareOwed: number; // in piasters
  totalRevenueSharePaid: number; // in piasters
  status: "active" | "suspended" | "trial" | "cancelled";
  trialEndsAt?: string;
  suspendedReason?: string;
  suspendedAt?: string;
  maxBranches: number;
  maxUsers: number;
  maxMenuItems: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
  customDomain?: string;
  totalSales?: number;
  orderCount?: number;
}

export interface RevenueShareEntry {
  id: string;
  organizationId: string;
  branchId: string;
  orderId: string;
  orderTotal: number; // piasters
  revenueSharePercent: number;
  revenueShareAmount: number; // piasters
  period: string; // "YYYY-MM"
  status: "pending" | "invoiced" | "paid";
  createdAt: string;
}

export interface RevenueShareInvoice {
  id: string;
  organizationId: string;
  period: string; // "YYYY-MM"
  totalSales: number; // piasters
  revenueSharePercent: number;
  revenueShareDue: number; // piasters
  orderCount: number;
  branchBreakdown: {
    branchId: string;
    branchName: string;
    sales: number; // piasters
    shareAmount: number; // piasters
  }[];
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
  createdAt: string;
}

export interface FeatureRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  featureKey: FeatureKey;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
}

export const PLANS: Record<PlanKey, SaaSPlan> = {
  starter: {
    name: "Starter",
    nameAr: "باقة المبتدئ (Starter)",
    revenueSharePercent: 1.0,
    maxBranches: 1,
    maxUsers: 5,
    maxMenuItems: 50,
    features: ["pos_basic", "menu_management", "basic_reports"]
  },
  growth: {
    name: "Growth",
    nameAr: "باقة النمو المتقدمة (Growth)",
    revenueSharePercent: 1.5,
    maxBranches: 3,
    maxUsers: 15,
    maxMenuItems: 150,
    features: ["pos_basic", "kds", "menu_management", "basic_reports", "delivery_management", "guest_portal"]
  },
  professional: {
    name: "Professional",
    nameAr: "الباقة الاحترافية (Professional)",
    revenueSharePercent: 2.0,
    maxBranches: 10,
    maxUsers: 50,
    maxMenuItems: 500,
    features: ["pos_basic", "kds", "menu_management", "basic_reports", "delivery_management", "guest_portal", "cost_control", "shift_management", "inventory"]
  },
  enterprise: {
    name: "Enterprise",
    nameAr: "باقة المؤسسات الكبرى (Enterprise)",
    revenueSharePercent: 2.5,
    maxBranches: 999,
    maxUsers: 999,
    maxMenuItems: 9999,
    features: ["pos_basic", "kds", "menu_management", "basic_reports", "delivery_management", "guest_portal", "cost_control", "shift_management", "inventory", "hr_payroll", "crm_loyalty", "aggregator_integration", "multi_branch", "advanced_reports", "white_label"]
  },
  custom: {
    name: "Custom Plan",
    nameAr: "باقة مخصصة (Custom)",
    revenueSharePercent: 1.5,
    maxBranches: 5,
    maxUsers: 20,
    maxMenuItems: 200,
    features: ["pos_basic", "menu_management", "basic_reports"]
  }
};


