export type GestureType =
  | 'MOVE'
  | 'LEFT_CLICK'
  | 'RIGHT_CLICK'
  | 'DOUBLE_CLICK'
  | 'DRAG_START'
  | 'DRAG_END'
  | 'SCROLL_UP'
  | 'SCROLL_DOWN'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'SWIPE_UP'
  | 'SWIPE_DOWN'
  | 'PAUSE'
  | 'FIST'
  | 'NONE';

export type AppMode = 'laptop' | 'mobile-control' | 'mobile-nav';

export interface CursorPosition {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
}

export interface GestureEvent {
  type: GestureType;
  cursor: CursorPosition;
  confidence: number;
  mode: AppMode;
  timestamp: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface CalibrationBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface SocketStatus {
  connected: boolean;
  latency: number;
  fps: number;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  peerId: string;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
}
