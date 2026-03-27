import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  Truck, 
  Clock, 
  BarChart3, 
  Users, 
  User as UserIcon, 
  AlertTriangle, 
  Calendar, 
  Upload, 
  X 
} from 'lucide-react';
import { 
  User, 
  Order, 
  Appointment, 
  AgentProfile, 
  StoreProduct 
} from '../../types';

interface AdminDashboardProps {
  currentUser: User | null;
  orders: Order[];
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  agents: AgentProfile[];
  setAgents: React.Dispatch<React.SetStateAction<AgentProfile[]>>;
  newAgent: any;
  setNewAgent: React.Dispatch<React.SetStateAction<any>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  adminTab: 'Overview' | 'Agents' | 'Inventory';
  setAdminTab: React.Dispatch<React.SetStateAction<'Overview' | 'Agents' | 'Inventory'>>;
  newProduct: Partial<StoreProduct>;
  setNewProduct: React.Dispatch<React.SetStateAction<Partial<StoreProduct>>>;
  storeProducts: StoreProduct[];
  setStoreProducts: React.Dispatch<React.SetStateAction<StoreProduct[]>>;
}

const AdminDashboard = ({
  currentUser,
  orders,
  appointments,
  setAppointments,
  agents,
  setAgents,
  newAgent,
  setNewAgent,
  categories,
  setCategories,
  adminTab,
  setAdminTab,
  newProduct,
  setNewProduct,
  storeProducts,
  setStoreProducts
}: AdminDashboardProps) => {
  const [categoryInput, setCategoryInput] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<string>('');
  const [editDeliveryValue, setEditDeliveryValue] = useState<string>('');

  if (!currentUser) return null;
  const stats = [
    { label: 'Total Shipments', value: orders.length + appointments.length, icon: Package, color: 'bg-blue-500' },
    { label: 'Pending Pickups', value: appointments.filter(a => a.status === 'Scheduled').length, icon: Clock, color: 'bg-amber-500' },
    { label: 'Active Shipments', value: orders.filter(o => o.status !== 'Delivered').length, icon: Truck, color: 'bg-indigo-500' },
    { label: 'Total Revenue', value: `$${orders.reduce((sum, o) => sum + o.totalCost, 0).toLocaleString()}`, icon: BarChart3, color: 'bg-emerald-500' },
  ];

  const handleAddAgent = () => {
    if (!newAgent.name || !newAgent.phone) return;
    const agent: AgentProfile = {
      id: 'AG-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
      ...newAgent,
      status: 'Active'
    };
    setAgents([...agents, agent]);
    setNewAgent({ name: '', phone: '', email: '', vehicleNumber: '' });
  };

  const handleAssignAgent = (aptId: string, agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    
    setAppointments(prev => prev.map(apt => 
      apt.id === aptId ? { ...apt, assignedAgent: agent, assignedAgentId: agent.id } : apt
    ));
  };

  const handleAddCategory = () => {
    if (categoryInput && !categories.includes(categoryInput)) {
      setCategories([...categories, categoryInput]);
      setCategoryInput('');
    }
  };

  const handleDeleteCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, newProduct: any, setNewProduct: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900">Admin Dashboard</h2>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setAdminTab('Overview')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminTab === 'Overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setAdminTab('Agents')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminTab === 'Agents' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Manage Agents
          </button>
          <button 
            onClick={() => setAdminTab('Inventory')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminTab === 'Inventory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Inventory
          </button>
        </div>
      </div>

      {adminTab === 'Overview' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
              >
                <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                  <stat.icon size={24} />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="text-2xl font-black text-slate-900">{stat.value}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock className="text-amber-500" /> Recent Appointments
              </h3>
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No appointments scheduled</p>
                ) : (
                  appointments.map(apt => (
                    <div key={apt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{apt.id}</div>
                          <div className="text-xs font-bold text-indigo-600">{apt.customerName || 'Customer'}</div>
                          <div className="text-xs text-slate-500">{apt.date} at {apt.time}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-indigo-600">{apt.phone}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">{apt.status}</div>
                        </div>
                      </div>

                      {apt.assignedAgent ? (
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-indigo-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                              <Users size={16} />
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Assigned Agent</div>
                              <div className="text-xs font-bold text-slate-900">{apt.assignedAgent.name}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, assignedAgent: undefined, assignedAgentId: undefined } : a))}
                            className="text-[10px] text-red-500 font-bold hover:underline"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select 
                            className="flex-1 p-2 rounded-lg bg-white border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                            onChange={(e) => handleAssignAgent(apt.id, e.target.value)}
                            defaultValue=""
                          >
                            <option value="" disabled>Select Agent to Assign</option>
                            {agents.filter(a => a.status === 'Active').map(agent => (
                              <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                          </select>
                          <div className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <AlertTriangle size={12} /> Unassigned
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Truck className="text-indigo-500" /> Recent Shipments
              </h3>
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No shipments found</p>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-900">{order.id}</div>
                        <div className="text-xs text-slate-500">{order.destination.country} • {order.totalWeight}kg</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900">${order.totalCost}</div>
                        <div className="text-[10px] text-indigo-600 uppercase font-bold">{order.status}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : adminTab === 'Agents' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
            <h3 className="text-xl font-bold mb-6">Add New Agent</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Agent Name"
                  value={newAgent.name}
                  onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="+91 XXXXX XXXXX"
                  value={newAgent.phone}
                  onChange={e => setNewAgent({...newAgent, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
                <input 
                  type="email" 
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="agent@jiffex.com"
                  value={newAgent.email}
                  onChange={e => setNewAgent({...newAgent, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vehicle Number</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="KA-01-XX-XXXX"
                  value={newAgent.vehicleNumber}
                  onChange={e => setNewAgent({...newAgent, vehicleNumber: e.target.value})}
                />
              </div>
              <button 
                onClick={handleAddAgent}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Create Agent Profile
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Active Agents ({agents.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents.map(agent => (
                  <div key={agent.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <UserIcon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{agent.name}</div>
                      <div className="text-xs text-slate-500">{agent.phone}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{agent.vehicleNumber || 'No Vehicle'}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">
                          {agent.status}
                        </span>
                        <button 
                          onClick={() => setAgents(agents.filter(a => a.id !== agent.id))}
                          className="text-[10px] text-red-500 font-bold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
              <h3 className="text-xl font-bold mb-6">Add New Product</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Product Name</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="e.g. Brass Diya"
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price ($)</label>
                        <input 
                          type="number" 
                          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          value={newProduct.price || ''}
                          onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight (kg)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          value={newProduct.weight || ''}
                          onChange={e => setNewProduct({...newProduct, weight: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Delivery</label>
                      <input 
                        type="date" 
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        value={newProduct.estimatedDelivery || ''}
                        onChange={e => setNewProduct({...newProduct, estimatedDelivery: e.target.value})}
                      />
                    </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category</label>
                  <select 
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Product Image</label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        placeholder="Image URL (https://...)"
                        value={newProduct.image}
                        onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                      />
                      <label className="cursor-pointer px-4 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all border border-slate-200">
                        <Upload size={18} />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, newProduct, setNewProduct)} />
                      </label>
                    </div>
                    {newProduct.image && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                        <img src={newProduct.image} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                        <button 
                          onClick={() => setNewProduct({...newProduct, image: ''})}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (!newProduct.name || !newProduct.price) return;
                    const prod: StoreProduct = {
                      id: 'p' + (storeProducts.length + 1),
                      name: newProduct.name,
                      price: newProduct.price,
                      category: newProduct.category as any,
                      image: newProduct.image || 'https://picsum.photos/seed/product/400/400',
                      weight: newProduct.weight || 0.5,
                      estimatedDelivery: newProduct.estimatedDelivery
                    };
                    setStoreProducts([...storeProducts, prod]);
                    setNewProduct({ name: '', price: 0, category: categories[0], image: '', weight: 0, estimatedDelivery: '' });
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Add to Store
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Manage Categories</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="New Category Name"
                    value={categoryInput}
                    onChange={e => setCategoryInput(e.target.value)}
                  />
                  <button 
                    onClick={handleAddCategory}
                    className="px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-bold text-slate-700">{cat}</span>
                      <button 
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Store Inventory ({storeProducts.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storeProducts.map(product => (
                  <div key={product.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={product.image} className="w-full h-full object-cover" alt={product.name} referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.category} • {product.weight}kg</div>
                      {product.estimatedDelivery && (
                        <div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                          <Calendar size={10} /> Delivery: {product.estimatedDelivery}
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm font-black text-slate-900">${product.price}</div>
                          <div className="flex gap-2">
                            <div className="flex flex-col gap-1">
                              {editingProductId === product.id ? (
                                <div className="flex flex-col gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase w-12">Price</label>
                                    <input 
                                      type="number" 
                                      className="flex-1 p-1 text-xs border rounded outline-none focus:ring-1 focus:ring-indigo-500"
                                      value={editPriceValue}
                                      onChange={e => setEditPriceValue(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase w-12">Delivery</label>
                                    <input 
                                      type="date" 
                                      className="flex-1 p-1 text-xs border rounded outline-none focus:ring-1 focus:ring-indigo-500"
                                      value={editDeliveryValue}
                                      onChange={e => setEditDeliveryValue(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <button 
                                      onClick={() => {
                                        setStoreProducts(storeProducts.map(p => p.id === product.id ? {
                                          ...p, 
                                          price: Number(editPriceValue),
                                          estimatedDelivery: editDeliveryValue
                                        } : p));
                                        setEditingProductId(null);
                                      }}
                                      className="text-[10px] text-emerald-600 font-bold hover:underline"
                                    >
                                      Save
                                    </button>
                                    <button 
                                      onClick={() => setEditingProductId(null)}
                                      className="text-[10px] text-slate-400 font-bold hover:underline"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setEditingProductId(product.id);
                                    setEditPriceValue(product.price.toString());
                                    setEditDeliveryValue(product.estimatedDelivery || '');
                                  }}
                                  className="text-[10px] text-indigo-600 font-bold hover:underline"
                                >
                                  Edit Product
                                </button>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => setStoreProducts(storeProducts.filter(p => p.id !== product.id))}
                            className="text-[10px] text-red-500 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
