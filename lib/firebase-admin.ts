import { App, initializeApp, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let app: App;
let isFirebaseInitialized = false;

// Check if we have Firebase credentials configured
try {
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIREBASE_CONFIG ||
    process.env.FIREBASE_PROJECT_ID
  ) {
    const apps = getApps();
    if (apps.length === 0) {
      app = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    } else {
      app = apps[0]!;
    }
    isFirebaseInitialized = true;
    console.log("[Firebase Admin] Initialized with live service environment.");
  } else {
    console.warn(
      "[Firebase Admin] No credentials detected. Initializing local sandbox persistence engine."
    );
  }
} catch (error) {
  console.error("[Firebase Admin] Initialization failure:", error);
}

export function getAdminAuth() {
  if (!isFirebaseInitialized) {
    // Return mock admin.auth SDK functions to allow local sandbox preview
    return {
      verifyIdToken: async (token: string) => {
        // If it is mock, return custom mock claims
        if (token === "mock-token-owner") {
          return {
            uid: "u-owner-001",
            email: "mahmoudgameil732@gmail.com",
            tenantId: "tenant-a",
            role: "tenant_owner",
            branchIds: ["*"]
          };
        }
        if (token.startsWith("mock-token-")) {
          const role = token.replace("mock-token-", "");
          return {
            uid: `u-${role}-002`,
            email: `${role}@gourmet-group.com`,
            tenantId: "tenant-a",
            role: role,
            branchIds: ["branch-a"]
          };
        }
        // Fallback standard verified user
        return {
          uid: "u-test-user",
          email: "test@example.com",
          tenantId: "tenant-a",
          role: "cashier",
          branchIds: ["branch-a"]
        };
      },
      createUser: async (properties: any) => {
        return {
          uid: `u-prov-${Date.now()}`,
          email: properties.email,
          disabled: properties.disabled || false,
          displayName: properties.displayName || ""
        };
      },
      updateUser: async (uid: string, properties: any) => {
        return { uid, ...properties };
      },
      setCustomUserClaims: async (uid: string, claims: any) => {
        console.log(`[Mock Auth] Set claims on UID ${uid}:`, claims);
      },
      revokeRefreshTokens: async (uid: string) => {
        console.log(`[Mock Auth] Revoked refresh tokens for UID ${uid}`);
      }
    } as any;
  }
  return getAuth(app);
}

// Sandbox local JSON db file configuration
const DB_DIR = path.join(process.cwd(), "db-data");
const STAFF_USERS_FILE = path.join(DB_DIR, "staff_users.json");

function readLocalStaff(): any[] {
  try {
    if (fs.existsSync(STAFF_USERS_FILE)) {
      return JSON.parse(fs.readFileSync(STAFF_USERS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to read local staff db:", e);
  }
  return [];
}

function writeLocalStaff(data: any[]): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(STAFF_USERS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write local staff db:", e);
  }
}

export function getFirestoreDb() {
  if (!isFirebaseInitialized) {
    // Return mock firestore implementation using local staff_users.json file!
    return {
      collection: (colName: string) => {
        return {
          doc: (docId?: string) => {
            const id = docId || `u-prov-${Date.now()}`;
            return {
              id,
              get: async () => {
                const list = readLocalStaff();
                const matched = list.find((u: any) => u.userId === id || u.id === id);
                return {
                  exists: !!matched,
                  id,
                  data: () => matched || null
                };
              },
              set: async (data: any) => {
                const list = readLocalStaff();
                const cleanData = { ...data, userId: id };
                const filtered = list.filter((u: any) => u.userId !== id && u.id !== id);
                filtered.push(cleanData);
                writeLocalStaff(filtered);
                return { id };
              },
              update: async (data: any) => {
                const list = readLocalStaff();
                const idx = list.findIndex((u: any) => u.userId === id || u.id === id);
                if (idx !== -1) {
                  list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
                  writeLocalStaff(list);
                }
                return { id };
              },
              delete: async () => {
                const list = readLocalStaff();
                const filtered = list.filter((u: any) => u.userId !== id && u.id !== id);
                writeLocalStaff(filtered);
              }
            };
          },
          get: async () => {
            const list = readLocalStaff();
            return {
              docs: list.map((item) => ({
                id: item.userId || item.id,
                data: () => item
              }))
            };
          },
          add: async (data: any) => {
            const list = readLocalStaff();
            const id = `u-prov-${Date.now()}`;
            const cleanData = { ...data, userId: id };
            list.push(cleanData);
            writeLocalStaff(list);
            return { id };
          }
        } as any;
      }
    } as any;
  }
  return getFirestore(app);
}
