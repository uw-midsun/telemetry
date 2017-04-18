const svgns = 'http://www.w3.org/2000/svg';

// direction to turn the dial in.
export enum Direction {
  CounterClockwise = -1,
  Clockwise = 1
}

// line ending style.
export enum LineEnd {
  Flat = 1,
  Round = 2,
}

// animate the curve of the arc using a cubic easing function and animate
// frames.
function Animate(start: number, end: number, duration: number, step: number,
                 callback: (new_val: number) => void): void {
  let currentIteration = 1;
  const interations = 60 * duration;
  if (start > end) {
    step = step * -1;
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

// maps polar coordinates to Cartesian to draw the dial.
function polarToCartesian(centerX: number, centerY: number, radius: number,
                          angle: number): any {
  return {
    x : centerX + radius * Math.cos(angle),
    y : centerY + radius * Math.sin(angle)
  };
}

// describes the SVG arc as a string.
function describeArc(x: number, y: number, radius: number, startAngle: number,
                     endAngle: number, reverse: boolean): string {
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
  public step: number = 1;
  public angleOffset: number = 0;
  public angleArc: number = 2 * Math.PI;
  public rotation: Direction = Direction.Clockwise;

  // UI
  public animationDuration: number = 1;
  public thickness: number = 1;
  public padding: number = 5;
  public lineCap: LineEnd = LineEnd.Flat;
  public dialColor: string = '#000000';
  public dialOpacity: number = 1;
  public rectColor: string = '#ffffff';
  public rectOpacity: number = 1;
  public showText: boolean = true;
  public font: string = 'Open Sans';
  public fontSize: number = 30;
  public fontColor: string = '#000000';
}

// class for drawing SVG based dials.
export class Dial {
  private _svg: SVGElement;
  private _rect: SVGRectElement;
  private _path: SVGPathElement;
  private _text: SVGTextElement;
  private _value: number = 0;
  private _delta: number;
  private _div: HTMLDivElement;
  private _options: DialOptions;

  constructor(div: HTMLDivElement, options: DialOptions) {
    this._div = div;
    this._svg = document.createElementNS(svgns, 'svg') as SVGElement;
    this._svg.setAttribute('style', 'width:100%; height:100%');
    this._div.appendChild(this._svg);
    this._rect = document.createElementNS(svgns, 'rect') as SVGRectElement;
    this._svg.appendChild(this._rect);
    this._path = document.createElementNS(svgns, 'path') as SVGPathElement;
    this._svg.appendChild(this._path);
    this._text = document.createElementNS(svgns, 'text') as SVGTextElement;
    this._svg.appendChild(this._text);

    this.updateOptions(options);
    this.draw();
  }

  // updates the options and changes settings internally accordingly.
  // TODO(ckitagawa): overload this to be an accessor as well.
  public updateOptions(options: DialOptions): void {
    this._options = options;

    this._delta = this._options.max - this._options.min;

    this._path.setAttribute('fill-opacity', '0');
    if (this._options.lineCap === LineEnd.Flat) {
      this._path.setAttribute('stroke-linecap', 'butt');
    } else {
      this._path.setAttribute('stroke-linecap', 'round');
    }
    this._path.setAttribute('stroke', this._options.dialColor);
    this._path.setAttribute('stroke-width', this._options.thickness.toString());
    this._path.setAttribute('stroke-opacity',
                            this._options.dialOpacity.toString());
    this._rect.setAttribute('fill', this._options.rectColor);
    this._rect.setAttribute('fill-opacity',
                            this._options.rectOpacity.toString());
    this._text.setAttribute('text-anchor', 'middle');
    this._text.setAttribute('alignment-baseline', 'middle');
    this._text.setAttribute('fill', this._options.fontColor);
    this._text.setAttribute('font-family', this._options.font);
    this._text.setAttribute('font-size', this._options.fontSize.toString());
    this.draw();
  }

  // updates the value of the dial and redraws accordingly.
  public updateValue(value: number): void {
    const update = (new_val: number) => {
      if (new_val > this._options.max) {
        new_val = this._options.max;
      } else if (new_val < this._options.min) {
        new_val = this._options.min;
      }
      this._value = new_val;
      this.draw();
    };
    Animate(this._value, value, this._options.animationDuration,
            this._options.step, update);
  }

  // helper that draws the SVG path component of the dial.
  private drawPath(path: SVGPathElement, radius: number, value: number,
                   offset: number): void {
    if (this._options.rotation === Direction.Clockwise) {
      const angleEnd =
          this._options.angleArc * (value - this._options.min) / this._delta +
          this._options.angleOffset;
      path.setAttribute('d', describeArc(this._svg.clientWidth / 2,
                                         this._svg.clientHeight / 2, radius,
                                         this._options.angleOffset + offset,
                                         angleEnd + offset, false));
    } else {
      const angleEnd =
          this._options.angleArc -
          this._options.angleArc * (value - this._options.min) / this._delta -
          this._options.angleOffset;
      path.setAttribute('d',
                        describeArc(this._svg.clientWidth / 2,
                                    this._svg.clientHeight / 2, radius,
                                    angleEnd + offset,
                                    this._options.angleOffset - offset, false));
    }
  }

  // draws the actual dial.
  private draw(): void {
    // draw the rectangle.
    this._rect.setAttribute('width', (this._svg.clientWidth).toString());
    this._rect.setAttribute('height', (this._svg.clientHeight).toString());

    // draw the arc.
    const radius = Math.min(this._svg.clientWidth, this._svg.clientHeight) / 2 -
                   this._options.padding - this._options.thickness / 2;
    this.drawPath(this._path, radius, this._value, 0);

    // draw the text.
    if (this._options.showText) {
      this._text.innerHTML = this._value.toString();
      this._text.setAttribute('x', (this._svg.clientWidth / 2).toString());
      this._text.setAttribute('y', (this._svg.clientHeight / 2).toString());
    }
  }
}
