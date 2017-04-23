import streamGraph = require('./streaming_graph');
import dial = require('./dial');
import readout = require('./readouts');

// Graph

// Time windowing (Graph Side).
const kFifteenMin = 180000;
const timeDomain = new streamGraph.TimeWindow(kFifteenMin);

// x Configuration.
const xScale = new streamGraph.WindowedScale(
    new Plottable.Scales.Linear(), (domain: any[]) => timeDomain.cached);
const xScale1 = new Plottable.Scales.Linear().domain([ 3, 0 ]);
const xScale1TickGenerator =
    Plottable.Scales.TickGenerators.integerTickGenerator();
xScale1.tickGenerator(xScale1TickGenerator);
const xAxis = new Plottable.Axes.Numeric(xScale1, 'bottom');
xAxis.endTickLength(0);
xAxis.innerTickLength(0);
xAxis.margin(1);
xAxis.showEndTickLabels(true);
console.log(xAxis.showEndTickLabels());
xAxis.addClass('x-axis-tick');
const gridlines = new Plottable.Components.Gridlines(xScale1, null);
const xLabel = new Plottable.Components.AxisLabel('Minutes Ago');
xLabel.addClass("x-label");

// y Configuration.
const yScale = new Plottable.Scales.Linear();
yScale.autoDomain();
const yAxis = new Plottable.Axes.Numeric(yScale, 'left');
yAxis.addClass('y-axis-tick');
yAxis.showEndTickLabels(true);
yAxis.endTickLength(0);
yAxis.innerTickLength(0);

// Data configuration.
const motor_data = [ {x : Date.now(), y : Math.cos(Date.now() / 100000)} ];
const xTimeBuffer = 1000;
const motor_power =
    new streamGraph.StreamingDataset(motor_data, {color : 'rgb(88, 86, 214)'});
motor_power.setFilter((data: any[]) => {
  return data.filter((datum: any) =>
                         datum.x >= timeDomain.begin() - xTimeBuffer);
});

// Plot configuration.
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

// Chart configuration.
const group = new Plottable.Components.Group([ streamingPlot.plot, gridlines ]);
const chart = new Plottable.Components.Table(
    [ [ yAxis, group ], [ null, xAxis ], [ null, xLabel ] ]);
chart.renderTo('#graph');

function UpdatePlot(): void {
  timeDomain.domain();
  streamingPlot.redraw();
  yAxis.redraw();
}

motor_power.dataUpdate = () => UpdatePlot();

function AddData(): void {
  const now = Date.now();
  motor_power.addData({x : now, y : Math.cos(now / 100000)});
}

window.setInterval(() => AddData(), 50);

// Dials
const speedDialOptions = new dial.DialOptions();
speedDialOptions.angleOffset = 0.5 * Math.PI;
speedDialOptions.angleArc = 1.5 * Math.PI;

const socDialOptions = new dial.DialOptions();
socDialOptions.angleOffset = 0.5 * Math.PI;
socDialOptions.angleArc = Math.PI;
socDialOptions.rotation = dial.Direction.CounterClockwise;
const speedDial = new dial.Dial(
    document.getElementById('speedometer') as HTMLDivElement, speedDialOptions);
const batteryDial = new dial.Dial(
    document.getElementById('soc') as HTMLDivElement, socDialOptions);

speedDial.value(100);
batteryDial.value(100);

const date = new Date();
document.getElementById('status').innerHTML = date.toLocaleTimeString();

// window.setInterval(function() {
//  speedDial.updateValue(Math.round(Math.random() * 100));
//  let date = new Date();
//  document.getElementById('status').innerHTML = date.toLocaleTimeString();
//  batteryDial.updateValue(Math.round(Math.random() * 100));
// }, 1000);
//

// Readouts

const ReadoutOptions = new readout.ReadoutOptions();
ReadoutOptions.units = 'kW';
const solarReadout = new readout.Readout(
    document.getElementById('solar-readout') as HTMLDivElement, ReadoutOptions);
solarReadout.value(1.1);
const motorReadout = new readout.Readout(
    document.getElementById('motor-readout') as HTMLDivElement, ReadoutOptions);
motorReadout.value(7.1);

// Updates

window.addEventListener('resize', () => {
  chart.redraw()
  solarReadout.redraw(),
  motorReadout.redraw(),
  speedDial.redraw(),
  batteryDial.redraw()
});
