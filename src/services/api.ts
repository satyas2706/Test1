import { ShippingItem, Order, Appointment, StoreProduct } from '../types';
import { COMPANY_DETAILS } from '../constants';

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

  async fetchProducts(): Promise<StoreProduct[]> {
    const response = await fetch(`${API_URL}/api/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return await response.json();
  },

  async createProduct(product: Partial<StoreProduct>): Promise<StoreProduct> {
    const response = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Failed to create product');
    return await response.json();
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

  async getAllOrders(): Promise<Order[]> {
    const response = await fetch(`${API_URL}/api/orders`);
    if (!response.ok) throw new Error('Failed to fetch all orders');
    return await response.json();
  },

  async trackOrder(orderId: string): Promise<Order> {
    const response = await fetch(`${API_URL}/api/orders/track/${orderId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Order not found');
    }
    return await response.json();
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

  async updateOrder(orderId: string, updates: Partial<Order>) {
    const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update order');
    return await response.json();
  },

  async sendInvoicePDF(email: string, order: Order, companyDetails: any) {
    const response = await fetch(`${API_URL}/api/invoice/send-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, order, companyDetails }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to send invoice');
    }
    return await response.json();
  },

  async sendOrderConfirmationEmail(email: string, order: Order, companyDetails: any) {
    const response = await fetch(`${API_URL}/api/order-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, order, companyDetails }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to send order confirmation');
    }
    return await response.json();
  },

  async shareInvoice(order: Order) {
    return this.sendInvoicePDF(order.destination.email || '', order, COMPANY_DETAILS);
  },
  
  async updateItemWeight(itemId: string, weight: number) {
    const response = await fetch(`${API_URL}/api/items/${itemId}/weight`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weight }),
    });
    if (!response.ok) throw new Error('Failed to update weight');
    return await response.json();
  },

  async clearAllOrders() {
    const response = await fetch(`${API_URL}/api/orders`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to clear orders');
    return await response.json();
  }
};
