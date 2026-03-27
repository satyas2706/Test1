import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, RefreshCw, MessageSquare, Mail, Phone, CheckCircle2, Truck, Trash2, Check, Eye } from 'lucide-react';

interface NotificationCenterProps {
  notifications: any[];
  loadingNotifications: boolean;
  fetchNotifications: () => void;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
}

const NotificationCenter = ({
  notifications,
  loadingNotifications,
  fetchNotifications,
  markAsRead,
  deleteNotification
}: NotificationCenterProps) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Notification Center</h2>
          <p className="text-slate-500">Track your shipment alerts across SMS, Email, and WhatsApp.</p>
        </div>
        <button 
          onClick={fetchNotifications}
          className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm active:scale-95"
        >
          <RefreshCw size={20} className={loadingNotifications ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { id: 'sms', label: 'SMS Alerts', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
          { id: 'email', label: 'Email Updates', icon: Mail, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { id: 'whatsapp', label: 'WhatsApp', icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50' }
        ].map(channel => (
          <div key={channel.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${channel.bg} ${channel.color} rounded-2xl flex items-center justify-center`}>
              <channel.icon size={24} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">{channel.label}</div>
              <div className="text-xs text-emerald-600 font-bold">Active</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Bell size={18} className="text-indigo-600" /> Recent Notifications
          </h3>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {notifications.filter(n => !n.read).length} Unread
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center text-slate-400"
              >
                <Bell size={48} className="mx-auto mb-4 opacity-20" />
                <p>No notifications yet. They will appear here as your shipment progresses.</p>
              </motion.div>
            ) : (
              notifications.map((notif: any) => (
                <motion.div 
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`p-6 hover:bg-slate-50 transition-colors group relative ${!notif.read ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white transition-colors ${!notif.read ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                      {notif.event_type === 'Delivered' ? <CheckCircle2 className="text-emerald-600" size={20} /> : 
                       notif.event_type === 'Out for delivery' ? <Truck className="text-indigo-600" size={20} /> :
                       <Bell className={!notif.read ? 'text-indigo-600' : 'text-slate-400'} size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{notif.event_type}</span>
                          {!notif.read && (
                            <span className="w-2 h-2 bg-indigo-600 rounded-full" />
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(notif.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">{notif.message}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-2">
                          {notif.channels.map((ch: string) => (
                            <span key={ch} className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold text-slate-500 rounded uppercase tracking-tighter">
                              {ch}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.read && (
                            <button 
                              onClick={() => markAsRead(notif.id)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(notif.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
