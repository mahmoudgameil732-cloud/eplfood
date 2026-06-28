import { AggregatorAdapter, SyncResult } from "./adapter.interface";
import { Order, MenuItem, OrderStatus, OrderItem, OrderItemModifier } from "../../src/types";

export class CareemAdapter implements AggregatorAdapter {
  platformName = "careem";
  private commissionRate = 0.18; // 18% Careem Commission

  async receiveOrder(rawPayload: any): Promise<Order> {
    return this.mapToUnifiedOrder(rawPayload);
  }

  mapToUnifiedOrder(aggregatorOrder: any): Order {
    const rawOrder = aggregatorOrder.order || aggregatorOrder;
    const items: OrderItem[] = (rawOrder.items || []).map((item: any, index: number): OrderItem => {
      const itemModifiers: OrderItemModifier[] = (item.customizations || []).map((m: any): OrderItemModifier => ({
        groupId: m.id || "mod-group",
        groupName: m.groupName || "Customizations",
        optionId: m.optionId || `opt-${m.name.toLowerCase().replace(/\s+/g, "-")}`,
        optionName: m.name,
        price: Number(m.price) || 0
      }));

      return {
        id: item.itemId || `it-${index}`,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        notes: item.instructions || "",
        course: "main",
        fired: true,
        modifiers: itemModifiers
      };
    });

    const subtotal = items.reduce((sum, item) => {
      const modifiersCost = item.modifiers.reduce((mSum, m) => mSum + m.price, 0);
      return sum + (item.price + modifiersCost) * item.quantity;
    }, 0);

    const deliveryFee = Number(rawOrder.delivery_charge) || 4.50;
    const discountAmount = Number(rawOrder.discount) || 0;
    const totalAmount = subtotal + deliveryFee - discountAmount;

    const commissionAmount = Number((totalAmount * this.commissionRate).toFixed(2));
    const timestamp = rawOrder.booking_time || new Date().toISOString();

    return {
      id: rawOrder.id ? `car-${rawOrder.id}` : `car-${Date.now()}`,
      tableId: null,
      tableName: "Careem Delivery",
      fulfillmentType: "delivery",
      orderSource: "aggregator:careem",
      items,
      status: "placed",
      totalAmount,
      shiftId: null,
      placedAt: timestamp,
      updatedAt: new Date().toISOString(),
      delivery: {
        address: rawOrder.dropoff_address || "Careem Customer Location, Dubai",
        latitude: rawOrder.latitude || 25.1972,
        longitude: rawOrder.longitude || 55.2744,
        distanceKm: rawOrder.distance_km || 4.2,
        deliveryFee,
        riderName: rawOrder.captain_name || "Careem Captain",
        riderPhone: rawOrder.captain_phone || "+971501111111"
      },
      payment: {
        method: "card",
        subtotal,
        taxAmount: Number((subtotal * 0.05).toFixed(2)),
        surcharge: 0,
        discountAmount,
        totalPaid: totalAmount,
        tipAmount: Number(rawOrder.tip) || 0
      }
    };
  }

  async pushStatusUpdate(orderId: string, status: OrderStatus): Promise<{ success: boolean; url: string; payload: any }> {
    let careemStatus = "RECEIVED";
    if (status === "confirmed") careemStatus = "CONFIRMED";
    else if (status === "preparing") careemStatus = "PREPARING";
    else if (status === "ready_for_rider" || status === "rider_assigned") careemStatus = "READY_FOR_COLLECTION";
    else if (status === "picked_up") careemStatus = "DISPATCHED";
    else if (status === "delivered" || status === "completed" || status === "paid") careemStatus = "DELIVERED";
    else if (status === "voided") careemStatus = "CANCELLED";

    const payload = {
      booking_id: orderId.replace(/^car-/, ""),
      status: careemStatus,
      timestamp: new Date().toISOString()
    };

    const url = "https://api.careem.com/v2/orders/status";
    return {
      success: true,
      url,
      payload
    };
  }

  async syncMenu(menuItems: MenuItem[]): Promise<SyncResult> {
    const syncedItemsCount = menuItems.length;
    return {
      success: true,
      syncedItemsCount,
      timestamp: new Date().toISOString(),
      platform: "careem"
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
