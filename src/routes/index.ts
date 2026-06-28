import { Router } from "express";
import { requireAuth, requireRole, requireBranchAccess } from "../middleware/auth.middleware";
import { createMenuItem, getBranchMenu } from "../controllers/menu.controller";
import { createPosOrder } from "../controllers/order.controller";

const router = Router();

/**
 * Menu Management Endpoints
 */
// Fetch branch menu
router.get(
  "/api/tenants/:tenantId/branches/:branchId/menu",
  requireAuth,
  requireBranchAccess,
  getBranchMenu
);

// Create new menu item
router.post(
  "/api/tenants/:tenantId/branches/:branchId/menu",
  requireAuth,
  requireRole("platform_admin", "admin", "branch_manager"),
  requireBranchAccess,
  createMenuItem
);

/**
 * POS Cashier Order Engine Endpoints
 */
// Place new POS Order
router.post(
  "/api/tenants/:tenantId/branches/:branchId/orders",
  requireAuth,
  requireRole("platform_admin", "admin", "branch_manager", "cashier"),
  requireBranchAccess,
  createPosOrder
);

export default router;
