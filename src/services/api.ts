import { ShippingItem, Appointment, User, Order } from '../types';

const API_BASE = '/api';

export const api = {
  async getItems(userId: string): Promise<ShippingItem[]> {
    const res = await fetch(`${API_BASE}/items/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
  },

  async createItem(item: Partial<ShippingItem>): Promise<ShippingItem> {
    const res = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create item');
    }
    return res.json();
  },

  async createOrder(order: Partial<Appointment | Order>): Promise<any> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create order');
    }
    return res.json();
  },

  async getOrders(customerId: string): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders/${customerId}`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    const data = await res.json();
    return data.map((o: any) => ({
      ...o,
      customerId: o.customer_id,
      totalWeight: o.total_weight,
      totalCost: o.total_cost,
      paymentStatus: o.payment_status,
      createdAt: o.created_at,
      shippingDate: o.shipping_date
    }));
  },

  async updateItemStatus(itemId: string, status: string, userId: string, name: string): Promise<ShippingItem> {
    const res = await fetch(`${API_BASE}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, user_id: userId, name }),
    });
    if (!res.ok) throw new Error('Failed to update item status');
    return res.json();
  },

  async checkHealth(): Promise<{ status: string; supabaseConnected: boolean }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  }
};
