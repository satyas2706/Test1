import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Truck, Calendar, MapPin, User as UserIcon, ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { User, Appointment } from '../../types';

interface AgentSectionProps {
  currentUser: User | null;
  appointments: Appointment[];
  activeWorkOrder: any;
  setActiveWorkOrder: (apt: any) => void;
  WorkOrderSection: React.ReactNode;
}

const AgentSection = ({
  currentUser,
  appointments,
  activeWorkOrder,
  setActiveWorkOrder,
  WorkOrderSection
}: AgentSectionProps) => {
  const [activeTab, setActiveTab] = useState<'Scheduled' | 'Completed' | 'Canceled'>('Scheduled');

  if (!currentUser) return null;

  const scheduledApts = appointments.filter(a => a.status === 'Scheduled' && a.assignedAgentId);
  const completedApts = appointments.filter(a => a.status === 'Completed' && a.assignedAgentId);
  const canceledApts = appointments.filter(a => a.status === 'Cancelled' && a.assignedAgentId);

  const displayedApts = 
    activeTab === 'Scheduled' ? scheduledApts : 
    activeTab === 'Completed' ? completedApts : 
    canceledApts;

  if (activeWorkOrder) {
    return <>{WorkOrderSection}</>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Agent Portal</h2>
          <p className="text-slate-500">Manage and process assigned pickups.</p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold animate-pulse">
          {scheduledApts.length} Pending Tasks
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-100 gap-6">
        <button
          onClick={() => setActiveTab('Scheduled')}
          className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all px-1 relative ${
            activeTab === 'Scheduled'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock size={16} />
          <span>Scheduled</span>
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
            activeTab === 'Scheduled' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {scheduledApts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('Completed')}
          className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all px-1 relative ${
            activeTab === 'Completed'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>Completed</span>
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
            activeTab === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {completedApts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('Canceled')}
          className={`flex items-center gap-2 pb-4 border-b-2 font-bold transition-all px-1 relative ${
            activeTab === 'Canceled'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <XCircle size={16} />
          <span>Canceled</span>
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
            activeTab === 'Canceled' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {canceledApts.length}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedApts.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-100">
            <CheckCircle2 size={64} className="mx-auto mb-4 text-slate-300 opacity-40" />
            <h3 className="text-xl font-bold text-slate-900">No pickups found</h3>
            <p className="text-slate-500">There are no {activeTab.toLowerCase()} pickups assigned.</p>
          </div>
        ) : (
          displayedApts.map(apt => (
            <motion.div 
              key={apt.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Truck size={24} />
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work Order</div>
                  <div className="text-sm font-black text-slate-900">{apt.id}</div>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="font-bold text-slate-700">{apt.date}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{apt.time}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin size={14} className="text-slate-400 mt-1" />
                  <span className="text-slate-600 leading-tight">{apt.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon size={14} className="text-slate-400" />
                  <span className="font-bold text-indigo-600">{apt.phone}</span>
                </div>
              </div>

              {apt.status === 'Completed' ? (
                <div className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold flex items-center justify-center gap-2 text-md border border-emerald-100">
                  <CheckCircle2 size={16} /> Completed & Processed
                </div>
              ) : apt.status === 'Cancelled' ? (
                <div className="w-full py-3 bg-rose-50 text-rose-700 rounded-xl font-bold flex items-center justify-center gap-2 text-md border border-rose-100">
                  <XCircle size={16} /> Pickup Canceled
                </div>
              ) : (
                <button 
                  onClick={() => setActiveWorkOrder(apt)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  Process Pickup <ArrowRight size={18} />
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgentSection;
