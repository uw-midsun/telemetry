import canDefs = require('./can_msg_defs');

export class CanMessage {
  public source: canDefs.CanDevice;
  public id: canDefs.CanMessage;
  public rtr: boolean;
  public data: any;
  public timestamp: Date;
  constructor(raw: any) {
    this.source = raw.source;
    this.id = raw.id;
    this.rtr = raw.rtr;
    this.data = raw.data;
    this.timestamp = new Date(raw.timestamp);
  }
}

