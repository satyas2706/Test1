import { useState, useRef, useEffect, useCallback } from 'react';
import { WebSession, SessionStatus, TranscriptEvent } from '@omnidim-ai/client';
import { toast } from 'sonner';

export type VoiceCallStatus = 'idle' | 'connecting' | 'active' | 'ended' | 'error';

export interface UseJiffexVoiceCallReturn {
  callStatus: VoiceCallStatus;
  isMuted: boolean;
  lastTranscript: { role: 'user' | 'agent'; text: string } | null;
  startCall: (isUserAuthenticated: boolean) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
}

export function useJiffexVoiceCall(onOpenLogin?: () => void): UseJiffexVoiceCallReturn {
  const [callStatus, setCallStatus] = useState<VoiceCallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<{ role: 'user' | 'agent'; text: string } | null>(null);
  const sessionRef = useRef<WebSession | null>(null);

  const cleanupSession = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.stop();
      } catch (e) {
        // Safe ignore
      }
      sessionRef.current = null;
    }
    setCallStatus('idle');
    setIsMuted(false);
    setLastTranscript(null);
  }, []);

  const endCall = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.stop();
      } catch (e) {
        // Safe ignore
      }
    }
    cleanupSession();
    toast.info('Support call ended');
  }, [cleanupSession]);

  const toggleMute = useCallback(() => {
    if (!sessionRef.current) return;
    const nextMuted = !isMuted;
    try {
      sessionRef.current.mute(nextMuted);
      setIsMuted(nextMuted);
      toast.info(nextMuted ? 'Microphone muted' : 'Microphone unmuted');
    } catch (e) {
      console.error('[Jiffex Voice Support] Error toggling mute:', e);
    }
  }, [isMuted]);

  const startCall = useCallback(async (isUserAuthenticated: boolean) => {
    if (!isUserAuthenticated) {
      if (onOpenLogin) {
        onOpenLogin();
      } else {
        window.dispatchEvent(new CustomEvent('jiffex:open-login', { detail: { source: 'support' } }));
      }
      return;
    }

    if (sessionRef.current) {
      cleanupSession();
    }

    setCallStatus('connecting');
    setLastTranscript(null);
    toast.info('Connecting to Jiffex Support...');

    try {
      const storedToken = localStorage.getItem('jiffex_session_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
        headers['x-jiffex-session'] = storedToken;
      }

      const res = await fetch('/api/support/call-session', {
        method: 'POST',
        credentials: 'include',
        headers
      });

      if (!res.ok) {
        let errMessage = 'Failed to connect to Jiffex Support.';
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch {
          // ignore
        }

        if (res.status === 401) {
          toast.error('Please log in to start a support call.');
          if (onOpenLogin) onOpenLogin();
          else window.dispatchEvent(new CustomEvent('jiffex:open-login', { detail: { source: 'support' } }));
        } else {
          toast.error(errMessage);
        }
        setCallStatus('idle');
        return;
      }

      const data = await res.json();
      if (!data?.ws_url) {
        toast.error('Voice session credentials invalid. Please try again.');
        setCallStatus('idle');
        return;
      }

      const session = new WebSession();
      sessionRef.current = session;

      session.on('status', (s: SessionStatus) => {
        console.log('[Jiffex Voice Support] Session status:', s);
        if (s === 'connecting') {
          setCallStatus('connecting');
        } else if (s === 'active') {
          setCallStatus('active');
          toast.success('Connected to Jiffex Support');
        } else if (typeof s === 'object' && s.state === 'ended') {
          console.log('[Jiffex Voice Support] Call ended:', s.reason);
          cleanupSession();
          toast.info('Support call ended');
        }
      });

      session.on('error', (err: Error) => {
        console.error('[Jiffex Voice Support] Session error:', err);
        toast.error(err?.message || 'Support voice call disconnected');
        cleanupSession();
      });

      session.on('transcript', (t: TranscriptEvent) => {
        if (t?.text) {
          setLastTranscript({ role: t.role, text: t.text });
        }
      });

      await session.start({ wsUrl: data.ws_url });
    } catch (err: any) {
      console.error('[Jiffex Voice Support] Initialization error:', err);
      toast.error(err?.message || 'Could not access microphone or connect to Jiffex Support.');
      cleanupSession();
    }
  }, [cleanupSession, onOpenLogin]);

  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        try {
          sessionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    callStatus,
    isMuted,
    lastTranscript,
    startCall,
    endCall,
    toggleMute
  };
}
