import { AggregatorAdapter, SyncResult } from "./adapter.interface";
import { Order, MenuItem, OrderStatus, OrderItem, OrderItemModifier } from "../../src/types";

export class TalabatAdapter implements AggregatorAdapter {
  platformName = "talabat";
  private commissionRate = 0.15; // 15% Talabat Commission

  async receiveOrder(rawPayload: any): Promise<Order> {
    return this.mapToUnifiedOrder(rawPayload);
  }

  mapToUnifiedOrder(aggregatorOrder: any): Order {
    const rawOrder = aggregatorOrder.order || aggregatorOrder;
    const items: OrderItem[] = (rawOrder.items || []).map((item: any, index: number): OrderItem => {
      const itemModifiers: OrderItemModifier[] = (item.modifiers || []).map((m: any): OrderItemModifier => ({
        groupId: m.groupId || "mod-group",
        groupName: m.groupName || "Modifiers",
        optionId: m.optionId || `opt-${m.name.toLowerCase().replace(/\s+/g, "-")}`,
        optionName: m.name,
        price: Number(m.price) || 0
      }));

      return {
        id: item.itemId || `it-${index}`,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        notes: item.notes || "",
        course: "main", // Default course classification
        fired: true, // Auto-fired for aggregator delivery
        modifiers: itemModifiers
      };
    });

    const subtotal = items.reduce((sum, item) => {
      const modifiersCost = item.modifiers.reduce((mSum, m) => mSum + m.price, 0);
      return sum + (item.price + modifiersCost) * item.quantity;
    }, 0);

    const deliveryFee = Number(rawOrder.delivery_fee) || 5.00;
    const discountAmount = Number(rawOrder.discount_amount) || 0;
    const totalAmount = subtotal + deliveryFee - discountAmount;

    const commissionAmount = Number((totalAmount * this.commissionRate).toFixed(2));

    const timestamp = rawOrder.created_at || new Date().toISOString();

    return {
      id: rawOrder.id ? `tal-${rawOrder.id}` : `tal-${Date.now()}`,
      tableId: null,
      tableName: "Talabat Delivery",
      fulfillmentType: "delivery",
      orderSource: "aggregator:talabat",
      items,
      status: "placed",
      totalAmount,
      shiftId: null,
      placedAt: timestamp,
      updatedAt: new Date().toISOString(),
      delivery: {
        address: rawOrder.delivery_address || "Talabat Customer Address, Dubai",
        latitude: rawOrder.latitude || 25.2048,
        longitude: rawOrder.longitude || 55.2708,
        distanceKm: rawOrder.distance_km || 3.5,
        deliveryFee,
        riderName: rawOrder.rider_name || "Talabat Rider",
        riderPhone: rawOrder.rider_phone || "+971500000000"
      },
      payment: {
        method: "card",
        subtotal,
        taxAmount: Number((subtotal * 0.05).toFixed(2)), // 5% VAT included
        surcharge: 0,
        discountAmount,
        totalPaid: totalAmount,
        tipAmount: Number(rawOrder.tip_amount) || 0
      }
    };
  }

  async pushStatusUpdate(orderId: string, status: OrderStatus): Promise<{ success: boolean; url: string; payload: any }> {
    // Translate our status to Talabat status
    let talabatStatus = "RECEIVED";
    if (status === "confirmed") talabatStatus = "ACCEPTED";
    else if (status === "preparing") talabatStatus = "PREPARING";
    else if (status === "ready_for_rider" || status === "rider_assigned") talabatStatus = "READY";
    else if (status === "picked_up") talabatStatus = "OUT_FOR_DELIVERY";
    else if (status === "delivered" || status === "completed" || status === "paid") talabatStatus = "DELIVERED";
    else if (status === "voided") talabatStatus = "CANCELLED";

    const payload = {
      order_id: orderId.replace(/^tal-/, ""),
      status: talabatStatus,
      updated_at: new Date().toISOString()
    };

    // Simulate API request to Talabat
    const url = "https://api.talabat.com/v1/orders/status-update";
    return {
      success: true,
      url,
      payload
    };
  }

  async syncMenu(menuItems: MenuItem[]): Promise<SyncResult> {
    // Filter items with visible channel or default
    const syncedItemsCount = menuItems.length;
    return {
      success: true,
      syncedItemsCount,
      timestamp: new Date().toISOString(),
      platform: "talabat"
    };
  }

  async syncAvailability(itemId: string, isAvailable: boolean): Promise<{ success: boolean; itemId: string; isAvailable: boolean }> {
    return {
      success: true,
      itemId,
      isAvailable
    };
  }
}
