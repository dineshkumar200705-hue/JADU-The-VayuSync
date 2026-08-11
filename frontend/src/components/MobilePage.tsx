import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { socketService } from '@/services/socketService';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useMediaPipe } from '@/hooks/useMediaPipe';
import { useGesture } from '@/hooks/useGesture';
import { startCamera, stopCamera } from '@/services/cameraService';
import { GestureDisplay } from './GestureDisplay';
import { HandLandmarks } from './HandLandmarks';
import { Smartphone, Wifi, WifiOff } from 'lucide-react';

export function MobilePage() {
  const { connected, sendGesture, setMode } = useSocket('mobile');
  const { startStreaming } = useWebRTC('mobile');
  const { ready: mpReady, detect } = useMediaPipe();
  const { confirmedGesture, smoothCursor, confidence, processLandmarks } = useGesture();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [landmarks, setLandmarks] = useState<import('@/types').Landmark[]>([]);
  const [fps, setFps] = useState(0);
  const [mobileMode, setMobileMode] = useState<'control' | 'nav'>('control');

  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const fpsRef = useRef({ n: 0, t: performance.now() });

  useEffect(() => {
    setMode(mobileMode === 'control' ? 'mobile-control' : 'mobile-nav');
  }, [mobileMode, setMode]);

  // Remote trigger from laptop — confirm() counts as a user gesture so getUserMedia is allowed
  useEffect(() => {
    const handler = () => {
      if (stream) return;
      if (window.confirm('Laptop is requesting your camera. Tap OK to start.')) startStreaming_();
    };
    socketService.on('mobile-camera-start', handler);
    return () => socketService.off('mobile-camera-start');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  const startStreaming_ = async () => {
    const s = await startCamera();
    setStream(s);
    await startStreaming(s);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.onloadedmetadata = () => video.play().catch(() => {});
  }, [stream]);

  useEffect(() => {
    if (!stream || !mpReady) return;

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      const lms = detect(video);
      setLandmarks(lms ?? []);
      const result = processLandmarks(lms);

      fpsRef.current.n++;
      const now = performance.now();
      if (now - fpsRef.current.t >= 1000) {
        setFps(fpsRef.current.n);
        fpsRef.current = { n: 0, t: now };
      }

      if (result && result.type !== 'NONE') {
        sendGesture(result.type, result.cursor, result.confidence, mobileMode === 'control' ? 'mobile-control' : 'mobile-nav');
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [stream, mpReady, detect, processLandmarks, sendGesture, mobileMode]);

  const stopStream = () => {
    cancelAnimationFrame(rafRef.current);
    stopCamera(stream);
    setStream(null);
    setLandmarks([]);
  };

  const w = 320, h = 240;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-4 gap-4">
      <div className="flex items-center gap-2 pt-2">
        <Smartphone className="w-5 h-5 text-purple-400" />
        <h1 className="text-lg font-bold">AirMouse — Mobile</h1>
        {connected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden border border-gray-700 w-full max-w-xs">
        {(['control', 'nav'] as const).map(m => (
          <button key={m} onClick={() => setMobileMode(m)} disabled={!!stream}
            className={`flex-1 py-2 text-sm font-medium transition-all
              ${mobileMode === m ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400'}`}>
            {m === 'control' ? '📡 Control Laptop' : '📱 Mobile Nav'}
          </button>
        ))}
      </div>

      {/* Camera */}
      <div className="relative rounded-xl overflow-hidden bg-gray-900 border border-gray-700"
        style={{ width: w, height: h }}>
        <video ref={videoRef} autoPlay playsInline muted width={w} height={h}
          className="object-cover" style={{ transform: 'scaleX(-1)', display: stream ? 'block' : 'none' }} />
        {!stream && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">Camera off</div>
        )}
        {landmarks.length > 0 && <HandLandmarks landmarks={landmarks} width={w} height={h} mirrored={false} />}
      </div>

      {/* Controls */}
      <div className="flex gap-3 w-full max-w-xs">
        <button onClick={startStreaming_} disabled={!!stream || !connected}
          className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-sm">
          Start Camera
        </button>
        <button onClick={stopStream} disabled={!stream}
          className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-sm">
          Stop
        </button>
      </div>

      {/* Gesture info */}
      <div className="w-full max-w-xs">
        <GestureDisplay gesture={confirmedGesture} confidence={confidence} cursor={smoothCursor} fps={fps} />
      </div>

      {!mpReady && (
        <p className="text-xs text-yellow-400 text-center">Loading MediaPipe model…</p>
      )}
      {!connected && (
        <p className="text-xs text-red-400 text-center">
          Not connected. Make sure backend is running on the same network.
        </p>
      )}
    </div>
  );
}
