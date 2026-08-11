export type GestureType =
  | 'MOVE' | 'LEFT_CLICK' | 'RIGHT_CLICK' | 'DOUBLE_CLICK'
  | 'DRAG_START' | 'DRAG_END'
  | 'SCROLL_UP' | 'SCROLL_DOWN'
  | 'SWIPE_LEFT' | 'SWIPE_RIGHT' | 'SWIPE_UP' | 'SWIPE_DOWN'
  | 'PAUSE' | 'FIST' | 'NONE';

export type AppMode = 'laptop' | 'mobile-control' | 'mobile-nav';

export interface Landmark { x: number; y: number; z: number; }

export interface GestureResult {
  type: GestureType;
  cursor: { x: number; y: number };
  confidence: number;
  landmarks: Landmark[];
}

export interface CalibrationBounds {
  minX: number; maxX: number;
  minY: number; maxY: number;
}

export interface AppState {
  mode: AppMode;
  isTracking: boolean;
  isConnected: boolean;
  currentGesture: GestureType;
  cursor: { x: number; y: number };
  fps: number;
  latency: number;
  landmarks: Landmark[];
  confidence: number;
  cameraSource: 'webcam' | 'mobile';
  isCalibrating: boolean;
}
