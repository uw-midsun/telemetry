(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var svgns = 'http://www.w3.org/2000/svg';
    var Direction;
    (function (Direction) {
        Direction[Direction["CounterClockwise"] = -1] = "CounterClockwise";
        Direction[Direction["Clockwise"] = 1] = "Clockwise";
    })(Direction = exports.Direction || (exports.Direction = {}));
    var LineEnd;
    (function (LineEnd) {
        LineEnd[LineEnd["Flat"] = 1] = "Flat";
        LineEnd[LineEnd["Round"] = 2] = "Round";
    })(LineEnd = exports.LineEnd || (exports.LineEnd = {}));
    function Animate(start, end, duration, step, callback) {
        var currentIteration = 1;
        var interations = 60 * duration;
        if (start > end) {
            step = step * -1;
        }
        function easeCubic(pos) {
            pos /= 0.5;
            if (pos < 1) {
                return 0.5 * Math.pow(pos, 3);
            }
            return 0.5 * (Math.pow(pos - 2, 3) + 2);
        }
        function animate() {
            var progress = currentIteration++ / interations;
            var value = start + step * currentIteration * easeCubic(progress);
            callback(Math.round(value));
            if (step > 0 && value < end) {
                window.requestAnimationFrame(animate);
            }
            else if (step < 0 && value > end) {
                window.requestAnimationFrame(animate);
            }
        }
        window.requestAnimationFrame(animate);
    }
    function polarToCartesian(centerX, centerY, radius, angle) {
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    }
    function describeArc(x, y, radius, startAngle, endAngle, reverse) {
        var start = polarToCartesian(x, y, radius, endAngle);
        var end = polarToCartesian(x, y, radius, startAngle);
        var largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';
        return [
            'M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(' ');
    }
    var DialOptions = (function () {
        function DialOptions() {
            this.min = 0;
            this.max = 100;
            this.step = 1;
            this.angleOffset = 0;
            this.angleArc = 2 * Math.PI;
            this.rotation = Direction.Clockwise;
            this.duration = 1;
            this.thickness = 1;
            this.padding = 5;
            this.lineCap = LineEnd.Flat;
            this.dialColor = '#000000';
            this.dialOpacity = 1;
            this.rectColor = '#ffffff';
            this.rectOpacity = 1;
            this.showText = true;
            this.font = 'Open Sans';
            this.fontSize = 30;
            this.fontColor = '#000000';
        }
        return DialOptions;
    }());
    exports.DialOptions = DialOptions;
    var Dial = (function () {
        function Dial(div, options) {
            this._value = 0;
            this._div = div;
            this._options = options;
            this._svg = document.createElementNS(svgns, 'svg');
            this._svg.setAttribute('style', 'width:100%; height:100%');
            this._div.appendChild(this._svg);
            this._rect = document.createElementNS(svgns, 'rect');
            this._svg.appendChild(this._rect);
            this._path = document.createElementNS(svgns, 'path');
            this._svg.appendChild(this._path);
            this._text = document.createElementNS(svgns, 'text');
            this._svg.appendChild(this._text);
            this.updateOptions(options);
            this.draw();
        }
        Dial.prototype.updateOptions = function (options) {
            this._options = options;
            this._delta = this._options.max - this._options.min;
            this._path.setAttribute('fill-opacity', '0');
            if (this._options.lineCap === LineEnd.Flat) {
                this._path.setAttribute('stroke-linecap', 'butt');
            }
            else {
                this._path.setAttribute('stroke-linecap', 'round');
            }
            this._path.setAttribute('stroke', this._options.dialColor);
            this._path.setAttribute('stroke-width', this._options.thickness.toString());
            this._path.setAttribute('stroke-opacity', this._options.dialOpacity.toString());
            this._rect.setAttribute('fill', this._options.rectColor);
            this._rect.setAttribute('fill-opacity', this._options.rectOpacity.toString());
            this._text.setAttribute('text-anchor', 'middle');
            this._text.setAttribute('alignment-baseline', 'middle');
            this._text.setAttribute('fill', this._options.fontColor);
            this._text.setAttribute('font-family', this._options.font);
            this._text.setAttribute('font-size', this._options.fontSize.toString());
            this.draw();
        };
        Dial.prototype.updateValue = function (value) {
            var _this = this;
            var update = function (new_val) {
                if (new_val > _this._options.max) {
                    new_val = _this._options.max;
                }
                else if (new_val < _this._options.min) {
                    new_val = _this._options.min;
                }
                _this._value = new_val;
                _this.draw();
            };
            Animate(this._value, value, this._options.duration, this._options.step, update);
        };
        Dial.prototype.drawPath = function (path, radius, value, offset) {
            if (this._options.rotation === Direction.Clockwise) {
                var angleEnd = this._options.angleArc * (value - this._options.min) / this._delta +
                    this._options.angleOffset;
                path.setAttribute('d', describeArc(this._svg.clientWidth / 2, this._svg.clientHeight / 2, radius, this._options.angleOffset + offset, angleEnd + offset, false));
            }
            else {
                var angleEnd = this._options.angleArc -
                    this._options.angleArc * (value - this._options.min) / this._delta -
                    this._options.angleOffset;
                path.setAttribute('d', describeArc(this._svg.clientWidth / 2, this._svg.clientHeight / 2, radius, angleEnd + offset, this._options.angleOffset - offset, false));
            }
        };
        Dial.prototype.draw = function () {
            this._rect.setAttribute('width', (this._svg.clientWidth).toString());
            this._rect.setAttribute('height', (this._svg.clientHeight).toString());
            var radius = Math.min(this._svg.clientWidth, this._svg.clientHeight) / 2 -
                this._options.padding - this._options.thickness / 2;
            this.drawPath(this._path, radius, this._value, 0);
            if (this._options.showText) {
                this._text.innerHTML = this._value.toString();
                this._text.setAttribute('x', (this._svg.clientWidth / 2).toString());
                this._text.setAttribute('y', (this._svg.clientHeight / 2).toString());
            }
        };
        return Dial;
    }());
    exports.Dial = Dial;
});
//# sourceMappingURL=dial.js.map