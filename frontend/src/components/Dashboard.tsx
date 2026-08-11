import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraView } from './CameraView';
import { GestureDisplay } from './GestureDisplay';
import { StatusPanel } from './StatusPanel';
import { ControlPanel } from './ControlPanel';
import { useSocket } from '@/hooks/useSocket';
import { useMediaPipe } from '@/hooks/useMediaPipe';
import { useGesture } from '@/hooks/useGesture';
import { useWebRTC } from '@/hooks/useWebRTC';
import { startCamera, stopCamera, getCameras, type CameraDevice } from '@/services/cameraService';
import { socketService } from '@/services/socketService';
import { CalibrationWizard, saveCalibration } from '@/utils/calibration';
import type { AppMode, Landmark } from '@/types';
import { ChevronDown, Copy, Check, RadioTower } from 'lucide-react';

export function Dashboard() {
  const { connected, latency, sendGesture, setMode, startTracking: socketStart, stopTracking: socketStop } = useSocket('laptop');
  const { ready: mpReady, loading: mpLoading, error: mpError, detect } = useMediaPipe();
  const { confirmedGesture, smoothCursor, confidence, processLandmarks, updateCalibration, reset: resetGesture } = useGesture();
  const { remoteStream, peerConnected } = useWebRTC('host');

  const [mode, setModeState] = useState<AppMode>('laptop');
  const [isTracking, setIsTracking] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [fps, setFps] = useState(0);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);

  const [mobileUrl, setMobileUrl] = useState('');
  const [urlCopied, setUrlCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const connectedRef = useRef(false);
  const fpsRef = useRef({ n: 0, t: performance.now() });
  const calibWizard = useRef(new CalibrationWizard());

  // Load camera list
  useEffect(() => {
    getCameras().then(list => {
      setCameras(list);
      if (list[0]) setSelectedCamera(list[0].deviceId);
    });
  }, []);

  // Resolve the LAN IP → show the HTTPS Express URL (port 3443) so mobile camera works
  useEffect(() => {
    fetch('/api/server-info')
      .then(r => r.json())
      .then(({ ip, httpsPort }: { ip: string; httpsPort: number }) => {
        setMobileUrl(`https://${ip}:${httpsPort}/mobile`);
      })
      .catch(() => setMobileUrl('https://<your-ip>:3443/mobile'));
  }, []);

  // Keep a ref so the worker closure always reads the latest connection state
  useEffect(() => { connectedRef.current = connected; }, [connected]);

  const handleModeChange = (m: AppMode) => {
    setModeState(m);
    setMode(m);
  };

  const handleStart = useCallback(async () => {
    let activeStream = stream;

    if (mode === 'laptop') {
      activeStream = await startCamera(selectedCamera);
      setStream(activeStream);
    } else if (mode === 'mobile-control' && remoteStream) {
      activeStream = remoteStream;
      setStream(remoteStream);
    }

    if (!activeStream) return;

    setIsTracking(true);
    socketStart();
    resetGesture();

    // Web Worker sends ticks at 50 ms — unlike setInterval on the main thread,
    // worker timers are NOT throttled when the browser tab is in the background.
    // This keeps gesture tracking alive system-wide once the camera is open.
    const worker = new Worker(
      new URL('../workers/ticker.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !mpReady) return;

      const lms = detect(video);
      setLandmarks(lms ?? []);
      const result = processLandmarks(lms);

      fpsRef.current.n++;
      const now = performance.now();
      if (now - fpsRef.current.t >= 1000) {
        setFps(fpsRef.current.n);
        fpsRef.current = { n: 0, t: now };
      }

      if (result && result.type !== 'NONE' && result.type !== 'PAUSE' && connectedRef.current) {
        sendGesture(result.type, result.cursor, result.confidence, mode);
      }
    };
  }, [stream, mode, selectedCamera, remoteStream, mpReady, detect, processLandmarks, sendGesture, socketStart, resetGesture]);

  const handleStop = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setIsTracking(false);
    socketStop();
    if (mode === 'laptop') {
      stopCamera(stream);
      setStream(null);
    }
    setLandmarks([]);
    setFps(0);
    resetGesture();
  }, [mode, stream, socketStop, resetGesture]);

  // Auto-cleanup
  useEffect(() => () => {
    workerRef.current?.terminate();
    stopCamera(stream);
  }, []);

  // Use remote stream when available
  useEffect(() => {
    if (remoteStream && mode === 'mobile-control') setStream(remoteStream);
  }, [remoteStream, mode]);

  // Calibration
  const handleCalibrate = () => {
    calibWizard.current.reset();
    setIsCalibrating(true);
    setCalibrationStep(0);
  };

  const handleCalibrationClick = useCallback(() => {
    const { x, y } = smoothCursor;
    calibWizard.current.addCorner(x, y);
    const step = calibWizard.current.step;
    setCalibrationStep(step);
    if (calibWizard.current.isComplete()) {
      const bounds = calibWizard.current.compute();
      saveCalibration(bounds);
      updateCalibration(bounds);
      setIsCalibrating(false);
      setCalibrationStep(0);
    }
  }, [smoothCursor, updateCalibration]);

  const calCorners = ['Top-Left', 'Top-Right', 'Bottom-Right', 'Bottom-Left'];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <span className="text-lg">🖐</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white">AirMouse AI</h1>
            <p className="text-xs text-gray-500">Touchless Control System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Camera selector */}
          {mode === 'laptop' && cameras.length > 0 && (
            <div className="relative">
              <select
                value={selectedCamera}
                onChange={e => setSelectedCamera(e.target.value)}
                disabled={isTracking}
                className="appearance-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 pr-7 text-sm text-gray-300 disabled:opacity-40"
              >
                {cameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-2 w-3 h-3 text-gray-500 pointer-events-none" />
            </div>
          )}

          {/* Mobile peer badge + URL */}
          {mode === 'mobile-control' && (
            <div className="flex items-center gap-2">
              <div className={`text-xs px-2 py-1 rounded-full font-medium ${peerConnected ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-800 text-gray-500'}`}>
                {peerConnected ? '📱 Phone connected' : '📱 Waiting for phone…'}
              </div>
              {mobileUrl && (
                <>
                  <button
                    onClick={() => { navigator.clipboard.writeText(mobileUrl); setUrlCopied(true); setTimeout(() => setUrlCopied(false), 2000); }}
                    title={`Open on phone: ${mobileUrl}`}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-all font-mono"
                  >
                    {urlCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    <span className="max-w-[140px] truncate">{mobileUrl}</span>
                  </button>
                  <button
                    onClick={() => socketService.triggerMobileCamera()}
                    title="Trigger camera on connected mobile"
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 transition-all"
                  >
                    <RadioTower className="w-3 h-3" />
                    Trigger Cam
                  </button>
                </>
              )}
            </div>
          )}

          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${connected ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {connected ? 'Backend Live' : 'Offline'}
          </div>
        </div>
      </header>

      {/* Calibration overlay */}
      {isCalibrating && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center gap-4"
          onClick={handleCalibrationClick}>
          <div className="text-2xl font-bold text-cyan-400">Calibration Mode</div>
          <p className="text-gray-300 text-center max-w-xs">
            Point your index finger to the <strong>{calCorners[calibrationStep]}</strong> corner of your screen, then click.
          </p>
          <div className="flex gap-2 mt-2">
            {calCorners.map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i < calibrationStep ? 'bg-cyan-400' : 'bg-gray-600'}`} />
            ))}
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIsCalibrating(false); }}
            className="mt-4 text-sm text-gray-500 hover:text-gray-300">Cancel</button>
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 grid grid-cols-[1fr_320px] gap-4 p-4 min-h-0">

        {/* Left — camera + gesture */}
        <div className="flex flex-col gap-4 min-h-0">
          <CameraView
            ref={videoRef}
            stream={stream}
            landmarks={landmarks}
            className="flex-1"
          />

          {isTracking && (
            <div className="text-xs text-center text-gray-600">
              Tracking active system-wide — switch to any app, gestures still control the mouse
            </div>
          )}
        </div>

        {/* Right — controls + stats */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          {mpLoading && (
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-3 text-sm text-yellow-400 text-center">
              Loading MediaPipe…
            </div>
          )}
          {mpError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
              MediaPipe error: {mpError}
            </div>
          )}

          <GestureDisplay
            gesture={confirmedGesture}
            confidence={confidence}
            cursor={smoothCursor}
            fps={fps}
          />

          <StatusPanel
            connected={connected}
            latency={latency}
            mode={mode}
            isTracking={isTracking}
            cameraSource={mode === 'mobile-control' ? 'mobile' : 'webcam'}
            mediaPipeReady={mpReady}
          />

          <ControlPanel
            isTracking={isTracking}
            mode={mode}
            isConnected={connected}
            mediaPipeReady={mpReady}
            onStart={handleStart}
            onStop={handleStop}
            onCalibrate={handleCalibrate}
            onModeChange={handleModeChange}
          />
        </div>
      </div>
    </div>
  );
}
