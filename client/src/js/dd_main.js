(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./streaming_graph", "./dial", "./readout", "./visibility", "./animate", "./can_msg_defs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var streamGraph = require("./streaming_graph");
    var dial = require("./dial");
    var readout = require("./readout");
    var vis = require("./visibility");
    var animate = require("./animate");
    var canDefs = require("./can_msg_defs");
    function toFixedTrunc(value, n) {
        var v = value.toString().split('.');
        if (n <= 0)
            return v[0];
        var f = v[1] || '';
        if (f.length > n)
            return v[0] + "." + f.substr(0, n);
        while (f.length < n)
            f += '0';
        return v[0] + "." + f;
    }
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
    document.getElementById('state').innerHTML = 'N';
    window.addEventListener('resize', function () {
        chart.redraw();
        solarReadout.redraw();
        motorReadout.redraw();
        speedDial.redraw();
        batteryDial.redraw();
    });
    var auxCurrent = 0;
    var auxVoltage = 0;
    var dcdcCurrent = 0;
    var dcdcVoltage = 0;
    var hvCurrent = 0;
    var hvVoltage = new Array(36);
    for (var i = 0; i < 36; ++i) {
        hvVoltage[i] = 0;
    }
    var ws = new WebSocket('ws://localhost:8080/ws');
    ws.onmessage = function (event) {
        var msg = JSON.parse(event.data);
        console.log(msg.id);
        switch (msg.id) {
            case 46:
                break;
            case 36:
                var value = (msg.data.vehicle_velocity_left + msg.data.vehicle_velocity_right) /
                    2 * 0.036;
                console.log(msg);
                if (value <= 120 && value >= 0) {
                    speedDial.value(value);
                }
                else {
                    speedDial.value(0);
                }
                console.log(value);
                break;
            case 35:
                var power = msg.data.mc_voltage_1 * msg.data.mc_current_1 +
                    msg.data.mc_voltage_2 * msg.data.mc_current_2;
                motor_power.addData({ x: msg.timestamp, y: power });
                motorReadout.value(power);
                break;
            case 18:
                if (msg.data.direction === 0) {
                    document.getElementById('state').innerHTML = 'N';
                }
                else if (msg.data.direction === 1) {
                    document.getElementById('state').innerHTML = 'D';
                }
                else if (msg.data.direction === 2) {
                    document.getElementById('state').innerHTML = 'R';
                }
                var cruiseVal = msg.data.cruise_control / (1 << 12);
                if (cruiseVal > 5) {
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
                if (msg.data.light_state === 0) {
                    state = vis.State.Hidden;
                }
                if (msg.data.light_id === 4) {
                    right.state(state);
                }
                if (msg.data.light_id === 5) {
                    left.state(state);
                }
                if (msg.data.light_id === 6) {
                    right.state(vis.State.Hidden);
                    left.state(vis.State.Hidden);
                    right.state(state);
                    left.state(state);
                }
                break;
            case 43:
                auxVoltage = msg.data.aux_voltage / 1000;
                auxCurrent = msg.data.aux_current / 1000;
                dcdcVoltage = msg.data.dcdc_voltage / 1000;
                dcdcCurrent = msg.data.dcdc_current / 1000;
                break;
            case 32:
                if (msg.data.module_id < 36) {
                    hvVoltage[msg.data.module_id] = msg.data.voltage / 10000;
                }
                break;
            case 33:
                hvCurrent = msg.data.current;
                break;
            default:
                break;
        }
        document.getElementById('status').innerHTML = 'Aux: ' +
            toFixedTrunc(auxVoltage, 2) + ' V ' + toFixedTrunc(auxCurrent, 2) +
            ' mA | DCDC: ' + toFixedTrunc(dcdcVoltage, 2) + ' V ' +
            toFixedTrunc(dcdcCurrent, 2) + ' mA | HV: ' +
            toFixedTrunc(hvVoltage.reduce(function (acc, val) {
                return acc + val;
            }), 2) +
            ' V ' + toFixedTrunc(hvCurrent, 2) + ' A';
    };
});
//# sourceMappingURL=dd_main.js.map