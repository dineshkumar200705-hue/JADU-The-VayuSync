export type GestureType =
  | 'MOVE' | 'LEFT_CLICK' | 'RIGHT_CLICK' | 'DOUBLE_CLICK'
  | 'DRAG_START' | 'DRAG_END'
  | 'SCROLL_UP' | 'SCROLL_DOWN'
  | 'SWIPE_LEFT' | 'SWIPE_RIGHT' | 'SWIPE_UP' | 'SWIPE_DOWN'
  | 'PAUSE' | 'FIST' | 'NONE';

export type AppMode = 'laptop' | 'mobile-control' | 'mobile-nav';

export interface GestureEvent {
  type: GestureType;
  cursor: { x: number; y: number };
  confidence: number;
  mode: AppMode;
  timestamp: number;
}

export interface ClientState {
  id: string;
  mode: AppMode;
  isTracking: boolean;
  role: 'laptop' | 'mobile';
}
