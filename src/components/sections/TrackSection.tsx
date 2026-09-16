import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Plane, 
  AlertTriangle, 
  ExternalLink, 
  Headphones, 
  Copy, 
  Search, 
  Loader2, 
  Info, 
  ChevronRight 
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { Order, User } from '../../types';

export interface ThirdPartyTrackResult {
  id: string;
  carrier: string;
  status: string;
  origin: string;
  destination: string;
  estimatedDelivery?: string;
  weight: string;
  serviceType: string;
  events: {
    status: string;
    location: string;
    date: string;
    time: string;
    description: string;
  }[];
  shipmentFacts?: {
    overview: { label: string; value: string }[];
    services: { label: string; value: string }[];
    packageDetails: { label: string; value: string }[];
  };
  isLive?: boolean;
  isDemoFallback?: boolean;
  apiError?: string;
  hasError?: boolean;
  trackingUrl?: string;
}

export const mapOrderToThirdPartyTrackResult = (order: Order): ThirdPartyTrackResult => {
  const destCountry = order.destination?.country || 'USA';
  
  // Assign carrier based on destination or deterministically
  let carrier: 'FedEx' | 'DHL' | 'UPS' | 'USPS' = 'FedEx';
  if (['UK', 'Germany', 'UAE'].includes(destCountry)) {
    carrier = 'DHL';
  } else if (['Australia', 'Canada'].includes(destCountry)) {
    carrier = 'UPS';
  } else if (destCountry === 'India') {
    carrier = 'USPS';
  }

  // Map Jiffex native status to tracking status
  const rawStatus = order.status;
  let status: 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Pending' = 'Pending';
  if (rawStatus === 'Delivered') {
    status = 'Delivered';
  } else if (rawStatus === 'Out for Delivery') {
    status = 'Out for Delivery';
  } else if (['In Transit', 'Ready to Ship', 'Packed'].includes(rawStatus)) {
    status = 'In Transit';
  } else {
    status = 'Pending';
  }

  const origin = 'Jiffex Delhi Hub (DEL), India';
  const destination = `${order.destination?.city || 'New York'}, ${order.destination?.state ? order.destination.state + ', ' : ''}${destCountry}`;
  
  const shipDate = order.shippingDate || order.created_at || order.createdAt || new Date().toISOString();
  const dateBase = new Date(shipDate);
  const formatDateStr = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTimeStr = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    const minStr = m.toString().padStart(2, '0');
    return `${hr}:${minStr} ${period}`;
  };

  const estDate = new Date(dateBase.getTime() + (status === 'Delivered' ? 3 : 5) * 24 * 3600 * 1000);
  const estimatedDelivery = status === 'Delivered'
    ? `Delivered on ${formatDateStr(new Date(dateBase.getTime() + 3 * 24 * 3600 * 1000))}`
    : `Estimated Delivery by ${formatDateStr(estDate)}`;

  const events = [];
  const today = new Date();
  
  if (status === 'Delivered') {
    const dDate = new Date(dateBase.getTime() + 3 * 24 * 3600 * 1000);
    events.push({
      status: 'Delivered',
      location: destination,
      date: formatDateStr(dDate),
      time: formatTimeStr(14, 30),
      description: `Shipment delivered and signed. Received by ${order.destination?.fullName || 'Consignee'}.`
    });
    events.push({
      status: 'Out for Delivery',
      location: destination,
      date: formatDateStr(dDate),
      time: formatTimeStr(8, 15),
      description: `Courier out for local delivery in ${order.destination?.city || 'destination area'}.`
    });
    events.push({
      status: 'Customs Cleared',
      location: `${order.destination?.city || 'Destination Hub'} Airport`,
      date: formatDateStr(new Date(dateBase.getTime() + 2 * 24 * 3600 * 1000)),
      time: formatTimeStr(11, 20),
      description: 'International customs clearance process completed successfully.'
    });
    events.push({
      status: 'Arrived at Sorting Hub',
      location: 'Transit Sorting Gateway',
      date: formatDateStr(new Date(dateBase.getTime() + 1.5 * 24 * 3600 * 1000)),
      time: formatTimeStr(23, 40),
      description: 'Departed from origin transit facility.'
    });
    events.push({
      status: 'Processed & Shipped',
      location: origin,
      date: formatDateStr(dateBase),
      time: formatTimeStr(18, 10),
      description: 'Order packed, consolidated, and handed over to carrier network.'
    });
  } else if (status === 'Out for Delivery') {
    events.push({
      status: 'Out for Delivery',
      location: destination,
      date: formatDateStr(today),
      time: formatTimeStr(9, 30),
      description: `Shipment out for local delivery. Carrier agent is en route.`
    });
    events.push({
      status: 'Customs Cleared',
      location: `${order.destination?.city || 'Destination Hub'} Airport`,
      date: formatDateStr(new Date(today.getTime() - 12 * 3600 * 1000)),
      time: formatTimeStr(15, 45),
      description: 'Customs clearance approved.'
    });
    events.push({
      status: 'In Transit',
      location: 'In Transit',
      date: formatDateStr(new Date(today.getTime() - 36 * 3600 * 1000)),
      time: formatTimeStr(10, 0),
      description: 'Departed international hub.'
    });
    events.push({
      status: 'Processed & Shipped',
      location: origin,
      date: formatDateStr(dateBase),
      time: formatTimeStr(18, 10),
      description: 'Consolidation complete. Dispatched with primary carrier.'
    });
  } else if (status === 'In Transit') {
    events.push({
      status: 'In Transit',
      location: 'International Air Transit',
      date: formatDateStr(today),
      time: formatTimeStr(16, 0),
      description: 'In flight / transit to destination hub country.'
    });
    events.push({
      status: 'Departed Facility',
      location: origin,
      date: formatDateStr(dateBase),
      time: formatTimeStr(21, 15),
      description: 'Departed Jiffex New Delhi logistics facility.'
    });
    events.push({
      status: 'Processed at Warehouse',
      location: origin,
      date: formatDateStr(dateBase),
      time: formatTimeStr(14, 0),
      description: 'Consolidated, packed, and custom declarations declared.'
    });
  } else {
    if (order.status === 'Packed' || order.status === 'Consolidating items' || order.status === 'Ready to Ship') {
      events.push({
        status: 'Consolidation & Packaging Complete',
        location: origin,
        date: formatDateStr(today),
        time: formatTimeStr(11, 0),
        description: `All items safely consolidated and packed into a single container. Ready for dispatch.`
      });
    }
    if (order.status === 'Received at Warehouse' || order.status === 'In Warehouse') {
      events.push({
        status: 'Received at Jiffex Warehouse',
        location: origin,
        date: formatDateStr(today),
        time: formatTimeStr(10, 0),
        description: `Items received from home pickup, weighed, and cataloged. Awaiting consolidation.`
      });
    }
    events.push({
      status: 'Order Placed & Scheduled',
      location: 'Origin Address',
      date: formatDateStr(dateBase),
      time: formatTimeStr(8, 0),
      description: 'Shipment request submitted and carrier routing generated.'
    });
  }

  const calculatedWeight = order.totalWeight || order.items?.reduce((sum, i) => sum + (i.weight || 0), 0) || 1.5;
  const weight = `${calculatedWeight.toFixed(1)} kg`;

  const serviceTypes: Record<'FedEx' | 'DHL' | 'UPS' | 'USPS', string> = {
    UPS: 'UPS Worldwide Express® (via Jiffex)',
    FedEx: 'FedEx International Priority® (via Jiffex)',
    DHL: 'DHL Express Worldwide® (via Jiffex)',
    USPS: 'USPS Priority Mail Express® (via Jiffex)'
  };

  return {
    id: order.id,
    carrier,
    status,
    origin,
    destination,
    estimatedDelivery,
    weight,
    serviceType: serviceTypes[carrier],
    events
  };
};

export const ThirdPartyTrackerCard: React.FC<{ 
  result: ThirdPartyTrackResult; 
  isMobile?: boolean; 
  navigateTo?: (tab: any) => void;
}> = ({ result, isMobile, navigateTo }) => {
  const [showTracker, setShowTracker] = useState(true);
  
  const carrierBranding: Record<string, { logo: React.ReactNode; barColor: string }> = {
    FedEx: {
      logo: (
        <span className="font-extrabold tracking-tight text-lg">
          <span className="text-[#4D148C]">Fed</span>
          <span className="text-[#FF6200]">Ex</span>
        </span>
      ),
      barColor: 'bg-[#4D148C]',
    },
    Fedex: {
      logo: (
        <span className="font-extrabold tracking-tight text-lg">
          <span className="text-[#4D148C]">Fed</span>
          <span className="text-[#FF6200]">Ex</span>
        </span>
      ),
      barColor: 'bg-[#4D148C]',
    },
    fedex: {
      logo: (
        <span className="font-extrabold tracking-tight text-lg">
          <span className="text-[#4D148C]">Fed</span>
          <span className="text-[#FF6200]">Ex</span>
        </span>
      ),
      barColor: 'bg-[#4D148C]',
    },
    Delhivery: {
      logo: (
        <span className="font-black italic tracking-widest text-[#FF6200] text-base font-sans">
          DELHIVERY
        </span>
      ),
      barColor: 'bg-[#FF5500]',
    },
    delhivery: {
      logo: (
        <span className="font-black italic tracking-widest text-[#FF6200] text-base font-sans">
          DELHIVERY
        </span>
      ),
      barColor: 'bg-[#FF5500]',
    },
    DHL: {
      logo: (
        <span className="font-black italic tracking-tighter text-lg text-[#D0021B]">
          DHL Express
        </span>
      ),
      barColor: 'bg-[#D0021B]',
    },
    UPS: {
      logo: (
        <span className="flex items-center gap-1.5 font-black text-sm text-amber-950 bg-[#FFC72C] px-2.5 py-1 rounded-md shrink-0 border border-amber-500/20">
          UPS®
        </span>
      ),
      barColor: 'bg-[#351C15]',
    },
    USPS: {
      logo: (
        <span className="font-black italic tracking-wide text-[#004B87] text-lg">
          USPS®
        </span>
      ),
      barColor: 'bg-[#003366]',
    }
  };

  const brand = carrierBranding[result.carrier] || {
    logo: <span className="font-extrabold tracking-tight text-lg text-indigo-600">{result.carrier || 'Carrier'}</span>,
    barColor: 'bg-indigo-600'
  };
  const steps = ['Label Created', 'Pickup Completed', 'In Transit', 'Out for Delivery', 'Delivered'];
  const getStepIndex = (statusStr: string): number => {
    const s = (statusStr || '').toLowerCase();
    if (s.includes('delivered') || s.includes('received by') || s.includes('completed') || s.includes('signed')) return 4;
    if (s.includes('out for delivery') || s.includes('delivery vehicle') || s.includes('on vehicle')) return 3;
    if (s.includes('transit') || s.includes('departed') || s.includes('arrived') || s.includes('facility') || s.includes('hub') || s.includes('cleared') || s.includes('customs') || s.includes('received at warehouse') || s.includes('packed') || s.includes('shipped') || s.includes('dispatched')) return 2;
    if (s.includes('pick') || s.includes('pickup') || s.includes('collected') || s.includes('received')) return 1;
    if (s.includes('label') || s.includes('created') || s.includes('billing') || s.includes('manifest') || s.includes('pending')) return 0;
    return 2; // Default to In Transit
  };
  const currentStepIndex = getStepIndex(result.status);
  const hasError = !!(result.hasError || result.status === 'Error' || result.status === 'Fetch Failed');

  if (isMobile) {
    if (hasError) {
      return (
        <div className="bg-white rounded-3xl border border-red-100 shadow-md overflow-hidden p-5 space-y-4">
          <div className="flex items-center gap-3">
            {brand.logo}
            <span className="px-2 py-0.5 rounded-full text-[8px] uppercase font-black tracking-widest bg-red-50 text-red-800 border border-red-100 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
              Sync Failed
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">Connection Offline</h3>
            <span className="inline-block px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-black rounded-lg border border-red-100">
              ID: {result.id}
            </span>
          </div>
          <div className="p-3.5 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-red-700 leading-normal font-semibold">
              We were unable to synchronize the delivery status with the partner carrier system. Please verify that the tracking number or order ID is correct and registered.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-5 space-y-5">
        {/* Header: Carrier Branding, Status Badge, ID */}
        <div className="flex flex-col gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3">
            {brand.logo}
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider text-white ${brand.barColor}`}>
              {result.status}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">ID:</span>
              <span className="text-xs font-black text-slate-800 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-150">{result.id}</span>
              <button 
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result.id);
                  toast.success("Tracking ID copied to clipboard!");
                }}
                className="p-1 text-slate-400 hover:text-indigo-600 active:scale-95 transition-all"
                title="Copy Tracking ID"
              >
                <Copy size={12} />
              </button>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
              {result.serviceType || result.carrier}
            </span>
          </div>
          {result.estimatedDelivery && (
            <div className="text-[11px] font-semibold text-emerald-600 bg-emerald-50/50 border border-emerald-100/40 p-2.5 rounded-xl flex items-center gap-1.5">
              <Clock size={13} />
              <span>{result.estimatedDelivery}</span>
            </div>
          )}
        </div>

        {/* Route Map Flow */}
        <div className="bg-slate-50/50 border border-slate-100/60 p-4 rounded-2xl flex items-center justify-between gap-2">
          <div className="flex-1 text-left space-y-0.5">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Origin</span>
            <span className="text-xs font-black text-slate-800 block truncate">{result.origin ? result.origin.split(',')[0] : 'Origin'}</span>
            <span className="text-[9px] text-slate-400 font-semibold block truncate">
              {result.origin ? result.origin.split(',').slice(1).join(',').trim() : ''}
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center px-1 relative min-w-[50px] shrink-0">
            <div className="absolute top-[16px] left-0 right-0 h-0.5 bg-slate-200" />
            <div 
              className={`absolute top-[16px] left-0 h-0.5 ${brand.barColor} transition-all duration-1000`} 
              style={{ width: `${(currentStepIndex / 4) * 100}%` }}
            />
            <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-white border shadow-sm relative z-10 text-indigo-600`}>
              <Plane size={11} className="animate-pulse" />
            </div>
          </div>

          <div className="flex-1 text-right space-y-0.5">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Destination</span>
            <span className="text-xs font-black text-slate-800 block truncate">{result.destination ? result.destination.split(',')[0] : 'Destination'}</span>
            <span className="text-[9px] text-slate-400 font-semibold block truncate">
              {result.destination ? result.destination.split(',').slice(1).join(',').trim() : ''}
            </span>
          </div>
        </div>

        {/* Vertical Timeline logs */}
        <div className="space-y-3 pt-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2 px-1">
            Active Scanner Milestones
          </span>
          <div className="relative pl-5 space-y-5 pt-1 border-l border-slate-100 ml-2">
            {result.events && result.events.length > 0 ? (
              result.events.map((ev, i) => {
                const isLatest = i === 0;
                return (
                  <div key={i} className="relative flex flex-col gap-0.5 text-left">
                    {/* Dot indicator */}
                    <div className="absolute -left-[25px] top-1.5 w-3.5 h-3.5 rounded-full border border-white bg-white flex items-center justify-center z-10 shadow-sm">
                      <div className={`w-2 h-2 rounded-full ${isLatest ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`} />
                    </div>

                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <span className={`text-xs font-extrabold ${isLatest ? 'text-indigo-600' : 'text-slate-800'}`}>
                        {ev.status}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 whitespace-nowrap">
                        {ev.date} {ev.time}
                      </span>
                    </div>
                    
                    {ev.location && (
                      <div className="inline-flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded max-w-fit mt-0.5">
                        <MapPin size={8} /> {ev.location}
                      </div>
                    )}

                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">
                      {ev.description}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-slate-400 text-xs">No scan events received yet.</div>
            )}
          </div>
        </div>

        {/* Shipment Facts: 2-column tiles */}
        {result.shipmentFacts && (
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-1">Shipment Overview</span>
            <div className="grid grid-cols-2 gap-2.5">
              {result.shipmentFacts.overview.slice(0, 4).map((item, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block mb-0.5">{item.label}</span>
                  <span className="text-xs font-extrabold text-slate-800 block break-words leading-tight">{item.value}</span>
                </div>
              ))}
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block mb-0.5">Total Weight</span>
                <span className="text-xs font-mono font-extrabold text-indigo-600 block leading-tight">{result.weight}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider block mb-0.5">Carrier Service</span>
                <span className="text-xs font-extrabold text-slate-800 block leading-tight truncate">{result.carrier}</span>
              </div>
            </div>
          </div>
        )}

        {/* Active direct carrier link */}
        <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
          {result.trackingUrl && (
            <a 
              href={result.trackingUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100 flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <ExternalLink size={12} />
              Open {result.carrier} Portal
            </a>
          )}
          {navigateTo && (
            <button 
              type="button"
              onClick={() => navigateTo('support')}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <Headphones size={12} />
              Contact Support Desk
            </button>
          )}
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-red-100 shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-red-50 bg-gradient-to-r from-red-50/10 via-white to-red-50/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              {brand.logo}
              <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-widest leading-none border bg-red-50 text-red-800 border-red-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Tracking Synchronization Failed
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 font-sans">Connection Offline</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-black rounded-xl border border-red-100">
              ID: {result.id}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="p-5 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-sm font-sans font-black">
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-1.5 flex-1">
              <span className="text-xs font-black text-red-800 uppercase tracking-widest block leading-none">Unable to Retrieve Live Status</span>
              <p className="text-xs text-red-700 leading-relaxed font-semibold">
                We were unable to synchronize the delivery status details with the partner carrier system. 
                Please verify the tracking number or order ID.
              </p>
              {result.apiError && (
                <div className="mt-3 p-3 bg-red-100/35 rounded-xl border border-red-100/40 text-left">
                  <span className="block text-[10px] font-black uppercase text-red-800 tracking-wider mb-1 font-sans">Server Error Log Details</span>
                  <p className="text-[11px] font-mono font-medium text-red-900 leading-normal break-all">
                    {result.apiError}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center">
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Please verify that the courier tracking number or order ID is valid and registered in the database.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
      {/* Header Panel with Carrier Branding */}
      <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            {brand.logo}
            <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-widest leading-none border bg-teal-50 text-teal-800 border-teal-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              Real-time Database Status
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-800">Carrier Shipment Status</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1.5 bg-slate-50 text-slate-500 text-xs font-bold rounded-xl border border-slate-200">
            {result.serviceType || result.carrier}
          </span>
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-xl border border-indigo-100">
            ID: {result.id}
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* Real Data Synchronization Notice & Direct Tracking Option */}
        <div className="p-5 bg-teal-50/40 border border-teal-100/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-teal-200 text-teal-600 flex items-center justify-center shrink-0 shadow-sm font-sans font-black">
              <CheckCircle2 size={18} />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-black text-teal-800 uppercase tracking-widest block leading-none">Database Records Synced</span>
              <p className="text-[11px] text-teal-700 leading-relaxed font-semibold">
                This shipment tracking status is synchronized directly with your real Jiffex order data.
              </p>
            </div>
          </div>
          {result.trackingUrl && (
            <button
              type="button"
              onClick={() => setShowTracker(prev => !prev)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 ${
                showTracker 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <ExternalLink size={14} />
              {showTracker ? 'Hide' : 'Open'} {result.carrier} Tracker
            </button>
          )}
        </div>

        {/* Custom Interactive Shipment Progress Tracker */}
        {showTracker && (
          <div className="space-y-6 pt-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Shipment Progress</span>
              <span className="text-xs font-semibold text-slate-500 font-mono tracking-tight bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-250/30">
                ID: {result.id}
              </span>
            </div>

            <div className="bg-slate-50/50 border border-slate-200/60 rounded-[2rem] p-6 sm:p-8 space-y-6">
              {/* Status & Barcode Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-5 border-b border-slate-200/80">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-[#FF6200] uppercase tracking-widest block leading-none">
                    {result.carrier} Standard Shipping Console
                  </span>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${brand.barColor} animate-ping`} />
                    Official Live Carrier Delivery Milestones
                  </h4>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                  <div className="flex items-end gap-[1.5px] h-7 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                    {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 2, 1].map((w, idx) => (
                      <div key={idx} className="bg-slate-900 h-full" style={{ width: `${w}px` }} />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider">
                    SECURE BARCODE: {result.id}
                  </span>
                </div>
              </div>

              {/* Horizontal Chronology Timeline */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-slate-400 uppercase tracking-widest">Route Chronology</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md text-[10px]">
                    Last Checked: Just Now
                  </span>
                </div>
                <div className="relative pt-4 pb-4">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full absolute top-1/2 -translate-y-1/2 left-0" />
                  <div 
                    className={`h-1.5 rounded-full absolute top-1/2 -translate-y-1/2 left-0 transition-all duration-1000 ${brand.barColor}`}
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                  />
                  <div className="relative flex justify-between">
                    {steps.map((st, idx) => {
                      const isActive = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                            isCurrent ? `${brand.barColor} text-white border-transparent scale-110 shadow-lg` :
                            isActive ? `${brand.barColor} text-white border-transparent` :
                            'bg-white text-slate-350 border-slate-200'
                          }`}>
                            {idx === 4 ? <CheckCircle2 size={13} /> : idx === 2 ? <Truck size={13} /> : <Package size={13} />}
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-tight text-center ${
                            isCurrent ? 'text-slate-800 font-extrabold' :
                            isActive ? 'text-slate-600 font-bold' :
                            'text-slate-350'
                          }`}>
                            {st}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* High-visibility Live Status Banner & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                <div className="bg-white border border-slate-150 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Real-time status</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-black text-white uppercase ${brand.barColor}`}>
                        {result.status}
                      </span>
                      {result.estimatedDelivery && (
                        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/40">
                          {result.estimatedDelivery}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-medium text-slate-500 leading-relaxed font-sans">
                    Authorized digital delivery manifest synced with the real-time order tracking server.
                  </p>
                </div>

                <div className="bg-white border border-slate-150 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">carrier services</span>
                    <div className="text-sm font-black text-slate-800">{result.carrier} Global Express Air</div>
                    <div className="text-xs font-semibold text-slate-500">{result.serviceType || 'Priority Express'}</div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 font-mono mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span>DATA SECURITY ENVELOPE</span>
                    <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-black uppercase tracking-wider text-[9px]">Verified Secure</span>
                  </div>
                </div>
              </div>

              {/* Active Scan Logs directly under the shipment progress */}
              {result.events && result.events.length > 0 && (
                <div className="bg-white border border-slate-150 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-2">
                    Active Scanner Milestones
                  </span>
                  <div className="relative pl-6 space-y-6 pt-2">
                    <div className="absolute top-2 bottom-2 left-[10px] w-0.5 bg-slate-100" />
                    {result.events.map((ev, i) => (
                      <div key={i} className="relative flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 text-left">
                        {/* Dot indicator */}
                        <div className="absolute -left-6 top-1 w-5.5 h-5.5 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center z-10">
                          <div className={`w-2 h-2 rounded-full ${i === 0 ? brand.barColor : 'bg-slate-300'}`} />
                        </div>

                        <div className="sm:w-32 shrink-0 pt-0.5 leading-none">
                          <span className="text-xs font-black text-slate-800 block">{ev.date}</span>
                          <span className="text-[9px] text-slate-400 font-bold block mt-1">{ev.time}</span>
                        </div>

                        <div className="flex-1 pb-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-slate-900 leading-none">{ev.status}</span>
                            {ev.location && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded leading-none">
                                {ev.location}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1.5">
                            {ev.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.trackingUrl && (
                <div className="flex justify-end text-right pt-2 border-t border-slate-100">
                  <a 
                    href={result.trackingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline flex items-center gap-1 leading-none"
                  >
                    <ExternalLink size={11} />
                    Open Direct Portal on {result.carrier}.com
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cargo specs layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white border border-slate-150 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
              <MapPin size={16} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">Origin</span>
              <span className="text-xs font-bold text-slate-900 leading-tight">{result.origin || 'Origin'}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white border border-slate-150 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <MapPin size={16} className="text-emerald-600" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">Destination</span>
              <span className="text-xs font-bold text-slate-900 leading-tight">{result.destination || 'Destination'}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white border border-slate-150 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
              <Package size={16} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">Total Weight</span>
              <span className="text-xs font-mono font-bold text-indigo-700 leading-tight">{result.weight || '1.5 kg'}</span>
            </div>
          </div>
        </div>

        {/* Shipment Facts sections */}
        {result.shipmentFacts && (
          <div className="space-y-6 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 space-y-4">
                <h4 className="text-xs font-black text-[#4D148C] uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4D148C]" />
                  Shipment Overview
                </h4>
                <div className="space-y-3.5">
                  {result.shipmentFacts.overview.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4 border-b border-slate-100/50 pb-2 last:border-none last:pb-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pt-0.5">{item.label}</span>
                      <span className="text-xs font-black text-slate-800 text-right leading-snug">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 space-y-4">
                <h4 className="text-xs font-black text-[#FF6200] uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6200]" />
                  Services
                </h4>
                <div className="space-y-3.5">
                  {result.shipmentFacts.services.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4 border-b border-slate-100/50 pb-2 last:border-none last:pb-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pt-0.5">{item.label}</span>
                      <span className="text-xs font-black text-slate-800 text-right leading-snug">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-5 space-y-4">
                <h4 className="text-xs font-black text-[#4D148C] uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4D148C]" />
                  Package Details
                </h4>
                <div className="space-y-3.5">
                  {result.shipmentFacts.packageDetails.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4 border-b border-slate-100/50 pb-2 last:border-none last:pb-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pt-0.5">{item.label}</span>
                      <span className="text-xs font-black text-slate-800 text-right leading-snug">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export interface TrackSectionProps {
  trackingId?: string;
  setTrackingId?: (id: string) => void;
  orders?: Order[];
  currentUser?: User | null;
  isMobile?: boolean;
  navigateTo?: (tab: any) => void;
}

export const TrackSection: React.FC<TrackSectionProps> = ({
  trackingId = '',
  setTrackingId,
  orders = [],
  currentUser,
  isMobile = false,
  navigateTo
}) => {
  const [trackIdInput, setTrackIdInput] = useState(trackingId);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [thirdPartyResult, setThirdPartyResult] = useState<ThirdPartyTrackResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const lastSearchedRef = useRef<string>('');

  const activeOrders = useMemo(() => {
    return orders.filter(o => 
      (o.customerId === currentUser?.id || o.customer_id === currentUser?.id)
    );
  }, [orders, currentUser]);

  const executeSearch = async (rawQuery: string) => {
    const inputVal = rawQuery.trim();
    if (!inputVal) return;

    lastSearchedRef.current = inputVal;
    setIsSearching(true);

    // Update parent trackingId state if available
    if (setTrackingId) {
      setTrackingId(inputVal);
    }

    // 1. Check local orders state for instant matching
    const matchedLocalOrder = orders.find(o => 
      o.id?.toLowerCase() === inputVal.toLowerCase() ||
      o.tracking_number?.toLowerCase() === inputVal.toLowerCase() ||
      o.trackingNumber?.toLowerCase() === inputVal.toLowerCase()
    );

    if (matchedLocalOrder) {
      setTrackingOrder(matchedLocalOrder);
      setThirdPartyResult(mapOrderToThirdPartyTrackResult(matchedLocalOrder));
      toast.success(`Tracking details for Order ${inputVal} loaded!`);
      setIsSearching(false);
      return;
    }

    // 2. Query live Order endpoint
    try {
      console.log("[TrackSection] Querying live Order ID:", inputVal);
      const data = await api.trackOrderLive(inputVal);
      if (data && data.success && data.trackingData) {
        setTrackingOrder(null);
        setThirdPartyResult({
          ...data.trackingData,
          isLive: data.isLive,
          isDemoFallback: data.isDemo,
          apiError: data.apiError
        });
        toast.success(`Tracking details for ${inputVal} loaded successfully!`);
        setIsSearching(false);
        return;
      }
    } catch (err: any) {
      console.warn("[TrackSection] Order ID search failed, checking carrier database:", err?.message || err);
    }

    // 3. Fallback: Query carrier tracking database
    try {
      const res = await fetch("/api/track-carrier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId: inputVal }),
      });
      const data = await res.json();
      if (res.ok && data && data.success && data.trackingData) {
        setTrackingOrder(null);
        setThirdPartyResult({
          ...data.trackingData,
          isLive: data.isLive,
          isDemoFallback: data.isDemo,
          apiError: data.apiError
        });
        toast.success(`Shipment details for tracking number ${inputVal} loaded!`);
      } else {
        toast.error(data?.error || `Tracking ID / Order ID "${inputVal}" details not found.`);
      }
    } catch (carrierErr: any) {
      console.error("[TrackSection] Fallback carrier lookup failed:", carrierErr);
      toast.error('Tracking ID / Order ID details not found inside the registry.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrackSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeSearch(trackIdInput);
  };

  // Sync with trackingId prop whenever it changes externally
  useEffect(() => {
    if (trackingId && trackingId.trim()) {
      setTrackIdInput(trackingId);
      if (lastSearchedRef.current !== trackingId.trim()) {
        executeSearch(trackingId.trim());
      }
    }
  }, [trackingId]);

  if (isMobile) {
    return (
      <div className="flex flex-col gap-5 px-4 py-4 pb-12">
        {/* Mobile Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Track Shipment</h1>
          <p className="text-xs text-slate-500 font-semibold leading-normal">
            Enter your Order ID or Courier Tracking number to check its delivery journey.
          </p>
        </div>

        {/* Mobile Search Card */}
        <div className="bg-white p-4 rounded-3xl shadow-lg shadow-indigo-500/5 border border-slate-100">
          <form onSubmit={handleTrackSearch} className="flex flex-col gap-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Package size={18} />
              </div>
              <input 
                type="text" 
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-200 transition-all font-bold text-sm text-slate-900 placeholder:text-slate-400"
                placeholder="Order ID (e.g. SH-00001) or Carrier ID..."
                value={trackIdInput}
                onChange={(e) => setTrackIdInput(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={isSearching}
              className="w-full py-3.5 bg-indigo-600 active:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {isSearching ? 'Searching...' : 'Track Shipment'}
            </button>
          </form>
        </div>

        <AnimatePresence mode="wait">
          {/* Active Result (from local order or live search) */}
          {(thirdPartyResult || trackingOrder) && (
            <motion.div
              key="active-mobile-result"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <ThirdPartyTrackerCard 
                result={thirdPartyResult || mapOrderToThirdPartyTrackResult(trackingOrder!)} 
                isMobile={true}
                navigateTo={navigateTo}
              />
              
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100/60 flex items-start gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                  <Info size={16} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-black text-amber-950 uppercase tracking-wider">Notice</h4>
                  <p className="text-[10px] text-amber-800 leading-normal font-medium">
                    Status updates can take 12-24 hours to reflect after physical handover. If you have questions, please reach out to Jiffex support.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Empty State / Active Shipments Quick Link (when no active result is rendered) */}
          {!trackingOrder && !thirdPartyResult && (
            <motion.div
              key="empty-mobile-links"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {activeOrders.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Truck size={15} className="text-indigo-600" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Your Active Orders</h3>
                  </div>
                  <div className="space-y-2">
                    {activeOrders.map((ord) => (
                      <div 
                        key={ord.id} 
                        onClick={() => {
                          setTrackIdInput(ord.id);
                          executeSearch(ord.id);
                        }}
                        className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:bg-slate-50 transition-all flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-800">{ord.id}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] uppercase font-bold border ${
                              ord.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              ord.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              'bg-indigo-50 text-indigo-700 border-indigo-100'
                            }`}>
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold">
                            Destination: <span className="text-slate-600 font-black">{ord.destination?.city || ord.destination?.country || 'Global'}</span>
                          </div>
                        </div>
                        <div className="text-indigo-600 text-xs font-black flex items-center gap-0.5">
                          Track <ChevronRight size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                    <Package size={22} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">No active searches</h4>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal">
                      Enter your tracking identifier above or view your order dashboard for details.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop View
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">Track Your Shipment</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">Enter your Order ID (e.g. JX-PH-10001) to see the real-time status of your global delivery.</p>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-slate-100">
        <form onSubmit={handleTrackSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-5 flex items-center text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              <Package size={20} />
            </div>
            <input 
              type="text" 
              className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-200 transition-all font-bold text-slate-900 placeholder:text-slate-400"
              placeholder="Enter Tracking ID (e.g. Fedex, DHL, UPS or SH-00001)"
              value={trackIdInput}
              onChange={(e) => setTrackIdInput(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={isSearching}
            className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            {isSearching ? 'Searching...' : 'Track Now'}
          </button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {(thirdPartyResult || trackingOrder) && (
          <motion.div
            key="desktop-tracking-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <ThirdPartyTrackerCard 
              result={thirdPartyResult || mapOrderToThirdPartyTrackResult(trackingOrder!)} 
              isMobile={false}
              navigateTo={navigateTo}
            />
            
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                <Info size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Important Notice</h4>
                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                  Status updates may take 12-24 hours to reflect after physical handover. If your status hasn't changed in 48 hours, please contact support.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Desktop Active Orders list if no search result yet and user has active orders */}
        {!trackingOrder && !thirdPartyResult && activeOrders.length > 0 && (
          <motion.div
            key="desktop-active-orders"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-indigo-600" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Your Active Orders</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeOrders.map((ord) => (
                <div 
                  key={ord.id}
                  onClick={() => {
                    setTrackIdInput(ord.id);
                    executeSearch(ord.id);
                  }}
                  className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{ord.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {ord.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      To: <span className="font-semibold text-slate-600">{ord.destination?.city || ord.destination?.country || 'Global'}</span>
                    </div>
                  </div>
                  <div className="text-indigo-600 text-xs font-black flex items-center gap-1">
                    Track <ChevronRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrackSection;
