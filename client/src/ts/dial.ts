var svgns = "http://www.w3.org/2000/svg";

export enum Direction {
  CounterClockwise = -1,
  Clockwise = 1
}

export enum LineEnd {
  Flat = 1,
  Round = 2,
}

function Animate(start: number, end: number, duration: number, step: number,
                 callback: (new_val: number) => void) {
  let currentIteration = 1;
  const interations = 60 * duration;
  if (start > end) {
    step = step * -1;
  }

  function easeCubic(pos: number) {
    if ((pos /= 0.5) < 1) {
      return 0.5 * Math.pow(pos, 3);
    }
    return 0.5 * (Math.pow(pos - 2, 3), +2);
  }

  function animate() {
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

function polarToCartesian(centerX: number, centerY: number, radius: number,
                          angle: number) {
  return {
    x : centerX + radius * Math.cos(angle),
    y : centerY + radius * Math.sin(angle)
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number,
                     endAngle: number, reverse: boolean): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

  return [
    "M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

export class DialOptions {
  // Shape
  public min: number = 0;
  public max: number = 100;
  public step: number = 1;
  public angleOffset: number = 0;
  public angleArc: number = 2 * Math.PI;
  public rotation: Direction = Direction.Clockwise;

  // UI
  public duration: number = 1;
  public thickness: number = 1;
  public padding: number = 5;
  public lineCap: LineEnd = LineEnd.Flat;
  public dialColor: string = "#000000";
  public dialOpacity: number = 1;
  public rectColor: string = "#FFFFFF";
  public rectOpacity: number = 1;
  public showText: boolean = true;
  public font: string = "Verdana";
  public fontSize: number = 30;
  public fontColor: string = "#000000";
}

export class Dial {
  private svg: SVGElement;
  private rect: SVGRectElement;
  private path: SVGPathElement;
  private text: SVGTextElement;
  private value: number = 0;
  private delta: number;

  constructor(private div: HTMLDivElement, private options: DialOptions) {
    this.svg = <SVGElement>document.createElementNS(svgns, "svg");
    this.svg.setAttribute('style', "width:100%; height:100%");
    this.div.appendChild(this.svg);
    this.rect = <SVGRectElement>document.createElementNS(svgns, "rect");
    this.svg.appendChild(this.rect);
    this.path = <SVGPathElement>document.createElementNS(svgns, "path");
    this.svg.appendChild(this.path);
    this.text = <SVGTextElement>document.createElementNS(svgns, "text");
    this.svg.appendChild(this.text);

    this.updateOptions(options);
    this.draw();
  }

  private drawPath(path: SVGPathElement, radius: number, value: number,
                   offset: number): void {
    if (this.options.rotation == Direction.Clockwise) {
      const angleEnd =
          this.options.angleArc * (value - this.options.min) / this.delta +
          this.options.angleOffset;
      path.setAttribute("d", describeArc(this.svg.clientWidth / 2,
                                         this.svg.clientHeight / 2, radius,
                                         this.options.angleOffset + offset,
                                         angleEnd + offset, false));
    } else {
      const angleEnd =
          this.options.angleArc -
          this.options.angleArc * (value - this.options.min) / this.delta -
          this.options.angleOffset;
      path.setAttribute(
          "d", describeArc(this.svg.clientWidth / 2, this.svg.clientHeight / 2,
                           radius, angleEnd + offset,
                           this.options.angleOffset - offset, false));
    }
  }

  private draw(): void {
    // Draw the rectangle.
    this.rect.setAttribute("width", (this.svg.clientWidth).toString());
    this.rect.setAttribute("height", (this.svg.clientHeight).toString());

    // Draw the arc.
    const radius = Math.min(this.svg.clientWidth, this.svg.clientHeight) / 2 -
                   this.options.padding - this.options.thickness / 2;
    this.drawPath(this.path, radius, this.value, 0);

    // Draw the text.
    if (this.options.showText) {
      this.text.innerHTML = this.value.toString();
      this.text.setAttribute("x", (this.svg.clientWidth / 2).toString());
      this.text.setAttribute("y", (this.svg.clientHeight / 2).toString());
    }
  }

  public updateOptions(options: DialOptions): void {
    this.options = options;

    this.delta = this.options.max - this.options.min;

    this.path.setAttribute("fill-opacity", "0");
    if (this.options.lineCap = LineEnd.Flat) {
      this.path.setAttribute("stroke-linecap", "butt");
    } else {
      this.path.setAttribute("stroke-linecap", "round");
    }
    this.path.setAttribute("stroke", this.options.dialColor);
    this.path.setAttribute("stroke-width", this.options.thickness.toString());
    this.path.setAttribute("stroke-opacity",
                           this.options.dialOpacity.toString());
    this.rect.setAttribute("fill", this.options.rectColor);
    this.rect.setAttribute("fill-opacity", this.options.rectOpacity.toString());
    this.text.setAttribute("text-anchor", "middle");
    this.text.setAttribute("alignment-baseline", "middle");
    this.text.setAttribute("fill", this.options.fontColor);
    this.text.setAttribute("font-family", this.options.font);
    this.text.setAttribute("font-size", this.options.fontSize.toString());
    this.draw();
  }

  public updateValue(value: number) {
    let update = (new_val: number) => {
      if (new_val > this.options.max) {
        new_val = this.options.max;
      } else if (new_val < this.options.min) {
        new_val = this.options.min;
      }
      this.value = new_val;
      this.draw();
    };
    Animate(this.value, value, this.options.duration, this.options.step,
            update);
  }
}

