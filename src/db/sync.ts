import fs from "fs";
import path from "path";
import { db, tenants, branches, staffUsers } from "./index";
import { eq } from "drizzle-orm";

const DATA_DIR = path.join(process.cwd(), "db-data");
const ORGANIZATIONS_FILE = path.join(DATA_DIR, "organizations.json");
const STAFF_USERS_FILE = path.join(DATA_DIR, "staff_users.json");

// Helper to read local JSON
function readJSON(filePath: string, defaultData: any) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
  return defaultData;
}

export async function syncFoundationalData(branchesList: any[]) {
  try {
    console.log("[Database Sync] Starting synchronization with PostgreSQL...");

    // 1. Sync Tenants
    const localOrgs = readJSON(ORGANIZATIONS_FILE, []);
    if (localOrgs.length > 0) {
      const dbTenants = await db.select().from(tenants);
      if (dbTenants.length === 0) {
        console.log(`[Database Sync] Seeding ${localOrgs.length} tenants...`);
        for (const org of localOrgs) {
          const featureFlags: Record<string, boolean> = {};
          if (Array.isArray(org.customFeatures)) {
            org.customFeatures.forEach((f: any) => {
              featureFlags[f.key] = !!f.enabled;
            });
          }

          await db.insert(tenants).values({
            tenantId: org.id,
            legalName: org.legalName || org.name,
            brandName: org.name,
            subscriptionPlan: org.plan || "growth",
            subscriptionStatus: org.status || "active",
            billingEmail: org.ownerEmail || "owner@eplfood.com",
            defaultCurrency: "EGP",
            defaultTimezone: "Africa/Cairo",
            defaultLocale: "ar-EG",
            supportedLocales: ["ar-EG", "en-US"],
            featureFlags: featureFlags,
            createdAt: org.createdAt ? new Date(org.createdAt) : new Date(),
            metadata: {
              logo: org.logo,
              primaryColor: org.primaryColor,
              ownerPhone: org.ownerPhone,
              ownerPassword: org.ownerPassword,
              revenueSharePercent: org.revenueSharePercent,
              maxBranches: org.maxBranches,
              maxUsers: org.maxUsers,
              maxMenuItems: org.maxMenuItems,
            },
          });
        }
        console.log("[Database Sync] Tenants seeded successfully.");
      }
    }

    // 2. Sync Branches
    if (branchesList && branchesList.length > 0) {
      const dbBranches = await db.select().from(branches);
      if (dbBranches.length === 0) {
        console.log(`[Database Sync] Seeding ${branchesList.length} branches...`);
        for (const b of branchesList) {
          await db.insert(branches).values({
            branchId: b.id,
            tenantId: b.tenantId || "org-default",
            name: { ar: b.nameAr || b.name, en: b.name },
            address: { street: b.address || "", city: "Cairo", governorate: "Cairo", country: "Egypt" },
            geoPoint: { latitude: 30.0444, longitude: 31.2357 },
            phone: b.phone || "",
            email: "branch@eplfood.com",
            timezone: "Africa/Cairo",
            currency: "EGP",
            isActive: b.isOpen !== false,
            openingHours: {},
            taxNumber: "123-456-789",
            receiptFooter: "شكراً لزيارتكم",
            registers: [],
            kdsStations: ["grill", "fryer"],
            deliveryZones: b.deliveryZones || [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        console.log("[Database Sync] Branches seeded successfully.");
      }
    }

    // 3. Sync Staff Users
    const localStaff = readJSON(STAFF_USERS_FILE, []);
    if (localStaff.length > 0) {
      const dbStaff = await db.select().from(staffUsers);
      if (dbStaff.length === 0) {
        console.log(`[Database Sync] Seeding ${localStaff.length} staff users...`);
        for (const s of localStaff) {
          const names = (s.name || "User").split(" ");
          const firstName = names[0];
          const lastName = names.slice(1).join(" ") || "User";

          await db.insert(staffUsers).values({
            uid: s.id,
            tenantId: s.tenantId || "org-default",
            branchId: s.branchId || null,
            allBranchIds: s.branchId ? [s.branchId] : [],
            role: s.role || "cashier",
            displayName: s.name || "User",
            firstName: firstName,
            lastName: lastName,
            phone: s.phone || "",
            email: s.email || `${s.id}@eplfood.com`,
            pin: s.pin || "1234",
            isActive: s.status === "active",
            hireDate: s.hireDate ? new Date(s.hireDate) : new Date(),
            hourlyRate: s.hourlyRate || 0,
            weeklyHourTarget: s.weeklyHourTarget || 40,
            emergencyContact: { name: "Emergency", phone: s.phone || "" },
            photoUrl: s.photoUrl || null,
            customClaims: { role: s.role || "cashier", tenantId: s.tenantId || "org-default", branchId: s.branchId || null },
            createdAt: new Date(),
            createdBy: s.createdBy || "system",
            updatedAt: new Date(),
          });
        }
        console.log("[Database Sync] Staff users seeded successfully.");
      }
    }

    console.log("[Database Sync] All foundational modules synchronized successfully.");
  } catch (error) {
    console.error("[Database Sync] Error during database synchronization:", error);
  }
}
