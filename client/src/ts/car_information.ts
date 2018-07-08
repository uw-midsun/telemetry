import table = require('./table');
import d3 = require('d3');
import canDefs = require('./can_msg_defs');
import chart = require('./dual_chart');
import battery = require('./batteries');
import { CanMessage } from './can_msg';
import { AckManager, AckRequest } from './ack_handler';
import { Miscellaneous } from './miscellaneous';

//const ws = new WebSocket('ws://localhost:8080/ws');
const ws = new WebSocket('ws://localhost:8081');

let battery_status_dom: HTMLElement = document.getElementById("battery-status-table");

let battery_status = new battery.BatteryStatus(battery_status_dom);
battery_status.draw();

let ack_manager = new AckManager();
let fault_table_dom: HTMLElement = document.getElementById("fault-table");
let fault_table = new table.FaultTable(fault_table_dom, ack_manager);

let miscellaneous = new Miscellaneous();

ws.onmessage = (event) => {
  const raw_msg = JSON.parse(event.data);
  const msg: CanMessage = new CanMessage(raw_msg);
  ack_manager.process_msg(msg);
  fault_table.process_msg(msg);
  let data: any;
  switch (msg.id) {
    case canDefs.CanMessage.CAN_MESSAGE_BATTERY_AGGREGATE_VC:
      battery_status.updateBatteryInfo(msg.data);
      break;
    case canDefs.CanMessage.CAN_MESSAGE_BATTERY_VT:
      battery_status.updateCellInfo(msg.data);
      break;
    case canDefs.CanMessage.CAN_MESSAGE_POWER_STATE:
    case canDefs.CanMessage.CAN_MESSAGE_DRIVE_OUTPUT:
    case canDefs.CanMessage.CAN_MESSAGE_CRUISE_TARGET:
      miscellaneous.update(msg);
      break;
  }
}

