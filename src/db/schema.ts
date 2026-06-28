import { pgTable, text, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

// foundational module 1: Tenants
export const tenants = pgTable("tenants", {
  tenantId: text("tenant_id").primaryKey(),
  legalName: text("legal_name").notNull(),
  brandName: text("brand_name").notNull(),
  subscriptionPlan: text("subscription_plan").notNull(), // "starter" | "growth" | "professional" | "enterprise" | "custom"
  subscriptionStatus: text("subscription_status").notNull(), // "trialing" | "active" | "past_due" | "suspended" | "cancelled"
  billingEmail: text("billing_email").notNull(),
  defaultCurrency: text("default_currency").notNull(), // ISO 4217 code e.g. "EGP", "SAR"
  defaultTimezone: text("default_timezone").notNull(), // IANA timezone e.g. "Africa/Cairo"
  defaultLocale: text("default_locale").notNull(), // BCP 47 locale e.g. "ar-EG"
  supportedLocales: jsonb("supported_locales").$type<string[]>().notNull(), // Enabled translations e.g. ["ar-EG", "en-US"]
  featureFlags: jsonb("feature_flags").$type<Record<string, boolean | undefined>>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  suspendedAt: timestamp("suspended_at"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
});

// foundational module 2: Branches
export const branches = pgTable("branches", {
  branchId: text("branch_id").primaryKey(),
  tenantId: text("tenant_id")
    .references(() => tenants.tenantId, { onDelete: "cascade" })
    .notNull(),
  name: jsonb("name").$type<Record<string, string>>().notNull(), // Multilingual e.g. { ar: "فرع المعادي", en: "Maadi Branch" }
  address: jsonb("address").$type<{
    street: string;
    city: string;
    governorate: string;
    country: string;
    postalCode?: string;
  }>().notNull(),
  geoPoint: jsonb("geo_point").$type<{
    latitude: number;
    longitude: number;
  }>().notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  timezone: text("timezone").notNull(), // Overrides tenant level if customized
  currency: text("currency").notNull(), // Overrides tenant level if customized
  isActive: boolean("is_active").default(true).notNull(),
  openingHours: jsonb("opening_hours").notNull(),
  taxNumber: text("tax_number").notNull(), // Printed on thermal receipts
  receiptFooter: text("receipt_footer"),
  registers: jsonb("registers").notNull(), // Stored as JSON as defined in types
  kdsStations: jsonb("kds_stations").$type<string[]>().notNull(), // e.g., ["grill", "fryer"]
  deliveryZones: jsonb("delivery_zones").notNull(), // delivery zones array
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// foundational module 3: Staff Users
export const staffUsers = pgTable("staff_users", {
  uid: text("uid").primaryKey(), // Matches Firebase Auth UID
  tenantId: text("tenant_id")
    .references(() => tenants.tenantId, { onDelete: "cascade" })
    .notNull(),
  branchId: text("branch_id")
    .references(() => branches.branchId, { onDelete: "set null" }), // Primary branch assignment (null for enterprise managers)
  allBranchIds: jsonb("all_branch_ids").$type<string[] | null>(), // Multi-location visibility scopes
  role: text("role").notNull(), // StaffRole: "platform_admin" | "admin" | "branch_manager" | "cashier" | "kitchen" | "rider" | "hr_manager" | "accountant"
  displayName: text("display_name").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  pin: text("pin").notNull(), // Hashed PIN for in-register transactions (Stored server-side only)
  isActive: boolean("is_active").default(true).notNull(),
  hireDate: timestamp("hire_date").notNull(),
  terminatedAt: timestamp("terminated_at"),
  hourlyRate: integer("hourly_rate"), // payroll rate (minor units) - using integers for accuracy
  weeklyHourTarget: integer("weekly_hour_target"),
  emergencyContact: jsonb("emergency_contact").$type<{
    name: string;
    phone: string;
  }>().notNull(),
  photoUrl: text("photo_url"),
  customClaims: jsonb("custom_claims").$type<{
    role: string;
    tenantId: string;
    branchId: string | null;
  }>().notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").notNull(), // Staff UID
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  scopeHistory: jsonb("scope_history").$type<any[]>(),
});
