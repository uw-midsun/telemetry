(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./streaming_graph", "./dial", "./readout"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var streamGraph = require("./streaming_graph");
    var dial = require("./dial");
    var readout = require("./readout");
    var kWindowMillis = 180000;
    var timeDomain = new streamGraph.TimeWindow(kWindowMillis);
    var xScale = new streamGraph.WindowedScale(function (domain) { return timeDomain.cached; });
    var xScaleLabels = new Plottable.Scales.Linear().domain([3, 0]);
    var xScaleLabelsTickGenerator = Plottable.Scales.TickGenerators.integerTickGenerator();
    xScaleLabels.tickGenerator(xScaleLabelsTickGenerator);
    var xAxis = new Plottable.Axes.Numeric(xScaleLabels, 'bottom');
    xAxis.endTickLength(0);
    xAxis.innerTickLength(0);
    xAxis.margin(1);
    xAxis.showEndTickLabels(true);
    xAxis.addClass('x-axis-tick');
    var gridlines = new Plottable.Components.Gridlines(xScaleLabels, null);
    var xLabel = new Plottable.Components.AxisLabel('Minutes Ago');
    xLabel.addClass('x-label');
    var yScale = new Plottable.Scales.Linear();
    yScale.autoDomain();
    var yAxis = new Plottable.Axes.Numeric(yScale, 'left');
    yAxis.addClass('y-axis-tick');
    yAxis.showEndTickLabels(true);
    yAxis.endTickLength(0);
    yAxis.innerTickLength(0);
    var motor_data = [{ x: Date.now(), y: Math.cos(Date.now() / 100000) }];
    var xTimeBuffer = 1000;
    var motor_power = new streamGraph.StreamingDataset(motor_data, { color: 'rgb(88, 86, 214)' });
    motor_power.filter(function (data) {
        return data.filter(function (datum) {
            return datum.x >= timeDomain.begin() - xTimeBuffer;
        });
    });
    var streamingPlot = new Plottable.Plots.Area();
    streamingPlot.datasets([motor_power]);
    streamingPlot.y(function (d) { return d.y; }, yScale);
    streamingPlot.x(function (d) { return d.x; }, xScale);
    streamingPlot.attr('stroke', function (d, i, ds) {
        return ds.metadata().color;
    });
    streamingPlot.attr('fill', function (d, i, ds) {
        return ds.metadata().color.replace(')', ', 0.6)').replace('rgb', 'rgba');
    });
    streamingPlot.attr('stroke-width', 3);
    var group = new Plottable.Components.Group([streamingPlot, gridlines]);
    var chart = new Plottable.Components.Table([[yAxis, group], [null, xAxis], [null, xLabel]]);
    chart.renderTo('#graph');
    function UpdatePlot() {
        timeDomain.domain();
        xScale.domain();
        chart.redraw();
    }
    motor_power.dataUpdate = function () { return UpdatePlot(); };
    function AddData() {
        var now = Date.now();
        motor_power.addData({ x: now, y: 9000 * Math.cos(now / 10000) + 6000 });
    }
    var speedDialOptions = new dial.DialOptions();
    speedDialOptions.angleOffset = 0.5 * Math.PI;
    speedDialOptions.angleArc = 1.5 * Math.PI;
    var socDialOptions = new dial.DialOptions();
    socDialOptions.angleOffset = 0.5 * Math.PI;
    socDialOptions.angleArc = Math.PI;
    socDialOptions.rotation = dial.Direction.CounterClockwise;
    var speedDial = new dial.Dial(document.getElementById('speedometer'), speedDialOptions);
    var batteryDial = new dial.Dial(document.getElementById('soc'), socDialOptions);
    var ReadoutOptions = new readout.ReadoutOptions();
    ReadoutOptions.units = 'kW';
    var solarReadout = new readout.Readout(document.getElementById('solar-readout'), ReadoutOptions);
    var date = new Date();
    document.getElementById('status').innerHTML = date.toLocaleTimeString();
    solarReadout.value(0);
    var motorReadout = new readout.Readout(document.getElementById('motor-readout'), ReadoutOptions);
    motorReadout.value(0);
    window.setInterval(function () { return AddData(); }, 50);
    window.addEventListener('resize', function () {
        chart.redraw();
        solarReadout.redraw();
        motorReadout.redraw();
        speedDial.redraw();
        batteryDial.redraw();
    });
    var rightTurnOn = 0;
    var rightTurnOff = 1;
    var leftTurnOn = 2;
    var leftTurnOff = 3;
    var hazardOn = 4;
    var hazardOff = 5;
    var solarPowerLevel = 6;
    var motorPowerLevel = 7;
    var batteryState = 8;
    var cruiseOn = 9;
    var cruiseLevel = 10;
    var cruiseOff = 11;
    var speed = 12;
    var ws = new WebSocket('ws://localhost:8080/ws');
    ws.onmessage = function (event) {
        var msg = JSON.parse(event.data);
        switch (msg.id) {
            case solarPowerLevel:
                solarReadout.value(msg.data);
                break;
            case motorPowerLevel:
                motorReadout.value(msg.data);
                break;
            case speed:
                speedDial.value(msg.data);
                break;
            case batteryState:
                batteryDial.value(msg.data);
                break;
            default:
                break;
        }
    };
});
//# sourceMappingURL=dd_main.js.map