import { Request, Response, NextFunction } from "express";
import { getAdminAuth } from "../../lib/firebase-admin";
import { StaffRole } from "../types/db.types";

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    tenantId: string;
    role: StaffRole;
    branchIds: string[];
  };
}

/**
 * Middleware to ensure the user is authenticated by verifying the Firebase ID Token.
 * Extracts custom claims (tenantId, role, branchIds) and appends them to req.user.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Authentication required",
      message: "Please provide a valid Authorization Bearer token."
    });
    return;
  }

  const token = authHeader.split(" ")[1]!;

  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);

    const tenantId = decodedToken.tenantId;
    const role = decodedToken.role as StaffRole;
    const branchIds = decodedToken.branchIds || [];

    if (!tenantId || !role) {
      res.status(403).json({
        success: false,
        error: "Insufficient token claims",
        message: "The provided token does not contain required tenant or role assertions."
      });
      return;
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      tenantId,
      role,
      branchIds
    };

    next();
  } catch (error: any) {
    console.error("[Auth Middleware] Token verification failed:", error.message);
    res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Invalid or expired authentication token.",
      details: error.message
    });
  }
}

/**
 * Middleware to enforce strict RBAC.
 */
export function requireRole(...allowedRoles: StaffRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Unauthenticated",
        message: "Authentication is required before authorization can be evaluated."
      });
      return;
    }

    const { role, tenantId } = req.user;

    // Guard against tenant tampering
    const requestedTenantId = req.params.tenantId || req.body.tenantId;
    if (requestedTenantId && requestedTenantId !== tenantId) {
      console.warn(`[Security Alert] Cross-tenant access blocked: User '${tenantId}' tried to access tenant '${requestedTenantId}'`);
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "Security violation: Cross-tenant data access is prohibited."
      });
      return;
    }

    if (!allowedRoles.includes(role)) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: `Your role '${role}' does not have permission to execute this operation. Allowed: ${allowedRoles.join(", ")}`
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to validate that the requested branchId falls within the user's allowed branchIds array
 * to prevent cross-branch leakage.
 */
export function requireBranchAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Unauthenticated",
      message: "Authentication is required before branch authorization can be evaluated."
    });
    return;
  }

  const { branchIds, role } = req.user;
  const requestedBranchId = req.params.branchId || req.body.branchId;

  if (!requestedBranchId) {
    res.status(400).json({
      success: false,
      error: "Missing branch context",
      message: "This endpoint requires a branchId in the route parameters or request body."
    });
    return;
  }

  // Bypass for roles that have global access, or if the user's branchIds contains "*"
  const hasGlobalBypass = 
    role === "platform_admin" || 
    role === "admin" || 
    role === "hr_manager" || 
    role === "accountant" ||
    branchIds.includes("*");

  if (!hasGlobalBypass && !branchIds.includes(requestedBranchId)) {
    console.warn(`[Security Alert] Cross-branch access blocked: User with branch permissions ${JSON.stringify(branchIds)} tried to access branch '${requestedBranchId}'`);
    res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "Security violation: You do not have permission to access data for this branch."
    });
    return;
  }

  next();
}
