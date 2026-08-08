export const GESTURE_INFO: Record<string, { icon: string; label: string; description: string; color: string }> = {
  MOVE:         { icon: '☝️',  label: 'Move Cursor',   description: 'Point index finger',            color: '#00e5ff' },
  LEFT_CLICK:   { icon: '👌',  label: 'Left Click',    description: 'Pinch thumb + index',            color: '#00ff88' },
  RIGHT_CLICK:  { icon: '🤏',  label: 'Right Click',   description: 'Pinch thumb + middle',           color: '#ff9900' },
  DOUBLE_CLICK: { icon: '✌️', label: 'Double Click',  description: 'Pinch thumb + ring',             color: '#aa00ff' },
  DRAG_START:   { icon: '✊',  label: 'Drag',          description: 'Two fingers held',               color: '#ff4444' },
  DRAG_END:     { icon: '🖐',  label: 'Drop',          description: 'Release drag',                   color: '#ff4444' },
  SCROLL_UP:    { icon: '☝☝', label: 'Scroll Up',     description: 'Two fingers move up',            color: '#00ccff' },
  SCROLL_DOWN:  { icon: '👇👇', label: 'Scroll Down', description: 'Two fingers move down',          color: '#00ccff' },
  SWIPE_LEFT:   { icon: '👈',  label: 'Back',          description: 'Swipe left (open palm)',         color: '#ffcc00' },
  SWIPE_RIGHT:  { icon: '👉',  label: 'Forward',       description: 'Swipe right (open palm)',        color: '#ffcc00' },
  SWIPE_UP:     { icon: '☝',   label: 'Swipe Up',      description: 'Three fingers move up',          color: '#88ff00' },
  SWIPE_DOWN:   { icon: '👇',  label: 'Swipe Down',    description: 'Three fingers move down',        color: '#88ff00' },
  PAUSE:        { icon: '🖐',  label: 'Pause',         description: 'Open palm — stops tracking',    color: '#aaaaaa' },
  FIST:         { icon: '✊',  label: 'Fist',          description: 'Closed fist',                    color: '#ff4444' },
  NONE:         { icon: '👋',  label: 'No Gesture',    description: 'No hand detected',               color: '#555555' },
};

// MediaPipe hand landmark indices
export const LM = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3,  THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7,  INDEX_TIP: 8,
  MIDDLE_MCP:9, MIDDLE_PIP:10,MIDDLE_DIP:11, MIDDLE_TIP:12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15,  RING_TIP: 16,
  PINKY_MCP:17, PINKY_PIP: 18,PINKY_DIP: 19, PINKY_TIP: 20,
} as const;

export const HAND_CONNECTIONS: [number, number][] = [
  [LM.WRIST, LM.THUMB_CMC],[LM.THUMB_CMC,LM.THUMB_MCP],[LM.THUMB_MCP,LM.THUMB_IP],[LM.THUMB_IP,LM.THUMB_TIP],
  [LM.WRIST, LM.INDEX_MCP],[LM.INDEX_MCP,LM.INDEX_PIP],[LM.INDEX_PIP,LM.INDEX_DIP],[LM.INDEX_DIP,LM.INDEX_TIP],
  [LM.WRIST, LM.MIDDLE_MCP],[LM.MIDDLE_MCP,LM.MIDDLE_PIP],[LM.MIDDLE_PIP,LM.MIDDLE_DIP],[LM.MIDDLE_DIP,LM.MIDDLE_TIP],
  [LM.WRIST, LM.RING_MCP],[LM.RING_MCP,LM.RING_PIP],[LM.RING_PIP,LM.RING_DIP],[LM.RING_DIP,LM.RING_TIP],
  [LM.WRIST, LM.PINKY_MCP],[LM.PINKY_MCP,LM.PINKY_PIP],[LM.PINKY_PIP,LM.PINKY_DIP],[LM.PINKY_DIP,LM.PINKY_TIP],
  [LM.INDEX_MCP,LM.MIDDLE_MCP],[LM.MIDDLE_MCP,LM.RING_MCP],[LM.RING_MCP,LM.PINKY_MCP],[LM.WRIST,LM.PINKY_MCP],
];
