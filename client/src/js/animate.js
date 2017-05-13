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
    var Animator = (function () {
        function Animator(options) {
            this._animationId = null;
            this.options(options);
        }
        Animator.prototype.options = function (options) {
            if (options) {
                this._options = options;
                this._iterations = 60 * options.durationMillis / 1000;
            }
            return this._options;
        };
        Animator.prototype.animate = function (start, end, callback) {
            this.cancel();
            this._direction = 1;
            if (start > end) {
                this._direction = -1;
            }
            this._currentIteration = 1;
            this._start = start;
            this._end = end;
            this._callback = callback;
            this._animate();
        };
        Animator.prototype.cancel = function () {
            if (this._animationId) {
                window.cancelAnimationFrame(this._animationId);
            }
        };
        Animator.prototype._easeCubic = function (pos) {
            pos /= 0.5;
            if (pos < 1) {
                return 0.5 * Math.pow(pos, 3);
            }
            return 0.5 * (Math.pow(pos - 2, 3) + 2);
        };
        Animator.prototype._animate = function () {
            var _this = this;
            this.cancel();
            if (this._start === this._end) {
                return;
            }
            var progress = this._currentIteration++ / this._iterations;
            var value = this._start +
                this._direction * this._currentIteration * this._easeCubic(progress);
            if (this._direction > 0 && value > this._end) {
                value = this._end;
            }
            else if (this._direction < 0 && value < this._end) {
                value = this._end;
            }
            this._callback(value);
            var run = function () { return _this._animate(); };
            this._animationId = window.requestAnimationFrame(run);
        };
        return Animator;
    }());
    exports.Animator = Animator;
    ;
});
//# sourceMappingURL=animate.js.map