import streamGraph = require('./streaming_graph');
import dial = require('./dial');
import readout = require('./readout');
import vis = require('./visibility');
import animate = require('./animate');
import canDefs = require('./can_msg_defs');

// SOC mapping
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

class graph {
  xScale: any;
  timeDomain: any;
  graph_graph: any;
  graph_dataset: any;
  constructor(timeWindow: number, element: string) {
    const kWindowMillis = timeWindow;
    this.timeDomain = new streamGraph.TimeWindow(kWindowMillis);
    this.xScale = new streamGraph.WindowedScale((domain: any[]) => this.timeDomain.cached);
    const xScaleLabels = new Plottable.Scales.Linear().domain([timeWindow / 60000, 0]);
    const xScaleLabelsTickGenerator = Plottable.Scales.TickGenerators.integerTickGenerator();
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
    this.graph_dataset = [];
    const xTimeBuffer = 1000;
    this.graph_graph = new streamGraph.StreamingDataset(
      this.graph_dataset, { color: 'rgb(88, 86, 214)' });
    this.graph_dataset.filter((data: any[]) => {
      const time_window = this.timeDomain.begin() - xTimeBuffer;
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
    streamingPlot.datasets([this.graph_graph]);
    streamingPlot.y((d: any) => d.y, yScale);
    streamingPlot.x((d: any) => d.x, this.xScale);
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
    chart.renderTo('#' + element);
    this.graph_graph.dataUpdate = () => this.UpdatePlot();
  }
  UpdatePlot(): void {
    this.timeDomain.domain();
    this.xScale.domain();
  }
}

const batteryVoltageGraph = new graph(180000, 'battery-voltage-graph');
const batteryCurrentGraph = new graph(180000, 'battery-current-graph');
const solarFrontVoltageGraph = new graph(180000, 'solar-front-voltage-graph');
const solarFrontCurrentGraph = new graph(180000, 'solar-front-current-graph');
const solarRearVoltageGraph = new graph(180000, 'solar-rear-voltage-graph');
const solarRearCurrentGraph = new graph(180000, 'solar-rear-current-graph');
// Date
function updateDate(): void {
  const date = new Date();
  document.getElementById('date-text').innerHTML =
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Updates
window.setInterval(() => {
  updateDate();
}, 30000);

// Initializations
const ws = new WebSocket(
  'ws://' + window.location.hostname + ':' + window.location.port + '/ws'
);
updateDate();


function setToEllipses(element: string): void {
  document.getElementById(element).innerHTML = "...";
}

var faultArray: string[] = ['...', '...', '...', '...', '...'];
function insertFaultMessage(msg: string): void {
  faultArray.unshift(msg);
  faultArray = faultArray.slice(0, 5);
  let faultList: string = "";
  for (let fault of faultArray) {
    faultList += "<li>" + fault + "</li>";
  }
  document.getElementById('fault-printout-list').innerHTML = faultList;
}

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.id) {
    case canDefs.CanMessage.CAN_MESSAGE_BPS_HEARTBEAT:
      document.getElementById('bps-hb-text').innerHTML = "beep";
      setTimeout(setToEllipses, 100, 'bps-hb-text');
      break;
    case canDefs.CanMessage.CAN_MESSAGE_POWERTRAIN_HEARTBEAT:
      document.getElementById('powertrain-hb-text').innerHTML = "beep";
      setTimeout(setToEllipses, 100, 'powertrain-hb-text');
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
      const bat_converted_current = ((msg.data.current << 32) >> 32) / 1000000;
      const bat_converted_voltage = msg.data.voltage / 10000;
      document.getElementById('mp-current').innerHTML =
        (bat_converted_current).toFixed(1) + ' A';
      document.getElementById('mp-voltage').innerHTML =
        (bat_converted_voltage).toFixed(1) + ' V';
      document.getElementById('bat-voltage-value').innerHTML =
        'Value: ' + (bat_converted_voltage).toFixed(1) + ' V';
      document.getElementById('bat-current-value').innerHTML =
        'Value: ' + (bat_converted_current).toFixed(1) + ' A';
      batteryVoltageGraph.graph_graph.addData(
        { x: msg.timestamp, y: bat_converted_voltage });
      batteryCurrentGraph.graph_graph.addData(
        { x: msg.timestamp, y: bat_converted_current });
      document.getElementById('state-of-charge').innerHTML =
        'State of charge: ' + mapSocPercent(bat_converted_voltage).toFixed(2) + '%';
      break;
    case canDefs.CanMessage.CAN_MESSAGE_SOLAR_DATA_FRONT:
      const solar_front_current = msg.data.current;
      const solar_front_voltage = msg.data.voltage;
      solarFrontVoltageGraph.graph_graph.addData(
        { x: msg.timestamp, y: solar_front_voltage });
      solarFrontCurrentGraph.graph_graph.addData(
        { x: msg.timestamp, y: solar_front_current });
      document.getElementById('solar-front-voltage-value').innerHTML =
        'Value: ' + solar_front_voltage.toFixed(1) + ' V';
      document.getElementById('solar-front-current-value').innerHTML =
        'Value: ' + solar_front_current.toFixed(1) + ' A';
      document.getElementById('solar-front-temp').innerHTML =
        'front temp: ' + msg.data.temp.toString();
      break;
    case canDefs.CanMessage.CAN_MESSAGE_SOLAR_DATA_REAR:
      const solar_rear_current = msg.data.current;
      const solar_rear_voltage = msg.data.voltage;
      solarRearVoltageGraph.graph_graph.addData(
        { x: msg.timestamp, y: solar_rear_voltage });
      solarRearCurrentGraph.graph_graph.addData(
        { x: msg.timestamp, y: solar_rear_current });
      document.getElementById('solar-rear-voltage-value').innerHTML =
        'Value: ' + solar_rear_voltage.toFixed(1) + ' V';
      document.getElementById('solar-rear-current-value').innerHTML =
        'Value: ' + solar_rear_current.toFixed(1) + ' A';
      document.getElementById('solar-rear-temp').innerHTML =
        'rear temp: ' + msg.data.temp.toString();
      break;
    case canDefs.CanMessage.CAN_MESSAGE_BATTERY_RELAY_MAIN:
      if (msg.data > 0)
        document.getElementById('bat-main-relay-state').innerHTML = 'closed';
      else
        document.getElementById('bat-main-relay-state').innerHTML = 'open';
      break;
    case canDefs.CanMessage.CAN_MESSAGE_BATTERY_RELAY_SLAVE:
      if (msg.data > 0)
        document.getElementById('bat-slave-relay-state').innerHTML = 'closed';
      else
        document.getElementById('bat-slave-relay-state').innerHTML = 'open';
      break;
    case canDefs.CanMessage.CAN_MESSAGE_SOLAR_RELAY_FRONT:
      if (msg.data > 0)
        document.getElementById('solar-front-relay-state').innerHTML = 'closed';
      else
        document.getElementById('solar-front-relay-state').innerHTML = 'open';
      break;
    case canDefs.CanMessage.CAN_MESSAGE_SOLAR_RELAY_REAR:
      if (msg.data > 0)
        document.getElementById('solar-rear-relay-state').innerHTML = 'closed';
      else
        document.getElementById('solar-rear-relay-state').innerHTML = 'open';
      break;
    case canDefs.CanMessage.CAN_MESSAGE_MOTOR_RELAY:
      if (msg.data > 0)
        document.getElementById('motor-relay-state').innerHTML = 'closed';
      else
        document.getElementById('motor-relay-state').innerHTML = 'open';
      break;
    case canDefs.CanMessage.CAN_MESSAGE_POWER_DISTRIBUTION_FAULT:
      insertFaultMessage("power distro fault");
      break;
    case canDefs.CanMessage.CAN_MESSAGE_OVUV_DCDC_AUX:
      if (msg.data.dcdc_ov_flag == 1)
        insertFaultMessage("dcdc ov fault");
      if (msg.data.dcdc_uv_flag == 1)
        insertFaultMessage("dcdc uv fault");
      if (msg.data.aux_bat_ov_flag == 1)
        insertFaultMessage("aux ov fault");
      if (msg.data.aux_bat_uv_flag == 1)
        insertFaultMessage("aux uv fault");
      break;
    case canDefs.CanMessage.CAN_MESSAGE_HORN:
      insertFaultMessage("CAR GO BEEP BEEP");
      break;
    default:
      //console.log(`No handler found: data=${event.data}`);
      break;
  }
};

ws.onclose = (event) => {
  console.error('WebSocket closed observed:', event);
};

ws.onerror = (event) => {
  console.error('WebSocket error observed:', event);
};