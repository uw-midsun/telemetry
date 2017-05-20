// Module for animating displays.

// Interface for animation options. The duration specifies the duration of the
// animation in milliseconds (60 fps).
export interface AnimateOptions { durationMillis: number; }

// Animation function for transitions between start and end. The callback is
// called with the updated value each step.

export class Animator {
  private _animationId: number|null = null;
  private _currentIteration: number;
  private _options: AnimateOptions;
  private _iterations: number;
  private _start: number;
  private _end: number;
  private _direction: number;
  private _callback: (new_val: number) => void;

  constructor(options: AnimateOptions) { this.options(options); }

  public options(): AnimateOptions;
  public options(options: AnimateOptions): this;
  public options(options?: AnimateOptions): AnimateOptions|this {
    if (options) {
      this._options = options;
      this._iterations = 60 * options.durationMillis / 1000;
    }
    return this._options;
  }

  public animate(start: number, end: number,
                 callback: (new_val: number) => void): void {
    this.cancel();
    this._direction = 1;
    if (start > end) {
      this._direction = -1;
    }
    this._currentIteration = 1;
    this._start = start;
    this._end = end;
    this._callback = callback;

    this._animate();
  }

  public cancel(): void {
    if (this._animationId) {
      window.cancelAnimationFrame(this._animationId);
    }
  }

  private _easeCubic(pos: number): number {
    pos /= 0.5;
    if (pos < 1) {
      return 0.5 * Math.pow(pos, 3);
    }

    return 0.5 * (Math.pow(pos - 2, 3) + 2);
  }

  private _animate(): void {
    this.cancel();
    if (this._start === this._end) {
      return;
    }

    const progress = this._currentIteration++ / this._iterations;
    let value =
        this._start +
        this._direction * this._currentIteration * this._easeCubic(progress);
    if (this._direction > 0 && value > this._end) {
      value = this._end;
    } else if (this._direction < 0 && value < this._end) {
      value = this._end;
    }
    this._callback(value);

    const run = () => this._animate();

    this._animationId = window.requestAnimationFrame(run);
  }
}
