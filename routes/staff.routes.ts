import { Router } from "express";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware";
import {
  getStaffList,
  inviteStaff,
  updateStaffScope,
  deactivateStaff
} from "../controllers/staff.controller";

const router = Router();

/**
 * Routing configuration for Tenant Owner Self-Service Portal (Staff Management API)
 * All endpoints enforce:
 * 1. authenticateToken - Verifies and decodes JWT, sets tenantId, role, and branchIds context.
 * 2. authorizeRoles - Controls operational role gating.
 * 3. Cross-Tenant parameter tamper guarding (inside authorizeRoles).
 */

// Fetch personnel roster (Access limited to Owners and Admins)
router.get(
  "/api/tenants/:tenantId/users",
  authenticateToken,
  authorizeRoles("tenant_owner", "tenant_admin"),
  getStaffList
);

// Provision new personnel (Access limited to Owners, Admins, and Branch Managers)
router.post(
  "/api/tenants/:tenantId/users",
  authenticateToken,
  authorizeRoles("tenant_owner", "tenant_admin", "branch_manager"),
  inviteStaff
);

// Modify employee role or branch assignments (Access limited to Owners and Admins)
router.patch(
  "/api/tenants/:tenantId/users/:userId/role",
  authenticateToken,
  authorizeRoles("tenant_owner", "tenant_admin"),
  updateStaffScope
);

// Soft-deactivate personnel account (Access limited to Owners, Admins, and Branch Managers)
router.delete(
  "/api/tenants/:tenantId/users/:userId",
  authenticateToken,
  authorizeRoles("tenant_owner", "tenant_admin", "branch_manager"),
  deactivateStaff
);

export default router;
