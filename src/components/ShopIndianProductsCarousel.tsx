import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';

export interface IndianShopProduct {
  id: string;
  tag: string;
  title: string;
  price: string;
  weight: string;
  bgColor: string;
  emoji: string;
  tagBg?: string;
  tagText?: string;
}

export const POPULAR_INDIAN_PRODUCTS: IndianShopProduct[] = [
  {
    id: 'p1',
    tag: 'POOJA',
    title: 'Ganesh Idol (Eco-friendly)',
    price: '$15.00',
    weight: '0.4 kg',
    bgColor: 'from-amber-100 to-orange-100',
    emoji: '🪔',
    tagBg: 'bg-amber-100 border-amber-200',
    tagText: 'text-amber-800'
  },
  {
    id: 'p2',
    tag: 'POOJA',
    title: 'Brass Diya Set (Pack of 4)',
    price: '$25.00',
    weight: '0.5 kg',
    bgColor: 'from-yellow-100 to-amber-200',
    emoji: '🕯️',
    tagBg: 'bg-yellow-100 border-yellow-200',
    tagText: 'text-yellow-800'
  },
  {
    id: 'p3',
    tag: 'POOJA',
    title: 'Sandalwood Incense Sticks',
    price: '$10.00',
    weight: '0.2 kg',
    bgColor: 'from-orange-100 to-amber-100',
    emoji: '🪵',
    tagBg: 'bg-orange-100 border-orange-200',
    tagText: 'text-orange-800'
  },
  {
    id: 'p4',
    tag: 'DECOR',
    title: 'Handcrafted Elephant Statue',
    price: '$35.00',
    weight: '0.8 kg',
    bgColor: 'from-blue-100 to-slate-100',
    emoji: '🐘',
    tagBg: 'bg-blue-100 border-blue-200',
    tagText: 'text-blue-800'
  },
  {
    id: 'p5',
    tag: 'SWEETS',
    title: 'Kaju Katli Sweet Box (500g)',
    price: '$18.50',
    weight: '0.5 kg',
    bgColor: 'from-emerald-100 to-teal-100',
    emoji: '🍬',
    tagBg: 'bg-emerald-100 border-emerald-200',
    tagText: 'text-emerald-800'
  },
  {
    id: 'p6',
    tag: 'GOURMET',
    title: 'Pure Kashmir Saffron (1g)',
    price: '$24.00',
    weight: '0.05 kg',
    bgColor: 'from-rose-100 to-orange-100',
    emoji: '🌾',
    tagBg: 'bg-rose-100 border-rose-200',
    tagText: 'text-rose-800'
  },
  {
    id: 'p7',
    tag: 'POOJA',
    title: 'Pure Copper Kalash & Lota',
    price: '$30.00',
    weight: '0.8 kg',
    bgColor: 'from-amber-100 to-yellow-100',
    emoji: '🏺',
    tagBg: 'bg-amber-100 border-amber-200',
    tagText: 'text-amber-800'
  },
  {
    id: 'p8',
    tag: 'SNACKS',
    title: 'Haldiram Special Bhujia (1kg)',
    price: '$9.50',
    weight: '1.0 kg',
    bgColor: 'from-orange-100 to-red-100',
    emoji: '🥨',
    tagBg: 'bg-orange-100 border-orange-200',
    tagText: 'text-orange-800'
  },
  {
    id: 'p9',
    tag: 'SPICES',
    title: 'Organic Turmeric Powder (500g)',
    price: '$12.00',
    weight: '0.5 kg',
    bgColor: 'from-yellow-100 to-amber-200',
    emoji: '🌿',
    tagBg: 'bg-yellow-100 border-yellow-200',
    tagText: 'text-yellow-900'
  },
  {
    id: 'p10',
    tag: 'SWEETS',
    title: 'Motichoor Laddoo Box (500g)',
    price: '$16.00',
    weight: '0.5 kg',
    bgColor: 'from-amber-100 to-orange-100',
    emoji: '🟡',
    tagBg: 'bg-amber-100 border-amber-200',
    tagText: 'text-amber-800'
  },
  {
    id: 'p11',
    tag: 'FESTIVE',
    title: 'Handmade Clay Diyas (Set of 12)',
    price: '$14.00',
    weight: '0.6 kg',
    bgColor: 'from-rose-100 to-amber-100',
    emoji: '✨',
    tagBg: 'bg-rose-100 border-rose-200',
    tagText: 'text-rose-800'
  },
  {
    id: 'p12',
    tag: 'WELLNESS',
    title: 'Mysore Sandal Soap (Pack of 3)',
    price: '$11.50',
    weight: '0.45 kg',
    bgColor: 'from-teal-100 to-emerald-100',
    emoji: '🧼',
    tagBg: 'bg-teal-100 border-teal-200',
    tagText: 'text-teal-800'
  }
];

interface ShopIndianProductsCarouselProps {
  navigateTo: (tab: string) => void;
  onAddToCart?: (item: IndianShopProduct) => void;
}

export const ShopIndianProductsCarousel: React.FC<ShopIndianProductsCarouselProps> = ({
  navigateTo,
  onAddToCart
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      // Scroll by approximately one visible screen segment or 4-5 card widths
      const scrollDistance = container.clientWidth * 0.85;
      container.scrollBy({
        left: direction === 'right' ? scrollDistance : -scrollDistance,
        behavior: 'smooth'
      });
    }
  };

  const handleAddItem = (product: IndianShopProduct) => {
    setAddedItemIds(prev => ({ ...prev, [product.id]: true }));
    toast.success(`"${product.title}" consolidated in your pickup box!`);
    if (onAddToCart) {
      onAddToCart(product);
    }
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [product.id]: false }));
    }, 2200);
  };

  return (
    <div className="bg-[#f0f9ff] border border-sky-100 p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-left space-y-3.5 shadow-sm relative overflow-hidden">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-black text-white bg-emerald-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
            CO-SHIPPING ACTIVE
          </span>
          <span className="text-[9px] font-black text-sky-800 bg-sky-100 border border-sky-200/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            ZERO BASE FEES
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Scroll Left Arrow Button */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left to view previous items"
            title="Scroll previous items"
            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
              canScrollLeft 
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-300 shadow-xs active:scale-95' 
                : 'bg-slate-100/70 border-slate-200/50 text-slate-300 cursor-not-allowed opacity-50'
            }`}
          >
            <ChevronLeft size={15} />
          </button>

          {/* Scroll Right Arrow Button */}
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right to view more items"
            title="Scroll next items"
            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
              canScrollRight 
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-300 shadow-xs active:scale-95' 
                : 'bg-slate-100/70 border-slate-200/50 text-slate-300 cursor-not-allowed opacity-50'
            }`}
          >
            <ChevronRight size={15} />
          </button>

          {/* See All Store Button */}
          <button 
            onClick={() => {
              navigateTo('store');
              window.scrollTo(0, 0);
            }}
            className="inline-flex items-center gap-1 text-[9px] font-black text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 rounded-lg uppercase transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <ShoppingBag size={11} />
            <span>See All</span>
          </button>
        </div>
      </div>

      {/* Description Text */}
      <div>
        <h3 className="text-sm font-black text-[#091535]">Shop Indian Products</h3>
        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-0.5">
          Delivered inside your same pickup box with <strong>no extra courier base fees</strong>.
        </p>
      </div>

      {/* 5-Item Display Horizontal Carousel Container with Relative Floating Arrows */}
      <div className="relative group/track">
        {/* Floating Left Arrow (desktop/tablet) */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 border border-slate-200 shadow-md text-slate-700 items-center justify-center hover:bg-white hover:border-sky-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Floating Right Arrow (desktop/tablet) */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 border border-slate-200 shadow-md text-slate-700 items-center justify-center hover:bg-white hover:border-sky-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Scrollable Track (5 Items Visible per view window on desktop, responsive scroll on mobile) */}
        <div 
          ref={scrollRef}
          className="flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 px-0.5 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {POPULAR_INDIAN_PRODUCTS.map((product) => {
            const isAdded = !!addedItemIds[product.id];

            return (
              <div 
                key={product.id} 
                className="snap-start flex-none w-[155px] sm:w-[170px] md:w-[calc(20%-9.6px)] md:min-w-[175px] bg-white border border-slate-200/90 hover:border-sky-300 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Artwork / Emoji Display */}
                  <div className={`w-full h-20 rounded-xl bg-gradient-to-br ${product.bgColor} flex items-center justify-center relative mb-2 shadow-2xs`}>
                    <span className="text-3xl select-none">{product.emoji}</span>
                    <span className={`absolute top-1.5 left-1.5 text-[7px] font-black uppercase px-1.5 py-0.5 rounded border ${product.tagBg || 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                      {product.tag}
                    </span>
                  </div>

                  {/* Title & Weight */}
                  <h4 className="text-[11px] sm:text-xs font-black text-slate-900 line-clamp-2 leading-tight min-h-[28px]" title={product.title}>
                    {product.title}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-bold mt-1">
                    {product.weight}
                  </p>
                </div>

                {/* Price & Add Action */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div>
                    <p className="text-xs font-black text-slate-900 leading-none">{product.price}</p>
                    <p className="text-[7px] text-teal-700 font-bold mt-0.5 uppercase tracking-tight">Zero base fee</p>
                  </div>
                  <button 
                    onClick={() => handleAddItem(product)}
                    className={`px-2.5 py-1 text-[9px] font-black rounded-lg transition-all shrink-0 cursor-pointer shadow-2xs flex items-center gap-0.5 ${
                      isAdded 
                        ? 'bg-emerald-700 text-white' 
                        : 'bg-teal-600 hover:bg-teal-700 text-white active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={10} /> Added
                      </>
                    ) : (
                      '+ Add'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
