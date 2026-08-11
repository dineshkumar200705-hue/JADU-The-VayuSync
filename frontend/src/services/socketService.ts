import { io, Socket } from 'socket.io-client';
import type { GestureType, AppMode } from '@/types';

// Connect directly to backend port 3001.
// Vite's WebSocket proxy is unreliable for socket.io WebSocket upgrades,
// so we bypass it and hit port 3001 on whatever host the user is browsing from.
// LAN mobile: opens http://192.168.x.x:5173/mobile → connects to 192.168.x.x:3001 ✓
const BACKEND_URL = `${window.location.protocol}//${window.location.hostname}:3001`;

class SocketService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  connect(role: 'laptop' | 'mobile' = 'laptop') {
    // Guard against React StrictMode double-invoke and concurrent calls.
    // Check socket existence (any state), not just .connected.
    if (this.socket) return this.socket;

    this.socket = io(BACKEND_URL, {
      query: { role },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => console.log('[Socket] Connected:', this.socket!.id));
    this.socket.on('disconnect', (r) => console.log('[Socket] Disconnected:', r));

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  get connected() { return this.socket?.connected ?? false; }
  get id() { return this.socket?.id ?? null; }

  sendGesture(type: GestureType, cursor: { x: number; y: number }, confidence: number, mode: AppMode) {
    if (!this.socket?.connected) return;
    this.socket.emit('gesture', { type, cursor, confidence, mode, timestamp: Date.now() });
  }

  setMode(mode: AppMode) {
    this.socket?.emit('set-mode', { mode });
  }

  startTracking() { this.socket?.emit('start-tracking'); }
  stopTracking() { this.socket?.emit('stop-tracking'); }
  triggerMobileCamera() { this.socket?.emit('trigger-mobile-camera'); }

  ping(): Promise<number> {
    return new Promise(resolve => {
      const start = Date.now();
      this.socket?.emit('ping', start);
      this.socket?.once('pong', () => resolve(Date.now() - start));
      setTimeout(() => resolve(-1), 2000);
    });
  }

  // WebRTC signaling
  joinRoom(room: string, role: 'host' | 'mobile') {
    this.socket?.emit('join-room', { room, role });
  }

  sendOffer(room: string, offer: RTCSessionDescriptionInit, peerId: string) {
    this.socket?.emit('webrtc-offer', { room, offer, peerId });
  }

  sendAnswer(room: string, answer: RTCSessionDescriptionInit, peerId: string) {
    this.socket?.emit('webrtc-answer', { room, answer, peerId });
  }

  sendIceCandidate(room: string, candidate: RTCIceCandidateInit, peerId?: string) {
    this.socket?.emit('ice-candidate', { room, candidate, peerId });
  }

  on<T>(event: string, cb: (data: T) => void) {
    this.socket?.on(event, cb as (...args: unknown[]) => void);
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb as (...args: unknown[]) => void);
  }

  off(event: string) {
    this.socket?.off(event);
    this.listeners.delete(event);
  }
}

export const socketService = new SocketService();
