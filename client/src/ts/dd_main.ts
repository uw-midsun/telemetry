import streamGraph = require('./streaming_graph');
import dial = require('./dial');

// graph

// time windowing (Graph Side).
const kFifteenMin = 9000;
const timeDomain = new streamGraph.TimeWindow(kFifteenMin);

// x Configuration.
const xScale = new streamGraph.WindowedScale(
    new Plottable.Scales.Linear(), (domain: any[]) => timeDomain.cached);
const xAxis = new Plottable.Axes.Numeric(
    xScale.getScale() as Plottable.QuantitativeScale<number>, 'bottom');
xAxis.endTickLength(0);
xAxis.innerTickLength(0);
xAxis.addClass('x-axis-tick');
const xLabel =
    new Plottable.Components.AxisLabel('Last 15 Minutes').yAlignment('center');

// y Configuration.
const yScale = new Plottable.Scales.Linear();
yScale.autoDomain();
const yAxis = new Plottable.Axes.Numeric(yScale, 'left');
yAxis.addClass('y-axis-tick');
yAxis.showEndTickLabels(true);
yAxis.endTickLength(0);
yAxis.innerTickLength(0);

// data configuration.
const motor_data = [ {x : Date.now(), y : Math.cos(Date.now() / 1000)} ];
const xTimeBuffer = 1000;
const motor_power =
    new streamGraph.StreamingDataset(motor_data, {color : 'rgb(88, 86, 214)'});
motor_power.setFilter((data: any[]) => {
  return data.filter((datum: any) =>
                         datum.x >= timeDomain.begin() - xTimeBuffer);
});

// plot configuration.
const streamingPlot = new streamGraph.StreamingPlot(new Plottable.Plots.Area());
streamingPlot.datasets([ motor_power ]);
streamingPlot.plot.y((d: any) => d.y, yScale);
streamingPlot.x((d: any) => d.x, xScale);
streamingPlot.plot.attr('stroke', (d: any, i: any, ds: Plottable.Dataset) => {
  return ds.metadata().color;
});
streamingPlot.plot.attr('fill', (d: any, i: any, ds: Plottable.Dataset) => {
  return ds.metadata().color.replace(')', ', 0.6)').replace('rgb', 'rgba');
});
streamingPlot.plot.attr('stroke-width', 3);

// chart configuration.
const group = new Plottable.Components.Group([ streamingPlot.plot ]);
const chart = new Plottable.Components.Table(
    [ [ yAxis, group ], [ null, xAxis ], [ null, xLabel ] ]);
chart.renderTo('#graph');

function UpdatePlot(): void {
  timeDomain.domain();
  streamingPlot.redraw();
  chart.redraw();
}

motor_power.dataUpdate = () => UpdatePlot();

function AddData(): void {
  const now = Date.now();
  motor_power.addData({x : now, y : Math.cos(now / 1000)});
}

window.setInterval(() => AddData(), 100);
window.addEventListener('resize', () => chart.redraw());

// dials
const speedDialOptions = new dial.DialOptions();
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

const socDialOptions = new dial.DialOptions();
socDialOptions.rectColor = '#1d1f26';
socDialOptions.rectOpacity = 0;
socDialOptions.dialColor = '#11b981';
socDialOptions.dialOpacity = 1;
socDialOptions.thickness = 80;
socDialOptions.showText = false;
socDialOptions.angleOffset = 0.5 * Math.PI;
socDialOptions.angleArc = Math.PI;
socDialOptions.rotation = dial.Direction.CounterClockwise;
const speedDial = new dial.Dial(
    document.getElementById('speedometer') as HTMLDivElement, speedDialOptions);
const batteryDial = new dial.Dial(
    document.getElementById('soc') as HTMLDivElement, socDialOptions);

speedDial.updateValue(100);
batteryDial.updateValue(100);

const date = new Date();
document.getElementById('status').innerHTML = date.toLocaleTimeString();

// window.setInterval(function() {
//  speedDial.updateValue(Math.round(Math.random() * 100));
//  let date = new Date();
//  document.getElementById('status').innerHTML = date.toLocaleTimeString();
//  batteryDial.updateValue(Math.round(Math.random() * 100));
// }, 1000);
