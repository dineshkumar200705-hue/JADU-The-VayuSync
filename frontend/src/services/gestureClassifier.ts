import type { Landmark, GestureType } from '@/types';

const LM = {
  WRIST: 0, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_TIP: 20,
};

// Wider threshold → easier to trigger. 0.14 = comfortable natural pinch.
const PINCH_THRESH = 0.14;
const SWIPE_VEL_THRESH = 0.9;
const SWIPE_WINDOW = 350;
const SCROLL_THRESH = 0.018;

interface PositionRecord { x: number; y: number; t: number; }

function dist(a: Landmark, b: Landmark) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function extended(lm: Landmark[], tip: number, pip: number, mcp: number) {
  return lm[tip].y < lm[pip].y && lm[pip].y < lm[mcp].y;
}

function thumbExtended(lm: Landmark[]) {
  return Math.abs(lm[LM.THUMB_TIP].x - lm[LM.INDEX_MCP].x) > 0.04;
}

export class GestureClassifier {
  private history: PositionRecord[] = [];
  private prevScrollY: number | null = null;

  private addHistory(x: number, y: number) {
    const now = Date.now();
    this.history.push({ x, y, t: now });
    this.history = this.history.filter(p => now - p.t < SWIPE_WINDOW);
  }

  private getVelocity(): { vx: number; vy: number } {
    if (this.history.length < 3) return { vx: 0, vy: 0 };
    const first = this.history[0];
    const last = this.history[this.history.length - 1];
    const dt = (last.t - first.t) / 1000 || 0.001;
    return { vx: (last.x - first.x) / dt, vy: (last.y - first.y) / dt };
  }

  classify(lm: Landmark[]): { type: GestureType; cursor: { x: number; y: number }; confidence: number } {
    const handSize = dist(lm[LM.WRIST], lm[LM.MIDDLE_MCP]) || 0.01;

    const tExt = thumbExtended(lm);
    const iExt = extended(lm, LM.INDEX_TIP, LM.INDEX_PIP, LM.INDEX_MCP);
    const mExt = extended(lm, LM.MIDDLE_TIP, LM.MIDDLE_PIP, LM.MIDDLE_MCP);
    const rExt = extended(lm, LM.RING_TIP, LM.RING_PIP, LM.RING_MCP);
    const pExt = extended(lm, LM.PINKY_TIP, LM.PINKY_PIP, LM.PINKY_MCP);

    const tiDist = dist(lm[LM.THUMB_TIP], lm[LM.INDEX_TIP]) / handSize;
    const tmDist = dist(lm[LM.THUMB_TIP], lm[LM.MIDDLE_TIP]) / handSize;
    const trDist = dist(lm[LM.THUMB_TIP], lm[LM.RING_TIP]) / handSize;

    // Cursor follows index fingertip (mirrored x)
    const cursor = { x: 1 - lm[LM.INDEX_TIP].x, y: lm[LM.INDEX_TIP].y };
    this.addHistory(cursor.x, cursor.y);

    // Open palm → PAUSE or SWIPE (highest priority)
    if (tExt && iExt && mExt && rExt && pExt) {
      const { vx, vy } = this.getVelocity();
      const speed = Math.sqrt(vx ** 2 + vy ** 2);
      if (speed > SWIPE_VEL_THRESH) {
        if (Math.abs(vx) > Math.abs(vy)) {
          return { type: vx > 0 ? 'SWIPE_RIGHT' : 'SWIPE_LEFT', cursor, confidence: 0.9 };
        }
        return { type: vy > 0 ? 'SWIPE_DOWN' : 'SWIPE_UP', cursor, confidence: 0.9 };
      }
      return { type: 'PAUSE', cursor, confidence: 0.95 };
    }

    // Pinch gestures — checked by thumb-finger distance only (no finger-extension check
    // because pinching naturally bends the target finger, making extension checks unreliable)
    if (tiDist < PINCH_THRESH) {
      return { type: 'LEFT_CLICK', cursor, confidence: Math.min(0.99, 1 - tiDist / PINCH_THRESH) };
    }
    if (tmDist < PINCH_THRESH) {
      return { type: 'RIGHT_CLICK', cursor, confidence: Math.min(0.99, 1 - tmDist / PINCH_THRESH) };
    }
    if (trDist < PINCH_THRESH) {
      return { type: 'DOUBLE_CLICK', cursor, confidence: Math.min(0.99, 1 - trDist / PINCH_THRESH) };
    }

    // Closed fist
    if (!iExt && !mExt && !rExt && !pExt) {
      return { type: 'FIST', cursor, confidence: 0.9 };
    }

    // Two fingers (index + middle) → scroll or drag
    if (iExt && mExt && !rExt && !pExt) {
      const cy = lm[LM.INDEX_TIP].y;
      if (this.prevScrollY !== null) {
        const dy = cy - this.prevScrollY;
        this.prevScrollY = cy;
        if (dy < -SCROLL_THRESH) return { type: 'SCROLL_UP', cursor, confidence: 0.85 };
        if (dy > SCROLL_THRESH) return { type: 'SCROLL_DOWN', cursor, confidence: 0.85 };
      } else {
        this.prevScrollY = cy;
      }
      return { type: 'DRAG_START', cursor, confidence: 0.8 };
    }

    this.prevScrollY = null;

    // One finger → move cursor
    if (iExt && !mExt && !rExt && !pExt) {
      return { type: 'MOVE', cursor, confidence: 0.95 };
    }

    // Three fingers → swipe
    if (iExt && mExt && rExt && !pExt) {
      const { vx, vy } = this.getVelocity();
      const speed = Math.sqrt(vx ** 2 + vy ** 2);
      if (speed > SWIPE_VEL_THRESH) {
        if (Math.abs(vx) > Math.abs(vy)) {
          return { type: vx > 0 ? 'SWIPE_RIGHT' : 'SWIPE_LEFT', cursor, confidence: 0.85 };
        }
        return { type: vy > 0 ? 'SWIPE_DOWN' : 'SWIPE_UP', cursor, confidence: 0.85 };
      }
    }

    return { type: 'NONE', cursor, confidence: 0 };
  }

  reset() {
    this.history = [];
    this.prevScrollY = null;
  }
}
