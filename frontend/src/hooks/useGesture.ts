import { useRef, useCallback, useState } from 'react';
import { GestureClassifier } from '@/services/gestureClassifier';
import { CursorFilter } from '@/utils/smoothing';
import { mapToScreen, loadCalibration } from '@/utils/calibration';
import type { GestureType, Landmark, CalibrationBounds } from '@/types';

const DEBOUNCE = 3; // consecutive frames to confirm gesture

export function useGesture() {
  const classifierRef = useRef(new GestureClassifier());
  const filterRef = useRef(new CursorFilter());
  const consecutiveRef = useRef<{ type: GestureType; count: number }>({ type: 'NONE', count: 0 });
  const boundsRef = useRef<CalibrationBounds>(loadCalibration());

  const [confirmedGesture, setConfirmedGesture] = useState<GestureType>('NONE');
  const [smoothCursor, setSmoothCursor] = useState({ x: 0.5, y: 0.5 });
  const [confidence, setConfidence] = useState(0);

  const processLandmarks = useCallback((landmarks: Landmark[] | null) => {
    if (!landmarks) {
      consecutiveRef.current = { type: 'NONE', count: 0 };
      setConfirmedGesture('NONE');
      setConfidence(0);
      return null;
    }

    const raw = classifierRef.current.classify(landmarks);

    // Smooth cursor
    const mapped = mapToScreen(raw.cursor.x, raw.cursor.y, boundsRef.current);
    const smooth = filterRef.current.filter(mapped.x, mapped.y);
    setSmoothCursor(smooth);
    setConfidence(raw.confidence);

    // Debounce gesture changes
    const cons = consecutiveRef.current;
    if (raw.type === cons.type) {
      cons.count++;
      if (cons.count >= DEBOUNCE) {
        setConfirmedGesture(raw.type);
        return { ...raw, cursor: smooth };
      }
    } else {
      consecutiveRef.current = { type: raw.type, count: 1 };
    }

    return { ...raw, cursor: smooth };
  }, []);

  const updateCalibration = useCallback((bounds: CalibrationBounds) => {
    boundsRef.current = bounds;
  }, []);

  const reset = useCallback(() => {
    classifierRef.current.reset();
    filterRef.current.reset();
    consecutiveRef.current = { type: 'NONE', count: 0 };
    setConfirmedGesture('NONE');
  }, []);

  return { confirmedGesture, smoothCursor, confidence, processLandmarks, updateCalibration, reset };
}
