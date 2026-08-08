export const BACKEND_PORT = 3001;
export const FRONTEND_PORT = 5173;

// Gesture thresholds
export const PINCH_THRESHOLD = 0.08;        // normalized distance for pinch
export const SWIPE_VELOCITY_THRESHOLD = 0.8; // normalized units/sec
export const SWIPE_WINDOW_MS = 400;          // time window for swipe detection
export const GESTURE_DEBOUNCE_FRAMES = 3;    // consecutive frames to confirm gesture
export const CLICK_COOLDOWN_MS = 600;        // minimum ms between clicks
export const SCROLL_DEADZONE = 0.015;        // minimum movement to trigger scroll
export const SCROLL_MULTIPLIER = 8;

// Smoothing
export const FILTER_MIN_CUTOFF = 0.8;
export const FILTER_BETA = 0.4;
export const FILTER_D_CUTOFF = 1.0;

// Calibration defaults
export const DEFAULT_BOUNDS = { minX: 0.05, maxX: 0.95, minY: 0.05, maxY: 0.95 };

// WebRTC
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];
