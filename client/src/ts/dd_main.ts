import streamGraph = require('./streaming_graph');
import dial = require('./dial');
import readout = require('./readout');
import vis = require('./visibility');
import animate = require('./animate');
import canDefs = require('./can_msg_defs');

// SOC

function mapSocPercent(v: number): number {
  // Based on a discharge curve fit of polynomial degree 6.
  // For equation see: Battery Cell Testing on Confluence.
  // TODO(ckitagawa): Make this better if time allows.
  const max_capacity = 121.3439;  // Ah (Supposed to be 126 Ah)
  const curr_capacity = 322574 - 17347 * v + 386 * Math.pow(v, 2) -
      4.55 * Math.pow(v, 3) + 0.0299 * Math.pow(v, 4) -
      1.04e-4 * Math.pow(v, 5) + 1.5e-7 * Math.pow(v, 6);
  const result = curr_capacity / max_capacity * 100;
  if (result > 100) {
    return 100;
  } else if (result < 0) {
    return 0;
  }
  return result;
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
const power_consumption_data: any[] = [];
const xTimeBuffer = 1000;
const power_consumption_graph = new streamGraph.StreamingDataset(
    power_consumption_data, {color: 'rgb(88, 86, 214)'});
power_consumption_data.filter((data: any[]) => {
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
streamingPlot.datasets([power_consumption_graph]);
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

power_consumption_graph.dataUpdate = () => UpdatePlot();

// Dials
const speedDialOptions = new dial.DialOptions();
speedDialOptions.angleOffset = 0.5 * Math.PI;
speedDialOptions.angleArc = 1.5 * Math.PI;
speedDialOptions.max = 130;

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
const consumptionReadout = new readout.Readout(
    document.getElementById('consumption-readout') as HTMLDivElement,
    ReadoutOptions);

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

// Date
function updateDate(): void {
  const date = new Date();
  document.getElementById('status').innerHTML =
      date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

// Initializations

const ws = new WebSocket('ws://localhost:8080/ws');
speedDial.value(0);
batteryDial.value(0);
solarReadout.value(0);
consumptionReadout.value(0);
document.getElementById('state').innerHTML = 'N';
updateDate();

// Updates

window.setInterval(() => {
  updateDate();
}, 60000);

window.addEventListener('resize', () => {
  chart.redraw();
  solarReadout.redraw();
  consumptionReadout.redraw();
  speedDial.redraw();
  batteryDial.redraw();
});

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.id) {
    case canDefs.CanMessage.CAN_MESSAGE_SOLAR_DATA_REAR:  // Not working.
      // solarReadout.value(msg.data);
      break;
    case canDefs.CanMessage.CAN_MESSAGE_MOTOR_VELOCITY:
      // The << 32 >> 32 converts from unsigned to signed.
      const value = Math.abs(
          (((msg.data.vehicle_velocity_left << 32) >> 32) +
           ((msg.data.vehicle_velocity_right << 32) >> 32)) /
          2 * 0.036);  // cm/s->km/h
      if (value <= 120 && value >= 0) {
        speedDial.value(value);
      } else {
        speedDial.value(0);
      }
      break;
    case canDefs.CanMessage.CAN_MESSAGE_MOTOR_CONTROLLER_VC:
      const power = msg.data.mc_voltage_1 * msg.data.mc_current_1 +
          msg.data.mc_voltage_2 * msg.data.mc_current_2;
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
          (msg.data.aux_current / 1000).toFixed(2) + ' mA';
      document.getElementById('aux-voltage').innerHTML =
          (msg.data.aux_voltage / 1000).toFixed(2) + ' V';
      document.getElementById('dcdc-current').innerHTML =
          (msg.data.dcdc_current / 1000).toFixed(2) + ' mA';
      document.getElementById('dcdc-voltage').innerHTML =
          (msg.data.dcdc_voltage / 1000).toFixed(2) + ' V';
      break;
    case canDefs.CanMessage.CAN_MESSAGE_BATTERY_AGGREGATE_VC:
      const converted_current = ((msg.data.current << 32) >> 32) / 1000000;
      const converted_voltage = msg.data.voltage / 10000;
      document.getElementById('mp-current').innerHTML =
          (converted_current).toFixed(2) + ' A';
      document.getElementById('mp-voltage').innerHTML =
          (converted_voltage).toFixed(2) + ' V';
      power_consumption_graph.addData(
          {x: msg.timestamp, y: converted_current * converted_voltage});
      consumptionReadout.value(power);
      batteryDial.value(mapSocPercent(converted_voltage));
      break;
    default:
      break;
  }
};
