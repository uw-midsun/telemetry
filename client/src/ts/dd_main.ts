import streamGraph = require('./streaming_graph');
import dial = require('./dial');
import readout = require('./readout');
import vis = require('./visibility');
import animate = require('./animate');

// Graph

// Time windowing (Graph Side).
const kWindowMillis = 180000;  // 3 Min
const timeDomain = new streamGraph.TimeWindow(kWindowMillis);

// x Configuration.
const xScale =
    new streamGraph.WindowedScale((domain: any[]) => timeDomain.cached);
const xScaleLabels = new Plottable.Scales.Linear().domain([3, 0]);
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
const motor_data: any[] = [];
const xTimeBuffer = 1000;
const motor_power =
    new streamGraph.StreamingDataset(motor_data, {color: 'rgb(88, 86, 214)'});
motor_power.filter((data: any[]) => {
  const time_window = timeDomain.begin() - xTimeBuffer;
  let i: number = 0;
  while (data.length && data[i].x < time_window) {
    ++i;
  }
  if (i === 0) {
    // Micro-optimization to avoid O(N) copy when array is short.
    return data;
  }
  // Cheaper than filter since we know the elements to be filtered come first.
  return data.slice(i, data.length);
});

// Plot configuration.
const streamingPlot = new Plottable.Plots.Area();
streamingPlot.datasets([motor_power]);
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
const group = new Plottable.Components.Group([streamingPlot, gridlines]);
const chart = new Plottable.Components.Table(
    [[yAxis, group], [null, xAxis], [null, xLabel]]);
chart.renderTo('#graph');

function UpdatePlot(): void {
  timeDomain.domain();
  xScale.domain();
}

motor_power.dataUpdate = () => UpdatePlot();

// Dials
const speedDialOptions = new dial.DialOptions();
speedDialOptions.angleOffset = 0.5 * Math.PI;
speedDialOptions.angleArc = 1.5 * Math.PI;
speedDialOptions.max = 120;

const socDialOptions = new dial.DialOptions();
socDialOptions.angleOffset = 0.5 * Math.PI;
socDialOptions.angleArc = Math.PI;
socDialOptions.rotation = dial.Direction.CounterClockwise;

// Animation
const animationOptions = {
  durationMillis: 60
};

const speedDial = new dial.Dial(
    document.getElementById('speedometer') as HTMLDivElement, speedDialOptions,
    new animate.Animator(animationOptions));
const batteryDial = new dial.Dial(
    document.getElementById('soc') as HTMLDivElement, socDialOptions,
    new animate.Animator(animationOptions));

// Readouts

const ReadoutOptions = new readout.ReadoutOptions();
ReadoutOptions.units = 'W';
ReadoutOptions.formatter = (d: number) => d.toString();
const solarReadout = new readout.Readout(
    document.getElementById('solar-readout') as HTMLDivElement, ReadoutOptions);
const motorReadout = new readout.Readout(
    document.getElementById('motor-readout') as HTMLDivElement, ReadoutOptions);

// Arrows

const opts = {
  intervalMillis: 500
};
const right =
    new vis.VisibilityController(document.getElementById('right-icon'), opts);
const left =
    new vis.VisibilityController(document.getElementById('left-icon'), opts);

// Cruise

const copts = {
  intervalMillis: 1
};
const cruise = new vis.VisibilityController(
    document.getElementById('cruise-wrapper'), copts);

// Initializations

speedDial.value(120);
batteryDial.value(100);
solarReadout.value(0);
motorReadout.value(0);

function updateDate(): void {
  const date = new Date();
  document.getElementById('status').innerHTML =
      date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}
updateDate();

// Updates

window.setInterval(() => {
  updateDate();
}, 60000);

window.addEventListener('resize', () => {
  chart.redraw();
  solarReadout.redraw();
  motorReadout.redraw();
  speedDial.redraw();
  batteryDial.redraw();
});

const rightTurnOn = 0;
const rightTurnOff = 1;
const leftTurnOn = 2;
const leftTurnOff = 3;
const hazardOn = 4;
const hazardOff = 5;
const solarPowerLevel = 6;
const motorPowerLevel = 7;
const batteryState = 8;
const cruiseOn = 9;
const cruiseLevel = 10;
const cruiseOff = 11;
const speed = 12;

const ws = new WebSocket('ws://localhost:8080/ws');
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log(msg);

  switch (msg.id) {
    case solarPowerLevel:
      solarReadout.value(msg.data);
      break;
    case motorPowerLevel:
      motor_power.addData({x: msg.timestamp, y: msg.data});
      motorReadout.value(msg.data);
      break;
    case speed:
      speedDial.value(msg.data);
      break;
    case batteryState:
      batteryDial.value(msg.data);
      break;
    case rightTurnOn:
      right.state(vis.State.Blink);
      break;
    case rightTurnOff:
      right.state(vis.State.Hidden);
      break;
    case leftTurnOn:
      left.state(vis.State.Blink);
      break;
    case leftTurnOff:
      left.state(vis.State.Hidden);
      break;
    case hazardOn:
      left.state(vis.State.Blink);
      right.state(vis.State.Blink);
      break;
    case leftTurnOff:
      left.state(vis.State.Hidden);
      right.state(vis.State.Hidden);
      break;
    case cruiseOff:
      cruise.state(vis.State.Hidden);
      break;
    case cruiseOn:
      cruise.state(vis.State.Shown);
      document.getElementById('cruise-value').innerHTML =
          speedDial.value().toString();
      break;
    case cruiseLevel:
      document.getElementById('cruise-value').innerHTML =
          Math.round(msg.data).toString();
      break;
    default:
      break;
  }
};
