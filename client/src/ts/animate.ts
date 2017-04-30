// Module for animating displays.

// Interface for animation options. The duration specifies the duration of the
// animation in seconds (60 fps).
export interface AnimateOptions { duration: number; }

// Animation function for transitions between start and end. The callback is
// called with the updated value each step.
export function Animate(start: number, end: number, options: AnimateOptions,
                        callback: (new_val: number) => void): void {
  let currentIteration = 1;
  const interations = 60 * options.duration;
  let direction = 1;
  if (start > end) {
    direction = -1;
  }

  function easeCubic(pos: number): number {
    pos /= 0.5;
    if (pos < 1) {
      return 0.5 * Math.pow(pos, 3);
    }
    return 0.5 * (Math.pow(pos - 2, 3) + 2);
  }

  function animate(): void {
    if (start === end) {
      return;
    }
    const progress = currentIteration++ / interations;
    let value = start + direction * currentIteration * easeCubic(progress);
    if (direction > 0 && value > end) {
      value = end;
    } else if (direction < 0 && value < end) {
      value = end;
    }
    callback(value);
    window.requestAnimationFrame(animate);
  }

  window.requestAnimationFrame(animate);
}
