import table = require('./table');
import d3 = require('d3');
import canDefs = require('./can_msg_defs');
import chart = require('./dual_chart');
import battery = require('./batteries');

const ws = new WebSocket('ws://localhost:8081');

let battery_status_dom: HTMLElement = document.getElementById("battery-status-table");

let battery_status = new battery.BatteryStatus(battery_status_dom);
battery_status.draw();

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  switch (msg.id) {
    case canDefs.CanMessage.CAN_MESSAGE_BATTERY_VT:
      battery_status.update(msg.data);
  }
  //if (msg.source == canDefs.CanMessage.CAN_MESSAGE_BATTERY_VT) {
  //  console.log('dlc', msg.dlc);
  //  console.log('data', msg.data);
  //}
}

