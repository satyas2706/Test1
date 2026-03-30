import { AnimatePresence, motion } from 'motion/react';
import { Search, ShoppingBag, Plus, Trash2, SlidersHorizontal, ChevronDown, Calendar, Package, ArrowRight, Truck, X } from 'lucide-react';
import { StoreProduct, ShippingItem } from '../../types';

interface StoreSectionProps {
  storeProducts: StoreProduct[];
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addItem: (item: any, source: 'Pickup' | 'Store' | 'Warehouse') => void;
  removeStoreItem: (name: string) => void;
  items: ShippingItem[];
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  minPrice: number | '';
  setMinPrice: (price: number | '') => void;
  maxPrice: number | '';
  setMaxPrice: (price: number | '') => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  showJiffySuggestion: boolean;
  setShowJiffySuggestion: (show: boolean) => void;
  navigateTo: (tab: any) => void;
  appointments: any[];
}

const StoreSection = ({
  storeProducts,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  addItem,
  removeStoreItem,
  items,
  showFilters,
  setShowFilters,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  showJiffySuggestion,
  setShowJiffySuggestion,
  navigateTo,
  appointments
}: StoreSectionProps) => {
  let filteredProducts = storeProducts.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMinPrice = minPrice === '' || p.price >= minPrice;
    const matchesMaxPrice = maxPrice === '' || p.price <= maxPrice;
    return matchesCategory && matchesSearch && matchesMinPrice && matchesMaxPrice;
  });

  // Sorting logic
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'weight-low': return a.weight - b.weight;
      case 'weight-high': return b.weight - a.weight;
      default: return 0;
    }
  });

  const hasActivePickup = appointments.some(a => a.status === 'Scheduled');

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900"><span className="text-indigo-600">Jiffy Store</span></h2>
          <p className="text-slate-500">Premium Indian products delivered globally.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-2xl border transition-all flex items-center gap-2 font-bold text-sm ${
                showFilters || minPrice !== '' || maxPrice !== ''
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal size={18} />
              <span>Filters</span>
              {(minPrice !== '' || maxPrice !== '') && (
                <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
              )}
            </button>
            <div className="relative group">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm text-slate-600 cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
                <option value="weight-low">Weight: Low to High</option>
                <option value="weight-high">Weight: High to Low</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {['All', ...categories].map(cat => (
            <button 
              key={cat} 
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price Range ($)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-slate-400">-</span>
                    <input 
                      type="number" 
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={() => { setMinPrice(''); setMaxPrice(''); setSortBy('featured'); setSelectedCategory('All'); setSearchQuery(''); }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
                  >
                    Reset all filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length > 0 ? filteredProducts.map(product => {
          const cartItem = items.find(i => i.name === product.name && i.source === 'Store');
          const itemCount = cartItem?.quantity || 0;
          
          return (
            <motion.div 
              layout
              key={product.id} 
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative flex flex-col"
            >
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-4 right-4 z-10 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white"
                  >
                    {itemCount}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="aspect-square overflow-hidden relative">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  {product.category}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-900 leading-tight truncate flex-1 mr-2">{product.name}</h3>
                  <span className="text-indigo-600 font-bold shrink-0">${product.price}</span>
                </div>
                <div className="flex flex-col gap-1 mb-4">
                  <p className="text-[10px] text-slate-500">Weight: {product.weight} kg</p>
                  {product.estimatedDelivery && (
                    <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Calendar size={10} /> Ready by: {product.estimatedDelivery}
                    </div>
                  )}
                </div>
                <div className="mt-auto">
                  {itemCount > 0 ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => removeStoreItem(product.name)}
                        className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                        <ShoppingBag size={16} /> Added ({itemCount})
                      </div>
                      <button 
                        onClick={() => addItem({ 
                          name: product.name, 
                          weight: product.weight, 
                          price: product.price, 
                          image: product.image,
                          estimatedDelivery: product.estimatedDelivery 
                        }, 'Store')}
                        className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addItem({ 
                        name: product.name, 
                        weight: product.weight, 
                        price: product.price, 
                        image: product.image,
                        estimatedDelivery: product.estimatedDelivery 
                      }, 'Store')}
                      className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={16} /> Add to Shipment
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        }) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No products found</h3>
            <p className="text-slate-500">Try adjusting your search or category filter.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="text-indigo-600 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-8">
        <AnimatePresence>
          {showJiffySuggestion && !hasActivePickup && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-3xl"
            >
              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative group hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                    <Package className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 leading-tight">Ship more from home or Pickup from home?</h4>
                    <p className="text-slate-500 text-sm">Want to get some items from home or anywhere to ship along with your Jiffy Store items? Add warehouse items or schedule an agent pickup.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button 
                    onClick={() => {
                      navigateTo('warehouse');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                  >
                    <Package size={16} /> Add warehouse items <ArrowRight size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      navigateTo('pickup');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
                  >
                    <Truck size={16} /> Schedule Pickup from home <ArrowRight size={16} />
                  </button>
                </div>
                <button 
                  onClick={() => setShowJiffySuggestion(false)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StoreSection;
