import { useEffect, useRef, useState, useCallback } from 'react';
import type { Landmark } from '@/types';

type HandLandmarker = import('@mediapipe/tasks-vision').HandLandmarker;

const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export function useMediaPipe() {
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        const hl = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (!cancelled) {
          landmarkerRef.current = hl;
          setReady(true);
          console.log('[MediaPipe] Hand landmarker ready');
        } else {
          hl.close();
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
        console.error('[MediaPipe] Init failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const detect = useCallback((videoEl: HTMLVideoElement): Landmark[] | null => {
    const hl = landmarkerRef.current;
    if (!hl || videoEl.readyState < 2) return null;
    try {
      const result = hl.detectForVideo(videoEl, performance.now());
      if (result.landmarks.length > 0) {
        return result.landmarks[0] as Landmark[];
      }
    } catch (_e) { /* ignore frame errors */ }
    return null;
  }, []);

  return { ready, loading, error, detect };
}
