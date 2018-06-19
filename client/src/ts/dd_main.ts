import streamGraph = require('./streaming_graph');
import dial = require('./dial');
import readout = require('./readout');
import vis = require('./visibility');
import animate = require('./animate');
import canDefs = require('./can_msg_defs');

// Helpers
function toFixedTrunc(value: number, n: number): string {
  const v = value.toString().split('.');
  if (n <= 0) return v[0];
  let f = v[1] || '';
  if (f.length > n) return `${v[0]}.${f.substr(0, n)}`;
  while (f.length < n) f += '0';
  return `${v[0]}.${f}`
}

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

document.getElementById('state').innerHTML = 'N';

window.addEventListener('resize', () => {
  chart.redraw();
  solarReadout.redraw();
  motorReadout.redraw();
  speedDial.redraw();
  batteryDial.redraw();
});

const mpSize = 36;
const mpVoltage = new Array<number>(mpSize);
for (let i = 0; i < mpSize; ++i) {
  mpVoltage[i] = 0;
}

const ws = new WebSocket('ws://localhost:8080/ws');
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.id) {
    case canDefs.CanMessage.CAN_MESSAGE_SOLAR_DATA_REAR:  // Not working.
      // solarReadout.value(msg.data);
      break;
    case canDefs.CanMessage.CAN_MESSAGE_MOTOR_VELOCITY:
      const value =
          (msg.data.vehicle_velocity_left + msg.data.vehicle_velocity_right) /
          2 * 0.036;  // cm/s->km/h
      if (value <= 120 && value >= 0) {
        speedDial.value(value);
      } else {
        speedDial.value(0);
      }
      break;
    case canDefs.CanMessage.CAN_MESSAGE_MOTOR_CONTROLLER_VC:
      const power = msg.data.mc_voltage_1 * msg.data.mc_current_1 +
          msg.data.mc_voltage_2 * msg.data.mc_current_2;
      motor_power.addData({x: msg.timestamp, y: power});
      motorReadout.value(power);
      break;
    case canDefs.CanMessage.CAN_MESSAGE_DRIVE_OUTPUT:
      if (msg.data.direction === 0) {
        document.getElementById('state').innerHTML = 'N';
        speedDial.value(0);
      } else if (msg.data.direction === 1) {
        document.getElementById('state').innerHTML = 'D';
      } else if (msg.data.direction === 2) {
        document.getElementById('state').innerHTML = 'R';
      }
      const cruiseVal = msg.data.cruise_control / (1 << 12);
      if (cruiseVal > 10) {
        cruise.state(vis.State.Shown);
        document.getElementById('cruise-value').innerHTML =
            Math.round(cruiseVal).toString();
      } else {
        cruise.state(vis.State.Hidden);
      }
      break;
    case canDefs.CanMessage.CAN_MESSAGE_BATTERY_SOC:  // Currently not supplied.
      // batteryDial.value(msg.data);
      break;
    case canDefs.CanMessage.CAN_MESSAGE_LIGHTS_STATE:
      let state = vis.State.Blink;
      if (msg.data.light_state === 0) {
        state = vis.State.Hidden;
      }
      // Right
      if (msg.data.light_id === 4) {
        right.state(state);
      }
      // Left
      if (msg.data.light_id === 5) {
        left.state(state);
      }
      // Hazard
      if (msg.data.light_id === 6) {
        right.state(vis.State.Hidden);
        left.state(vis.State.Hidden);
        right.state(state);
        left.state(state);
      }
      break;
    case canDefs.CanMessage.CAN_MESSAGE_AUX_DCDC_VC:
      document.getElementById('aux-current').innerHTML =
          toFixedTrunc(msg.data.aux_current / 1000, 2) + ' mA';
      document.getElementById('aux-voltage').innerHTML =
          toFixedTrunc(msg.data.aux_voltage / 1000, 2) + ' V';
      document.getElementById('dcdc-current').innerHTML =
          toFixedTrunc(msg.data.dcdc_current / 1000, 2) + ' mA';
      document.getElementById('dcdc-voltage').innerHTML =
          toFixedTrunc(msg.data.dcdc_voltage / 1000, 2) + ' V';
      break;
    case canDefs.CanMessage.CAN_MESSAGE_BATTERY_VT:
      if (msg.data.module_id < 36) {
        mpVoltage[msg.data.module_id] = msg.data.voltage / 10000;
      }
      document.getElementById('mp-voltage').innerHTML =
          toFixedTrunc(mpVoltage.reduce((acc: number, val: number) => {
            return acc + val;
          }), 2) + ' V';
      break;
    case canDefs.CanMessage.CAN_MESSAGE_BATTERY_CURRENT:
      document.getElementById('mp-current').innerHTML =
          toFixedTrunc(msg.data.current, 2) + ' A';
      break;
    default:
      break;
  }
};
