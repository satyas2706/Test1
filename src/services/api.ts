import { ShippingItem, Order, Appointment, StoreProduct } from '../types';
import { COMPANY_DETAILS } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const API_URL = window.location.origin;

// Database converters for Products
function dbToProduct(dbProduct: any): StoreProduct {
  if (!dbProduct) return dbProduct;
  const { estimated_delivery, ...rest } = dbProduct;
  return {
    ...rest,
    estimatedDelivery: estimated_delivery || ''
  } as StoreProduct;
}

function productToDb(product: any) {
  if (!product) return null;
  const { estimatedDelivery, id, ...rest } = product;
  const dbProduct: any = {
    ...rest,
    estimated_delivery: estimatedDelivery
  };
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
  if (id && isValidUuid) {
    dbProduct.id = id;
  }
  return dbProduct;
}

// Database converters for Items
function dbToItem(dbItem: any): ShippingItem {
  if (!dbItem) return dbItem;
  return {
    id: dbItem.id,
    userId: dbItem.user_id || dbItem.userId,
    name: dbItem.name,
    weight: dbItem.weight || 0,
    status: dbItem.status || 'Received at Warehouse',
    source: dbItem.source || 'Warehouse',
    price: dbItem.price || 0,
    image: dbItem.image || '',
    estimatedDelivery: dbItem.estimated_delivery || dbItem.estimatedDelivery || '',
    submitted: dbItem.submitted !== undefined ? dbItem.submitted : dbItem.source !== 'Warehouse'
  } as ShippingItem;
}

export function groupItems(flatItems: ShippingItem[]): ShippingItem[] {
  const grouped: { [key: string]: ShippingItem & { ids: string[] } } = {};
  
  for (const item of flatItems) {
    if (!item) continue;
    // Group by name (lowercase) + source + submitted
    const key = `${(item.name || '').toLowerCase()}_${item.source || 'Warehouse'}_${!!item.submitted}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        ...item,
        quantity: item.quantity || 1,
        ids: [item.id]
      };
    } else {
      const g = grouped[key];
      g.quantity = (g.quantity || 1) + (item.quantity || 1);
      g.weight = (g.weight || 0) + (item.weight || 0);
      g.price = (g.price || 0) + (item.price || 0);
      g.ids.push(item.id);
    }
  }
  
  return Object.values(grouped);
}

function itemToDb(item: any) {
  if (!item) return null;
  return {
    id: item.id,
    user_id: item.userId || item.user_id || item.customer_id || item.customerId,
    name: item.name,
    weight: item.weight,
    status: item.status,
    source: item.source,
    price: item.price,
    image: item.image,
    estimated_delivery: item.estimatedDelivery
  };
}

// Helper to safely transform database order object supporting field extracting from destination JSONB
const transformDbOrder = (o: any) => {
  if (!o) return o;
  let dest = o.destination;
  if (typeof dest === 'string') {
    try {
      dest = JSON.parse(dest);
    } catch (e) {
      dest = {};
    }
  }

  return {
    ...o,
    destination: dest,
    customerId: o.customer_id || o.customerId || dest?.customerId || dest?.customer_id,
    totalWeight: o.total_weight !== undefined && o.total_weight !== null ? o.total_weight : (o.totalWeight !== undefined ? o.totalWeight : (dest?.totalWeight || dest?.total_weight || 0)),
    totalCost: o.total_cost !== undefined && o.total_cost !== null ? o.total_cost : (o.totalCost !== undefined ? o.totalCost : (dest?.totalCost || dest?.total_cost || 0)),
    paymentStatus: o.payment_status || o.paymentStatus || dest?.paymentStatus || dest?.payment_status || 'Pending',
    shippingDate: o.shipping_date || o.shippingDate || dest?.shippingDate || dest?.shipping_date || dest?.date,
    createdAt: o.created_at || o.createdAt,
    pickupType: o.pickup_type !== undefined && o.pickup_type !== null ? o.pickup_type : (o.pickupType !== undefined && o.pickupType !== null ? o.pickupType : (dest?.pickupType || dest?.pickup_type || 'AllAgent')),
    assignedAgent: o.assigned_agent !== undefined && o.assigned_agent !== null ? o.assigned_agent : (o.assignedAgent !== undefined && o.assignedAgent !== null ? o.assignedAgent : (dest?.assignedAgent || dest?.assigned_agent)),
    assignedAgentId: o.assigned_agent_id !== undefined && o.assigned_agent_id !== null ? o.assigned_agent_id : (o.assignedAgentId !== undefined && o.assignedAgentId !== null ? o.assignedAgentId : (dest?.assignedAgentId || dest?.assigned_agent_id)),
    languagePreference: o.language_preference !== undefined && o.language_preference !== null ? o.language_preference : (o.languagePreference !== undefined && o.languagePreference !== null ? o.languagePreference : (dest?.languagePreference || dest?.language_preference || 'English')),
    itemType: o.item_type !== undefined && o.item_type !== null ? o.item_type : (o.itemType !== undefined && o.itemType !== null ? o.itemType : (dest?.itemType || dest?.item_type || 'General')),
    vehicleType: o.vehicle_type !== undefined && o.vehicle_type !== null ? o.vehicle_type : (o.vehicleType !== undefined && o.vehicleType !== null ? o.vehicleType : (dest?.vehicleType || dest?.vehicle_type || 'Two-Wheeler')),
    customerName: o.customer_name !== undefined && o.customer_name !== null ? o.customer_name : (o.customerName !== undefined && o.customerName !== null ? o.customerName : (dest?.customerName || dest?.customer_name || dest?.fullName)),
    phone: o.phone !== undefined && o.phone !== null ? o.phone : dest?.phone,
    address: o.address !== undefined && o.address !== null ? o.address : dest?.address || dest?.addressLine1,
    date: o.date !== undefined && o.date !== null ? o.date : (dest?.date || o.shipping_date),
    time: o.time !== undefined && o.time !== null ? o.time : (dest?.time || 'Flexible'),
  };
};

function orderToDb(order: any) {
  if (!order) return null;
  
  let parsedDestination = order.destination || {};
  if (typeof parsedDestination === 'string') {
    try {
      parsedDestination = JSON.parse(parsedDestination);
    } catch (e) {
      parsedDestination = {};
    }
  }

  const sanitizedDestination = {
    ...parsedDestination,
    pickupType: order.pickup_type || order.pickupType || parsedDestination.pickupType,
    assignedAgent: order.assigned_agent || order.assignedAgent || parsedDestination.assignedAgent,
    assignedAgentId: order.assigned_agent_id || order.assignedAgentId || parsedDestination.assignedAgentId,
    languagePreference: order.language_preference || order.languagePreference || parsedDestination.languagePreference,
    itemType: order.item_type || order.itemType || parsedDestination.itemType,
    vehicleType: order.vehicle_type || order.vehicleType || parsedDestination.vehicleType,
    customerName: order.customer_name || order.customerName || parsedDestination.customerName || parsedDestination.fullName,
    phone: order.phone || order.destination?.phone || parsedDestination.phone,
    date: order.date || order.shipping_date || order.shippingDate || parsedDestination.date,
    time: order.time || parsedDestination.time || 'Flexible',
    address: order.address || order.destination?.addressLine1 || parsedDestination.address || parsedDestination.addressLine1
  };

  return {
    id: order.id,
    customer_id: order.customer_id || order.customerId,
    items: order.items,
    total_weight: order.total_weight || order.totalWeight || 0,
    total_cost: order.total_cost || order.totalCost || 0,
    status: order.status,
    destination: sanitizedDestination,
    payment_status: order.payment_status || order.paymentStatus || 'Pending',
    shipping_date: order.shipping_date || order.shippingDate,
  };
}

export const api = {
  dbToItem,
  groupItems,
  async checkHealth() {
    try {
      const response = await fetch(`${API_URL}/api/health`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Unreachable');
    } catch (error) {
      if (isSupabaseConfigured) {
        return { 
          status: 'ok', 
          supabaseConnected: true, 
          emailConfigured: false,
          isClientFallback: true
        };
      }
      return { status: 'error', error: (error as Error).message, supabaseConnected: false };
    }
  },

  async fetchProducts(): Promise<StoreProduct[]> {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Fetch products endpoint not reachable');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Fetching products directly...');
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        return (data || []).map(dbToProduct) as StoreProduct[];
      }
      throw err;
    }
  },

  async createProduct(product: Partial<StoreProduct>): Promise<StoreProduct> {
    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Create product endpoint not reachable');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Creating product directly...');
        const dbPayload = productToDb(product);
        const { data, error } = await supabase.from('products').insert(dbPayload).select().single();
        if (error) throw error;
        return dbToProduct(data) as StoreProduct;
      }
      throw err;
    }
  },

  async updateProduct(id: string, product: Partial<StoreProduct>): Promise<StoreProduct> {
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Update product endpoint not reachable');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Updating product directly...');
        const dbPayload = productToDb(product);
        if (dbPayload) delete dbPayload.id;
        const { data, error } = await supabase.from('products').update(dbPayload).eq('id', id).select().single();
        if (error) throw error;
        return dbToProduct(data) as StoreProduct;
      }
      throw err;
    }
  },

  async deleteProduct(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Delete product endpoint not reachable');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Deleting product directly...');
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      }
      throw err;
    }
  },

  async fetchItems(userId: string): Promise<ShippingItem[]> {
    try {
      const response = await fetch(`${API_URL}/api/items/${userId}`);
      if (response.ok) {
        const rawData = await response.json();
        const flatItems = (rawData || []).map(dbToItem) as ShippingItem[];
        return groupItems(flatItems);
      }
      throw new Error('Fetch items endpoint not reachable');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Fetching items directly...');
        let query = supabase.from('items').select('*');
        if (userId !== 'all') {
          query = query.eq('user_id', userId);
        }
        const { data, error } = await query;
        if (error) throw error;
        const flatItems = (data || []).map(dbToItem) as ShippingItem[];
        return groupItems(flatItems);
      }
      throw err;
    }
  },

  async createItem(item: Partial<ShippingItem> & { customer_id?: string; customerId?: string; user_id?: string; userId?: string }, ...args: any[]) {
    try {
      const response = await fetch(`${API_URL}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (response.ok) {
        const rawData = await response.json();
        return dbToItem(rawData);
      }
      throw new Error('Create item endpoint not reachable');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Creating item directly...');
        const dbPayload = itemToDb(item);
        const { data, error } = await supabase.from('items').insert(dbPayload).select().single();
        if (error) throw error;
        return dbToItem(data);
      }
      throw err;
    }
  },

  async deleteItem(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/items/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        return true;
      }
      throw new Error('Delete item endpoint not reachable');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Deleting item directly...');
        const { error } = await supabase.from('items').delete().eq('id', id);
        if (error) throw error;
        return true;
      }
      throw err;
    }
  },

  async createOrder(order: Partial<Order>) {
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Create order endpoint not reachable');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Creating order directly...');
        const finalId = order.id || (order as any).orderId || crypto.randomUUID();
        const dbPayload = orderToDb({ ...order, id: finalId });
        const { data, error } = await supabase.from('orders').insert(dbPayload).select().single();
        if (error) throw error;
        return transformDbOrder(data);
      }
      throw err;
    }
  },

  async fetchOrders(userId: string): Promise<Order[]> {
    try {
      const response = await fetch(`${API_URL}/api/orders/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Fetch orders endpoint not reachable');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Fetching orders directly...');
        let query = supabase.from('orders').select('*');
        if (userId !== 'all') {
          query = query.eq('customer_id', userId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(transformDbOrder);
      }
      throw err;
    }
  },

  async getOrders(userId: string): Promise<Order[]> {
    return this.fetchOrders(userId);
  },

  async getAllOrders(): Promise<Order[]> {
    try {
      const response = await fetch(`${API_URL}/api/orders`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('All orders endpoint not reachable');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Fetching all orders directly...');
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(transformDbOrder);
      }
      throw err;
    }
  },

  async getNextOrderId(prefix: string): Promise<{ nextId: string }> {
    try {
      const response = await fetch(`${API_URL}/api/orders/next-seq/${prefix}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Get next order ID endpoint not reachable');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Evaluating next order sequence directly...');
        let maxSeq = 0;
        const { data, error } = await supabase
          .from('orders')
          .select('id')
          .ilike('id', `${prefix}-%`)
          .order('id', { ascending: false })
          .limit(20);
          
        if (!error && data) {
          data.forEach((o: any) => {
            if (o.id && o.id.startsWith(prefix)) {
              const parts = o.id.split('-');
              if (parts.length >= 2) {
                const s = parseInt(parts[1], 10);
                if (!isNaN(s) && s > maxSeq) maxSeq = s;
              }
            }
          });
        }
        const nextSeqNum = maxSeq + 1;
        const seq = nextSeqNum.toString().padStart(5, '0');
        const finalId = `${prefix}-${seq}`;
        return { nextId: finalId };
      }
      throw err;
    }
  },

  async trackOrder(orderId: string): Promise<Order> {
    try {
      const response = await fetch(`${API_URL}/api/orders/track/${orderId}`);
      if (response.ok) {
        return await response.json();
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Order not found');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Tracking order directly...');
        const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Order not found');
        return transformDbOrder(data);
      }
      throw err;
    }
  },

  async trackOrderLive(orderId: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/track-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ orderId })
      });
      if (response.ok) {
        return await response.json();
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to track order sequence.');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Fetching order tracking info directly...');
        // Using window's local supabase client:
        const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Order not found');
        return {
          success: true,
          isLive: false,
          trackingData: data.tracking_response || {
            id: data.tracking_number || 'TBD',
            carrier: data.carrier || 'Pending Assignment',
            status: data.shipment_status || 'In Warehouse',
            events: []
          }
        };
      }
      throw err;
    }
  },

  async updateItemStatus(itemId: string, status: string, ...args: any[]) {
    try {
      const response = await fetch(`${API_URL}/api/items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        const rawData = await response.json();
        return dbToItem(rawData);
      }
      throw new Error('Update item status endpoint not reachable');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Updating item status directly...');
        const { data, error } = await supabase.from('items').update({ status }).eq('id', itemId).select().single();
        if (error) throw error;
        return dbToItem(data);
      }
      throw err;
    }
  },

  async updateOrderStatus(orderId: string, status: string, ...args: any[]) {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Update order status endpoint not reachable');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Updating order status directly...');
        const { data, error } = await supabase.from('orders').update({ status }).eq('id', orderId).select().single();
        if (error) throw error;
        return transformDbOrder(data);
      }
      throw err;
    }
  },

  async updateOrder(orderId: string, updates: Partial<Order>) {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Update order endpoint not reachable');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Updating order directly...');
        const updAny = updates as any;
        const dbUpdates: any = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.paymentStatus) dbUpdates.payment_status = updates.paymentStatus;
        if (updAny.payment_status) dbUpdates.payment_status = updAny.payment_status;
        if (updates.totalCost !== undefined) dbUpdates.total_cost = updates.totalCost;
        if (updAny.total_cost !== undefined) dbUpdates.total_cost = updAny.total_cost;
        if (updates.totalWeight !== undefined) dbUpdates.total_weight = updates.totalWeight;
        if (updAny.total_weight !== undefined) dbUpdates.total_weight = updAny.total_weight;
        if (updates.shippingDate) dbUpdates.shipping_date = updates.shippingDate;
        if (updAny.shipping_date) dbUpdates.shipping_date = updAny.shipping_date;
        if (updates.items) dbUpdates.items = updates.items;
        if (updates.destination) dbUpdates.destination = updates.destination;
        if (updates.assignedAgentId) dbUpdates.assigned_agent_id = updates.assignedAgentId;
        if (updAny.assigned_agent_id) dbUpdates.assigned_agent_id = updAny.assigned_agent_id;
        if (updates.assignedAgent) dbUpdates.assigned_agent = updates.assignedAgent;
        if (updAny.assigned_agent) dbUpdates.assigned_agent = updAny.assigned_agent;
        if (updAny.carrier !== undefined) dbUpdates.carrier = updAny.carrier;
        if (updAny.trackingNumber !== undefined) dbUpdates.tracking_number = updAny.trackingNumber;
        if (updAny.tracking_number !== undefined) dbUpdates.tracking_number = updAny.tracking_number;
        if (updAny.shipmentStatus !== undefined) dbUpdates.shipment_status = updAny.shipmentStatus;
        if (updAny.shipment_status !== undefined) dbUpdates.shipment_status = updAny.shipment_status;
        if (updAny.shipmentDate !== undefined) dbUpdates.shipment_date = updAny.shipmentDate;
        if (updAny.shipment_date !== undefined) dbUpdates.shipment_date = updAny.shipment_date;
        if (updAny.lastTrackingUpdate !== undefined) dbUpdates.last_tracking_update = updAny.lastTrackingUpdate;
        if (updAny.last_tracking_update !== undefined) dbUpdates.last_tracking_update = updAny.last_tracking_update;
        if (updAny.trackingResponse !== undefined) dbUpdates.tracking_response = updAny.trackingResponse;
        if (updAny.tracking_response !== undefined) dbUpdates.tracking_response = updAny.tracking_response;
        
        const { data, error } = await supabase.from('orders').update(dbUpdates).eq('id', orderId).select().single();
        if (error) throw error;
        return transformDbOrder(data);
      }
      throw err;
    }
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
    try {
      const response = await fetch(`${API_URL}/api/items/${itemId}/weight`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight }),
      });
      if (response.ok) {
        const rawData = await response.json();
        return dbToItem(rawData);
      }
      throw new Error('Failed to update weight');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Updating item weight directly...');
        const { data, error } = await supabase.from('items').update({ weight }).eq('id', itemId).select().single();
        if (error) throw error;
        return dbToItem(data);
      }
      throw err;
    }
  },

  async getShippingSettings(): Promise<{ rates: Record<string, number>; discounts: Record<string, number>; coupons?: Array<{ code: string; discountPercent: number; isEnabled: boolean }> }> {
    try {
      const response = await fetch(`${API_URL}/api/settings/shipping`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to fetch shipping settings');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Fetching shipping settings directly...');
        const { data, error } = await supabase.from('shipping_settings').select('*').eq('id', 'global').maybeSingle();
        if (error) throw error;
        if (data) {
          return {
            rates: typeof data.rates === 'string' ? JSON.parse(data.rates) : data.rates,
            discounts: typeof data.discounts === 'string' ? JSON.parse(data.discounts) : data.discounts,
            coupons: typeof data.coupons === 'string' ? JSON.parse(data.coupons) : data.coupons
          };
        }
      }
      return {
        rates: { 'USA': 12, 'UK': 10, 'Canada': 11, 'Australia': 13, 'UAE': 8, 'Germany': 9, 'Singapore': 7, 'India': 5 },
        discounts: { 'USA': 0, 'UK': 0, 'Canada': 0, 'Australia': 0, 'UAE': 0, 'Germany': 0 }
      };
    }
  },

  async updateShippingSettings(updates: { rates?: Record<string, number>; discounts?: Record<string, number>; coupons?: Array<{ code: string; discountPercent: number; isEnabled: boolean }> }): Promise<{ rates: Record<string, number>; discounts: Record<string, number>; coupons?: Array<{ code: string; discountPercent: number; isEnabled: boolean }> }> {
    try {
      const response = await fetch(`${API_URL}/api/settings/shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to update shipping settings');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Updating shipping settings directly...');
        const { data, error } = await supabase.from('shipping_settings').upsert({
          id: 'global',
          ...updates
        }).select().single();
        if (error) throw error;
        return {
          rates: typeof data.rates === 'string' ? JSON.parse(data.rates) : data.rates,
          discounts: typeof data.discounts === 'string' ? JSON.parse(data.discounts) : data.discounts,
          coupons: typeof data.coupons === 'string' ? JSON.parse(data.coupons) : data.coupons
        };
      }
      throw err;
    }
  },

  async clearAllOrders() {
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'DELETE'
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to clear orders');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Clearing orders directly...');
        const { error: itemsError } = await supabase.from('items').delete().neq('id', 'placeholder-non-existent-id');
        if (itemsError) throw itemsError;
        const { error: ordersError } = await supabase.from('orders').delete().neq('id', 'placeholder-non-existent-id');
        if (ordersError) throw ordersError;
        return { success: true };
      }
      throw err;
    }
  },

  async getSmtpStatus(): Promise<{ 
    SMTP_HOST: string; 
    SMTP_PORT: string; 
    SMTP_USER: string; 
    SMTP_FROM: string; 
    SMTP_PASS_MASKED: string; 
    SMTP_PASS_LENGTH: number;
    twilioSidConfigured: boolean;
    twilioPhoneConfigured: boolean;
  }> {
    const response = await fetch(`${API_URL}/api/admin/smtp-status`);
    if (!response.ok) throw new Error('Failed to fetch SMTP status');
    return await response.json();
  },

  async testSmtpConnection(params: {
    host: string;
    port: string;
    user: string;
    pass: string;
    from: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/api/smtp/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || "Failed to verify SMTP link");
    }
    return await response.json();
  },

  async getPickups() {
    try {
      const response = await fetch(`${API_URL}/api/pickups`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to fetch pickups');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Fetching pickups directly...');
        const { data, error } = await supabase.from('pickups').select('*');
        if (error) throw error;
        return data || [];
      }
      throw err;
    }
  },

  async createPickup(pickup: any) {
    try {
      const response = await fetch(`${API_URL}/api/pickups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pickup)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to create pickup');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Creating pickup directly...');
        const { data, error } = await supabase.from('pickups').insert(pickup).select().single();
        if (error) throw error;
        return data;
      }
      throw err;
    }
  },

  async updatePickup(id: string, updates: any) {
    try {
      const response = await fetch(`${API_URL}/api/pickups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to update pickup');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Updating pickup directly...');
        const { data, error } = await supabase.from('pickups').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      throw err;
    }
  },

  async deletePickup(id: string) {
    try {
      const response = await fetch(`${API_URL}/api/pickups/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to delete pickup');
    } catch (err) {
      if (isSupabaseConfigured) {
        console.log('[Supabase Client Fallback] Deleting pickup directly...');
        const { error } = await supabase.from('pickups').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      }
      throw err;
    }
  }
};
