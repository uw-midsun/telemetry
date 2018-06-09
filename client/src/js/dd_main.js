(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./streaming_graph", "./dial", "./readout", "./visibility", "./animate", "./can_id", "./can_msg_defs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var streamGraph = require("./streaming_graph");
    var dial = require("./dial");
    var readout = require("./readout");
    var vis = require("./visibility");
    var animate = require("./animate");
    var canId = require("./can_id");
    var canDefs = require("./can_msg_defs");
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
    var motor_data = [];
    var xTimeBuffer = 1000;
    var motor_power = new streamGraph.StreamingDataset(motor_data, { color: 'rgb(88, 86, 214)' });
    motor_power.filter(function (data) {
        var time_window = timeDomain.begin() - xTimeBuffer;
        var i = 0;
        while (data.length && data[i].x < time_window) {
            ++i;
        }
        if (i === 0) {
            return data;
        }
        return data.slice(i, data.length);
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
    }
    motor_power.dataUpdate = function () { return UpdatePlot(); };
    var speedDialOptions = new dial.DialOptions();
    speedDialOptions.angleOffset = 0.5 * Math.PI;
    speedDialOptions.angleArc = 1.5 * Math.PI;
    speedDialOptions.max = 120;
    var socDialOptions = new dial.DialOptions();
    socDialOptions.angleOffset = 0.5 * Math.PI;
    socDialOptions.angleArc = Math.PI;
    socDialOptions.rotation = dial.Direction.CounterClockwise;
    var animationOptions = {
        durationMillis: 60
    };
    var speedDial = new dial.Dial(document.getElementById('speedometer'), speedDialOptions, new animate.Animator(animationOptions));
    var batteryDial = new dial.Dial(document.getElementById('soc'), socDialOptions, new animate.Animator(animationOptions));
    var ReadoutOptions = new readout.ReadoutOptions();
    ReadoutOptions.units = 'W';
    ReadoutOptions.formatter = function (d) { return d.toString(); };
    var solarReadout = new readout.Readout(document.getElementById('solar-readout'), ReadoutOptions);
    var motorReadout = new readout.Readout(document.getElementById('motor-readout'), ReadoutOptions);
    var opts = {
        intervalMillis: 500
    };
    var right = new vis.VisibilityController(document.getElementById('right-icon'), opts);
    var left = new vis.VisibilityController(document.getElementById('left-icon'), opts);
    var copts = {
        intervalMillis: 1
    };
    var cruise = new vis.VisibilityController(document.getElementById('cruise-wrapper'), copts);
    speedDial.value(120);
    batteryDial.value(100);
    solarReadout.value(0);
    motorReadout.value(0);
    function updateDate() {
        var date = new Date();
        document.getElementById('status').innerHTML =
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    updateDate();
    window.setInterval(function () {
        updateDate();
    }, 60000);
    window.addEventListener('resize', function () {
        chart.redraw();
        solarReadout.redraw();
        motorReadout.redraw();
        speedDial.redraw();
        batteryDial.redraw();
    });
    var ws = new WebSocket('ws://localhost:8080/ws');
    ws.onmessage = function (event) {
        var msg = JSON.parse(event.data);
        console.log(msg);
        var can_id = new canId.CanId(msg.id);
        switch (can_id.msgId()) {
            case 46:
                break;
            case 36:
                speedDial.value((msg.data32[0] + msg.data32[1]) / 2 * 3.6);
                break;
            case 35:
                var power = msg.data32[0] * msg.data32[1];
                motor_power.addData({ x: msg.timestamp, y: power });
                motorReadout.value(power);
                break;
            case 18:
                var cruiseVal = msg.data16[2] / (1 << 12);
                if (cruiseVal) {
                    cruise.state(vis.State.Shown);
                    document.getElementById('cruise-value').innerHTML =
                        Math.round(cruiseVal).toString();
                }
                else {
                    cruise.state(vis.State.Hidden);
                }
                break;
            case 31:
                break;
            case 24:
                var state = vis.State.Blink;
                if (msg.data8[1] === 0) {
                    state = vis.State.Hidden;
                }
                if (msg.data8[0] === 4) {
                    right.state(state);
                }
                if (msg.data8[0] === 5) {
                    left.state(state);
                }
                if (msg.data8[0] === 6) {
                    right.state(vis.State.Hidden);
                    left.state(vis.State.Hidden);
                    right.state(state);
                    left.state(state);
                }
                break;
            default:
                break;
        }
    };
});
//# sourceMappingURL=dd_main.js.map