import { Order, MenuItem, OrderStatus } from "../../src/types";

export interface SyncResult {
  success: boolean;
  syncedItemsCount: number;
  timestamp: string;
  platform: string;
  errors?: string[];
}

export interface AggregatorAdapter {
  platformName: string;
  receiveOrder(rawPayload: any): Promise<Order>;
  mapToUnifiedOrder(aggregatorOrder: any): Order;
  pushStatusUpdate(orderId: string, status: OrderStatus): Promise<{ success: boolean; url: string; payload: any }>;
  syncMenu(menuItems: MenuItem[]): Promise<SyncResult>;
  syncAvailability(itemId: string, isAvailable: boolean): Promise<{ success: boolean; itemId: string; isAvailable: boolean }>;
}
