import React from 'react';
import { motion } from 'motion/react';
import { Truck, Calendar, MapPin, User as UserIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
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
  if (!currentUser) return null;
  const assignedApts = appointments.filter(a => a.status === 'Scheduled' && a.assignedAgentId);

  if (activeWorkOrder) {
    return <>{WorkOrderSection}</>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Agent Portal</h2>
          <p className="text-slate-500">Manage and process assigned pickups.</p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold">
          {assignedApts.length} Assigned Tasks
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignedApts.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-100">
            <CheckCircle2 size={64} className="mx-auto mb-4 text-emerald-500 opacity-20" />
            <h3 className="text-xl font-bold text-slate-900">All caught up!</h3>
            <p className="text-slate-500">No pending pickups assigned to you.</p>
          </div>
        ) : (
          assignedApts.map(apt => (
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

              <button 
                onClick={() => setActiveWorkOrder(apt)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                Process Pickup <ArrowRight size={18} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgentSection;
