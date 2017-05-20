// Visibility controller for elements that need to toggle on events.

// Possible states for the visibility control.
export enum State {
  Hidden = 1,
  Shown = 2,
  Blink = 3
}

// Options for the visibility.
export interface VisibilityOptions {
  intervalMillis: number;
}

// Controller for the visibility.
export class VisibilityController {
  private _element: HTMLElement;
  private _options: VisibilityOptions;
  private _blinkId: number|null = null;
  private _state: State;
  private _visible: boolean;

  constructor(element: HTMLElement, options: VisibilityOptions, state?: State) {
    this._element = element;
    this._options = options;
    if (state) {
      this.state(state);
    } else {
      this.state(State.Hidden);
    }
  }

  public options(): VisibilityOptions;
  public options(options: VisibilityOptions): this;
  public options(options?: VisibilityOptions): VisibilityOptions|this {
    if (options) {
      this._options = options;
      this.state(this._state);
      return this;
    }
    return this._options;
  }

  public state(): State;
  public state(state: State): this;
  public state(state?: State): State|this {
    if (state) {
      this._stopBlink();
      switch (state) {
        case State.Hidden as number:
          this._element.style.visibility = 'hidden';
          this._visible = false;
          break;
        case State.Shown as number:
          this._element.style.visibility = 'visible';
          this._visible = true;
          break;
        case State.Blink as number:
          this._blinkId = window.setInterval(() => this._toggleState(),
            this._options.intervalMillis);
          break;
        default:
          break;
      }
      this._state = state;
    }
    return this._state;
  }

  private _stopBlink(): void {
    if (this._blinkId) {
      window.clearInterval(this._blinkId);
    }
  }

  private _toggleState(): void {
    if (this._visible) {
      this._element.style.visibility = 'hidden';
      this._visible = false;
    } else {
      this._element.style.visibility = 'visible';
      this._visible = true;
    }
  }
}
