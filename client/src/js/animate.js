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
    function Animate(start, end, duration, step, callback) {
        var currentIteration = 1;
        var interations = 60 * duration;
        if (start > end) {
            step = Math.abs(step) * -1;
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
    exports.Animate = Animate;
});
//# sourceMappingURL=animate.js.map