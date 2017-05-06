(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./animate"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var animate = require("./animate");
    var svgns = 'http://www.w3.org/2000/svg';
    var Direction;
    (function (Direction) {
        Direction[Direction["CounterClockwise"] = -1] = "CounterClockwise";
        Direction[Direction["Clockwise"] = 1] = "Clockwise";
    })(Direction = exports.Direction || (exports.Direction = {}));
    function polarToCartesian(centerX, centerY, radius, angle) {
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    }
    function describeArc(x, y, radius, startAngle, endAngle) {
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
            this.angleOffset = 0;
            this.angleArc = 2 * Math.PI;
            this.rotation = Direction.Clockwise;
            this.autoRedraw = true;
            this.animationOptions = { duration: 40 };
            this.formatter = function (d) { return d.toString(); };
        }
        return DialOptions;
    }());
    exports.DialOptions = DialOptions;
    var Dial = (function () {
        function Dial(div, options, value) {
            var _this = this;
            this._div = div;
            if (value) {
                this._value = value;
            }
            else {
                this._value = 0;
            }
            this._svg = document.createElementNS(svgns, 'svg');
            this._svg.setAttribute('style', 'width:100%; height:100%');
            this._div.appendChild(this._svg);
            this._shadow = document.createElementNS(svgns, 'path');
            this._shadow.id = this._div.id + '-shadow';
            this._svg.appendChild(this._shadow);
            this._path = document.createElementNS(svgns, 'path');
            this._path.id = this._div.id + '-path';
            this._svg.appendChild(this._path);
            this._text = document.createElementNS(svgns, 'text');
            this._text.id = this._div.id + '-text';
            this._svg.appendChild(this._text);
            window.addEventListener('resize', function () {
                _this._update();
            });
            this._update();
            this.options(options);
        }
        Dial.prototype.options = function (options) {
            if (options) {
                this._options = options;
                this._delta = this._options.max - this._options.min;
                if (this._options.autoRedraw) {
                    this.redraw();
                }
                return this;
            }
            return this._options;
        };
        Dial.prototype.value = function (value) {
            var _this = this;
            if (value) {
                var update = function (new_val) {
                    _this._value = Math.round(new_val);
                    _this.redraw();
                };
                animate.Animate(this._value, value, this._options.animationOptions, update);
                return this;
            }
            return this._value;
        };
        Dial.prototype.redraw = function () {
            var radius = Math.min(this._width, this._height) / 2 -
                this._thickness / 2;
            this.drawPath(this._path, radius, this._value, 0);
            this.drawPath(this._shadow, radius, this._options.max, 0);
            this._text.innerHTML = this._options.formatter(this._value);
            this._text.setAttribute('x', (this._width / 2).toString());
            this._text.setAttribute('y', (this._height / 2).toString());
        };
        Dial.prototype._update = function () {
            this._thickness =
                parseFloat(window.getComputedStyle(this._path, null).strokeWidth);
            this._width = this._svg.clientWidth;
            this._height = this._svg.clientHeight;
        };
        Dial.prototype.drawPath = function (path, radius, value, offset) {
            if (this._options.rotation === Direction.Clockwise) {
                var angleEnd = this._options.angleArc * (value - this._options.min) / this._delta +
                    this._options.angleOffset;
                path.setAttribute('d', describeArc(this._width / 2, this._height / 2, radius, this._options.angleOffset + offset, angleEnd + offset));
            }
            else {
                var angleEnd = this._options.angleArc -
                    this._options.angleArc * (value - this._options.min) / this._delta -
                    this._options.angleOffset;
                path.setAttribute('d', describeArc(this._width / 2, this._height / 2, radius, angleEnd + offset, this._options.angleOffset - offset));
            }
        };
        return Dial;
    }());
    exports.Dial = Dial;
});
//# sourceMappingURL=dial.js.map