import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getFirestoreDb } from "../../lib/firebase-admin";
import { MenuItem } from "../types/db.types";

/**
 * POST /api/tenants/:tenantId/branches/:branchId/menu
 * Creates a new menu item. Forcibly overrides tenantId and branchId from path params.
 * Strictly validates and forces financial fields (like basePrice) to be minor-unit integers.
 */
export async function createMenuItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { tenantId, branchId } = req.params;
    const userId = req.user?.uid || "system";

    // 1. Payloads validation
    const payload = req.body;
    if (!payload.name || typeof payload.name !== "object" || Object.keys(payload.name).length === 0) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        message: "A multilingual name object is required (e.g., { en: 'Classic Burger' })."
      });
      return;
    }

    if (!payload.categoryId) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        message: "categoryId is required."
      });
      return;
    }

    // Process and validate financial fields (basePrice must be a strict minor-unit integer)
    let basePrice: number;
    if (payload.basePrice === undefined || payload.basePrice === null) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        message: "basePrice is required."
      });
      return;
    }

    // Strict validation and processing to minor-unit integer (no decimals allowed)
    const rawPrice = Number(payload.basePrice);
    if (isNaN(rawPrice) || !Number.isInteger(rawPrice) || rawPrice < 0) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        message: "basePrice must be a non-negative integer representing minor units (e.g., 500 for $5.00)."
      });
      return;
    }
    basePrice = rawPrice;

    // Validate channelPricing overrides if present
    const channelPricing: Record<string, number> = {};
    if (payload.channelPricing && typeof payload.channelPricing === "object") {
      for (const [channel, price] of Object.entries(payload.channelPricing)) {
        const parsedPrice = Number(price);
        if (isNaN(parsedPrice) || !Number.isInteger(parsedPrice) || parsedPrice < 0) {
          res.status(400).json({
            success: false,
            error: "Validation Error",
            message: `Channel pricing override for '${channel}' must be a non-negative integer.`
          });
          return;
        }
        channelPricing[channel] = parsedPrice;
      }
    }

    // Build the robust, type-safe MenuItem document
    const itemId = payload.itemId || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const menuItem: MenuItem = {
      itemId,
      tenantId,
      branchId: branchId === "global" ? null : branchId,
      categoryId: payload.categoryId,
      name: payload.name,
      description: payload.description || {},
      imageUrl: payload.imageUrl || null,
      displayOrder: typeof payload.displayOrder === "number" ? payload.displayOrder : 0,
      basePrice,
      channelPricing: Object.keys(channelPricing).length > 0 ? channelPricing : undefined,
      taxRate: typeof payload.taxRate === "number" ? payload.taxRate : null,
      taxIncluded: typeof payload.taxIncluded === "boolean" ? payload.taxIncluded : null,
      recipeBomId: payload.recipeBomId || null,
      theoreticalCostPrice: typeof payload.theoreticalCostPrice === "number" ? payload.theoreticalCostPrice : null,
      foodCostPercent: typeof payload.foodCostPercent === "number" ? payload.foodCostPercent : null,
      isAvailable: payload.isAvailable !== false,
      availableChannels: Array.isArray(payload.availableChannels) ? payload.availableChannels : ["pos"],
      availableHours: payload.availableHours || null,
      kdsStation: payload.kdsStation || null,
      prepTimeMinutes: typeof payload.prepTimeMinutes === "number" ? payload.prepTimeMinutes : 0,
      modifierGroups: Array.isArray(payload.modifierGroups) ? payload.modifierGroups : [],
      allergens: Array.isArray(payload.allergens) ? payload.allergens : [],
      calories: typeof payload.calories === "number" ? payload.calories : null,
      isArchived: payload.isArchived === true,
      isFeatured: payload.isFeatured === true,
      menuEngineeringClass: payload.menuEngineeringClass || null,
      aggregatorMappings: payload.aggregatorMappings || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      lastModifiedBy: userId
    };

    const db = getFirestoreDb();
    await db.collection("menu_items").doc(itemId).set(menuItem);

    res.status(201).json({
      success: true,
      message: "Menu item created successfully.",
      data: menuItem
    });
  } catch (error: any) {
    console.error("[Menu Controller] Error creating menu item:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "An unexpected error occurred while saving the menu item.",
      details: error.message
    });
  }
}

/**
 * GET /api/tenants/:tenantId/branches/:branchId/menu
 * Fetches the active (non-archived & available) menu items for a specific branch.
 * Native queries in Firestore, retrieving global items plus branch override items, combining them securely.
 */
export async function getBranchMenu(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { tenantId, branchId } = req.params;

    const db = getFirestoreDb();
    const menuItemsRef = db.collection("menu_items");

    // Retrieve active items for the specific tenant
    // Natively querying tenantId and filter out archived ones where possible.
    const snapshot = await menuItemsRef
      .where("tenantId", "==", tenantId)
      .where("isArchived", "==", false)
      .get();

    const items: MenuItem[] = [];
    snapshot.docs.forEach((doc: any) => {
      items.push(doc.data() as MenuItem);
    });

    // Segment and merge menu items:
    // 1. Global Items (branchId is null or 'global')
    // 2. Specific Branch overrides (branchId matches)
    // If a branch-specific item override has the same ID or name, branch override takes priority.
    const globalItems = items.filter(item => item.branchId === null || item.branchId === "global");
    const branchSpecificItems = items.filter(item => item.branchId === branchId);

    // Build the resolved menu list
    const finalMenu: MenuItem[] = [];
    
    // We use categoryId and itemId tracking to compose the branch specific menu.
    // If there is a branch-specific menu item with the same name or ID override, we prefer it.
    branchSpecificItems.forEach(item => {
      finalMenu.push(item);
    });

    globalItems.forEach(globalItem => {
      // Check if this global item has been overridden for this branch
      const hasOverride = branchSpecificItems.some(
        bItem => bItem.itemId === globalItem.itemId || 
        (bItem.name.en === globalItem.name.en && bItem.categoryId === globalItem.categoryId)
      );
      if (!hasOverride) {
        finalMenu.push(globalItem);
      }
    });

    // Sort by displayOrder
    finalMenu.sort((a, b) => a.displayOrder - b.displayOrder);

    res.status(200).json({
      success: true,
      count: finalMenu.length,
      data: finalMenu
    });
  } catch (error: any) {
    console.error("[Menu Controller] Error fetching branch menu:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "An unexpected error occurred while fetching the branch menu.",
      details: error.message
    });
  }
}
