import { Request, Response, NextFunction } from "express";
import { getAdminAuth } from "../lib/firebase-admin";

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    tenantId: string;
    role: string;
    branchIds: string[];
  };
}

/**
 * Middleware to authenticate requests by verifying the Firebase ID Token.
 * Extracts custom claims (tenantId, role, branchIds) and appends them to req.user.
 */
export async function authenticateToken(
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

  const token = authHeader.split(" ")[1];

  try {
    const auth = getAdminAuth();
    // Verify token using firebase-admin
    const decodedToken = await auth.verifyIdToken(token);

    // Ensure custom claims are populated
    const tenantId = decodedToken.tenantId;
    const role = decodedToken.role;
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
 * Authorization guard that enforces role permissions and isolates requests
 * to verify tenant context consistency (rejecting parameter tampering).
 * 
 * @param allowedRoles The user roles allowed to access this endpoint.
 */
export function authorizeRoles(...allowedRoles: string[]) {
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

    // Cross-tenant escalation guard
    const requestedTenantId = req.params.tenantId;
    if (requestedTenantId && requestedTenantId !== tenantId) {
      console.warn(`[Security Alert] Potential tenant cross-talk escalation blocked! User tenant '${tenantId}' tried to access parameter tenant '${requestedTenantId}'`);
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "Security violation: Cross-tenant data tampering is strictly prohibited."
      });
      return;
    }

    // Role verification
    if (!allowedRoles.includes(role)) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: `Your role '${role}' does not have permission to execute this operation. Required: ${allowedRoles.join(", ")}`
      });
      return;
    }

    next();
  };
}
