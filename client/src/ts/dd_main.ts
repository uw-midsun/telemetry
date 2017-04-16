import streamGraph = require("./streaming_graph");
import dial = require("./dial");

// GRAPH

// Time windowing (Graph Side).
const kFifteenMin = 9000;
var timeDomain = new streamGraph.TimeWindow(kFifteenMin);

// X Configuration.
var xScale = new streamGraph.WindowedScale(
    new Plottable.Scales.Linear(),
    function(domain: any[]) { return timeDomain.cached; });
var xAxis = new Plottable.Axes.Numeric(
    <Plottable.QuantitativeScale<number>>xScale.getScale(), "bottom");
xAxis.endTickLength(0);
xAxis.innerTickLength(0);
xAxis.addClass("x-axis-tick");
var xLabel =
    new Plottable.Components.AxisLabel("Last 15 Minutes").yAlignment("center");

// Y Configuration.
var yScale = new Plottable.Scales.Linear();
yScale.autoDomain();
var yAxis = new Plottable.Axes.Numeric(yScale, "left");
yAxis.addClass("y-axis-tick");
yAxis.showEndTickLabels(true);
yAxis.endTickLength(0);
yAxis.innerTickLength(0);

// Data configuration.
var motor_data = [ {x : Date.now(), y : Math.cos(Date.now() / 1000)} ];
const xTimeBuffer = 1000;
var motor_power = new streamGraph.StreamingDataset(
    motor_data, {"color" : "rgb(88, 86, 214)"});
motor_power.setFilter(function(data: any[]) {
  return data.filter(function(datum: any) {
    return datum.x >= timeDomain.begin() - xTimeBuffer;
  });
});

// Plot configuration.
var streamingPlot = new streamGraph.StreamingPlot(new Plottable.Plots.Area());
streamingPlot.datasets([ motor_power ]);
streamingPlot.plot.y(function(d: any) { return d.y }, yScale);
streamingPlot.x(function(d: any) { return d.x; }, xScale);
streamingPlot.plot.attr("stroke",
                        function(d: any, i: any, ds: Plottable.Dataset) {
                          return ds.metadata().color;
                        });
streamingPlot.plot.attr(
    "fill", function(d: any, i: any, ds: Plottable.Dataset) {
      return ds.metadata().color.replace(")", ", 0.6)").replace("rgb", "rgba");
    });
streamingPlot.plot.attr("stroke-width", 3);

// Chart configuration.
var group = new Plottable.Components.Group([ streamingPlot.plot ]);
var chart = new Plottable.Components.Table(
    [ [ yAxis, group ], [ null, xAxis ], [ null, xLabel ] ]);
chart.renderTo("div#graph");

function UpdatePlot() {
  timeDomain.domain();
  streamingPlot.redraw();
  chart.redraw();
}

motor_power.dataUpdate = function() { UpdatePlot(); };

function AddData() {
  const now = Date.now()
  motor_power.addData({x : now, y : Math.cos(now / 1000)});
}

window.setInterval(function() { AddData(); }, 100);
window.addEventListener("resize", function() { chart.redraw(); });

// DIALS

var speedDialOptions = new dial.DialOptions();
speedDialOptions.rectColor = "#1D1F26";
speedDialOptions.rectOpacity = 0;
speedDialOptions.dialColor = "#11b981";
speedDialOptions.dialOpacity = 1;
speedDialOptions.font = "Open Sans";
speedDialOptions.fontColor = "white";
speedDialOptions.thickness = 30;
speedDialOptions.angleOffset = 0.5 * Math.PI;
speedDialOptions.angleArc = 1.5 * Math.PI;
speedDialOptions.fontSize = 200;
speedDialOptions.padding = 20;

var socDialOptions = new dial.DialOptions();
socDialOptions.rectColor = "#1D1F26";
socDialOptions.rectOpacity = 0;
socDialOptions.dialColor = "#11b981";
socDialOptions.dialOpacity = 1;
socDialOptions.thickness = 80;
socDialOptions.showText = false;
socDialOptions.angleOffset = 0.5 * Math.PI;
socDialOptions.angleArc = 1 * Math.PI;
socDialOptions.rotation = dial.Direction.CounterClockwise;
var speedDial = new dial.Dial(<HTMLDivElement>document.getElementById("speedometer"),
                         speedDialOptions);
var batteryDial =
    new dial.Dial(<HTMLDivElement>document.getElementById("soc"), socDialOptions);

speedDial.updateValue(100);
batteryDial.updateValue(100);

let date = new Date();
document.getElementById("status").innerHTML = date.toLocaleTimeString();

//window.setInterval(function() {
//  speedDial.updateValue(Math.round(Math.random() * 100));
//  let date = new Date();
//  document.getElementById("status").innerHTML = date.toLocaleTimeString();
//  batteryDial.updateValue(Math.round(Math.random() * 100));
//}, 1000);
