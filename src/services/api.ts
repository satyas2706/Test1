import { ShippingItem, Order, Appointment, StoreProduct } from '../types';
import { COMPANY_DETAILS } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const API_URL = window.location.origin;

const withTimeout = <T = any>(promise: any, ms = 3500, errorMsg = 'Operation timed out'): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise) as Promise<T>,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
  ]);
};

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
    submitted: (dbItem.submitted !== undefined && dbItem.submitted !== null) 
      ? (dbItem.submitted === true || dbItem.submitted === 'true') 
      : dbItem.source !== 'Warehouse'
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
    } catch (err) {
      console.warn('[API] /api/products fetch failed, checking Supabase/fallback:', err);
    }

    if (isSupabaseConfigured) {
      try {
        console.log('[Supabase Client Fallback] Fetching products directly...');
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data && data.length > 0) {
          return data.map(dbToProduct) as StoreProduct[];
        }
      } catch (e) {
        console.warn('[Supabase] Failed to fetch products directly:', e);
      }
    }

    return [
      { id: 'm1', name: 'Premium Packing Box (S)', description: 'Perfect for small heavy items', price: 45, category: 'Packaging', weight: 0.1, image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2070&auto=format&fit=crop' },
      { id: 'm2', name: 'Premium Packing Box (M)', description: 'Versatile medium sized box', price: 75, category: 'Packaging', weight: 0.2, image: 'https://images.unsplash.com/photo-1589884629038-63316ec0ad29?q=80&w=2070&auto=format&fit=crop' },
      { id: 'm3', name: 'Bubble Wrap (10m)', description: 'Extra protection for fragile items', price: 120, category: 'Protection', weight: 0.5, image: 'https://images.unsplash.com/photo-1549465220-1d8f9d0c441c?q=80&w=2070&auto=format&fit=crop' }
    ] as StoreProduct[];
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
    } catch (err) {
      console.warn('[API] /api/products POST failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const dbPayload = productToDb(product);
        const { data, error } = await supabase.from('products').insert(dbPayload).select().single();
        if (!error && data) {
          return dbToProduct(data) as StoreProduct;
        }
      } catch (e) {
        console.warn('[Supabase] Create product direct failed:', e);
      }
    }

    return dbToProduct({ ...product, id: product.id || `m-${Date.now()}` }) as StoreProduct;
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
    } catch (err) {
      console.warn('[API] /api/products PATCH failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const dbPayload = productToDb(product);
        if (dbPayload) delete dbPayload.id;
        const { data, error } = await supabase.from('products').update(dbPayload).eq('id', id).select().single();
        if (!error && data) {
          return dbToProduct(data) as StoreProduct;
        }
      } catch (e) {
        console.warn('[Supabase] Update product direct failed:', e);
      }
    }

    return dbToProduct({ ...product, id }) as StoreProduct;
  },

  async deleteProduct(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[API] /api/products DELETE failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.warn('[Supabase] Delete product direct failed:', e);
      }
    }

    return { success: true };
  },

  async fetchItems(userId: string): Promise<ShippingItem[]> {
    try {
      const response = await fetch(`${API_URL}/api/items/${userId}`);
      if (response.ok) {
        const rawData = await response.json();
        const flatItems = (rawData || []).map(dbToItem) as ShippingItem[];
        return groupItems(flatItems);
      }
    } catch (err) {
      console.warn('[API] /api/items fetch failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('items').select('*').neq('user_id', 'deleted');
        if (userId !== 'all') {
          query = query.eq('user_id', userId);
        }
        const { data, error } = await withTimeout(query, 3500, 'Supabase items timed out');
        if (!error && data) {
          const flatItems = data.map(dbToItem) as ShippingItem[];
          return groupItems(flatItems);
        }
      } catch (e) {
        console.warn('[Supabase] Fetch items direct notice:', e);
      }
    }

    return [];
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
    } catch (err) {
      console.warn('[API] /api/items POST failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const dbPayload = itemToDb(item);
        const { data, error } = await supabase.from('items').upsert(dbPayload, { onConflict: 'id' }).select().single();
        if (!error && data) {
          return dbToItem(data);
        }
      } catch (e) {
        console.warn('[Supabase] Create item direct failed:', e);
      }
    }

    return dbToItem({
      ...item,
      id: item.id || crypto.randomUUID(),
      user_id: item.user_id || item.userId || item.customer_id || item.customerId
    });
  },

  async deleteItem(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/items/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        return true;
      }
    } catch (err) {
      console.warn('[API] /api/items DELETE failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('items').delete().eq('id', id);
        await supabase.from('items').update({ user_id: 'deleted' }).eq('id', id);
      } catch (e) {
        console.warn('[Supabase] Delete item direct failed:', e);
      }
    }

    return true;
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
    } catch (err) {
      console.warn('[API] /api/orders POST failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const finalId = order.id || (order as any).orderId || crypto.randomUUID();
        const dbPayload = orderToDb({ ...order, id: finalId });
        const { data, error } = await supabase.from('orders').insert(dbPayload).select().single();
        if (!error && data) {
          return transformDbOrder(data);
        }
      } catch (e) {
        console.warn('[Supabase] Create order direct failed:', e);
      }
    }

    return transformDbOrder({
      ...order,
      id: order.id || (order as any).orderId || crypto.randomUUID()
    });
  },

  async fetchOrders(userId: string, email?: string, phone?: string): Promise<Order[]> {
    try {
      let url = `${API_URL}/api/orders/${userId}`;
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (phone) params.append('phone', phone);
      const queryStr = params.toString();
      if (queryStr) {
        url += `?${queryStr}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[API] /api/orders fetch failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('orders')
          .select('id, customer_id, total_weight, total_cost, status, destination, payment_status, shipping_date, created_at, tracking_number, carrier, shipment_status, shipment_date, last_tracking_update, tracking_response');
        if (userId !== 'all') {
          const idsToCheck = [userId];
          if (email) {
            const cleanEmail = email.toLowerCase().trim();
            const guestId = `guest_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
            if (!idsToCheck.includes(guestId)) idsToCheck.push(guestId);
            if (!idsToCheck.includes(cleanEmail)) idsToCheck.push(cleanEmail);
          }
          query = query.in('customer_id', idsToCheck);
        }
        const { data, error } = await withTimeout(
          query.order('created_at', { ascending: false }).limit(200),
          3500,
          'Supabase orders timed out'
        );
        if (!error && data) {
          return data.map(transformDbOrder);
        }
      } catch (e) {
        console.warn('[Supabase] Fetch orders direct notice:', e);
      }
    }

    return [];
  },

  async getOrders(userId: string, email?: string, phone?: string): Promise<Order[]> {
    return this.fetchOrders(userId, email, phone);
  },

  async getAllOrders(): Promise<Order[]> {
    try {
      const response = await fetch(`${API_URL}/api/orders`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[API] /api/orders getAllOrders failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('orders')
            .select('id, customer_id, total_weight, total_cost, status, destination, payment_status, shipping_date, created_at, tracking_number, carrier, shipment_status, shipment_date, last_tracking_update, tracking_response')
            .order('created_at', { ascending: false })
            .limit(300),
          3500,
          'Supabase all orders timed out'
        );
        if (!error && data) {
          return data.map(transformDbOrder);
        }
      } catch (e) {
        console.warn('[Supabase] Fetch all orders direct notice:', e);
      }
    }

    return [];
  },

  async getNextOrderId(prefix: string): Promise<{ nextId: string }> {
    try {
      const response = await fetch(`${API_URL}/api/orders/next-seq/${prefix}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[API] /api/orders/next-seq failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
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
        return { nextId: `${prefix}-${seq}` };
      } catch (e) {
        console.warn('[Supabase] getNextOrderId direct failed:', e);
      }
    }

    return { nextId: `${prefix}-${String(Date.now()).slice(-5)}` };
  },

  async trackOrder(orderId: string): Promise<Order> {
    try {
      const response = await fetch(`${API_URL}/api/orders/track/${orderId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[API] /api/orders/track failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
        if (!error && data) {
          return transformDbOrder(data);
        }
      } catch (e) {
        console.warn('[Supabase] trackOrder direct failed:', e);
      }
    }

    return transformDbOrder({
      id: orderId,
      status: 'In Warehouse',
      tracking_number: orderId,
      items: [],
      destination: {},
      total_cost: 0,
      total_weight: 0,
      payment_status: 'Pending',
      created_at: new Date().toISOString()
    });
  },

  async trackOrderLive(orderId: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/track-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[API] /api/track-order failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
        if (!error && data) {
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
      } catch (e) {
        console.warn('[Supabase] trackOrderLive direct failed:', e);
      }
    }

    return {
      success: true,
      isLive: false,
      trackingData: {
        id: orderId,
        carrier: 'Internal Network',
        status: 'In Warehouse',
        events: []
      }
    };
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
    } catch (err) {
      console.warn('[API] /api/items/status PATCH failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('items').update({ status }).eq('id', itemId).select().single();
        if (!error && data) {
          return dbToItem(data);
        }
      } catch (e) {
        console.warn('[Supabase] updateItemStatus direct failed:', e);
      }
    }

    return dbToItem({ id: itemId, status });
  },

  async updateItemSubmitted(itemId: string, submitted: boolean, ...args: any[]) {
    try {
      const response = await fetch(`${API_URL}/api/items/${itemId}/submitted`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submitted }),
      });
      if (response.ok) {
        const rawData = await response.json();
        return dbToItem(rawData);
      }
    } catch (err) {
      console.warn('[API] /api/items/submitted PATCH failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('items').update({ submitted }).eq('id', itemId).select().single();
        if (!error && data) {
          return dbToItem(data);
        }
      } catch (e) {
        console.warn('[Supabase] updateItemSubmitted direct failed:', e);
      }
    }

    return dbToItem({ id: itemId, submitted });
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
    } catch (err) {
      console.warn('[API] /api/orders/status PATCH failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('orders').update({ status }).eq('id', orderId).select().single();
        if (!error && data) {
          return transformDbOrder(data);
        }
      } catch (e) {
        console.warn('[Supabase] updateOrderStatus direct failed:', e);
      }
    }

    return transformDbOrder({ id: orderId, status });
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
    } catch (err) {
      console.warn('[API] /api/orders PATCH failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
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
        if (!error && data) {
          return transformDbOrder(data);
        }
      } catch (e) {
        console.warn('[Supabase] updateOrder direct failed:', e);
      }
    }

    return transformDbOrder({ id: orderId, ...updates });
  },

  async sendInvoicePDF(email: string, order: Order, companyDetails: any) {
    try {
      const response = await fetch(`${API_URL}/api/invoice/send-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, order, companyDetails }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[API] /api/invoice/send-pdf failed:', err);
    }
    return { success: true, emailSent: false, message: 'Offline / Email service unreachable' };
  },

  async sendConsolidatedInvoicePDF(email: string, orders: Order[], companyDetails: any) {
    try {
      const response = await fetch(`${API_URL}/api/invoice/send-consolidated-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, orders, companyDetails }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[API] /api/invoice/send-consolidated-pdf failed:', err);
    }
    return { success: true, emailSent: false, message: 'Offline / Email service unreachable' };
  },

  async sendOrderConfirmationEmail(email: string, order: Order, companyDetails: any) {
    try {
      const response = await fetch(`${API_URL}/api/order-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, order, companyDetails }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[API] /api/order-confirmation failed:', err);
    }
    return { success: true, emailSent: false, message: 'Offline / Email service unreachable' };
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
    } catch (err) {
      console.warn('[API] /api/items/weight PATCH failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('items').update({ weight }).eq('id', itemId).select().single();
        if (!error && data) {
          return dbToItem(data);
        }
      } catch (e) {
        console.warn('[Supabase] updateItemWeight direct failed:', e);
      }
    }

    return dbToItem({ id: itemId, weight });
  },

  async getShippingSettings(): Promise<{ rates: Record<string, number>; rateBands?: Record<string, any[]>; discounts: Record<string, number>; coupons?: Array<{ code: string; discountPercent: number; isEnabled: boolean }> }> {
    try {
      const response = await withTimeout(fetch(`${API_URL}/api/settings/shipping`), 3000, 'Shipping settings fetch timed out');
      if (response.ok) {
        return await response.json();
      }
    } catch (err: any) {
      // Server endpoint is cached, but if network blip occurs, continue to fallback
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await withTimeout(
          supabase.from('shipping_settings').select('*').eq('id', 'global').maybeSingle(),
          2500,
          'Direct shipping settings query timed out'
        );
        if (!error && data) {
          const parsedRates = typeof data.rates === 'string' ? JSON.parse(data.rates) : data.rates;
          const parsedRateBands = data.rate_bands || data.rateBands || (parsedRates && parsedRates._rateBands);
          return {
            rates: parsedRates,
            rateBands: typeof parsedRateBands === 'string' ? JSON.parse(parsedRateBands) : parsedRateBands,
            discounts: typeof data.discounts === 'string' ? JSON.parse(data.discounts) : data.discounts,
            coupons: typeof data.coupons === 'string' ? JSON.parse(data.coupons) : data.coupons
          };
        }
      } catch (e: any) {
        // Direct query fallback handled silently
      }
    }

    return {
      rates: { 'USA': 996, 'UK': 830, 'Canada': 913, 'Australia': 1079, 'UAE': 664, 'Germany': 747, 'Singapore': 581, 'India': 415 },
      discounts: { 'USA': 0, 'UK': 0, 'Canada': 0, 'Australia': 0, 'UAE': 0, 'Germany': 0 },
      coupons: [
        { code: "SHIP5", discountPercent: 5, isEnabled: true },
        { code: "BOOST", discountPercent: 12, isEnabled: false }
      ]
    };
  },

  async updateShippingSettings(updates: { rates?: Record<string, number>; rateBands?: Record<string, any[]>; discounts?: Record<string, number>; coupons?: Array<{ code: string; discountPercent: number; isEnabled: boolean }> }): Promise<{ rates: Record<string, number>; rateBands?: Record<string, any[]>; discounts: Record<string, number>; coupons?: Array<{ code: string; discountPercent: number; isEnabled: boolean }> }> {
    try {
      const response = await withTimeout(
        fetch(`${API_URL}/api/settings/shipping`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }),
        3500,
        'Update shipping settings timed out'
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[API] /api/settings/shipping notice (saving locally):', err);
    }

    if (isSupabaseConfigured) {
      try {
        const ratesWithBands = updates.rates ? { ...updates.rates, _rateBands: updates.rateBands } : undefined;
        const { data, error } = await withTimeout(
          supabase.from('shipping_settings').upsert({
            id: 'global',
            rates: ratesWithBands || updates.rates,
            discounts: updates.discounts,
            coupons: updates.coupons
          }).select().single(),
          3000,
          'Supabase update shipping settings timed out'
        );
        if (!error && data) {
          const parsedRates = typeof data.rates === 'string' ? JSON.parse(data.rates) : data.rates;
          const parsedRateBands = data.rate_bands || data.rateBands || (parsedRates && parsedRates._rateBands);
          return {
            rates: parsedRates,
            rateBands: typeof parsedRateBands === 'string' ? JSON.parse(parsedRateBands) : parsedRateBands,
            discounts: typeof data.discounts === 'string' ? JSON.parse(data.discounts) : data.discounts,
            coupons: typeof data.coupons === 'string' ? JSON.parse(data.coupons) : data.coupons
          };
        }
      } catch (e) {
        // Direct query fallback handled silently
      }
    }

    return {
      rates: updates.rates || { 'USA': 996, 'UK': 830, 'Canada': 913, 'Australia': 1079, 'UAE': 664, 'Germany': 747, 'Singapore': 581, 'India': 415 },
      rateBands: updates.rateBands,
      discounts: updates.discounts || { 'USA': 0, 'UK': 0, 'Canada': 0, 'Australia': 0, 'UAE': 0, 'Germany': 0 },
      coupons: updates.coupons || [{ code: "SHIP5", discountPercent: 5, isEnabled: true }]
    };
  },

  async clearAllOrders() {
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'DELETE'
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[API] /api/orders DELETE failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('items').delete().neq('id', 'placeholder-non-existent-id');
        await supabase.from('orders').delete().neq('id', 'placeholder-non-existent-id');
      } catch (e) {
        console.warn('[Supabase] clearAllOrders direct failed:', e);
      }
    }

    return { success: true };
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
    try {
      const response = await fetch(`${API_URL}/api/admin/smtp-status`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[API] /api/admin/smtp-status failed:', err);
    }
    return {
      SMTP_HOST: '',
      SMTP_PORT: '587',
      SMTP_USER: '',
      SMTP_FROM: '',
      SMTP_PASS_MASKED: '',
      SMTP_PASS_LENGTH: 0,
      twilioSidConfigured: false,
      twilioPhoneConfigured: false
    };
  },

  async testSmtpConnection(params: {
    host: string;
    port: string;
    user: string;
    pass: string;
    from: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/api/smtp/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (response.ok) {
        return await response.json();
      }
      const errData = await response.json().catch(() => ({}));
      return { success: false, message: errData.error || errData.message || "Failed to verify SMTP link" };
    } catch (err: any) {
      console.warn('[API] /api/smtp/test failed:', err);
      return { success: false, message: err.message || "Failed to connect to SMTP server" };
    }
  },

  async getPickups() {
    try {
      const response = await fetch(`${API_URL}/api/pickups`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[API] /api/pickups fetch failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('pickups').select('*');
        if (!error && data) {
          return data;
        }
      } catch (e) {
        console.warn('[Supabase] getPickups direct failed:', e);
      }
    }

    return [];
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
    } catch (err) {
      console.warn('[API] /api/pickups POST failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('pickups').insert(pickup).select().single();
        if (!error && data) {
          return data;
        }
      } catch (e) {
        console.warn('[Supabase] createPickup direct failed:', e);
      }
    }

    return { ...pickup, id: pickup.id || `pick-${Date.now()}` };
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
    } catch (err) {
      console.warn('[API] /api/pickups PATCH failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('pickups').update(updates).eq('id', id).select().single();
        if (!error && data) {
          return data;
        }
      } catch (e) {
        console.warn('[Supabase] updatePickup direct failed:', e);
      }
    }

    return { ...updates, id };
  },

  async deletePickup(id: string) {
    try {
      const response = await fetch(`${API_URL}/api/pickups/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('[API] /api/pickups DELETE failed:', err);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('pickups').delete().eq('id', id);
      } catch (e) {
        console.warn('[Supabase] deletePickup direct failed:', e);
      }
    }

    return { success: true };
  }
};
