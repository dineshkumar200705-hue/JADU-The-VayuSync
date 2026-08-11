import { useEffect, useRef, useState, useCallback } from 'react';
import { WebRTCService } from '@/services/webrtcService';

export function useWebRTC(role: 'host' | 'mobile' = 'host') {
  const serviceRef = useRef<WebRTCService | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnected, setPeerConnected] = useState(false);

  useEffect(() => {
    const svc = new WebRTCService('airmouse-room', role);
    svc.onRemoteStream = (stream) => {
      setRemoteStream(stream);
      setPeerConnected(true);
    };
    svc.init();
    serviceRef.current = svc;

    return () => { svc.destroy(); };
  }, [role]);

  const startStreaming = useCallback(async (stream: MediaStream) => {
    await serviceRef.current?.startStreaming(stream);
  }, []);

  return { remoteStream, peerConnected, startStreaming };
}
