import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Menu, 
  Search, 
  ShoppingCart, 
  ShoppingBag,
  Heart, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  Users, 
  SlidersHorizontal, 
  ChevronDown, 
  Plus, 
  Minus, 
  X, 
  Home, 
  Grid, 
  Headset, 
  User, 
  Check, 
  ArrowRight,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { StoreProduct, ShippingItem } from '../../types';

interface MobileStoreSectionProps {
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
  orderedItemIds: Set<string>;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export const MobileStoreSection: React.FC<MobileStoreSectionProps> = ({
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
  appointments,
  orderedItemIds,
  setIsMobileMenuOpen
}) => {
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Wishlist State
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jiffex_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Quick Sort State (inline modal)
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Toggle wishlist
  const toggleWishlist = (productId: string, productName: string) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      let updated;
      if (exists) {
        updated = prev.filter(id => id !== productId);
        toast.info(`Removed "${productName}" from Wishlist`);
      } else {
        updated = [...prev, productId];
        toast.success(`Added "${productName}" to Wishlist!`);
      }
      localStorage.setItem('jiffex_wishlist', JSON.stringify(updated));
      return updated;
    });
  };

  // Slides configuration
  const slides = [
    {
      badgeText: "FRESH & AUTHENTIC",
      badgeIcon: <Sparkles size={11} className="text-orange-500" />,
      badgeColor: "border-orange-500/30 text-orange-600 bg-orange-50/50",
      secondBadgeText: "HYGIENICALLY PACKED",
      secondBadgeIcon: <ShieldCheck size={11} className="text-emerald-500" />,
      secondBadgeColor: "border-emerald-500/30 text-emerald-600 bg-emerald-50/50",
      headlinePrefix: "Miss the Taste of India?",
      headlineHighlight: "We Deliver Sweet Happiness.",
      subheadline: "Order delicious Indian sweets online. Freshly packed and shipped worldwide.",
      image: "https://lh3.googleusercontent.com/d/1UkJBaJFV91unv7jYqOXwEYY91r7ZOkvE", // Sweets slide
      cta: "EXPLORE SWEETS COLLECTION"
    },
    {
      badgeText: "TRADITIONAL BRASS",
      badgeIcon: <Sparkles size={11} className="text-orange-500" />,
      badgeColor: "border-orange-500/30 text-orange-600 bg-orange-50/50",
      secondBadgeText: "FESTIVE READY",
      secondBadgeIcon: <ShieldCheck size={11} className="text-amber-500" />,
      secondBadgeColor: "border-amber-500/30 text-amber-600 bg-amber-50/50",
      headlinePrefix: "Divine Festive Light",
      headlineHighlight: "Brass Diyas & Idols.",
      subheadline: "Intricately carved high-quality brass pooja essentials shipped globally.",
      image: "https://lh3.googleusercontent.com/d/1gpGBNFhoBWpcTMg5nV2-OEdWRWfQGFEy", // Pooja items
      cta: "SHOP POOJA ESSENTIALS"
    },
    {
      badgeText: "ARTISANAL INDIAN",
      badgeIcon: <Sparkles size={11} className="text-orange-500" />,
      badgeColor: "border-orange-500/30 text-orange-600 bg-orange-50/50",
      secondBadgeText: "HANDMADE WOOD",
      secondBadgeIcon: <ShieldCheck size={11} className="text-blue-500" />,
      secondBadgeColor: "border-blue-500/30 text-blue-600 bg-blue-50/50",
      headlinePrefix: "Stunning Heritage Craft",
      headlineHighlight: "Elegant Home Decor.",
      subheadline: "Majestic handcrafted statues, wall hangings and authentic Indian wood carvings.",
      image: "https://lh3.googleusercontent.com/d/1dxLyoYCj5EPfQP5mp9TEVxxbHCvyw4jg", // Decor
      cta: "EXPLORE HANDICRAFTS"
    }
  ];

  // Auto scroll slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Filter products based on search, category and price filters
  const filteredProducts = useMemo(() => {
    let result = storeProducts.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMinPrice = minPrice === '' || p.price >= minPrice;
      const matchesMaxPrice = maxPrice === '' || p.price <= maxPrice;
      return matchesCategory && matchesSearch && matchesMinPrice && matchesMaxPrice;
    });

    // Sorting logic
    return [...result].sort((a, b) => {
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
  }, [storeProducts, selectedCategory, searchQuery, minPrice, maxPrice, sortBy]);

  // Compute overall cart items quantity to show on header
  const totalCartCount = useMemo(() => {
    const cartItems = items.filter(i => !orderedItemIds.has(i.id) && i.source === 'Store');
    return cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [items, orderedItemIds]);

  return (
    <div className="bg-slate-50 min-h-screen pb-24 text-slate-900 font-sans antialiased">
      
      {/* 2. Hero Promo Banner (Schedule Pickup Style) */}
      <div id="carousel-hero-container" className="px-4 pt-4 pb-2">
        <div className="bg-gradient-to-br from-[#091535] to-[#122352] text-white p-5 rounded-2xl shadow-md flex items-center justify-between relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="flex items-center gap-3.5 z-10">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-yellow-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-none text-white">Shop & Ship</h2>
              <p className="text-[10px] text-slate-300 font-bold mt-1.5 leading-tight">
                Buy from Indian stores & we'll deliver worldwide
              </p>
            </div>
          </div>
          <div className="relative shrink-0 w-14 h-14 flex items-center justify-center">
            <ShoppingCart size={28} className="text-slate-200/40 animate-bounce" />
          </div>
        </div>

        {/* Value Proposition Labels (Sub-bar under Banner) */}
        <div className="grid grid-cols-3 gap-1 bg-white border border-slate-100 rounded-xl p-2.5 mt-2 shadow-sm">
          <div className="flex flex-col items-center text-center justify-center">
            <div className="w-6 h-6 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center mb-1">
              <Truck size={12} className="stroke-[2.5]" />
            </div>
            <span className="text-[8px] font-black text-slate-800 leading-tight">Delivered in 3-7 Days</span>
          </div>
          <div className="flex flex-col items-center text-center justify-center border-x border-slate-100">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center mb-1">
              <Users size={12} className="stroke-[2.5]" />
            </div>
            <span className="text-[8px] font-black text-slate-800 leading-tight">Trusted by 1000+ Indians</span>
          </div>
          <div className="flex flex-col items-center text-center justify-center">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center mb-1">
              <ShieldCheck size={12} className="stroke-[2.5]" />
            </div>
            <span className="text-[8px] font-black text-slate-800 leading-tight">Authentic Flavors</span>
          </div>
        </div>
      </div>

      {/* 3. Search and Utility Controls */}
      <div className="px-4 pt-2 pb-1 space-y-2">
        <div className="flex gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              id="search-input-box"
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-[11px] font-semibold text-slate-800 placeholder:text-[10px] shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters Toggle Button */}
          <button 
            id="btn-toggle-filters"
            onClick={() => setShowFiltersDrawer(true)}
            className={`px-3 py-2 rounded-xl border flex items-center gap-1 text-[8px] font-black uppercase tracking-wider transition-all shadow-sm ${
              minPrice !== '' || maxPrice !== ''
                ? 'bg-orange-50 border-orange-200 text-orange-600'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <SlidersHorizontal size={12} />
            <span>Filters</span>
            {(minPrice !== '' || maxPrice !== '') && (
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
            )}
          </button>

          {/* Sort Button */}
          <button 
            id="btn-toggle-sort"
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-slate-700 transition-all shadow-sm relative"
          >
            <ArrowUpDown size={12} />
            <span>Sort</span>
            <ChevronDown size={10} className={`transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Sort Dropdown Drawer Menu */}
        <AnimatePresence>
          {showSortDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white border border-slate-100 rounded-xl p-2 shadow-lg grid grid-cols-2 gap-1 z-30 relative"
            >
              {[
                { id: 'featured', label: 'Featured' },
                { id: 'price-low', label: 'Price: Low to High' },
                { id: 'price-high', label: 'Price: High to Low' },
                { id: 'name-asc', label: 'Name: A-Z' },
                { id: 'weight-low', label: 'Weight: Low to High' },
                { id: 'weight-high', label: 'Weight: High to Low' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSortBy(opt.id);
                    setShowSortDropdown(false);
                    toast.success(`Sorted by ${opt.label}`);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-left text-[10px] font-black tracking-wide transition-colors ${
                    sortBy === opt.id 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : 'hover:bg-slate-50 text-slate-650'
                  }`}
                >
                  {sortBy === opt.id && '✓ '}
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Category Navigation Tabs (Horizontal Scroll) */}
      <div className="px-4 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 scroll-smooth">
          {['All', ...categories].map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                }}
                className={`flex-shrink-0 px-3 py-2 rounded-full text-[8px] font-black tracking-tight uppercase transition-all duration-300 shadow-sm ${
                  isActive 
                    ? 'bg-[#091535] text-white ring-2 ring-slate-900/10' 
                    : 'bg-white border border-slate-150 text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat === 'All' ? '✨ All Items' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Popular Products Grid (Body Catalog) */}
      <div className="px-4 py-2 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black text-slate-950 uppercase tracking-wider">
            Popular Products ({filteredProducts.length})
          </h3>
          <button 
            id="btn-view-all"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              toast.info("Showing all products!");
            }}
            className="text-indigo-600 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 hover:underline"
          >
            View all →
          </button>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(product => {
              const cartItem = items.find(i => i.name === product.name && i.source === 'Store' && !orderedItemIds.has(i.id));
              const itemCount = cartItem?.quantity || 0;
              const isLiked = wishlist.includes(product.id);
              
              return (
                <div 
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,23,42,0.02)] hover:shadow-md transition-shadow relative flex flex-col overflow-hidden"
                >
                  {/* Category Pill Tag & Wishlist Floating Heart */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="px-2 py-0.5 bg-white/95 backdrop-blur-md text-[8px] font-black text-slate-800 uppercase tracking-widest rounded-md border border-slate-100 shadow-sm">
                      {product.category}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleWishlist(product.id, product.name)}
                    className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/95 backdrop-blur rounded-full flex items-center justify-center border border-slate-100 shadow-sm active:scale-90 transition-transform"
                  >
                    <Heart 
                      size={14} 
                      className={`transition-colors duration-300 ${
                        isLiked ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-red-500'
                      }`} 
                    />
                  </button>

                  {/* High Quality Image Container */}
                  <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden flex items-center justify-center">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Body Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between text-left">
                    <div className="space-y-1">
                      <h4 className="font-black text-xs text-slate-900 line-clamp-1">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-1.5 justify-between">
                        <span className="text-orange-600 text-sm font-black tracking-tight">
                          ₹{product.price}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400">
                          {product.weight} kg
                        </span>
                      </div>
                      
                      {/* Shipping Indicator (Green truck) */}
                      <div className="text-[8px] font-bold text-emerald-600 flex items-center gap-1 pt-0.5 leading-none">
                        <Truck size={10} className="shrink-0" />
                        <span>Ready to ship by 22 May</span>
                      </div>
                    </div>

                    {/* Controls Row */}
                    <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between gap-1.5">
                      {/* Quantity Selector Counter */}
                      <div className="flex items-center bg-slate-100 rounded-lg p-0.5 h-8 shrink-0">
                        <button
                          onClick={() => {
                            if (itemCount > 0) {
                              removeStoreItem(product.name);
                              toast.info(`Removed 1 "${product.name}" from cart`);
                            }
                          }}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:bg-white active:scale-90 transition-transform"
                        >
                          <Minus size={11} className="stroke-[2.5]" />
                        </button>
                        <span className="w-5 text-center text-[11px] font-black text-slate-900">
                          {itemCount}
                        </span>
                        <button
                          onClick={() => {
                            addItem({
                              name: product.name,
                              weight: product.weight,
                              price: product.price,
                              image: product.image,
                              estimatedDelivery: product.estimatedDelivery
                            }, 'Store');
                            toast.success(`Added 1 "${product.name}" to cart!`);
                          }}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:bg-white active:scale-90 transition-transform"
                        >
                          <Plus size={11} className="stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Vibrant Blue Add Button with Cart icon */}
                      <button
                        onClick={() => {
                          addItem({
                            name: product.name,
                            weight: product.weight,
                            price: product.price,
                            image: product.image,
                            estimatedDelivery: product.estimatedDelivery
                          }, 'Store');
                          toast.success(`"${product.name}" added to cart!`);
                        }}
                        className="flex-1 h-8 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 px-1.5 active:scale-95 transition-all shadow-sm"
                      >
                        <ShoppingCart size={11} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl py-12 px-4 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search size={28} />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">No matches found</h4>
            <p className="text-xs text-slate-400 leading-normal max-w-[200px] mx-auto">
              We couldn't find anything matching your filters or query.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setMinPrice('');
                setMaxPrice('');
                setSortBy('featured');
                toast.success('Filters cleared!');
              }}
              className="text-xs font-black text-indigo-600 underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>



      {/* Floating Checkout Sticky Bottom Bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-14 left-4 right-4 z-[75]">
          <div className="bg-[#091535] text-white p-3.5 rounded-2xl shadow-[0_12px_24px_rgba(9,21,53,0.3)] flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
                <ShoppingCart size={18} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider opacity-60 block">In Cart</span>
                <span className="text-xs font-black">{totalCartCount} Product{totalCartCount > 1 ? 's' : ''} added</span>
              </div>
            </div>
            <button
              onClick={() => {
                navigateTo('cart');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-white text-[#091535] rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all shadow-md"
            >
              <span>View Cart</span>
              <ArrowRight size={12} className="stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Options Side Drawer / Slide-up Modal */}
      <AnimatePresence>
        {showFiltersDrawer && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFiltersDrawer(false)}
              className="absolute inset-0 bg-black"
            />
            
            {/* Drawer Body */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white w-full rounded-t-[2rem] max-h-[85vh] overflow-y-auto relative z-10 px-5 pt-4 pb-6 space-y-6 text-left shadow-[0_-12px_36px_rgba(0,0,0,0.15)]"
            >
              {/* Top Handle bar */}
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto" />
              
              <div className="flex items-center justify-between pt-2">
                <h3 className="font-black text-base text-slate-900 uppercase tracking-tight">
                  Filters & Options
                </h3>
                <button 
                  onClick={() => setShowFiltersDrawer(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:scale-90 transition-transform"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Price Range (₹)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">Min: ₹</span>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-transparent outline-none text-xs font-black text-slate-800"
                    />
                  </div>
                  <span className="text-slate-400 font-bold">-</span>
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">Max: ₹</span>
                    <input 
                      type="number" 
                      placeholder="999"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-transparent outline-none text-xs font-black text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Categories Selection in Filters */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Category Filter
                </label>
                <div className="flex flex-wrap gap-2">
                  {['All', ...categories].map(cat => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected 
                            ? 'bg-blue-600 text-white font-black' 
                            : 'bg-slate-50 border border-slate-200 text-slate-600'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons in Drawer */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setMinPrice('');
                    setMaxPrice('');
                    setSelectedCategory('All');
                    setSortBy('featured');
                    setSearchQuery('');
                    toast.success('All filters cleared');
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 active:scale-95 transition-transform text-center"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setShowFiltersDrawer(false)}
                  className="flex-1 py-3 bg-[#091535] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-900 active:scale-95 transition-transform text-center"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
