import type { GestureType } from '@/types';

const GESTURE_META: Record<GestureType, { icon: string; label: string; color: string; desc: string }> = {
  MOVE:         { icon: '☝️',  label: 'Move',         color: '#00e5ff', desc: 'Index finger → cursor' },
  LEFT_CLICK:   { icon: '👌',  label: 'Click',        color: '#00ff88', desc: 'Thumb + Index pinch' },
  RIGHT_CLICK:  { icon: '🤏',  label: 'Right Click',  color: '#ff9900', desc: 'Thumb + Middle pinch' },
  DOUBLE_CLICK: { icon: '✌️', label: 'Double Click', color: '#aa44ff', desc: 'Thumb + Ring pinch' },
  DRAG_START:   { icon: '✊',  label: 'Drag',         color: '#ff4444', desc: 'Two fingers held' },
  DRAG_END:     { icon: '🖐',  label: 'Drop',         color: '#ff4444', desc: 'Release drag' },
  SCROLL_UP:    { icon: '⬆️', label: 'Scroll Up',    color: '#44ccff', desc: 'Two fingers up' },
  SCROLL_DOWN:  { icon: '⬇️', label: 'Scroll Down',  color: '#44ccff', desc: 'Two fingers down' },
  SWIPE_LEFT:   { icon: '👈',  label: 'Back',         color: '#ffcc00', desc: 'Swipe left' },
  SWIPE_RIGHT:  { icon: '👉',  label: 'Forward',      color: '#ffcc00', desc: 'Swipe right' },
  SWIPE_UP:     { icon: '☝',   label: 'Swipe Up',     color: '#88ff00', desc: 'Three fingers up' },
  SWIPE_DOWN:   { icon: '👇',  label: 'Swipe Down',   color: '#88ff00', desc: 'Three fingers down' },
  PAUSE:        { icon: '🖐',  label: 'Paused',       color: '#888888', desc: 'Open palm — tracking off' },
  FIST:         { icon: '✊',  label: 'Fist',         color: '#ff6666', desc: 'Closed fist' },
  NONE:         { icon: '👋',  label: 'No Hand',      color: '#444444', desc: 'Show your hand' },
};

interface Props {
  gesture: GestureType;
  confidence: number;
  cursor: { x: number; y: number };
  fps: number;
}

export function GestureDisplay({ gesture, confidence, cursor, fps }: Props) {
  const meta = GESTURE_META[gesture];

  return (
    <div className="flex flex-col gap-3">
      {/* Current gesture card */}
      <div className="rounded-xl border bg-gray-900/80 backdrop-blur p-4"
        style={{ borderColor: meta.color + '40' }}>
        <div className="flex items-center gap-4">
          <div className="text-5xl leading-none w-16 text-center select-none">{meta.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold" style={{ color: meta.color }}>{meta.label}</p>
            <p className="text-sm text-gray-400 mt-0.5">{meta.desc}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-mono font-bold text-white">
              {confidence > 0 ? `${(confidence * 100).toFixed(0)}%` : '--'}
            </div>
            <div className="text-xs text-gray-500">confidence</div>
          </div>
        </div>
        {/* Confidence bar */}
        <div className="mt-3 h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-150"
            style={{ width: `${confidence * 100}%`, backgroundColor: meta.color }} />
        </div>
      </div>

      {/* Cursor + FPS stats */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Cursor X" value={`${(cursor.x * 100).toFixed(1)}%`} />
        <Stat label="Cursor Y" value={`${(cursor.y * 100).toFixed(1)}%`} />
        <Stat label="FPS" value={fps.toFixed(0)} color={fps >= 20 ? '#00ff88' : fps >= 10 ? '#ff9900' : '#ff4444'} />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-gray-900 border border-gray-800 p-2.5 text-center">
      <div className="text-lg font-mono font-bold" style={{ color: color ?? '#00e5ff' }}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
