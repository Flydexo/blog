export type Phase = 'climbing' | 'summit' | 'falling' | 'returning';

/** Positions are fractions of the slope. The figure returns on foot, without a cut. */
export class Climb {
  progress = 0.43;
  person = 0.43;
  velocity = 0;
  phase: Phase = 'climbing';
  time = 0;
  private rest = 0;

  step(dt: number) {
    this.time += dt;
    if (this.phase === 'climbing') {
      this.velocity *= Math.exp(-2.2 * dt);
      this.progress += (0.033 + this.velocity) * dt;
      this.progress = Math.max(0, this.progress);
      this.person += (this.progress - this.person) * Math.min(1, dt * 8);
      if (this.progress >= 1) {
        this.progress = 1;
        this.phase = 'summit';
        this.rest = 0;
      }
    } else if (this.phase === 'summit') {
      this.person += (this.progress - this.person) * Math.min(1, dt * 8);
      this.rest += dt;
      if (this.rest > 1.1) { this.phase = 'falling'; this.velocity = -0.04; }
    } else if (this.phase === 'falling') {
      this.velocity -= dt * 0.34;
      this.progress += this.velocity * dt;
      this.person = Math.max(0, this.person - 0.12 * dt);
      if (this.progress <= 0) {
        this.progress = 0;
        this.velocity = 0;
        this.phase = 'returning';
      }
    } else {
      this.person = Math.max(0, this.person - dt * 0.17);
      if (this.person <= 0) {
        this.phase = 'climbing';
      }
    }
  }

}
