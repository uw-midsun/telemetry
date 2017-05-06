

export enum State {
  Hidden = 0,
  Shown = 1,
  Blink = 2
}

export interface VisibilityOptions {
  intervalSecs: number;
}

export class VisibilityController {
  private _element: HTMLElement;
  private _options: VisibilityOptions;
  private _blinkId: number|null = null;
  private _state: State;

  constructor(element: HTMLElement, options: VisibilityOptions, state?: State) {
    this._element = element;
    this._options = options;
    if (state) {
      this.state(state);
    } else {
      this.state(State.Hidden);
    }
  }

  public options() : VisibilityOptions;
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
      this._state = state;
      this._stopBlink(); 
      switch (state) {
        case State.Hidden as number:
          this._element.style.visibility = "hidden";
          break;
        case State.Shown as number:
          this._element.style.visibility = "visible";
          break;
        case State.Blink as number:
          this._blinkId = window.setInterval(this._toggleState(),
            this._options.intervalSecs * 1000);
          break;
      } 
    }
    return this._state;
  }

  private _stopBlink() {
    if (this._blinkId) {
      window.clearInterval(this._blinkId);
    }
  }

  private _toggleState(): void {
    const visibility = window.getComputedStyle(this._element, null).visibility;
    switch (visibility) {
      case "hidden":
        this._element.style.visibility = "visible";
        break;
      case "visible":
        this._element.style.visibility = "hidden";
        break;
      default:
        break;
    }
  }
}
