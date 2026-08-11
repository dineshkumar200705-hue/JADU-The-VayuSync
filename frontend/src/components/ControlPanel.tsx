import type { AppMode } from '@/types';
import { Play, Square, ScanLine, Monitor, Smartphone, Navigation } from 'lucide-react';

interface Props {
  isTracking: boolean;
  mode: AppMode;
  isConnected: boolean;
  mediaPipeReady: boolean;
  onStart: () => void;
  onStop: () => void;
  onCalibrate: () => void;
  onModeChange: (mode: AppMode) => void;
}

const MODES: { value: AppMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'laptop',        label: 'Webcam',       icon: <Monitor className="w-4 h-4" />,     desc: 'Laptop webcam → laptop mouse' },
  { value: 'mobile-control',label: 'Mobile→Laptop', icon: <Smartphone className="w-4 h-4" />, desc: 'Phone camera → laptop mouse' },
  { value: 'mobile-nav',    label: 'Mobile Nav',    icon: <Navigation className="w-4 h-4" />, desc: 'Phone → phone navigation' },
];

export function ControlPanel({ isTracking, mode, isConnected, mediaPipeReady, onStart, onStop, onCalibrate, onModeChange }: Props) {
  const canStart = isConnected && mediaPipeReady && !isTracking;

  return (
    <div className="flex flex-col gap-4">
      {/* Mode selector */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Mode</p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => { if (!isTracking) onModeChange(m.value); }}
              disabled={isTracking}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all
                ${mode === m.value
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                  : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600 hover:text-gray-300'}
                ${isTracking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={m.desc}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onStart}
          disabled={!canStart}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all
            ${canStart
              ? 'bg-green-500 hover:bg-green-400 text-black'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
        >
          <Play className="w-4 h-4" />
          Start
        </button>

        <button
          onClick={onStop}
          disabled={!isTracking}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all
            ${isTracking
              ? 'bg-red-500 hover:bg-red-400 text-white'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
        >
          <Square className="w-4 h-4" />
          Stop
        </button>

        <button
          onClick={onCalibrate}
          disabled={!isConnected}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm border transition-all
            ${isConnected
              ? 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10'
              : 'border-gray-700 text-gray-600 cursor-not-allowed'}`}
        >
          <ScanLine className="w-4 h-4" />
          Calibrate
        </button>
      </div>

      {/* Gesture cheat sheet */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Gesture Map</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {[
            ['☝️','Move cursor'],['👌','Left click'],
            ['🤏','Right click'],['✌️','Double click'],
            ['✊✊','Drag'],   ['☝☝','Scroll'],
            ['👈','Back'],      ['👉','Forward'],
            ['🖐','Pause'],
          ].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <span className="text-base">{icon}</span>
              <span className="text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
