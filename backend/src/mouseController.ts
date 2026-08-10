import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

// Python script embedded as a string — no separate .py file needed.
// Uses ctypes on Windows for zero-latency mouse control.
const PYTHON_SCRIPT = `
import sys, json, platform, time

try:
    import pyautogui
    pyautogui.FAILSAFE = False
    pyautogui.PAUSE = 0
except ImportError:
    sys.stderr.write("FATAL: pyautogui missing. Run: pip install pyautogui\\n")
    sys.exit(1)

W, H = pyautogui.size()
IS_WIN = platform.system() == 'Windows'

if IS_WIN:
    import ctypes
    u32 = ctypes.windll.user32
    def _move(x, y):    u32.SetCursorPos(int(x), int(y))
    def _ldown():       u32.mouse_event(0x0002, 0, 0, 0, 0)
    def _lup():         u32.mouse_event(0x0004, 0, 0, 0, 0)
    def _rclick():
        u32.mouse_event(0x0008, 0, 0, 0, 0)
        u32.mouse_event(0x0010, 0, 0, 0, 0)
    def _dclick():
        u32.mouse_event(0x0002, 0, 0, 0, 0); u32.mouse_event(0x0004, 0, 0, 0, 0)
        time.sleep(0.05)
        u32.mouse_event(0x0002, 0, 0, 0, 0); u32.mouse_event(0x0004, 0, 0, 0, 0)
else:
    def _move(x, y):    pyautogui.moveTo(x, y)
    def _ldown():       pyautogui.mouseDown()
    def _lup():         pyautogui.mouseUp()
    def _rclick():      pyautogui.rightClick()
    def _dclick():      pyautogui.doubleClick()

sys.stdout.write(json.dumps({'status': 'ready', 'width': W, 'height': H}) + '\\n')
sys.stdout.flush()

for raw in sys.stdin:
    raw = raw.strip()
    if not raw: continue
    try:
        cmd = json.loads(raw)
        a = cmd.get('action', '')
        if   a == 'move':         _move(cmd['x'], cmd['y'])
        elif a == 'click':        _ldown(); _lup()
        elif a == 'rclick':       _rclick()
        elif a == 'dclick':       _dclick()
        elif a == 'drag_start':   _move(cmd['x'], cmd['y']); _ldown()
        elif a == 'drag_end':     _lup()
        elif a == 'scroll_up':    pyautogui.scroll(cmd.get('amount', 5))
        elif a == 'scroll_down':  pyautogui.scroll(-cmd.get('amount', 5))
        elif a == 'back':         pyautogui.hotkey('alt', 'left')
        elif a == 'forward':      pyautogui.hotkey('alt', 'right')
    except Exception as e:
        sys.stderr.write(f'[mouse] {e}\\n'); sys.stderr.flush()
`;

export class MouseController extends EventEmitter {
  private proc: ChildProcess | null = null;
  screenWidth = 1920;
  screenHeight = 1080;
  private ready = false;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.proc = spawn('python', ['-c', PYTHON_SCRIPT], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.proc.stdout!.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const msg = JSON.parse(line);
            if (msg.status === 'ready') {
              this.screenWidth = msg.width;
              this.screenHeight = msg.height;
              this.ready = true;
              console.log(`[Mouse] Ready — screen: ${this.screenWidth}x${this.screenHeight}`);
              resolve();
            }
          } catch (_e) { /* ignore */ }
        }
      });

      this.proc.stderr!.on('data', (data: Buffer) => {
        const msg = data.toString().trim();
        if (msg.startsWith('FATAL')) {
          reject(new Error(msg));
        } else {
          process.stderr.write(`[python/mouse] ${msg}\n`);
        }
      });

      this.proc.on('exit', (code) => {
        this.ready = false;
        console.warn(`[Mouse] Python process exited with code ${code}`);
      });

      setTimeout(() => {
        if (!this.ready) reject(new Error('Mouse controller timed out'));
      }, 10000);
    });
  }

  private send(cmd: Record<string, unknown>) {
    if (!this.ready || !this.proc?.stdin) return;
    this.proc.stdin.write(JSON.stringify(cmd) + '\n');
  }

  moveTo(nx: number, ny: number) {
    this.send({ action: 'move', x: Math.round(nx * this.screenWidth), y: Math.round(ny * this.screenHeight) });
  }

  leftClick() { this.send({ action: 'click' }); }
  rightClick() { this.send({ action: 'rclick' }); }
  doubleClick() { this.send({ action: 'dclick' }); }

  dragStart(nx: number, ny: number) {
    this.send({ action: 'drag_start', x: Math.round(nx * this.screenWidth), y: Math.round(ny * this.screenHeight) });
  }

  dragEnd() { this.send({ action: 'drag_end' }); }
  scrollUp(amount = 5) { this.send({ action: 'scroll_up', amount }); }
  scrollDown(amount = 5) { this.send({ action: 'scroll_down', amount }); }
  back() { this.send({ action: 'back' }); }
  forward() { this.send({ action: 'forward' }); }

  destroy() {
    this.proc?.kill();
    this.proc = null;
  }
}
