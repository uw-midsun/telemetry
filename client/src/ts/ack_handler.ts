import canDefs = require('./can_msg_defs');
import { CanMessage } from './can_msg';

class AckRequest {
  message_id: canDefs.CanMessage;
  expected_devices: canDefs.CanDevice[];
  timer_id: number;
}

class AckManager {
  private readonly _ACK_TIMEOUT: number = 25;
  private _requests_list: AckRequest[];
  constructor() {
    this._requests_list = [];
  }
  public add_request(msg: CanMessage, expected_devices: canDefs.CanDevice[]) {
    let request: AckRequest = {
      message_id: msg.id,
      expected_devices: expected_devices,
      timer_id: setTimeout(()=>{
        console.log("uncleared acks: " + request.expected_devices.join(','));
      }, this._ACK_TIMEOUT)
    }
    this._requests_list.push(request);
  }
  public process_ack(msg: CanMessage) {
    for (let i = 0; i <  this._requests_list.length; i++) {
      let req: AckRequest = this._requests_list[i];
      if (req.message_id !== msg.id) {
        // This isn't the ack for the current request in the request list. 
        continue;
      }
      let i_expected_device: number = req.expected_devices.indexOf(msg.source);
      if (0 <= i_expected_device) {
        // It gets Ack'd.
        req.expected_devices.splice(i_expected_device, 1);
        if (req.expected_devices.length == 0) {
          console.log('cleared acks');
          // We clear requests timer.
          clearTimeout(req.timer_id);
          // We delete request!
          this._requests_list.splice(i, 1);
        }
        return;
      }
    }
  }

  public process_msg(msg: CanMessage) {
    switch (msg.id) {
      case canDefs.CanMessage.CAN_MESSAGE_BPS_HEARTBEAT:
        if (msg.rtr) {
          this.process_ack(msg);
          return;
        }
        this.add_request(msg, [
          canDefs.CanDevice.CAN_DEVICE_PLUTUS_SLAVE,
          canDefs.CanDevice.CAN_DEVICE_CHAOS,
          canDefs.CanDevice.CAN_DEVICE_DRIVER_CONTROLS
        ]);
        return;
    }
    return;
  }
}

export { AckManager, AckRequest }


