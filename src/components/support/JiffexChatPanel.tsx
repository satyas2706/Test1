import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  RotateCcw, 
  ShieldCheck, 
  HelpCircle,
  Package,
  Truck,
  Calculator,
  Calendar,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  order?: {
    orderId: string;
    trackingId: string;
    status: string;
    carrier: string;
    destination: string;
    estimatedDelivery: string;
    weight?: string;
    latestEvent?: {
      status?: string;
      location?: string;
      date?: string;
      time?: string;
      description?: string;
    };
  } | null;
}

interface JiffexChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onOpenLogin?: () => void;
  orders?: any[];
}

const DEFAULT_SUGGESTIONS = [
  { label: "Track my shipment", icon: Truck, prompt: "What is the status of my shipment?" },
  { label: "Check shipping rates to USA", icon: Calculator, prompt: "What are the shipping rates from India to USA?" },
  { label: "Book a doorstep pickup", icon: Calendar, prompt: "How do I schedule a doorstep pickup in India?" },
  { label: "Prohibited items list", icon: Package, prompt: "Which items are prohibited for shipping to the USA?" }
];

export const JiffexChatPanel: React.FC<JiffexChatPanelProps> = ({
  isOpen,
  onClose,
  userEmail,
  onOpenLogin,
  orders = []
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`Copied "${text}" to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Initialize unique session and greeting on open
  useEffect(() => {
    if (isOpen) {
      const newSession = `jfx-chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setSessionId(newSession);

      // Initial friendly Jiffex Support greeting
      setMessages([
        {
          id: 'msg-welcome',
          role: 'assistant',
          content: "Hello! Welcome to Jiffex Support. How can I assist you with your package tracking, shipping rates, or home pickup bookings today?",
          timestamp: new Date()
        }
      ]);

      // Focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      setMessages([]);
      setInputValue('');
      setIsLoading(false);
    }
  }, [isOpen]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend !== undefined ? textToSend : inputValue).trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const storedToken = localStorage.getItem('jiffex_session_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
        headers['x-jiffex-session'] = storedToken;
      }

      const res = await fetch('/api/support/chat-message', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          message: messageText,
          sessionId: sessionId || `jfx-chat-${Date.now()}`
        })
      });

      if (res.status === 401) {
        toast.error('Session expired. Please log in to chat with Jiffex Support.');
        onClose();
        if (onOpenLogin) {
          onOpenLogin();
        } else {
          window.dispatchEvent(new CustomEvent('jiffex:open-login', { detail: { source: 'support-chat' } }));
        }
        return;
      }

      if (!res.ok) {
        throw new Error(`Support service responded with HTTP ${res.status}`);
      }

      const data = await res.json();
      const botReply = data.response || "I have received your request. Let me know if you need help with shipments, quotes, or bookings.";

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        role: 'assistant',
        content: botReply,
        timestamp: new Date(),
        order: data.order || null
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('[Jiffex Support Chat] Error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I am temporarily having trouble reaching our logistics server. Please check your connection or try again shortly.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleResetChat = () => {
    const newSession = `jfx-chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setSessionId(newSession);
    setMessages([
      {
        id: `msg-welcome-${Date.now()}`,
        role: 'assistant',
        content: "Conversation refreshed. How can I assist you with your Jiffex shipment today?",
        timestamp: new Date()
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop for desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />

        {/* Panel Container: Full screen on mobile, right-side slide-over on md+ */}
        <div className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 flex max-w-full justify-end">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="w-full md:w-[460px] lg:w-[500px] h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 z-10"
            role="dialog"
            aria-labelledby="chat-panel-title"
          >
            {/* Header */}
            <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-indigo-100">
                    <Bot size={20} />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 id="chat-panel-title" className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>Jiffex Support</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-bold">
                      Online
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    24/7 AI Logistics Assistant • USA & India Shipping
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Restart conversation"
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  aria-label="Restart chat"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  aria-label="Close chat"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Notice Bar */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium shrink-0">
              <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
                <ShieldCheck size={14} className="text-emerald-600" />
                Verified Customer Support Session
              </span>
              {userEmail && (
                <span className="truncate max-w-[150px] text-slate-500 text-[10px]" title={userEmail}>
                  {userEmail}
                </span>
              )}
            </div>

            {/* Quick Orders Bar if user has orders */}
            {orders && orders.length > 0 && (
              <div className="px-4 py-2 bg-indigo-50/60 border-b border-indigo-100/70 shrink-0 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 shrink-0 flex items-center gap-1">
                  <Truck size={12} className="text-indigo-600" />
                  Your Orders:
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {orders.slice(0, 3).map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSendMessage(`Track order ${ord.id}`)}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200/80 text-[11px] font-bold font-mono transition shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
                      title={`Ask AI to track order #${ord.id}`}
                    >
                      <span>#{ord.id}</span>
                      <span className="text-[9px] font-sans font-normal opacity-80">({ord.shipment_status || ord.status || 'Active'})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
              {messages.map((msg) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAssistant && (
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot size={16} />
                      </div>
                    )}

                    <div className="max-w-[85%] sm:max-w-[80%] space-y-1">
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xs ${
                          isAssistant
                            ? 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm'
                            : 'bg-indigo-600 text-white font-medium rounded-tr-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap select-text">{msg.content}</p>

                        {/* Embedded Live Order Tracking Card */}
                        {isAssistant && msg.order && (
                          <div className="mt-3 p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                              <div className="flex items-center gap-1.5">
                                <Package size={14} className="text-indigo-400 shrink-0" />
                                <span className="text-xs font-bold font-mono text-slate-100">
                                  #{msg.order.orderId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(msg.order!.orderId)}
                                  className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                                  title="Copy Order ID"
                                >
                                  {copiedId === msg.order.orderId ? (
                                    <Check size={12} className="text-emerald-400" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {msg.order.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs">
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase font-semibold">Carrier</p>
                                <p className="font-bold text-slate-200 truncate">{msg.order.carrier}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase font-semibold">Destination</p>
                                <p className="font-bold text-slate-200 truncate">{msg.order.destination}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-[10px] text-slate-400 uppercase font-semibold">Estimated Delivery</p>
                                <p className="font-bold text-emerald-400 truncate">{msg.order.estimatedDelivery}</p>
                              </div>
                              {msg.order.latestEvent && (
                                <div className="col-span-2 pt-1.5 border-t border-slate-800/80">
                                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Latest Checkpoint</p>
                                  <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                                    {msg.order.latestEvent.description}
                                    {msg.order.latestEvent.location ? ` • ${msg.order.latestEvent.location}` : ''}
                                  </p>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('jiffex:navigate-tab', {
                                  detail: { tab: 'track', trackingNumber: msg.order!.trackingId }
                                }));
                                onClose();
                              }}
                              className="mt-3 w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 shadow-xs cursor-pointer"
                            >
                              <span>Open in Real-Time Tracker</span>
                              <ExternalLink size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                      <p
                        className={`text-[10px] text-slate-400 px-1 font-medium ${
                          isAssistant ? 'text-left' : 'text-right'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {!isAssistant && (
                      <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing / Thinking Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm px-4 py-3 shadow-2xs flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Loader2 size={14} className="animate-spin text-indigo-600" />
                    <span>Jiffex Support is replying...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips (when messages are few) */}
            {messages.length <= 2 && (
              <div className="px-4 py-2.5 bg-white border-t border-slate-100 shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" />
                  Suggested questions:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {DEFAULT_SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSendMessage(sug.prompt)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-200 text-left transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2 group"
                    >
                      <sug.icon size={13} className="text-indigo-600 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-900 truncate">
                        {sug.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form Area */}
            <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message to Jiffex Support..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition disabled:bg-slate-100 disabled:cursor-not-allowed"
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold rounded-xl transition active:scale-95 flex items-center justify-center cursor-pointer shadow-md shadow-indigo-200/50 disabled:shadow-none shrink-0"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>

              <div className="mt-2 text-center">
                <span className="text-[10px] text-slate-400 font-medium">
                  Jiffex Support • 24/7 AI-Powered International Logistics
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
