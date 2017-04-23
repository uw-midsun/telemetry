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
    var ReadoutOptions = (function () {
        function ReadoutOptions() {
            this.formatter = function (d) { return d.toString(); };
            this.autoRedraw = true;
        }
        return ReadoutOptions;
    }());
    exports.ReadoutOptions = ReadoutOptions;
    var Readout = (function () {
        function Readout(div, options, value) {
            this._div = div;
            if (value) {
                this._value = value;
            }
            else {
                this._value = 0;
            }
            this._svg = document.createElementNS(svgns, 'svg');
            this._svg.setAttribute('style', 'width: 100%; height: 100%;');
            this._div.appendChild(this._svg);
            this._circle =
                document.createElementNS(svgns, 'circle');
            this._circle.setAttribute('id', this._div.getAttribute('id') + '-circle');
            this._svg.appendChild(this._circle);
            this._units = document.createElementNS(svgns, 'text');
            this._units.setAttribute('id', this._div.getAttribute('id') + '-units');
            this._svg.appendChild(this._units);
            this._text = document.createElementNS(svgns, 'text');
            this._text.setAttribute('id', this._div.getAttribute('id') + '-text');
            this._svg.appendChild(this._text);
            this.options(options);
        }
        Readout.prototype.options = function (options) {
            if (options) {
                this._options = options;
                if (this._options.autoRedraw) {
                    this.redraw();
                }
                return this;
            }
            return this._options;
        };
        Readout.prototype.value = function (value) {
            if (value) {
                this._value = value;
                this.redraw();
                return this;
            }
            return this._value;
        };
        Readout.prototype.redraw = function () {
            var half_x = (this._div.clientWidth / 2).toString();
            var radius = Math.min(this._div.clientWidth, this._div.clientHeight) / 2 -
                parseFloat(window.getComputedStyle(this._circle, null).strokeWidth) / 2;
            this._circle.setAttribute('cx', half_x);
            this._circle.setAttribute('cy', (this._div.clientHeight / 2).toString());
            this._circle.setAttribute('r', (radius).toString());
            this._text.innerHTML = this._options.formatter(this._value);
            this._text.setAttribute('x', half_x);
            if (this._options.units) {
                this._text.setAttribute('y', (this._div.clientHeight / 2 - radius / 6).toString());
                this._units.innerHTML = this._options.units;
                this._units.setAttribute('x', half_x);
                this._units.setAttribute('y', (this._div.clientHeight / 2 + radius / 2).toString());
            }
            else {
                this._text.setAttribute('y', (this._div.clientHeight / 2).toString());
            }
        };
        return Readout;
    }());
    exports.Readout = Readout;
});
//# sourceMappingURL=readouts.js.map