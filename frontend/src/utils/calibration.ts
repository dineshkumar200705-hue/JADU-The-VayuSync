import type { CalibrationBounds } from '@/types';

const DEFAULT: CalibrationBounds = { minX: 0.05, maxX: 0.95, minY: 0.05, maxY: 0.95 };
const STORAGE_KEY = 'airmouse_calibration';

export function loadCalibration(): CalibrationBounds {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_e) { /* ignore */ }
  return { ...DEFAULT };
}

export function saveCalibration(bounds: CalibrationBounds) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bounds));
}

export function resetCalibration(): CalibrationBounds {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULT };
}

/** Map a raw [0,1] coordinate from the camera space to screen space. */
export function mapToScreen(
  rawX: number,
  rawY: number,
  bounds: CalibrationBounds,
): { x: number; y: number } {
  const cx = Math.max(bounds.minX, Math.min(bounds.maxX, rawX));
  const cy = Math.max(bounds.minY, Math.min(bounds.maxY, rawY));
  return {
    x: (cx - bounds.minX) / (bounds.maxX - bounds.minX),
    y: (cy - bounds.minY) / (bounds.maxY - bounds.minY),
  };
}

/** 4-corner calibration helper — collect corners, compute bounds. */
export class CalibrationWizard {
  private corners: { x: number; y: number }[] = [];

  addCorner(x: number, y: number) {
    this.corners.push({ x, y });
  }

  get step() { return this.corners.length; }

  isComplete() { return this.corners.length >= 4; }

  compute(): CalibrationBounds {
    const xs = this.corners.map(c => c.x);
    const ys = this.corners.map(c => c.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }

  reset() { this.corners = []; }
}
