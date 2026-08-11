import type { AppMode } from '@/types';
import { Wifi, WifiOff, Monitor, Smartphone, Radio } from 'lucide-react';

interface Props {
  connected: boolean;
  latency: number;
  mode: AppMode;
  isTracking: boolean;
  cameraSource: 'webcam' | 'mobile';
  mediaPipeReady: boolean;
}

export function StatusPanel({ connected, latency, mode, isTracking, cameraSource, mediaPipeReady }: Props) {
  const modeLabel = {
    'laptop': 'Laptop Webcam',
    'mobile-control': 'Mobile → Laptop',
    'mobile-nav': 'Mobile Navigation',
  }[mode];

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/80 backdrop-blur p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">System Status</h3>
      <div className="space-y-2.5">
        <StatusRow
          icon={connected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
          label="Backend"
          value={connected ? `Connected (${latency}ms)` : 'Disconnected'}
          ok={connected}
        />
        <StatusRow
          icon={<Monitor className="w-4 h-4 text-cyan-400" />}
          label="Mode"
          value={modeLabel}
          ok
        />
        <StatusRow
          icon={cameraSource === 'webcam'
            ? <Monitor className="w-4 h-4 text-cyan-400" />
            : <Smartphone className="w-4 h-4 text-purple-400" />}
          label="Camera"
          value={cameraSource === 'webcam' ? 'Webcam' : 'Mobile Stream'}
          ok
        />
        <StatusRow
          icon={<Radio className={`w-4 h-4 ${mediaPipeReady ? 'text-green-400' : 'text-yellow-400'}`} />}
          label="MediaPipe"
          value={mediaPipeReady ? 'Ready' : 'Loading…'}
          ok={mediaPipeReady}
        />
        <div className="flex items-center gap-2 pt-1">
          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-sm text-gray-300">
            {isTracking ? 'Tracking active' : 'Tracking stopped'}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <span className="text-sm text-gray-400 w-24 shrink-0">{label}</span>
      <span className={`text-sm font-medium ${ok ? 'text-white' : 'text-red-400'}`}>{value}</span>
    </div>
  );
}
