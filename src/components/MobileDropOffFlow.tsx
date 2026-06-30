import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Globe, 
  MapPin, 
  Copy, 
  CheckCircle2, 
  Package, 
  PackagePlus, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Info, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ShoppingBag,
  Inbox,
  X,
  ShieldCheck,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { WAREHOUSE_ADDRESS } from '../constants';

interface MobileDropOffFlowProps {
  customerWarehouseId: string;
  items: any[];
  addItem: (item: any, source: 'Warehouse' | 'Pickup' | 'Store') => void;
  removeItem: (id: string) => void;
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveTab: (tab: string) => void;
  currentUser: any;
  dbStatus: { checked: boolean };
  api: any;
  navigateTo: (tab: string) => void;

  // Cart Add States & setters
  cartItemName: string;
  setCartItemName: (val: string) => void;
  cartItemWeight: number | '';
  setCartItemWeight: (val: number | '') => void;
  cartItemQuantity: number;
  setCartItemQuantity: (val: number) => void;
  cartItemFragile: boolean;
  setCartItemFragile: (val: boolean) => void;
  cartItemInvoiceNumber: string;
  setCartItemInvoiceNumber: (val: string) => void;
  cartItemRemarks: string;
  setCartItemRemarks: (val: string) => void;
  cartItemPurchaseSource: string;
  setCartItemPurchaseSource: (val: string) => void;
  cartItemImageUrl: string;
  setCartItemImageUrl: (val: string) => void;
}

export const MobileDropOffFlow: React.FC<MobileDropOffFlowProps> = ({
  customerWarehouseId,
  items,
  addItem,
  removeItem,
  setItems,
  setActiveTab,
  currentUser,
  dbStatus,
  api,
  navigateTo,

  // Cart state bindings
  cartItemName,
  setCartItemName,
  cartItemWeight,
  setCartItemWeight,
  cartItemQuantity,
  setCartItemQuantity,
  cartItemFragile,
  setCartItemFragile,
  cartItemInvoiceNumber,
  setCartItemInvoiceNumber,
  cartItemRemarks,
  setCartItemRemarks,
  cartItemPurchaseSource,
  setCartItemPurchaseSource,
  cartItemImageUrl,
  setCartItemImageUrl,
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [showProhibitedModal, setShowProhibitedModal] = useState(false);
  const [selectedDocIndex, setSelectedDocIndex] = useState<number | null>(null);
  const [selectedProhibitedIndex, setSelectedProhibitedIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter display items for warehouse mode
  const displayItems = items.filter(i => i.source === 'Warehouse' && !i.submitted);

  const handleCopyAddress = () => {
    const addressText = `${WAREHOUSE_ADDRESS.name}\nAttn: ${customerWarehouseId}\n${WAREHOUSE_ADDRESS.street}\n${WAREHOUSE_ADDRESS.city}, ${WAREHOUSE_ADDRESS.state} ${WAREHOUSE_ADDRESS.zip}\n${WAREHOUSE_ADDRESS.country}\nTel: ${WAREHOUSE_ADDRESS.phone}`;
    navigator.clipboard.writeText(addressText);
    setCopied(true);
    toast.success('Warehouse address copied successfully!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddItem = () => {
    if (!cartItemName) {
      toast.error('Please enter an item description first.');
      return;
    }
    const unitWeight = typeof cartItemWeight === 'number' ? cartItemWeight : 0;
    
    addItem({
      name: cartItemName,
      weight: unitWeight * cartItemQuantity,
      quantity: cartItemQuantity,
      fragile: cartItemFragile,
      invoiceNumber: cartItemInvoiceNumber,
      remarks: cartItemRemarks,
      purchaseSource: cartItemPurchaseSource,
      image: cartItemImageUrl
    }, 'Warehouse');

    // Reset fields
    setCartItemName('');
    setCartItemWeight('');
    setCartItemQuantity(1);
    setCartItemFragile(false);
    setCartItemInvoiceNumber('');
    setCartItemRemarks('');
    setCartItemImageUrl('');

    toast.success('Item added to shipment! Scroll down or tap Continue to review.');
  };

  const handleFinalizePreAlert = async () => {
    if (displayItems.length === 0) {
      toast.error('Please register at least one item before finalizing.');
      return;
    }

    const unsubmittedWarehouseItems = [...displayItems];

    // Locally mark them as submitted
    setItems(prev => prev.map(i => 
      i.source === 'Warehouse' && !i.submitted 
        ? { ...i, submitted: true } 
        : i
    ));

    // Send pre-alerts to API/DB if connected
    if (dbStatus.checked && currentUser) {
      for (const item of unsubmittedWarehouseItems) {
        const ids = item.ids && item.ids.length > 0 ? item.ids : [item.id];
        for (const itemId of ids) {
          try {
            await api.updateItemSubmitted(itemId, true);
          } catch (err: any) {
            console.error(`Failed to update item ${itemId} to submitted:`, err.message);
          }
        }
      }
    }

    toast.success('Pre-alert submitted successfully!');
    setActiveTab('cart');
    navigateTo('cart');
  };

  const requirementsData = [
    {
      title: 'ID Proof Copy',
      subtext: 'Aadhar, Passport or Driving License Copy',
      icon: <ShieldCheck size={20} className="text-emerald-600" />,
      guidelines: [
        'Standard government-issued photo identification is mandatory.',
        'Acceptable IDs: Aadhaar Card, Indian/Global Passport, Voter ID, or Driving License.',
        'Please provide clear, legible front and back color copies of the document.',
        'The name listed on your ID document must exactly match the sender name declared on the shipping bill.'
      ]
    },
    {
      title: 'Itemized Declaration',
      subtext: 'Simple list of contents & quantities',
      icon: <FileText size={20} className="text-emerald-600" />,
      guidelines: [
        'A comprehensive declaration list detailing every item inside your package is required.',
        'Please list exact descriptions and quantities of all products (e.g. "4 Cotton Shirts, 2 Packets of dry sweets").',
        'This form helps customs officials easily verify the packages, avoiding unnecessary border delays.',
        'No professional invoice is needed; a simple hand-written or digitally typed list is fully acceptable.'
      ]
    },
    {
      title: 'Value Statement',
      subtext: 'Bills/Invoices for any luxurious brand garments',
      icon: <FileText size={20} className="text-emerald-600" />,
      guidelines: [
        'Mandatory for newly purchased retail items, branded luxurious goods, or heavy designer ethnic garments.',
        'Please produce purchase invoices or digital store receipts detailing actual paid pricing.',
        'Value statement ensures correct custom duty calculations and prevents arbitrary valuation adjustments by destination customs.',
        'For older used personal belongings, a simple self-declared estimated fair value is sufficient.'
      ]
    }
  ];

  const prohibitedData = [
    {
      title: 'Aerosols & Perfumes',
      subtext: 'Body sprays, deodorants, or inflammable liquids',
      icon: <span className="text-lg">💨</span>,
      reason: 'Under aviation safety law, pressurized aerosol sprays, body sprays, dry shampoos, sanitizers, and oil-based perfumes are treated as combustible hazardous cargo and cannot be boarded on cargo planes.'
    },
    {
      title: 'Cash & Jewellery',
      subtext: 'Currency notes, solid raw gold, silver bullion',
      icon: <span className="text-lg">💵</span>,
      reason: 'Standard express courier lines are strictly forbidden from carrying raw bullion metals, physical fiat banknotes, loose precious gems, gold/silver biscuits, or high-value ornaments due to global anti-money laundering controls and transit security guidelines.'
    },
    {
      title: 'Perishables',
      subtext: 'Open/homemade liquid curries, raw dairy products',
      icon: <span className="text-lg">🍲</span>,
      reason: 'Wet curries, unsealed pickles with high oil content, raw cheese, or items needing refrigeration are barred. They are highly prone to spoilage, odor emissions, and fluid leakages that can ruin entire multi-shipment containers.'
    },
    {
      title: 'Hazardous Materials',
      subtext: 'Ammunition, loose lithium batteries, explosive',
      icon: <span className="text-lg">🔋</span>,
      reason: 'Loose lithium-ion power cells, matches, fireworks, magnetic toys, combustible chemicals, and weapons of any category are completely banned. These products represent high-risk fire and explosion hazards under international air safety regulations.'
    },
    {
      title: 'Restricted Drugs & Plants',
      subtext: 'Prescription medicines without paperwork, live plants',
      icon: <span className="text-lg">🌱</span>,
      reason: 'Unprescribed medicine capsules or active pharmacy formulas are not permitted. Live flowers, plant saplings, soil bags, and raw unsterilized agricultural seeds are subject to biological quarantine laws in most destination countries.'
    }
  ];

  return (
    <div className="space-y-4 px-3 py-1 text-left">
      {/* 1. Header & Drop Off Banner */}
      <div className="bg-gradient-to-br from-[#064e3b] to-[#047857] text-white p-5 rounded-2xl shadow-md flex items-center justify-between relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-yellow-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Package size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight leading-none text-white">Drop Off Package</h2>
            <p className="text-[10px] text-emerald-100 font-bold mt-1.5 leading-tight">
              Ship your packages to our hub — we deliver abroad
            </p>
          </div>
        </div>
        <div className="relative shrink-0 w-14 h-14 flex items-center justify-center">
          <Package size={28} className="text-emerald-200/40 animate-bounce" />
        </div>
      </div>

      {/* 2. Progress Stepper */}
      <div className="grid grid-cols-3 gap-1 items-center justify-between text-center py-3 border border-slate-100 bg-white rounded-xl shadow-sm">
        {[
          { step: 1, label: 'Use Address' },
          { step: 2, label: 'Register Item' },
          { step: 3, label: 'Review & Send' }
        ].map((s) => {
          const isActive = activeStep === s.step;
          const isCompleted = activeStep > s.step;
          return (
            <div key={s.step} className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                isCompleted ? 'bg-emerald-600 text-white' :
                isActive ? 'bg-[#064e3b] text-white ring-4 ring-emerald-100' :
                'bg-slate-100 text-slate-400'
              }`}>
                {s.step}
              </div>
              <span className={`text-[9px] font-black tracking-tight mt-1 transition-colors ${
                isActive || isCompleted ? 'text-[#064e3b] font-black' : 'text-slate-400 font-bold'
              }`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 3. Steps Dynamic Renderer */}
      <div className="min-h-[350px]">
        {/* Step 1: Use Address */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2.5 text-left">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Our Warehouse Address</h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                Order your products from any online store or courier, and ship them directly to this address.
              </p>

              <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100/60 p-4 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-emerald-200">
                  <MapPin size={48} className="opacity-15" />
                </div>

                <div className="space-y-2 text-xs text-slate-800">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase text-emerald-800 block">Recipient Name</span>
                    <span className="font-bold text-[#0A142F]">{WAREHOUSE_ADDRESS.name}</span>
                  </div>

                  <div>
                    <span className="text-[9px] font-extrabold uppercase text-emerald-800 block">Unique ID (MUST Include as Attn)</span>
                    <span className="font-mono bg-white border border-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[11px] font-black">
                      Attn: {customerWarehouseId}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-extrabold uppercase text-emerald-800 block">Street Address</span>
                    <span className="font-bold text-[#0A142F]">{WAREHOUSE_ADDRESS.street}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase text-emerald-800 block">City & State</span>
                      <span className="font-bold text-[#0A142F]">{WAREHOUSE_ADDRESS.city}, {WAREHOUSE_ADDRESS.state}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold uppercase text-emerald-800 block">Postal/ZIP Code</span>
                      <span className="font-bold text-[#0A142F]">{WAREHOUSE_ADDRESS.zip}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase text-emerald-800 block">Country</span>
                      <span className="font-bold text-[#0A142F]">{WAREHOUSE_ADDRESS.country}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold uppercase text-emerald-800 block">Hub Phone</span>
                      <span className="font-bold text-[#0A142F]">{WAREHOUSE_ADDRESS.phone}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleCopyAddress}
                  className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-100"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Address Details'}</span>
                </button>
              </div>

              {/* Critical Alert Tip */}
              <div className="bg-amber-50/50 rounded-xl border border-amber-100 p-3.5 flex items-start gap-2.5 text-[10px] text-amber-950 leading-relaxed shadow-sm">
                <Info size={14} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold">CRITICAL WARNING:</span> You <span className="font-bold text-red-700">MUST</span> write the unique identifier <span className="font-mono bg-white border border-amber-100 text-amber-800 px-1 font-bold">Attn: {customerWarehouseId}</span> inside the address line or delivery remarks on Myntra, Amazon, etc. This is the only way we recognize that the package is yours!
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                setActiveStep(2);
                window.scrollTo(0, 0);
              }}
              className="w-full py-3.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-emerald-100"
            >
              <span>Continue to Step 2</span>
              <ArrowRight size={13} className="stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* Step 2: Register Item */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <PackagePlus size={12} className="stroke-[2.5]" />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Register Incoming Package</h4>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                Let us know what products are heading to our warehouse so we scan them instantly upon arrival.
              </p>

              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3 text-xs">
                {/* Item Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#0A142F] uppercase tracking-wide">Item Description</label>
                  <input 
                    type="text" 
                    value={cartItemName}
                    onChange={(e) => setCartItemName(e.target.value)}
                    placeholder="e.g. Cotton Kurtis, Brass diya, Wedding garments"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all text-xs font-bold bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Online Store Source */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#0A142F] uppercase tracking-wide">Online Store Source</label>
                    <select
                      value={cartItemPurchaseSource}
                      onChange={(e) => setCartItemPurchaseSource(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all text-xs font-bold bg-slate-50/50"
                    >
                      <option value="Myntra">Myntra</option>
                      <option value="Amazon India">Amazon India</option>
                      <option value="Flipkart">Flipkart</option>
                      <option value="Ajio">Ajio</option>
                      <option value="Nykaa">Nykaa</option>
                      <option value="FirstCry">FirstCry</option>
                      <option value="Meesho">Meesho</option>
                      <option value="Other / Boutique">Other / Boutique</option>
                    </select>
                  </div>

                  {/* Quantity Counter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#0A142F] uppercase tracking-wide">Quantity</label>
                    <div className="flex items-center justify-between border border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50/50 h-[38px]">
                      <button 
                        onClick={() => setCartItemQuantity(Math.max(1, cartItemQuantity - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-90 transition-all cursor-pointer"
                      >
                        <Minus size={12} className="stroke-[2.5]" />
                      </button>
                      <span className="font-extrabold text-[#0a142f] text-xs px-2">{cartItemQuantity}</span>
                      <button 
                        onClick={() => setCartItemQuantity(cartItemQuantity + 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-90 transition-all cursor-pointer"
                      >
                        <Plus size={12} className="stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Courier Tracking ID */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#0A142F] uppercase tracking-wide">Courier Tracking ID</label>
                    <input 
                      type="text" 
                      value={cartItemInvoiceNumber}
                      onChange={(e) => setCartItemInvoiceNumber(e.target.value)}
                      placeholder="Optional (e.g. Delivery tracking)"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all text-xs font-mono bg-slate-50/50"
                    />
                  </div>

                  {/* Estimated Unit Weight */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#0A142F] uppercase tracking-wide">Est. Unit Weight (kg)</label>
                    <input 
                      type="number" 
                      value={cartItemWeight}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCartItemWeight(val === '' ? '' : parseFloat(val));
                      }}
                      placeholder="Optional"
                      step="0.1"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all text-xs font-bold bg-slate-50/50"
                    />
                  </div>
                </div>

                {/* Optional Item Image URL */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-[#0A142F] uppercase tracking-wide">Item Image URL</label>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Optional reference</span>
                  </div>
                  <input 
                    type="url" 
                    value={cartItemImageUrl}
                    onChange={(e) => setCartItemImageUrl(e.target.value)}
                    placeholder="Paste image link from Myntra, Amazon, etc."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all text-xs font-semibold bg-slate-50/50"
                  />
                </div>

                <button 
                  onClick={handleAddItem}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-100"
                >
                  <Plus size={14} className="stroke-[2.5]" />
                  <span>Register This Item</span>
                </button>
              </div>

              {/* Added items mini overview */}
              {displayItems.length > 0 && (
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-emerald-900 tracking-wide">Current Shipment Summary</span>
                    <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      {displayItems.length} Registered
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-800 space-y-1 font-semibold">
                    {displayItems.slice(0, 3).map((item, index) => (
                      <div key={item.id} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate flex-1">{item.name} (x{item.quantity})</span>
                        <span className="font-bold text-[#0A142F] uppercase shrink-0 text-[8px]">{item.purchaseSource}</span>
                      </div>
                    ))}
                    {displayItems.length > 3 && (
                      <p className="text-[9px] text-slate-400 italic pt-0.5 font-bold">And {displayItems.length - 3} more registered packages...</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2.5">
              <button 
                onClick={() => {
                  setActiveStep(1);
                  window.scrollTo(0, 0);
                }}
                className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button 
                onClick={() => {
                  setActiveStep(3);
                  window.scrollTo(0, 0);
                }}
                className="flex-[2] py-3.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-100"
              >
                <span>Review & Finish</span>
                <ArrowRight size={13} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review shipment */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-3.5 text-left">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={12} className="stroke-[2.5]" />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Review Registered Items</h4>
              </div>

              {displayItems.length === 0 ? (
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <Inbox size={20} />
                  </div>
                  <h5 className="font-extrabold text-xs text-slate-800">No items registered yet</h5>
                  <p className="text-[10px] text-slate-400 font-semibold max-w-[200px]">Go back to Step 2 to add items you expect to receive.</p>
                  <button 
                    onClick={() => {
                      setActiveStep(2);
                      window.scrollTo(0, 0);
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 active:scale-95 cursor-pointer hover:bg-slate-150 transition-all"
                  >
                    Go Back & Add Items
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {displayItems.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between gap-3 relative group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-emerald-600 border border-slate-100 shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                          ) : (
                            <Package size={18} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-xs text-slate-900 truncate leading-snug">{item.name}</p>
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 bg-white rounded text-[8px] font-bold text-slate-500 border border-slate-100">
                              Qty: {item.quantity}
                            </span>
                            {item.purchaseSource && (
                              <span className="px-1.5 py-0.5 bg-emerald-50 rounded text-[8px] font-bold text-emerald-700 border border-emerald-100 uppercase">
                                {item.purchaseSource}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {displayItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-2 text-amber-900 text-[10px] leading-relaxed">
                  <Info size={14} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Official Weights Notice:</span> Individual package weights are checked and updated by our staff once physically scanned at the hub.
                  </div>
                </div>
              )}

              {/* Requirements & Prohibited Sections */}
              <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100">
                {/* REQUIRED DOCUMENTS */}
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck size={13} className="stroke-[2.5]" />
                    </div>
                    <h3 className="text-[11px] font-black uppercase text-emerald-950 tracking-wider">DOCUMENTS REQUIRED</h3>
                  </div>

                  <div className="space-y-2">
                    {[
                      { title: 'ID Proof Copy', subtext: 'Aadhar, Passport or Driving License Copy' },
                      { title: 'Itemized Declaration', subtext: 'Simple list of contents & quantities' },
                      { title: 'Value Statement', subtext: 'Bills/Invoices for any luxurious brand garments' }
                    ].map((doc, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm flex items-center justify-between gap-3 hover:border-emerald-100 transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedDocIndex(idx);
                          setShowRequirementsModal(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <ShieldCheck size={16} className="stroke-[2.5]" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[#0A142F]">{doc.title}</p>
                            <p className="text-[8px] text-slate-400 font-bold leading-tight mt-0.5">{doc.subtext}</p>
                          </div>
                        </div>
                        <span className="text-slate-300 font-bold text-xs select-none mr-1">&gt;</span>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedDocIndex(null);
                      setShowRequirementsModal(true);
                    }}
                    className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 hover:underline tracking-wider uppercase pt-1 cursor-pointer bg-transparent border-none outline-none"
                  >
                    View all requirements &gt;
                  </button>
                </div>

                {/* PROHIBITED ITEMS */}
                <div className="space-y-3 text-left pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 fill-current text-red-600" viewBox="0 0 24 24">
                        <path d="M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z"/>
                      </svg>
                    </div>
                    <h3 className="text-[11px] font-black uppercase text-red-800 tracking-wider">PROHIBITED ITEMS</h3>
                  </div>

                  <div className="space-y-2">
                    {[
                      { title: 'Aerosols & Perfumes', subtext: 'Body sprays, deodorants, or inflammable liquids' },
                      { title: 'Cash & Jewellery', subtext: 'Currency notes, solid raw gold, silver bullion' },
                      { title: 'Perishables', subtext: 'Open/homemade liquid curries, raw dairy products' },
                      { title: 'Hazardous Materials', subtext: 'Ammunition, loose lithium batteries, explosive' }
                    ].map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm flex items-center justify-between gap-3 hover:border-red-100 transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedProhibitedIndex(idx);
                          setShowProhibitedModal(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-extrabold font-mono">X</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-[#0A142F]">{item.title}</p>
                            <p className="text-[8px] text-slate-400 font-bold leading-tight mt-0.5">{item.subtext}</p>
                          </div>
                        </div>
                        <span className="text-slate-300 font-bold text-xs select-none mr-1">&gt;</span>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedProhibitedIndex(null);
                      setShowProhibitedModal(true);
                    }}
                    className="inline-flex items-center gap-1 text-[9px] font-black text-red-600 hover:underline tracking-wider uppercase pt-1 cursor-pointer bg-transparent border-none outline-none"
                  >
                    View all prohibited items &gt;
                  </button>
                </div>
              </div>

              {/* Shop Indian Products Co-Shipping Section */}
              <div className="bg-[#f0f9ff] border border-sky-100 p-4 rounded-2xl text-left space-y-3 shadow-sm relative overflow-hidden mt-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      CO-SHIPPING ACTIVE
                    </span>
                    <span className="text-[8px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      ZERO BASE FEES
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      navigateTo('store');
                      window.scrollTo(0, 0);
                    }}
                    className="inline-flex items-center gap-1 text-[8px] font-black text-white bg-emerald-600 px-2 py-1 rounded-lg uppercase hover:bg-emerald-700 transition cursor-pointer"
                  >
                    <ShoppingBag size={10} />
                    <span>See All</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-xs font-black text-[#091535]">Shop Indian Products</h3>
                  <p className="text-[10px] text-slate-500 font-semibold leading-normal mt-0.5">
                    Delivered inside your same drop-off box with no extra courier base fees.
                  </p>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x -mx-1 px-1">
                  {[
                    {
                      id: 'p1_dropoff',
                      tag: 'POOJA',
                      title: 'Ganesh Idol (Eco-friendly)',
                      price: '$15.00',
                      weight: '0.4 kg',
                      bgColor: 'from-amber-100 to-orange-100',
                      emoji: '🪔'
                    },
                    {
                      id: 'p2_dropoff',
                      tag: 'POOJA',
                      title: 'Brass Diya Set',
                      price: '$25.00',
                      weight: '0.5 kg',
                      bgColor: 'from-yellow-100 to-amber-200',
                      emoji: '🕯️'
                    },
                    {
                      id: 'p3_dropoff',
                      tag: 'POOJA',
                      title: 'Sandalwood Incense Sticks',
                      price: '$10.00',
                      weight: '0.2 kg',
                      bgColor: 'from-orange-100 to-amber-100',
                      emoji: '🪵'
                    },
                    {
                      id: 'p4_dropoff',
                      tag: 'DECOR',
                      title: 'Decor Elephant',
                      price: '$35.00',
                      weight: '0.8 kg',
                      bgColor: 'from-blue-100 to-slate-100',
                      emoji: '🐘'
                    }
                  ].map((product) => (
                    <div 
                      key={product.id} 
                      className="flex-shrink-0 w-[130px] bg-white border border-slate-100 p-2 rounded-xl shadow-sm snap-start flex flex-col justify-between"
                    >
                      <div>
                        <div className={`w-full h-20 rounded-lg bg-gradient-to-br ${product.bgColor} flex items-center justify-center relative mb-1.5`}>
                          <span className="text-3xl select-none">{product.emoji}</span>
                          <span className="absolute top-1 left-1 text-[7px] font-extrabold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded">
                            {product.tag}
                          </span>
                        </div>
                        <h4 className="text-[10px] font-black text-slate-800 truncate leading-tight">{product.title}</h4>
                        <p className="text-[8px] text-slate-400 font-bold mt-0.5">{product.weight}</p>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                        <div>
                          <p className="text-[10px] font-black text-slate-900 leading-none">{product.price}</p>
                          <p className="text-[7px] text-slate-400 font-medium mt-0.5 italic">Consolidated</p>
                        </div>
                        <button 
                          onClick={() => {
                            addItem({
                              name: product.title,
                              weight: parseFloat(product.weight),
                              price: parseFloat(product.price.replace('$', '')),
                              quantity: 1,
                              image: '',
                              purchaseSource: 'Store',
                              trackingId: '',
                              invoiceNumber: '',
                              fragile: false,
                              remarks: 'Co-shipped with drop-off package'
                            }, 'Store');
                            toast.success(`"${product.title}" consolidated in your shipment box!`);
                          }}
                          className="px-1.5 py-0.5 text-[8px] font-black text-emerald-600 border border-emerald-500/30 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition shrink-0 cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button 
                onClick={() => {
                  setActiveStep(2);
                  window.scrollTo(0, 0);
                }}
                className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button 
                onClick={handleFinalizePreAlert}
                disabled={displayItems.length === 0}
                className={`flex-[2] py-3.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                  displayItems.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send size={14} /> Finalize Shipment
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Documentation Requirements Modal */}
      {showRequirementsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-teal-50/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950">Documents Required</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Official Shipping Requirements</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowRequirementsModal(false);
                  setSelectedDocIndex(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-left">
              {selectedDocIndex !== null ? (
                // Focused Doc view
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/30">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      {requirementsData[selectedDocIndex].icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-950">{requirementsData[selectedDocIndex].title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{requirementsData[selectedDocIndex].subtext}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-emerald-950 tracking-wider uppercase">Fulfillment Guidelines</h5>
                    <ul className="space-y-2.5">
                      {requirementsData[selectedDocIndex].guidelines.map((guide, gIdx) => (
                        <li key={gIdx} className="flex gap-2 text-[10px] text-slate-500 font-medium leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                          <span>{guide}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => setSelectedDocIndex(null)}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black transition-all cursor-pointer border border-slate-100"
                  >
                    {"←"} View All Requirements
                  </button>
                </div>
              ) : (
                // Complete list view
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Please prepare and submit these documentation details. This guarantees smooth clearing at international customs.
                  </p>
                  
                  <div className="space-y-3">
                    {requirementsData.map((doc, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedDocIndex(idx)}
                        className="p-4 bg-slate-50/50 hover:bg-emerald-50/20 border border-slate-100 hover:border-emerald-100 rounded-2xl transition cursor-pointer flex gap-3"
                      >
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          {doc.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-950">{doc.title}</h4>
                            <span className="text-emerald-500 text-[10px] font-black uppercase tracking-wider">Details {"→"}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold mt-1 leading-normal">{doc.subtext}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
              <button 
                onClick={() => {
                  setShowRequirementsModal(false);
                  setSelectedDocIndex(null);
                }}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition cursor-pointer text-center"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prohibited Items Modal */}
      {showProhibitedModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-50/50 to-orange-50/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-red-950">Prohibited Items</h3>
                  <p className="text-[10px] text-red-500 font-bold">Strict Safety Regulations</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowProhibitedModal(false);
                  setSelectedProhibitedIndex(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-left">
              {selectedProhibitedIndex !== null ? (
                // Focused item view
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-red-50/50 rounded-2xl border border-red-100/30">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                      {prohibitedData[selectedProhibitedIndex].icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-red-950">{prohibitedData[selectedProhibitedIndex].title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{prohibitedData[selectedProhibitedIndex].subtext}</p>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h5 className="text-[10px] font-black text-red-800 tracking-wider uppercase">Reason For Restriction</h5>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      {prohibitedData[selectedProhibitedIndex].reason}
                    </p>
                  </div>

                  <button 
                    onClick={() => setSelectedProhibitedIndex(null)}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black transition-all cursor-pointer border border-slate-100"
                  >
                    {"←"} View All Prohibited Items
                  </button>
                </div>
              ) : (
                // Complete list view
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Under aviation laws and security guidelines, the following categories cannot be shipped. Please check your package carefully to ensure none of these are included.
                  </p>
                  
                  <div className="space-y-3">
                    {prohibitedData.map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedProhibitedIndex(idx)}
                        className="p-4 bg-slate-50/50 hover:bg-red-50/20 border border-slate-100 hover:border-red-100 rounded-2xl transition cursor-pointer flex gap-3"
                      >
                        <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-950">{item.title}</h4>
                            <span className="text-red-600 text-[10px] font-black uppercase tracking-wider">Why? {"→"}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold mt-1 leading-normal">{item.subtext}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
              <button 
                onClick={() => {
                  setShowProhibitedModal(false);
                  setSelectedProhibitedIndex(null);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer text-center"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
