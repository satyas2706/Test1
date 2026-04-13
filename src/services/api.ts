import { ShippingItem, Order, Appointment } from '../types';

const API_URL = window.location.origin;

export const api = {
  async checkHealth() {
    try {
      const response = await fetch(`${API_URL}/api/health`);
      return await response.json();
    } catch (error) {
      return { status: 'error', error: (error as Error).message };
    }
  },

  async fetchItems(userId: string): Promise<ShippingItem[]> {
    const response = await fetch(`${API_URL}/api/items/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch items');
    return await response.json();
  },

  async createItem(item: Partial<ShippingItem> & { customer_id: string }, ...args: any[]) {
    const response = await fetch(`${API_URL}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to create item');
    return await response.json();
  },

  async createOrder(order: Partial<Order>) {
    const response = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!response.ok) throw new Error('Failed to create order');
    return await response.json();
  },

  async fetchOrders(userId: string): Promise<Order[]> {
    const response = await fetch(`${API_URL}/api/orders/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return await response.json();
  },

  async getOrders(userId: string): Promise<Order[]> {
    return this.fetchOrders(userId);
  },

  async updateItemStatus(itemId: string, status: string, ...args: any[]) {
    const response = await fetch(`${API_URL}/api/items/${itemId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update status');
    return await response.json();
  },

  async updateOrderStatus(orderId: string, status: string, ...args: any[]) {
    const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update order status');
    return await response.json();
  },

  async sendInvoicePDF(email: string, order: Order, companyDetails: any) {
    const response = await fetch(`${API_URL}/api/invoice/send-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, order, companyDetails }),
    });
    if (!response.ok) throw new Error('Failed to send invoice');
    return await response.json();
  },

  async sendOrderConfirmationEmail(email: string, order: Order, companyDetails: any) {
    const response = await fetch(`${API_URL}/api/order-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, order, companyDetails }),
    });
    if (!response.ok) throw new Error('Failed to send order confirmation');
    return await response.json();
  },

  async shareInvoice(order: Order, ...args: any[]) {
    return this.sendInvoicePDF(order, ...args);
  }
};
