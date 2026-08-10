import { MouseController } from './mouseController.js';
import type { GestureEvent, GestureType } from './types.js';

const CLICK_COOLDOWN = 350; // ms — tighter window prevents double-fires, loose enough to feel responsive

export class GestureHandler {
  private lastGesture: GestureType = 'NONE';
  private lastClickTime = 0;
  private isDragging = false;

  constructor(private mouse: MouseController) {}

  async handle(event: GestureEvent): Promise<string> {
    const { type, cursor, mode } = event;

    if (mode === 'mobile-nav') return 'mobile-nav handled client-side';

    const now = Date.now();
    const canClick = now - this.lastClickTime > CLICK_COOLDOWN;

    try {
      switch (type) {
        case 'MOVE':
          this.mouse.moveTo(cursor.x, cursor.y);
          break;

        case 'LEFT_CLICK':
          // Do NOT move cursor during click — pinching shifts the fingertip position
          // and causes the click to land in the wrong spot.
          if (canClick && this.lastGesture !== 'LEFT_CLICK') {
            this.mouse.leftClick();
            this.lastClickTime = now;
          }
          break;

        case 'RIGHT_CLICK':
          if (canClick && this.lastGesture !== 'RIGHT_CLICK') {
            this.mouse.rightClick();
            this.lastClickTime = now;
          }
          break;

        case 'DOUBLE_CLICK':
          if (canClick && this.lastGesture !== 'DOUBLE_CLICK') {
            this.mouse.doubleClick();
            this.lastClickTime = now;
          }
          break;

        case 'DRAG_START':
          if (!this.isDragging) {
            this.mouse.dragStart(cursor.x, cursor.y);
            this.isDragging = true;
          } else {
            this.mouse.moveTo(cursor.x, cursor.y);
          }
          break;

        case 'DRAG_END':
          if (this.isDragging) {
            this.mouse.dragEnd();
            this.isDragging = false;
          }
          break;

        case 'SCROLL_UP':
          this.mouse.scrollUp(5);
          break;

        case 'SCROLL_DOWN':
          this.mouse.scrollDown(5);
          break;

        case 'SWIPE_LEFT':
          if (this.lastGesture !== 'SWIPE_LEFT') this.mouse.back();
          break;

        case 'SWIPE_RIGHT':
          if (this.lastGesture !== 'SWIPE_RIGHT') this.mouse.forward();
          break;

        case 'PAUSE':
        case 'NONE':
          if (this.isDragging) {
            this.mouse.dragEnd();
            this.isDragging = false;
          }
          break;
      }
    } catch (err) {
      console.error('[GestureHandler]', err);
      return 'error';
    }

    this.lastGesture = type;
    return 'ok';
  }
}
