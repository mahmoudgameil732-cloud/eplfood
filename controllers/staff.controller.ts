import { Response } from "express";
import crypto from "crypto";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getAdminAuth, getFirestoreDb } from "../lib/firebase-admin";

const ROLE_HIERARCHY: Record<string, number> = {
  tenant_owner: 100,
  tenant_admin: 80,
  branch_manager: 60,
  hr_manager: 40,
  accountant: 40,
  cashier: 20,
  kitchen: 20,
  rider: 10
};

/**
 * GET /api/tenants/:tenantId/users
 * Fetches the personnel roster for a specific tenant from Firestore with query filtering.
 */
export async function getStaffList(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = req.params;
    const { role, status } = req.query;

    const db = getFirestoreDb();
    const staffRef = db.collection("staff_users");

    // Fetch matching records
    const snapshot = await staffRef.get();
    let list: any[] = [];

    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      // Ensure records belong to the tenant
      if (data.tenantId === tenantId || data.organizationId === tenantId) {
        list.push({ ...data, id: doc.id });
      }
    });

    // Apply filtering on the retrieved list (or via Firestore query in a live setup)
    if (role && role !== "all") {
      list = list.filter((user) => user.role === role);
    }

    if (status && status !== "all") {
      list = list.filter((user) => {
        if (status === "active") {
          return user.isActive && user.onboardingStatus === "active";
        }
        if (status === "pending") {
          return user.onboardingStatus === "invitation_sent" && user.invitationStatus === "pending";
        }
        if (status === "expired") {
          return user.onboardingStatus === "invitation_sent" && user.invitationStatus === "expired";
        }
        if (status === "deactivated") {
          return !user.isActive || user.onboardingStatus === "deactivated";
        }
        return true;
      });
    }

    res.status(200).json({
      success: true,
      data: list
    });
  } catch (error: any) {
    console.error("[Staff Controller] getStaffList error:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to retrieve personnel roster from secure registry.",
      details: error.message
    });
  }
}

/**
 * POST /api/tenants/:tenantId/users
 * Provisions a new user, generates security invitation link, and registers a disabled Auth user.
 */
export async function inviteStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = req.params;
    const actor = req.user;

    if (!actor) {
      res.status(401).json({ success: false, error: "Unauthenticated" });
      return;
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      branchIds,
      branchNames,
      hourlyRate,
      weeklyHourTarget,
      notes
    } = req.body;

    if (!firstName || !lastName || !email || !role || !branchIds) {
      res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Missing mandatory personnel parameters (firstName, lastName, email, role, branchIds)."
      });
      return;
    }

    // Role hierarchy verification
    const actorPower = ROLE_HIERARCHY[actor.role] || 0;
    const targetPower = ROLE_HIERARCHY[role] || 0;

    if (actorPower < targetPower) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: `Security hierarchy violation: Your role '${actor.role}' cannot provision a superior role '${role}'.`
      });
      return;
    }

    // Operational roles constraint (cashier, kitchen, rider) must be assigned to exactly 1 branch
    const isOperational = ["cashier", "kitchen", "rider"].includes(role);
    if (isOperational && branchIds.length !== 1) {
      res.status(400).json({
        success: false,
        error: "Bad Request",
        message: `Operational role '${role}' must be assigned to exactly ONE branch location.`
      });
      return;
    }

    const auth = getAdminAuth();
    const db = getFirestoreDb();

    // Check if user already exists in Firestore
    const existingStaffSnap = await db.collection("staff_users").get();
    const isDuplicate = existingStaffSnap.docs.some((doc: any) => {
      const u = doc.data();
      return u.email.toLowerCase() === email.toLowerCase();
    });

    if (isDuplicate) {
      res.status(409).json({
        success: false,
        error: "Conflict",
        message: "A staff member with this email address has already been provisioned."
      });
      return;
    }

    // Generate secure token for invitation link
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72-hour security validity

    // Create a disabled Firebase Auth user to isolate until onboarding is accepted
    const authUser = await auth.createUser({
      email,
      emailVerified: false,
      disabled: true,
      displayName: `${firstName} ${lastName}`
    });

    // Write metadata record to secure staff_users Firestore collection
    const staffDocRef = db.collection("staff_users").doc(authUser.uid);
    const newStaffUser = {
      userId: authUser.uid,
      tenantId,
      organizationId: tenantId,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      phone: phone || "",
      role,
      branchIds,
      branchNames: branchNames || [],
      isActive: true,
      onboardingStatus: "invitation_sent",
      invitationStatus: "pending",
      inviteToken,
      invitationExpiresAt: expiresAt.toISOString(),
      resendCount: 0,
      createdAt: new Date().toISOString(),
      provisionedBy: actor.uid,
      provisionedByName: actor.email || "System",
      provisionedByRole: actor.role,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      weeklyHourTarget: weeklyHourTarget ? parseInt(weeklyHourTarget) : null,
      notes: notes || null,
      mustChangePasswordOnNextLogin: true,
      scopeHistory: [
        {
          changeId: `sh-init-${Date.now()}`,
          changedAt: new Date().toISOString(),
          changedBy: actor.uid,
          changedByRole: actor.role,
          previousRole: "none",
          newRole: role,
          previousBranchIds: [],
          newBranchIds: branchIds,
          reason: "Initial onboarding: User account provisioned."
        }
      ],
      sessions: []
    };

    await staffDocRef.set(newStaffUser);

    // Set custom user claims on the Firebase Auth user lazily
    await auth.setCustomUserClaims(authUser.uid, {
      tenantId,
      role,
      branchIds
    });

    res.status(201).json({
      success: true,
      message: "Security invitation successfully created and dispatched.",
      data: {
        userId: authUser.uid,
        email: authUser.email,
        inviteLink: `${process.env.APP_URL || "https://ai.studio"}/onboard?token=${inviteToken}`,
        invitationExpiresAt: expiresAt.toISOString()
      }
    });
  } catch (error: any) {
    console.error("[Staff Controller] inviteStaff error:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to dispatch invite and register auth claims.",
      details: error.message
    });
  }
}

/**
 * PATCH /api/tenants/:tenantId/users/:userId/role
 * Modifies the user's role or branch scopes, attaches an audit signature, and revokes JWT refresh tokens.
 */
export async function updateStaffScope(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = req.params;
    const actor = req.user;

    if (!actor) {
      res.status(401).json({ success: false, error: "Unauthenticated" });
      return;
    }

    const { role, branchIds, branchNames, reason } = req.body;

    if (!role || !branchIds || !reason) {
      res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Missing mandatory update parameters (role, branchIds, reason)."
      });
      return;
    }

    if (reason.trim().length < 10) {
      res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Please provide a detailed reason for the scope modification (minimum 10 characters)."
      });
      return;
    }

    const db = getFirestoreDb();
    const userDocRef = db.collection("staff_users").doc(userId);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      res.status(404).json({
        success: false,
        error: "Not Found",
        message: "The requested personnel profile does not exist."
      });
      return;
    }

    const userData = userSnap.data();

    // Prevent modification of tenant owner role via standard route
    if (userData.role === "tenant_owner") {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "Primary Tenant Owner clearances are immutable. Contact Platform Support."
      });
      return;
    }

    // Role hierarchy verification
    const actorPower = ROLE_HIERARCHY[actor.role] || 0;
    const currentTargetPower = ROLE_HIERARCHY[userData.role] || 0;
    const newTargetPower = ROLE_HIERARCHY[role] || 0;

    if (actorPower < currentTargetPower || actorPower < newTargetPower) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: `Security hierarchy violation: Your role '${actor.role}' cannot modify scopes superior/equal to yours.`
      });
      return;
    }

    // Cryptographic audit trail signature generation
    const auditSecret = process.env.AUDIT_SIGNING_KEY || "tenant-security-key-salt";
    const changedAt = new Date().toISOString();
    const payload = `${userId}:${actor.uid}:${userData.role}:${role}:${changedAt}`;
    const cryptographicSignature = crypto
      .createHmac("sha256", auditSecret)
      .update(payload)
      .digest("hex");

    const newHistoryEntry = {
      changeId: `sh-change-${Date.now()}`,
      changedAt,
      changedBy: actor.uid,
      changedByRole: actor.role,
      previousRole: userData.role,
      newRole: role,
      previousBranchIds: userData.branchIds || [],
      newBranchIds: branchIds,
      reason,
      cryptographicSignature // Production-grade immutable validation signature
    };

    const updatedHistory = [newHistoryEntry, ...(userData.scopeHistory || [])];

    // Update staff Firestore record
    await userDocRef.update({
      role,
      branchIds,
      branchNames: branchNames || userData.branchNames || [],
      scopeHistory: updatedHistory,
      updatedAt: new Date().toISOString()
    });

    const auth = getAdminAuth();

    // Re-bind JWT Custom Claims
    await auth.setCustomUserClaims(userId, {
      tenantId,
      role,
      branchIds
    });

    // Enforce instant session invalidation on client
    await auth.revokeRefreshTokens(userId);

    res.status(200).json({
      success: true,
      message: "Scope modified successfully. Security claims updated, and refresh tokens revoked.",
      data: {
        userId,
        newRole: role,
        newBranchIds: branchIds,
        auditTrail: newHistoryEntry
      }
    });
  } catch (error: any) {
    console.error("[Staff Controller] updateStaffScope error:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to update staff credentials or revoke tokens.",
      details: error.message
    });
  }
}

/**
 * DELETE /api/tenants/:tenantId/users/:userId
 * Implements soft deactivation, disables credentials in Auth, and logs security event.
 */
export async function deactivateStaff(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const actor = req.user;

    if (!actor) {
      res.status(401).json({ success: false, error: "Unauthenticated" });
      return;
    }

    const db = getFirestoreDb();
    const userDocRef = db.collection("staff_users").doc(userId);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      res.status(404).json({
        success: false,
        error: "Not Found",
        message: "The requested personnel profile does not exist."
      });
      return;
    }

    const userData = userSnap.data();

    // Prevent deactivating owners
    if (userData.role === "tenant_owner") {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "The primary Tenant Owner cannot be deactivated."
      });
      return;
    }

    // Role hierarchy check
    const actorPower = ROLE_HIERARCHY[actor.role] || 0;
    const targetPower = ROLE_HIERARCHY[userData.role] || 0;

    if (actorPower < targetPower) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: `Security hierarchy violation: Your role '${actor.role}' cannot deactivate a superior role '${userData.role}'.`
      });
      return;
    }

    const changedAt = new Date().toISOString();
    const historyEntry = {
      changeId: `sh-deact-${Date.now()}`,
      changedAt,
      changedBy: actor.uid,
      changedByRole: actor.role,
      previousRole: userData.role,
      newRole: userData.role,
      previousBranchIds: userData.branchIds || [],
      newBranchIds: userData.branchIds || [],
      reason: "Account suspended: Soft-deactivation protocol initiated by administrator."
    };

    const updatedHistory = [historyEntry, ...(userData.scopeHistory || [])];

    // Soft-deactivate Firestore record
    await userDocRef.update({
      isActive: false,
      onboardingStatus: "deactivated",
      scopeHistory: updatedHistory,
      updatedAt: new Date().toISOString()
    });

    const auth = getAdminAuth();

    // Disable login credentials in Auth completely
    await auth.updateUser(userId, {
      disabled: true
    });

    // Revoke current active tokens
    await auth.revokeRefreshTokens(userId);

    console.warn(`[Security Audit] USER_SUSPENDED: UID ${userId} disabled by admin UID ${actor.uid}`);

    res.status(200).json({
      success: true,
      message: "User account soft-deactivated successfully and credentials disabled."
    });
  } catch (error: any) {
    console.error("[Staff Controller] deactivateStaff error:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "Failed to perform soft-deactivation.",
      details: error.message
    });
  }
}
