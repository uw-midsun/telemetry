import table = require('./table');
import d3 = require('d3');
import canDefs = require('./can_msg_defs');
import chart = require('./dual_chart');
import battery = require('./batteries');
import { CanMessage } from './can_msg';
import { AckManager, AckRequest } from './ack_handler';

const ws = new WebSocket('ws://localhost:8080/ws');
//const ws = new WebSocket('ws://localhost:8081');

let battery_status_dom: HTMLElement = document.getElementById("battery-status-table");

let battery_status = new battery.BatteryStatus(battery_status_dom);
battery_status.draw();

let fault_table_dom: HTMLElement = document.getElementById("fault-table");
let fault_table = new table.FaultTable(fault_table_dom);

let ack_manager = new AckManager();

ws.onmessage = (event) => {
  const raw_msg = JSON.parse(event.data);
  const msg: CanMessage = new CanMessage(raw_msg);
  console.log('msg', msg);
  //if ( msg.id == 35 || msg.id == 36 || msg.id == 37) {
  //  console.log('msg', msg.data); 
  //}
  ack_manager.process_msg(msg);
  fault_table.process_msg(msg);
  switch (msg.id) {
    case canDefs.CanMessage.CAN_MESSAGE_BATTERY_VT:
      battery_status.update(msg.data);
      break;
  }
  //if (msg.source == canDefs.CanMessage.CAN_MESSAGE_BATTERY_VT) {
  //  console.log('dlc', msg.dlc);
  //  console.log('data', msg.data);
  //}
}

