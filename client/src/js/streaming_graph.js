var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
    var WindowedScale = (function (_super) {
        __extends(WindowedScale, _super);
        function WindowedScale(domainUpdater) {
            var _this = _super.call(this) || this;
            _this.domainUpdater = domainUpdater;
            return _this;
        }
        WindowedScale.prototype.domain = function (domain) {
            if (domain) {
                return _super.prototype.domain.call(this, domain);
            }
            else if (this.domainUpdater) {
                _super.prototype.domain.call(this, this.domainUpdater(_super.prototype.domain.call(this)));
            }
            return _super.prototype.domain.call(this);
        };
        return WindowedScale;
    }(Plottable.Scales.Linear));
    exports.WindowedScale = WindowedScale;
    var StreamingDataset = (function (_super) {
        __extends(StreamingDataset, _super);
        function StreamingDataset(data, metadata) {
            return _super.call(this, data, metadata) || this;
        }
        StreamingDataset.prototype.data = function (data) {
            if (data) {
                if (this._filter) {
                    _super.prototype.data.call(this, this._filter(data));
                }
                else {
                    _super.prototype.data.call(this, data);
                }
                if (this.dataUpdate) {
                    this.dataUpdate();
                }
                return this;
            }
            return _super.prototype.data.call(this);
        };
        StreamingDataset.prototype.addData = function (datum) {
            if (this._filter) {
                _super.prototype.data.call(this, this._filter(_super.prototype.data.call(this)));
            }
            var data = _super.prototype.data.call(this);
            data.push(datum);
            _super.prototype.data.call(this, data);
            if (this.dataUpdate) {
                this.dataUpdate();
            }
        };
        StreamingDataset.prototype.setFilter = function (filter) {
            this._filter = filter;
        };
        return StreamingDataset;
    }(Plottable.Dataset));
    exports.StreamingDataset = StreamingDataset;
});
//# sourceMappingURL=streaming_graph.js.map