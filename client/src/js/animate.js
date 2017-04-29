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
    function Animate(start, end, options, callback) {
        var currentIteration = 1;
        var interations = 60 * options.duration;
        var direction = 1;
        if (start > end) {
            direction = -1;
        }
        function easeCubic(pos) {
            pos /= 0.5;
            if (pos < 1) {
                return 0.5 * Math.pow(pos, 3);
            }
            return 0.5 * (Math.pow(pos - 2, 3) + 2);
        }
        function animate() {
            if (start == end) {
                return;
            }
            var progress = currentIteration++ / interations;
            var value = start + direction * currentIteration * easeCubic(progress);
            if (direction > 0 && value > end) {
                value = end;
            }
            else if (direction < 0 && value < end) {
                value = end;
            }
            callback(value);
            window.requestAnimationFrame(animate);
        }
        window.requestAnimationFrame(animate);
    }
    exports.Animate = Animate;
});
//# sourceMappingURL=animate.js.map