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
    var TimeWindow = (function () {
        function TimeWindow(windowMillis) {
            this.windowMillis = windowMillis;
            this.domain();
        }
        TimeWindow.prototype.domain = function () {
            var now = Date.now();
            this.cached = [now - this.windowMillis, now];
            return this.cached;
        };
        TimeWindow.prototype.begin = function () { return this.cached[0]; };
        TimeWindow.prototype.end = function () { return this.cached[1]; };
        return TimeWindow;
    }());
    exports.TimeWindow = TimeWindow;
    var StreamingDataSet = (function () {
        function StreamingDataSet() {
        }
        StreamingDataSet.prototype.data = function (data) {
            if (data) {
            }
            return this.dataset;
        };
        return StreamingDataSet;
    }());
    exports.StreamingDataSet = StreamingDataSet;
});
//# sourceMappingURL=graph.js.map