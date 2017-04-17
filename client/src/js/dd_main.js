(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./streaming_graph", "./dial"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var streamGraph = require("./streaming_graph");
    var dial = require("./dial");
    var kFifteenMin = 9000;
    var timeDomain = new streamGraph.TimeWindow(kFifteenMin);
    var xScale = new streamGraph.WindowedScale(new Plottable.Scales.Linear(), function (domain) { return timeDomain.cached; });
    var xAxis = new Plottable.Axes.Numeric(xScale.getScale(), 'bottom');
    xAxis.endTickLength(0);
    xAxis.innerTickLength(0);
    xAxis.addClass('x-axis-tick');
    var xLabel = new Plottable.Components.AxisLabel('Last 15 Minutes').yAlignment('center');
    var yScale = new Plottable.Scales.Linear();
    yScale.autoDomain();
    var yAxis = new Plottable.Axes.Numeric(yScale, 'left');
    yAxis.addClass('y-axis-tick');
    yAxis.showEndTickLabels(true);
    yAxis.endTickLength(0);
    yAxis.innerTickLength(0);
    var motor_data = [{ x: Date.now(), y: Math.cos(Date.now() / 1000) }];
    var xTimeBuffer = 1000;
    var motor_power = new streamGraph.StreamingDataset(motor_data, { color: 'rgb(88, 86, 214)' });
    motor_power.setFilter(function (data) {
        return data.filter(function (datum) {
            return datum.x >= timeDomain.begin() - xTimeBuffer;
        });
    });
    var streamingPlot = new streamGraph.StreamingPlot(new Plottable.Plots.Area());
    streamingPlot.datasets([motor_power]);
    streamingPlot.plot.y(function (d) { return d.y; }, yScale);
    streamingPlot.x(function (d) { return d.x; }, xScale);
    streamingPlot.plot.attr('stroke', function (d, i, ds) {
        return ds.metadata().color;
    });
    streamingPlot.plot.attr('fill', function (d, i, ds) {
        return ds.metadata().color.replace(')', ', 0.6)').replace('rgb', 'rgba');
    });
    streamingPlot.plot.attr('stroke-width', 3);
    var group = new Plottable.Components.Group([streamingPlot.plot]);
    var chart = new Plottable.Components.Table([[yAxis, group], [null, xAxis], [null, xLabel]]);
    chart.renderTo('div#graph');
    function UpdatePlot() {
        timeDomain.domain();
        streamingPlot.redraw();
        chart.redraw();
    }
    motor_power.dataUpdate = function () { return UpdatePlot(); };
    function AddData() {
        var now = Date.now();
        motor_power.addData({ x: now, y: Math.cos(now / 1000) });
    }
    window.setInterval(function () { return AddData(); }, 100);
    window.addEventListener('resize', function () { return chart.redraw(); });
    var speedDialOptions = new dial.DialOptions();
    speedDialOptions.rectColor = '#1d1f26';
    speedDialOptions.rectOpacity = 0;
    speedDialOptions.dialColor = '#11b981';
    speedDialOptions.dialOpacity = 1;
    speedDialOptions.font = 'Open Sans';
    speedDialOptions.fontColor = 'white';
    speedDialOptions.thickness = 30;
    speedDialOptions.angleOffset = 0.5 * Math.PI;
    speedDialOptions.angleArc = 1.5 * Math.PI;
    speedDialOptions.fontSize = 200;
    speedDialOptions.padding = 20;
    var socDialOptions = new dial.DialOptions();
    socDialOptions.rectColor = '#1d1f26';
    socDialOptions.rectOpacity = 0;
    socDialOptions.dialColor = '#11b981';
    socDialOptions.dialOpacity = 1;
    socDialOptions.thickness = 80;
    socDialOptions.showText = false;
    socDialOptions.angleOffset = 0.5 * Math.PI;
    socDialOptions.angleArc = Math.PI;
    socDialOptions.rotation = dial.Direction.CounterClockwise;
    var speedDial = new dial.Dial(document.getElementById('speedometer'), speedDialOptions);
    var batteryDial = new dial.Dial(document.getElementById('soc'), socDialOptions);
    speedDial.updateValue(100);
    batteryDial.updateValue(100);
    var date = new Date();
    document.getElementById('status').innerHTML = date.toLocaleTimeString();
});
//# sourceMappingURL=dd_main.js.map