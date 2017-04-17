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
    var WindowedScale = (function () {
        function WindowedScale(scale, domainUpdater) {
            this.domainUpdater = domainUpdater;
            this._scale = scale;
        }
        WindowedScale.prototype.getScale = function () {
            if (this.domainUpdater) {
                this._scale.domain(this.domainUpdater(this._scale.domain()));
            }
            return this._scale;
        };
        return WindowedScale;
    }());
    exports.WindowedScale = WindowedScale;
    var StreamingDataset = (function () {
        function StreamingDataset(data, metadata) {
            this._dataset = new Plottable.Dataset(data, metadata);
        }
        StreamingDataset.prototype.data = function (data) {
            if (data) {
                this._dataset.data(data);
                if (this.dataUpdate) {
                    this.dataUpdate();
                }
                return this;
            }
            return this._dataset.data();
        };
        StreamingDataset.prototype.metadata = function (metadata) {
            if (metadata) {
                this._dataset.metadata(metadata);
                return this;
            }
            return this._dataset.metadata();
        };
        StreamingDataset.prototype.addData = function (datum) {
            var data = this._dataset.data();
            data.push(datum);
            this._dataset.data(data);
            if (this.dataUpdate) {
                this.dataUpdate();
            }
        };
        StreamingDataset.prototype.setFilter = function (filter) {
            this._filter = filter;
        };
        StreamingDataset.prototype.getDataset = function () {
            if (this._filter) {
                this._dataset.data(this._filter(this._dataset.data()));
            }
            return this._dataset;
        };
        return StreamingDataset;
    }());
    exports.StreamingDataset = StreamingDataset;
    var StreamingPlot = (function () {
        function StreamingPlot(plot) {
            this.plot = plot;
            this.plot.datasets([]);
        }
        StreamingPlot.prototype.datasets = function (datasets) {
            if (datasets) {
                this._datasets = datasets;
                this.datasetUpdate();
                return this;
            }
            return this._datasets;
        };
        StreamingPlot.prototype.x = function (callback, scale) {
            this._scale = scale;
            this._xCallback = callback;
            this.xUpdate();
        };
        StreamingPlot.prototype.redraw = function () {
            this.datasetUpdate();
            this.xUpdate();
            this.plot.redraw();
        };
        StreamingPlot.prototype.datasetUpdate = function () {
            if (this._datasets) {
                var raw_datasets = [];
                for (var _i = 0, _a = this._datasets; _i < _a.length; _i++) {
                    var dataset = _a[_i];
                    raw_datasets.push(dataset.getDataset());
                }
                this.plot.datasets(raw_datasets);
            }
        };
        StreamingPlot.prototype.xUpdate = function () {
            this.plot.x(this._xCallback, this._scale.getScale());
        };
        return StreamingPlot;
    }());
    exports.StreamingPlot = StreamingPlot;
});
//# sourceMappingURL=streaming_graph.js.map