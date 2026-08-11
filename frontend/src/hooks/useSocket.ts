import { useEffect, useState, useCallback } from 'react';
import { socketService } from '@/services/socketService';
import type { AppMode, GestureType } from '@/types';

export function useSocket(role: 'laptop' | 'mobile' = 'laptop') {
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const [serverClients, setServerClients] = useState(0);

  useEffect(() => {
    const socket = socketService.connect(role);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onStatus = ({ clients }: { clients: number }) => setServerClients(clients);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('server-status', onStatus);

    // Latency polling every 3s
    const interval = setInterval(async () => {
      if (socket.connected) {
        const ms = await socketService.ping();
        if (ms >= 0) setLatency(ms);
      }
    }, 3000);

    setConnected(socket.connected);

    return () => {
      clearInterval(interval);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('server-status', onStatus);
    };
  }, [role]);

  const sendGesture = useCallback(
    (type: GestureType, cursor: { x: number; y: number }, confidence: number, mode: AppMode) => {
      socketService.sendGesture(type, cursor, confidence, mode);
    },
    [],
  );

  const setMode = useCallback((mode: AppMode) => socketService.setMode(mode), []);
  const startTracking = useCallback(() => socketService.startTracking(), []);
  const stopTracking = useCallback(() => socketService.stopTracking(), []);

  return { connected, latency, serverClients, sendGesture, setMode, startTracking, stopTracking };
}
