import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Package, Truck, CheckCircle2, Clock } from 'lucide-react';

const StaticShipmentTracker = () => {
  return (
    <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full translate-x-32 -translate-y-32 opacity-20" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
              <Package size={14} /> Tracking ID: JX-8829
            </div>
            <h3 className="text-3xl font-black tracking-tight">In Transit to Warehouse</h3>
            <p className="text-slate-400 text-sm font-medium">Expected Arrival: Tomorrow, 4:00 PM</p>
          </div>
          
          <div className="flex-1 max-w-xl">
            <div className="relative pt-8">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2" />
              <div className="absolute top-1/2 left-0 w-[60%] h-1 bg-indigo-500 -translate-y-1/2" />
              
              <div className="flex justify-between relative">
                {[
                  { icon: MapPin, label: 'Pickup', active: true },
                  { icon: Truck, label: 'Transit', active: true },
                  { icon: Warehouse, label: 'Warehouse', active: false },
                  { icon: Plane, label: 'Global', active: false },
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-900 z-10 ${step.active ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      <step.icon size={18} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${step.active ? 'text-white' : 'text-slate-500'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { MapPin as Warehouse, Plane } from 'lucide-react';

export default StaticShipmentTracker;
