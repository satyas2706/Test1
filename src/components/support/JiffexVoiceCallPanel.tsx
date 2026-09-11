import React from 'react';
import { PhoneCall, PhoneOff, Mic, MicOff, LogIn, Loader2 } from 'lucide-react';
import { VoiceCallStatus } from '../../hooks/useJiffexVoiceCall';

interface JiffexVoiceCallPanelProps {
  isAuthenticated: boolean;
  callStatus: VoiceCallStatus;
  isMuted: boolean;
  lastTranscript: { role: 'user' | 'agent'; text: string } | null;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  idPrefix?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const JiffexVoiceCallPanel: React.FC<JiffexVoiceCallPanelProps> = ({
  isAuthenticated,
  callStatus,
  isMuted,
  lastTranscript,
  onStartCall,
  onEndCall,
  onToggleMute,
  idPrefix = 'btn-call-jiffex-support',
  className = '',
  size = 'md'
}) => {
  if (callStatus === 'connecting') {
    return (
      <div className={`p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
          <div>
            <p className="text-xs sm:text-sm font-black text-indigo-950">Connecting to Jiffex Support...</p>
            <p className="text-[10px] sm:text-xs text-indigo-700 font-medium">Setting up secure audio line</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEndCall}
          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition active:scale-95 cursor-pointer shadow-sm"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (callStatus === 'active') {
    return (
      <div className={`p-4 sm:p-5 bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-50 border-2 border-emerald-300 rounded-2xl sm:rounded-3xl space-y-3.5 shadow-sm ${className}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p className="text-xs sm:text-sm font-black text-emerald-950 tracking-tight">Connected to Jiffex Support</p>
              <p className="text-[10px] sm:text-xs text-emerald-700 font-medium">24/7 AI Voice Support Active</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/80 rounded-full border border-emerald-200 text-emerald-800 text-[10px] font-bold">
            <span>{isMuted ? 'Mic Muted' : 'Microphone Live'}</span>
          </div>
        </div>

        {lastTranscript && lastTranscript.text && (
          <div className="p-3 bg-white/95 rounded-xl border border-emerald-200/80 text-xs text-slate-700 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
              <span>{lastTranscript.role === 'agent' ? 'Jiffex Support' : 'You'}</span>
            </div>
            <p className="font-medium text-slate-800 leading-relaxed">{lastTranscript.text}</p>
          </div>
        )}

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            id={`${idPrefix}-mute`}
            onClick={onToggleMute}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-2xs ${
              isMuted
                ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isMuted ? <MicOff size={15} className="text-amber-600" /> : <Mic size={15} className="text-slate-600" />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            type="button"
            id={`${idPrefix}-end`}
            onClick={onEndCall}
            className="px-5 py-2.5 rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-md shadow-rose-200 active:scale-95 transition ml-auto cursor-pointer"
          >
            <PhoneOff size={15} />
            <span>End Call</span>
          </button>
        </div>
      </div>
    );
  }

  // Idle state button
  const buttonPadding = size === 'sm' ? 'py-3 px-4 text-xs' : 'px-8 py-4 text-base';
  const iconSize = size === 'sm' ? 14 : 18;

  return (
    <button
      id={idPrefix}
      type="button"
      onClick={onStartCall}
      className={`bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 active:scale-95 transition flex items-center justify-center gap-3 cursor-pointer ${buttonPadding} ${className}`}
    >
      {isAuthenticated ? (
        <>
          <PhoneCall size={iconSize} />
          <span>Call Jiffex Support</span>
        </>
      ) : (
        <>
          <LogIn size={iconSize} />
          <span>Sign in to Call Support</span>
        </>
      )}
    </button>
  );
};
