// Animation function for transitions between start and end using a step size.
// the duration specifies the duration of the animation in seconds (60 fps).
// the callback is called with the updated value each step.
export function Animate(start: number, end: number, duration: number,
                        step: number,
                        callback: (new_val: number) => void): void {
  let currentIteration = 1;
  const interations = 60 * duration;
  if (start > end) {
    step = Math.abs(step) * -1;
    }

  function easeCubic(pos: number): number {
    pos /= 0.5;
    if (pos < 1) {
      return 0.5 * Math.pow(pos, 3);
      }
    return 0.5 * (Math.pow(pos - 2, 3) + 2);
    }

  function animate(): void {
    const progress = currentIteration++ / interations;
    const value = start + step * currentIteration * easeCubic(progress);
    callback(Math.round(value));
    if (step > 0 && value < end) {
      window.requestAnimationFrame(animate);
    } else if (step < 0 && value > end) {
      window.requestAnimationFrame(animate);
    }
  }

  window.requestAnimationFrame(animate);
}
