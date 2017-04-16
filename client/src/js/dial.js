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
    var svgns = "http://www.w3.org/2000/svg";
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
            if ((pos /= 0.5) < 1) {
                return 0.5 * Math.pow(pos, 3);
            }
            return 0.5 * (Math.pow(pos - 2, 3), +2);
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
        var largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
        return [
            "M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");
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
            this.dialColor = "#000000";
            this.dialOpacity = 1;
            this.rectColor = "#FFFFFF";
            this.rectOpacity = 1;
            this.showText = true;
            this.font = "Verdana";
            this.fontSize = 30;
            this.fontColor = "#000000";
        }
        return DialOptions;
    }());
    exports.DialOptions = DialOptions;
    var Dial = (function () {
        function Dial(div, options) {
            this.div = div;
            this.options = options;
            this.value = 0;
            this.svg = document.createElementNS(svgns, "svg");
            this.svg.setAttribute('style', "width:100%; height:100%");
            this.div.appendChild(this.svg);
            this.rect = document.createElementNS(svgns, "rect");
            this.svg.appendChild(this.rect);
            this.path = document.createElementNS(svgns, "path");
            this.svg.appendChild(this.path);
            this.text = document.createElementNS(svgns, "text");
            this.svg.appendChild(this.text);
            this.updateOptions(options);
            this.draw();
        }
        Dial.prototype.drawPath = function (path, radius, value, offset) {
            if (this.options.rotation == Direction.Clockwise) {
                var angleEnd = this.options.angleArc * (value - this.options.min) / this.delta +
                    this.options.angleOffset;
                path.setAttribute("d", describeArc(this.svg.clientWidth / 2, this.svg.clientHeight / 2, radius, this.options.angleOffset + offset, angleEnd + offset, false));
            }
            else {
                var angleEnd = this.options.angleArc -
                    this.options.angleArc * (value - this.options.min) / this.delta -
                    this.options.angleOffset;
                path.setAttribute("d", describeArc(this.svg.clientWidth / 2, this.svg.clientHeight / 2, radius, angleEnd + offset, this.options.angleOffset - offset, false));
            }
        };
        Dial.prototype.draw = function () {
            this.rect.setAttribute("width", (this.svg.clientWidth).toString());
            this.rect.setAttribute("height", (this.svg.clientHeight).toString());
            var radius = Math.min(this.svg.clientWidth, this.svg.clientHeight) / 2 -
                this.options.padding - this.options.thickness / 2;
            this.drawPath(this.path, radius, this.value, 0);
            if (this.options.showText) {
                this.text.innerHTML = this.value.toString();
                this.text.setAttribute("x", (this.svg.clientWidth / 2).toString());
                this.text.setAttribute("y", (this.svg.clientHeight / 2).toString());
            }
        };
        Dial.prototype.updateOptions = function (options) {
            this.options = options;
            this.delta = this.options.max - this.options.min;
            this.path.setAttribute("fill-opacity", "0");
            if (this.options.lineCap = LineEnd.Flat) {
                this.path.setAttribute("stroke-linecap", "butt");
            }
            else {
                this.path.setAttribute("stroke-linecap", "round");
            }
            this.path.setAttribute("stroke", this.options.dialColor);
            this.path.setAttribute("stroke-width", this.options.thickness.toString());
            this.path.setAttribute("stroke-opacity", this.options.dialOpacity.toString());
            this.rect.setAttribute("fill", this.options.rectColor);
            this.rect.setAttribute("fill-opacity", this.options.rectOpacity.toString());
            this.text.setAttribute("text-anchor", "middle");
            this.text.setAttribute("alignment-baseline", "middle");
            this.text.setAttribute("fill", this.options.fontColor);
            this.text.setAttribute("font-family", this.options.font);
            this.text.setAttribute("font-size", this.options.fontSize.toString());
            this.draw();
        };
        Dial.prototype.updateValue = function (value) {
            var _this = this;
            var update = function (new_val) {
                if (new_val > _this.options.max) {
                    new_val = _this.options.max;
                }
                else if (new_val < _this.options.min) {
                    new_val = _this.options.min;
                }
                _this.value = new_val;
                _this.draw();
            };
            Animate(this.value, value, this.options.duration, this.options.step, update);
        };
        return Dial;
    }());
    exports.Dial = Dial;
});
//# sourceMappingURL=dial.js.map