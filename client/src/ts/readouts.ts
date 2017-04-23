// Module that builds a readout for the driver display containing a value and
// units. The readout is surrounded by a circle. All objects are SVG.
import animate = require('./animate');

const svgns = 'http://www.w3.org/2000/svg';

// Options to configure the readout.
export class ReadoutOptions {
  public units: string;
  public formatter: (d: number) => string = (d: number) => d.toString();
  public autoRedraw: boolean = true;
}

// Class for displaying instantaneous readouts of values in a nice format via
// SVG.
export class Readout {
  private _div: HTMLDivElement;
  private _svg: SVGElement;
  private _value: number;
  private _options: ReadoutOptions;
  private _circle: SVGCircleElement;
  private _units: SVGTextElement;
  private _text: SVGTextElement;

  constructor(div: HTMLDivElement, options: ReadoutOptions);
  constructor(div: HTMLDivElement, options: ReadoutOptions, value: number);
  constructor(div: HTMLDivElement, options: ReadoutOptions, value?: number) {
    this._div = div;
    if (value) {
      this._value = value;
    } else {
      this._value = 0;
    }
    this._svg = document.createElementNS(svgns, 'svg') as SVGElement;
    this._svg.setAttribute('style', 'width: 100%; height: 100%;');
    this._div.appendChild(this._svg);
    this._circle =
        document.createElementNS(svgns, 'circle') as SVGCircleElement;
    this._circle.setAttribute('id', this._div.getAttribute('id') + '-circle');
    this._svg.appendChild(this._circle);
    this._units = document.createElementNS(svgns, 'text') as SVGTextElement;
    this._units.setAttribute('id', this._div.getAttribute('id') + '-units');
    this._svg.appendChild(this._units);
    this._text = document.createElementNS(svgns, 'text') as SVGTextElement;
    this._text.setAttribute('id', this._div.getAttribute('id') + '-text');
    this._svg.appendChild(this._text);
    this.options(options);
  }

  // Update the options.
  public options(): ReadoutOptions;
  public options(options: ReadoutOptions): this;
  public options(options?: ReadoutOptions): ReadoutOptions|this {
    if (options) {
      this._options = options;
      if (this._options.autoRedraw) {
        this.redraw();
        }
      return this;
      }
    return this._options;
  }

  // Update the value of the readout.
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

  // Redraws/draws the readout.
  public redraw(): void {
    const half_x = (this._div.clientWidth / 2).toString();
    const radius =
        Math.min(this._div.clientWidth, this._div.clientHeight) / 2 -
        parseFloat(window.getComputedStyle(this._circle, null).strokeWidth) / 2;
    this._circle.setAttribute('cx', half_x);
    this._circle.setAttribute('cy', (this._div.clientHeight / 2).toString());
    this._circle.setAttribute('r', (radius).toString());

    this._text.innerHTML = this._options.formatter(this._value);
    this._text.setAttribute('x', half_x);

    // Only renders the units if present. Otherwise centers the value.
    if (this._options.units) {
      // TODO(ckitagawa): Determine if it is possible to get font height that
      // will make this calculation more consistent/resizeable.
      this._text.setAttribute(
          'y', (this._div.clientHeight / 2 - radius / 6).toString());
      this._units.innerHTML = this._options.units;
      this._units.setAttribute('x', half_x);
      this._units.setAttribute(
          'y', (this._div.clientHeight / 2 + radius / 2).toString());
    } else {
      this._text.setAttribute('y', (this._div.clientHeight / 2).toString());
    }
  }
}
