/**
 * One Euro Filter — eliminates jitter without adding lag.
 * Lower minCutoff = more smoothing at rest.
 * Lower beta = less speed-dependent adaptation = uniformly smooth.
 */
export class OneEuroFilter {
  private x: number | null = null;
  private dx = 0;
  private lastTs: number | null = null;

  constructor(
    private readonly minCutoff = 0.4,   // was 0.8 — more smoothing at rest
    private readonly beta = 0.007,       // was 0.4 — nearly flat speed response = glassy smooth
    private readonly dCutoff = 1.0,
  ) {}

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(x: number, ts = performance.now()): number {
    if (this.x === null || this.lastTs === null) {
      this.x = x; this.lastTs = ts; return x;
    }
    const dt = Math.max((ts - this.lastTs) / 1000, 1e-6);
    const aDx = this.alpha(this.dCutoff, dt);
    const dx = (x - this.x) / dt;
    this.dx = aDx * dx + (1 - aDx) * this.dx;
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    const a = this.alpha(cutoff, dt);
    this.x = a * x + (1 - a) * this.x;
    this.lastTs = ts;
    return this.x;
  }

  reset() { this.x = null; this.dx = 0; this.lastTs = null; }
}

export class CursorFilter {
  private fx = new OneEuroFilter(0.4, 0.007);
  private fy = new OneEuroFilter(0.4, 0.007);

  filter(x: number, y: number) {
    const ts = performance.now();
    return { x: this.fx.filter(x, ts), y: this.fy.filter(y, ts) };
  }

  reset() { this.fx.reset(); this.fy.reset(); }
}
