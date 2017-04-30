import streamGraph = require('./streaming_graph');
import dial = require('./dial');
import readout = require('./readout');

// Graph

// Time windowing (Graph Side).
const kWindowMillis = 180000; // 3 Min
const timeDomain = new streamGraph.TimeWindow(kWindowMillis);

// x Configuration.
const xScale =
    new streamGraph.WindowedScale((domain: any[]) => timeDomain.cached);
const xScaleLabels = new Plottable.Scales.Linear().domain([ 3, 0 ]);
const xScaleLabelsTickGenerator =
    Plottable.Scales.TickGenerators.integerTickGenerator();
xScaleLabels.tickGenerator(xScaleLabelsTickGenerator);
const xAxis = new Plottable.Axes.Numeric(xScaleLabels, 'bottom');
xAxis.endTickLength(0);
xAxis.innerTickLength(0);
xAxis.margin(1);
xAxis.showEndTickLabels(true);
xAxis.addClass('x-axis-tick');
const gridlines = new Plottable.Components.Gridlines(xScaleLabels, null);
const xLabel = new Plottable.Components.AxisLabel('Minutes Ago');
xLabel.addClass('x-label');

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
const streamingPlot = new Plottable.Plots.Area();
streamingPlot.datasets([ motor_power ]);
streamingPlot.y((d: any) => d.y, yScale);
streamingPlot.x((d: any) => d.x, xScale);
streamingPlot.attr('stroke', (d: any, i: any, ds: Plottable.Dataset) => {
  return ds.metadata().color;
});
streamingPlot.attr('fill', (d: any, i: any, ds: Plottable.Dataset) => {
  return ds.metadata().color.replace(')', ', 0.6)').replace('rgb', 'rgba');
});
streamingPlot.attr('stroke-width', 3);

// Chart configuration.
const group = new Plottable.Components.Group([ streamingPlot, gridlines ]);
const chart = new Plottable.Components.Table(
    [ [ yAxis, group ], [ null, xAxis ], [ null, xLabel ] ]);
chart.renderTo('#graph');

function UpdatePlot(): void {
  timeDomain.domain();
  xScale.domain();
  chart.redraw();
}

motor_power.dataUpdate = () => UpdatePlot();

function AddData(): void {
  const now = Date.now();
  motor_power.addData({x : now, y : 9000 * Math.cos(now / 10000) + 6000});
}

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

// Readouts

const ReadoutOptions = new readout.ReadoutOptions();
ReadoutOptions.units = 'kW';
const solarReadout = new readout.Readout(
    document.getElementById('solar-readout') as HTMLDivElement, ReadoutOptions);
const motorReadout = new readout.Readout(
    document.getElementById('motor-readout') as HTMLDivElement, ReadoutOptions);

// Initializations

speedDial.value(100);
batteryDial.value(75);

const date = new Date();
document.getElementById('status').innerHTML = date.toLocaleTimeString();

solarReadout.value(1.1);
motorReadout.value(7.1);

// Updates

window.setInterval(() => AddData(), 50);

window.setInterval(() => {
  // speedDial.updateValue(Math.round(Math.random() * 100));
  // batteryDial.updateValue(Math.round(Math.random() * 100));
  const curr_date = new Date();
  document.getElementById('status').innerHTML = curr_date.toLocaleTimeString();
}, 1000);

window.addEventListener('resize', () => {
  chart.redraw();
  solarReadout.redraw();
  motorReadout.redraw();
  speedDial.redraw();
  batteryDial.redraw();
});
