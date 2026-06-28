import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { getFirestoreDb } from "../../lib/firebase-admin";
import { Order, OrderLineItem, OrderStatus, OrderSource } from "../types/db.types";

/**
 * POST /api/tenants/:tenantId/branches/:branchId/orders
 * Core Cashier POS / Order Engine transaction coordinator.
 * Features:
 * 1. Idempotency Guard (verifies and deduplicates using idempotencyKey).
 * 2. Strict Financial Validation (minor-unit integer consistency check on subtotals, taxes, totals).
 * 3. Secure Token Ingress Injection (tenantId, branchId, cashierId, cashierName).
 * 4. Concurrent Safe Multi-Document Firestore Transactions for daily sequencing order counters.
 */
export async function createPosOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { tenantId, branchId } = req.params;
    
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Unauthenticated",
        message: "User session context is missing."
      });
      return;
    }

    const { uid: cashierId, email: cashierEmail } = req.user;
    const payload = req.body;

    // Retrieve idempotency key
    const idempotencyKey = payload.idempotencyKey || req.headers["idempotency-key"];
    if (!idempotencyKey || typeof idempotencyKey !== "string") {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        message: "An idempotencyKey (UUIDv4) is strictly required to prevent double billing."
      });
      return;
    }

    const db = getFirestoreDb();

    // 1. Check Idempotency Cache
    const idempotencyQuery = await db.collection("orders")
      .where("tenantId", "==", tenantId)
      .where("idempotencyKey", "==", idempotencyKey)
      .limit(1)
      .get();

    if (!idempotencyQuery.empty) {
      const existingOrder = idempotencyQuery.docs[0]!.data() as Order;
      console.log(`[Idempotency Hit] Returning cached response for key: ${idempotencyKey}`);
      res.set("X-Cache-Idempotency", "HIT");
      res.status(200).json({
        success: true,
        message: "Order already processed (Idempotent response).",
        idempotencyHit: true,
        data: existingOrder
      });
      return;
    }

    // 2. Extract and Validate Line Items
    const orderItems: OrderLineItem[] = payload.orderItems;
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        message: "At least one orderLineItem is required to initialize an order."
      });
      return;
    }

    // 3. Strict Financial Engine Validation (Integrity Checks in Minor-Unit Integers)
    let calculatedSubtotal = 0;
    let calculatedTaxAmount = 0;
    let calculatedDiscountAmount = 0;

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i]!;
      
      // Enforce integers
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          message: `Line item at index ${i} has invalid quantity. Must be a positive integer.`
        });
        return;
      }
      
      if (!Number.isInteger(item.unitPrice) || item.unitPrice < 0) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          message: `Line item at index ${i} has invalid unitPrice. Must be a non-negative integer.`
        });
        return;
      }

      // Modifier validation
      let modifierSum = 0;
      if (Array.isArray(item.selectedModifiers)) {
        for (const mod of item.selectedModifiers) {
          if (!Number.isInteger(mod.priceAdjustment)) {
            res.status(400).json({
              success: false,
              error: "Validation Error",
              message: `Modifier '${mod.optionId}' price adjustment is not a valid integer.`
            });
            return;
          }
          modifierSum += mod.priceAdjustment;
        }
      }

      // Assert Line Subtotal: (unitPrice + modifierSum) * quantity
      const expectedLineSubtotal = (item.unitPrice + modifierSum) * item.quantity;
      if (item.lineSubtotal !== expectedLineSubtotal) {
        res.status(400).json({
          success: false,
          error: "Financial Tampering Detected",
          message: `Line item subtotal at index ${i} is mathematically incorrect. Expected ${expectedLineSubtotal}, received ${item.lineSubtotal}.`
        });
        return;
      }

      // Assert Line Total: lineSubtotal + taxAmount - discountAmount
      const expectedLineTotal = item.lineSubtotal + (item.taxAmount || 0) - (item.discountAmount || 0);
      if (item.lineTotal !== expectedLineTotal) {
        res.status(400).json({
          success: false,
          error: "Financial Tampering Detected",
          message: `Line item total at index ${i} is mathematically incorrect. Expected ${expectedLineTotal}, received ${item.lineTotal}.`
        });
        return;
      }

      calculatedSubtotal += item.lineSubtotal;
      calculatedTaxAmount += (item.taxAmount || 0);
      calculatedDiscountAmount += (item.discountAmount || 0);
    }

    // Global assertions
    const payloadSubtotal = Number(payload.subtotal);
    const payloadTaxAmount = Number(payload.taxAmount);
    const payloadDiscountAmount = Number(payload.discountAmount);
    const deliveryFeeTotal = Number(payload.deliveryFeeTotal || 0);
    const roundingAdjustment = Number(payload.roundingAdjustment || 0);
    const payloadTotal = Number(payload.totalAmount);

    if (payloadSubtotal !== calculatedSubtotal) {
      res.status(400).json({
        success: false,
        error: "Financial Tampering Detected",
        message: `Order subtotal discrepancy. Calculated: ${calculatedSubtotal}, received: ${payloadSubtotal}.`
      });
      return;
    }

    if (payloadTaxAmount !== calculatedTaxAmount) {
      res.status(400).json({
        success: false,
        error: "Financial Tampering Detected",
        message: `Order taxAmount discrepancy. Calculated: ${calculatedTaxAmount}, received: ${payloadTaxAmount}.`
      });
      return;
    }

    if (payloadDiscountAmount !== calculatedDiscountAmount) {
      res.status(400).json({
        success: false,
        error: "Financial Tampering Detected",
        message: `Order discountAmount discrepancy. Calculated: ${calculatedDiscountAmount}, received: ${payloadDiscountAmount}.`
      });
      return;
    }

    const calculatedTotal = calculatedSubtotal + calculatedTaxAmount + deliveryFeeTotal + roundingAdjustment - calculatedDiscountAmount;
    if (payloadTotal !== calculatedTotal) {
      res.status(400).json({
        success: false,
        error: "Financial Tampering Detected",
        message: `Order totalAmount calculation mismatch. Calculated: ${calculatedTotal} (subtotal: ${calculatedSubtotal} + tax: ${calculatedTaxAmount} + delivery: ${deliveryFeeTotal} + rounding: ${roundingAdjustment} - discount: ${calculatedDiscountAmount}), received: ${payloadTotal}.`
      });
      return;
    }

    // Define Date-based Daily Sequencing keys (UTC timezone is standard for financial day closure)
    const todayStr = new Date().toISOString().split("T")[0]!;
    const dailySequenceKey = `${tenantId}_${branchId}_${todayStr}`;
    const counterDocRef = db.collection("branch_counters").doc(dailySequenceKey);
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Prepare security invariants (inject verified values from req.user to block spoofing)
    const cashierName = cashierEmail ? cashierEmail.split("@")[0]! : "Cashier";

    // 4. Concurrency Guard Transaction
    const finalizedOrder = await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterDocRef);
      let nextOrderNumber = 1;

      if (counterDoc.exists) {
        const data = counterDoc.data();
        if (data && typeof data.lastOrderNumber === "number") {
          nextOrderNumber = data.lastOrderNumber + 1;
        }
      }

      // Update counter
      transaction.set(counterDocRef, {
        lastOrderNumber: nextOrderNumber,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Compose final secure Order
      const newOrder: Order = {
        orderId,
        tenantId,
        branchId,
        orderNumber: nextOrderNumber,
        dailySequenceKey,
        idempotencyKey,
        fulfillmentType: payload.fulfillmentType || "dine_in",
        orderSource: payload.orderSource || "pos",
        status: (payload.status as OrderStatus) || "new",
        tableId: payload.tableId || null,
        tableLabel: payload.tableLabel || null,
        coverCount: typeof payload.coverCount === "number" ? payload.coverCount : null,
        cashierId,
        cashierName,
        shiftId: payload.shiftId || "default_shift",
        registerId: payload.registerId || "default_register",
        customerId: payload.customerId || null,
        customerName: payload.customerName || null,
        customerPhone: payload.customerPhone || null,
        deliveryAddress: payload.deliveryAddress || null,
        deliveryZoneId: payload.deliveryZoneId || null,
        deliveryFee: payload.deliveryFee || null,
        riderId: null,
        riderName: null,
        estimatedPickupTime: payload.estimatedPickupTime || null,
        estimatedDeliveryTime: payload.estimatedDeliveryTime || null,
        orderItems: orderItems.map((item, idx) => ({
          ...item,
          lineId: item.lineId || `line_${idx}_${Date.now()}`
        })),
        subtotal: calculatedSubtotal,
        taxAmount: calculatedTaxAmount,
        discountAmount: calculatedDiscountAmount,
        discountId: payload.discountId || null,
        discountCode: payload.discountCode || null,
        deliveryFeeTotal,
        roundingAdjustment,
        totalAmount: calculatedTotal,
        payments: Array.isArray(payload.payments) ? payload.payments : [],
        totalPaid: typeof payload.totalPaid === "number" ? payload.totalPaid : 0,
        changeGiven: typeof payload.changeGiven === "number" ? payload.changeGiven : 0,
        loyaltyPointsEarned: typeof payload.loyaltyPointsEarned === "number" ? payload.loyaltyPointsEarned : null,
        loyaltyPointsRedeemed: typeof payload.loyaltyPointsRedeemed === "number" ? payload.loyaltyPointsRedeemed : null,
        loyaltyPointsValue: typeof payload.loyaltyPointsValue === "number" ? payload.loyaltyPointsValue : null,
        notes: payload.notes || null,
        statusHistory: [
          {
            status: (payload.status as OrderStatus) || "new",
            timestamp: new Date().toISOString(),
            updatedBy: cashierId
          }
        ],
        kdsCompletedAt: null,
        readyAt: null,
        pickedUpAt: null,
        deliveredAt: null,
        completedAt: null,
        voidedAt: null,
        voidedBy: null,
        voidReason: null,
        voidManagerPinVerificationId: null,
        refundedAt: null,
        refundedBy: null,
        refundReason: null,
        refundAmount: null,
        aggregatorOrderId: payload.aggregatorOrderId || null,
        isOfflineCreated: false,
        offlineSyncedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save Order inside the transaction context
      const orderDocRef = db.collection("orders").doc(orderId);
      transaction.set(orderDocRef, newOrder);

      return newOrder;
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      data: finalizedOrder
    });
  } catch (error: any) {
    console.error("[POS Order Engine] Concurrency transaction failed:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "POSIX transaction failed or database write error during checkout.",
      details: error.message
    });
  }
}
