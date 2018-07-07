import d3 = require('d3');
import canDefs = require('./can_msg_defs');
import { CanMessage } from './can_msg';
import { AckManager } from './ack_handler';

class TableField {
  public title: string;
  public field: string;
}

const enum BpsHeartbeatData {
  BPS_HEARTBEAT_FAULT_SOURCE_KILLSWITCH = 0,
  BPS_HEARTBEAT_FAULT_SOURCE_LTC_AFE,
  BPS_HEARTBEAT_FAULT_SOURCE_LTC_AFE_FSM,
  BPS_HEARTBEAT_FAULT_SOURCE_LTC_ADC,
  BPS_HEARTBEAT_FAULT_SOURCE_ACK_TIMEOUT,
}

class FaultTableEntry extends CanMessage {
   count: number;
}

export class FaultTable {
  private _table: any;
  private _tbody: any;
  private _entries: FaultTableEntry[] = [];
  private _fields: TableField[] = [
    {
      title: "Source ID",
      field: "source"
    },
    {
      title: "Msg ID",
      field: "id"
    },
    {
      title: "Data",
      field: "data"
    },
    {
      title: "Timestamp",
      field: "timestamp"
    }
  ];
  private _ack_manager: AckManager;

  constructor(table: HTMLElement, ack_manager: AckManager) {
    this._table = d3.select(table);
    this._createHeader(this._table, this._fields);
    this._tbody = this._createBody(this._table);
    this._ack_manager = ack_manager;
  }

  private _createHeader(table: any, fields: any[]) {
    table.append("thead")
      .append("tr")
      .selectAll("th")
      .data(fields)
      .enter()
      .append("th")
      .attr("scope", "col")
      .attr("class", "header")
      .text((d: any) => d.title);
  }
  
  private _createBody(table: any) {
    return table.append("tbody")
  }

  private _source_id_lookup: {[id:string]: string;} = {
    "1": "Plutus",
    "2": "Plutus Slave",
    "3": "Chaos",
    "4": "Telemetry",
    "5": "Lights Front",
    "6": "Lights Rear",
    "7": "Motor Controller",
    "8": "Driver Controls",
    "9": "Driver Display",
    "10": "Solar Master Front",
    "11": "Solar Master Rear",
    "12": "Sensor Board",
    "13": "Charger"
  }

  private _msg_id_lookup: {[id:string]: string;} = {
    "0": "BPS Heartbeat",
    "1": "Power Distribution Fault"
  }

  private _pwr_dst_data_lookup: {[id:string]: string;} = {
    "0": "BPS heartbeat",
    "1": "BPS heartbeat watchdog",
    "2": "Powertrain heartbeat watchdog",
    "3": "Relay retry expiry",
    "4": "Sequence retry expiry",
  }

  private _parse_bps_heartbeat_data(data: any) {
    let causes:string []= [];
    if (data & (1 << BpsHeartbeatData.BPS_HEARTBEAT_FAULT_SOURCE_KILLSWITCH)) {
      causes.push("Killswitch");
    }
    if (data & (1 << BpsHeartbeatData.BPS_HEARTBEAT_FAULT_SOURCE_LTC_AFE)) {
      causes.push("LTC AFE");
    }
    if (data & (1 << BpsHeartbeatData.BPS_HEARTBEAT_FAULT_SOURCE_LTC_AFE_FSM)) {
      causes.push("LTC AFE FSM");
    }
    if (data & (1 << BpsHeartbeatData.BPS_HEARTBEAT_FAULT_SOURCE_LTC_ADC)) {
      causes.push("LTC ADC");
    }
    if (data & (1 << BpsHeartbeatData.BPS_HEARTBEAT_FAULT_SOURCE_ACK_TIMEOUT)) {
      causes.push(`ACK Timeout: [${this._format_ack_timeout_devices()}]`);
    }
    return causes;
  }

  private _format_ack_timeout_devices(): string {
    let devices = this._ack_manager
                  .get_uncleared_acks()
                  .map((data: any) => this._source_id_lookup[data.toString()])
                  .join(", ");
    return devices;
  }


  private _MSG_WINDOW = 100 * 1000;
 
  private _filter_last_n_secs(): FaultTableEntry[] {
    let ago = new Date().getTime() - this._MSG_WINDOW;
    let filtered =  this._entries.filter((d: any) => {
      return d.timestamp > ago;
    });
    return filtered;
  }

  // To be equivalent:
  // id, source, and data must be the same.
  private _areEquivalent(d1: any, d2: any) {
    return (d1.id == d2.id) &&
           (d1.source == d2.source) &&
           (JSON.stringify(d1.data) == JSON.stringify(d2.data));
  }

  private _find_match(filtered: any[], data: any) {
    for (let i = 0; i < filtered.length; i++) {
      if (this._areEquivalent(filtered[i], data)) {
        return i;
      }
    }
    return -1;
  }

  private _isNotFault(data: any) {
    return this._isBpsHeartbeat(data) &&
           (data.data.status == 0);
  }

  private _isBpsHeartbeat(data: any) {
    return (data.id == canDefs.CanMessage.CAN_MESSAGE_BPS_HEARTBEAT);
  }

  public process_msg(msg: CanMessage) {
    if (msg.rtr) {
      return;
    }
    switch (msg.id) {
      case canDefs.CanMessage.CAN_MESSAGE_POWER_DISTRIBUTION_FAULT:
        this.update(msg);
        break;
      case canDefs.CanMessage.CAN_MESSAGE_BPS_HEARTBEAT:
        if (msg.data.status !== 0) {
          this.update(msg);
        }
        break;
    }
    return;
  }

  public update(data: CanMessage) {
    let filtered: FaultTableEntry[] = this._filter_last_n_secs();
    let index: number = this._find_match(filtered, data);
    let entry: FaultTableEntry = <FaultTableEntry> data;
    if (index < 0) {
      entry.count = 1;
    } else {
      let old: FaultTableEntry= this._removeOld(index);
      entry.count = (old.count) + 1;
    }
    this._addEntry(data);
  }

  private _removeOld(index: number): FaultTableEntry {
    // Remove it from the entries array.
    let entry = this._entries.splice(index, 1)[0];
    // Remove it in the GUI.
    d3.select("#t-" + entry.timestamp.getTime())
      .remove();
    return entry;
  }

  private _addEntry(data: any) {
      this._entries.push(data);
      this._tbody.insert("tr", ":first-child")
        .attr("id", "t-" + Math.round(data["timestamp"]))
        .selectAll("td")
        .data(this._fields)
        .enter()
        .append("td")
        .attr("class", (d: any) => d.field)
        .text((d: TableField) => {
          switch (d.field) {
            case "source":
              let str = "";
              let source_id = this._source_id_lookup[data["source"].toString()] || data["source"];
              str += source_id;
              str += ((data.count > 1) ? " (" + data.count + ")" : "");
              return this._source_id_lookup[data["source"].toString()]
                + ((data.count > 1) ? " (" + data.count + ")" : "");
            case "id":
              return this._msg_id_lookup[data["id"].toString()];
            case "data":
              return this._parseMsgData(data["data"], data.id);
            case "timestamp":
              let d = new Date(data["timestamp"])
                  .toTimeString()
                  .split(" ")[0];
              return d;
          }
          return data[d.field].toString();
        });
  }

  private _parseMsgData(data: any, id: number) {
    let field: string = "";
    for (let f in data) {
      field = f;
    }
    switch (id) {
      case canDefs.CanMessage.CAN_MESSAGE_POWER_DISTRIBUTION_FAULT:
        let txt: string = this._pwr_dst_data_lookup[data[field]];
        return this._pwr_dst_data_lookup[data[field]] || data[field];
      case canDefs.CanMessage.CAN_MESSAGE_BPS_HEARTBEAT:
        return this._parse_bps_heartbeat_data(data[field]).join(", ");
    }
    return JSON.stringify(data);
  }
}
