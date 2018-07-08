import canDefs = require('./can_msg_defs');
import { CanMessage } from './can_msg';

class AckRequest {
  in_use: boolean;
  message_id: canDefs.CanMessage;
  expected_devices: canDefs.CanDevice[];
  timer_id: number;
}

class AckManager {
  private readonly _ACK_TIMEOUT: number = 25;
  private readonly _MAX_REQUESTS: number = 10;

  private _requests_list: AckRequest[];
  constructor() {
    this._requests_list = [];
    for (let i = 0; i < this._MAX_REQUESTS; i++) {
      this._requests_list.push({
        in_use: false,
        message_id: canDefs.CanMessage.NUM_CAN_MESSAGES,
        expected_devices: [],
        timer_id: 0
      })
    }
  }

  private _uncleared_acks: canDefs.CanDevice[] = [];

  private request_timeout_callback(request: AckRequest)  {
    this._uncleared_acks = request.expected_devices;
    request.in_use = false;
  }

  public get_uncleared_acks() {
    return this._uncleared_acks;
  }

  public add_request(msg: CanMessage, expected_devices: canDefs.CanDevice[]) {
    for (let i = 0; i < this._MAX_REQUESTS; i++) {
      let request: AckRequest = this._requests_list[i];
      if (request.in_use) {
        continue;
      }
      let new_request = {
        in_use: true,
        message_id: msg.id,
        expected_devices: expected_devices,
        timer_id: setTimeout(() => {
          this.request_timeout_callback(new_request);
        }, this._ACK_TIMEOUT)
      }
      this._requests_list[i] = new_request;
      return;
    }
    console.error("Maximum number of requests reached!");
  }

  public process_ack(msg: CanMessage) {
    for (let i = 0; i <  this._MAX_REQUESTS; i++) {
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
          // We clear requests timer.
          clearTimeout(req.timer_id);
          // Request is no longer in use
          req.in_use = false;
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

