import animate = require('./animate');

const svgns = 'http://www.w3.org/2000/svg';

// Direction to turn the dial in.
export enum Direction {
  CounterClockwise = -1,
  Clockwise = 1
}

// Utilities:
// TODO(ckitagawa): Consider moving these to a utility module.

// Maps polar coordinates to Cartesian.
function polarToCartesian(centerX: number, centerY: number, radius: number,
                          angle: number): any {
  return {
    x : centerX + radius * Math.cos(angle),
    y : centerY + radius * Math.sin(angle)
  };
  }

// Describes an SVG arc as a string.
function describeArc(x: number, y: number, radius: number, startAngle: number,
                     endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';

  return [
    'M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ');
  }

// Options to adjust the behavior of Dial.
export class DialOptions {
  // Shape
  public min: number = 0;
  public max: number = 100;
  public angleOffset: number = 0;
  public angleArc: number = 2 * Math.PI;
  public rotation: Direction = Direction.Clockwise;
  public autoRedraw: boolean = true;

  // Animation
  public animationDuration: number = 1;
  public step: number = 1;

  public formatter: (d: number) => string = (d: number) => d.toString();
  }

// Class for drawing SVG based dials.
export class Dial {
  private _svg: SVGElement;
  private _path: SVGPathElement;
  private _text: SVGTextElement;
  private _value: number;
  private _delta: number;
  private _div: HTMLDivElement;
  private _options: DialOptions;

  constructor(div: HTMLDivElement, options: DialOptions, value?: number) {
    this._div = div;
    if (value) {
      this._value = value;
    } else {
      this._value = 0;
    }
    this._svg = document.createElementNS(svgns, 'svg') as SVGElement;
    this._svg.setAttribute('style', 'width:100%; height:100%');
    this._div.appendChild(this._svg);
    this._path = document.createElementNS(svgns, 'path') as SVGPathElement;
    this._path.id = this._div.id + '-path';
    this._svg.appendChild(this._path);
    this._text = document.createElementNS(svgns, 'text') as SVGTextElement;
    this._text.id = this._div.id + '-text';
    this._svg.appendChild(this._text);
    this.options(options);
  }

  // Updates the options and changes settings internally accordingly.
  public options(): DialOptions;
  public options(options: DialOptions): this;
  public options(options?: DialOptions): DialOptions|this {
    if (options) {
      this._options = options;
      this._delta = this._options.max - this._options.min;
      if (this._options.autoRedraw) {
        this.redraw();
        }
      return this;
      }
    return this._options;
  }

  // Updates or reads value of the dial.
  public value(): number;
  public value(value: number): this;
  public value(value?: number): number|this {
    if (value) {
      const update = (new_val: number) => {
        if (new_val > this._options.max) {
          new_val = this._options.max;
        } else if (new_val < this._options.min) {
          new_val = this._options.min;
        }
        this._value = new_val;
        this.redraw();
      };
      animate.Animate(this._value, value, this._options.animationDuration,
                      this._options.step, update);
      return this;
      }
    return this._value;
  }

  // Draws the actual dial.
  public redraw(): void {
    const radius =
        Math.min(this._svg.clientWidth, this._svg.clientHeight) / 2 -
        parseFloat(window.getComputedStyle(this._path, null).strokeWidth) / 2;
    this.drawPath(this._path, radius, this._value, 0);

    // Draw the text.
    this._text.innerHTML = this._options.formatter(this._value);
    this._text.setAttribute('x', (this._svg.clientWidth / 2).toString());
    this._text.setAttribute('y', (this._svg.clientHeight / 2).toString());
  }

  // Helper that draws the SVG path component of the dial.
  private drawPath(path: SVGPathElement, radius: number, value: number,
                   offset: number): void {
    if (this._options.rotation === Direction.Clockwise) {
      const angleEnd =
          this._options.angleArc * (value - this._options.min) / this._delta +
          this._options.angleOffset;
      path.setAttribute('d', describeArc(this._svg.clientWidth / 2,
                                         this._svg.clientHeight / 2, radius,
                                         this._options.angleOffset + offset,
                                         angleEnd + offset));
    } else {
      const angleEnd =
          this._options.angleArc -
          this._options.angleArc * (value - this._options.min) / this._delta -
          this._options.angleOffset;
      path.setAttribute('d', describeArc(this._svg.clientWidth / 2,
                                         this._svg.clientHeight / 2, radius,
                                         angleEnd + offset,
                                         this._options.angleOffset - offset));
    }
  }
}
