const svgns = 'http://www.w3.org/2000/svg';

export class ReadoutOptions {
  public name: string;
  public units: string;
  // Required to accurately draw without overflowing the div.
  public strokeWidth: number;
}

// Class for displaying instantaneous readouts of values in a nice format via
// SVG.
export class Readout {
  private _div: HTMLDivElement;
  private _value: number;
  private _options: ReadoutOptions;
  private _circle: SVGCircleElement;
  private _name: SVGTextElement;
  private _units: SVGTextElement;
  private _text: SVGTextElement;

  constructor(div: HTMLDivElement, options: ReadoutOptions) {
    this._div = div;
    this._options = options;
    this._circle =
        document.createElementNS(svgns, 'circle') as SVGCircleElement;
    this._div.appendChild(this._circle);
    this._name = document.createElementNS(svgns, 'text') as SVGTextElement;
    this._div.appendChild(this._name);
    this._units = document.createElementNS(svgns, 'text') as SVGTextElement;
    this._div.appendChild(this._units);
    this._text = document.createElementNS(svgns, 'text') as SVGTextElement;
    this._div.appendChild(this._text);
    this.redraw();
  }

  public value(): number;
  public value(value: number): this;
  public value(value?: number): number|this {
    if (value) {
      this._value = value;
      this.redraw();
      return this;
    }
    return this._value;
  }

  public options(): ReadoutOptions;
  public options(options: ReadoutOptions): this;
  public options(options?: ReadoutOptions): ReadoutOptions|this {
    if (options) {
      this._options = options;
      this.redraw();
      return this;
    }
    return this._options;
  }

  public redraw(): void {
    const half_x = (this._div.clientWidth / 2).toString();
    const radius = Math.min(this._div.clientWidth, this._div.clientHeight) / 2 -
                   this._options.strokeWidth;
    this._circle.setAttribute("cx", half_x);
    this._circle.setAttribute("cy", (this._div.clientHeight / 2).toString());
    this._circle.setAttribute("r", (radius).toString());
    this._text.setAttribute("x", half_x);
    // TODO(ckitagawa): Determine if it is possible to get font height that will
    // make this calculation more consistent.
    this._text.setAttribute(
      "y", (this._div.clientHeight / 2 - radius / 3).toString());
    this._text.innerHTML = this._value.toString();
    
    this._units.setAttribute("x", half_x);
    this._units.setAttribute(
      "y", (this._div.clientHeight / 2 + radius / 2).toString());
    this._units.innerHTML = this._options.name;

    this._name.setAttribute("x", half_x);
    this._name.setAttribute(
      "y", (this._div.clientHeight / 2 + radius / 2).toString());
    this._name.innerHTML = this._options.name;
  }
}
