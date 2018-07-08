import canDefs = require('./can_msg_defs');
import d3 = require('d3');

enum Direction {
  DIRECTION_NEUTRAL= 0,
  DIRECTION_FORWARD = 1,
  DIRECTION_REVERSE = 2,
  NUM_DIRECTIONS = 3
}

enum PowerState {
  POWER_STATE_IDLE = 0,
  POWER_STATE_CHARGE = 1,
  POWER_STATE_DRIVE = 2,
  NUM_POWER_STATES = 3
}

enum MiscConsts {
  DRIVE_OUTPUT_DENOMINATOR = (1 << 12)
}

class Miscellaneous {
  private _power_state: any;
  private _throttle: any;
  private _direction: any;
  private _cruise_control_active: any;
  private _cruise_control_target: any;
  private _mechanical_brake_state: any;

  constructor() {
    this._power_state = d3.select('#power_state');
    this._throttle = d3.select('#throttle');
    this._direction = d3.select('#direction');
    this._cruise_control_active = d3.select('#cruise_control_active');
    this._cruise_control_target = d3.select('#cruise_control_target');
    this._mechanical_brake_state = d3.select('#mechanical_brake_state');
  }

  public update(msg: any) {
    switch (msg.id) {
      case canDefs.CanMessage.CAN_MESSAGE_POWER_STATE:
        this._process_power_state(msg.data);
        break;
      case canDefs.CanMessage.CAN_MESSAGE_DRIVE_OUTPUT:
        this._process_drive_output(msg.data);
        break;
      case canDefs.CanMessage.CAN_MESSAGE_CRUISE_TARGET:
        this._process_cruise_target(msg.data);
        break;
    }
  }

  private _process_power_state(data: any) {
    let text: string; 
    switch (data.power_state) {
      case PowerState.POWER_STATE_IDLE:
        text = "Idle";
        break;
      case PowerState.POWER_STATE_CHARGE:
        text = "Charge";
        break;
      case PowerState.POWER_STATE_DRIVE:
        text = "Drive";
        break;
      default:
        text = `Invalid Power State: ${data.power_state}`;
    }
    this._power_state.text(text);
  }

  private _process_drive_output(data: any) {
    // Handling throttle:
    let throttle_ratio = data.throttle/MiscConsts.DRIVE_OUTPUT_DENOMINATOR;
    // keeping 3 significant digits.
    let throttle_percentage = Math.round(throttle_ratio * 1000)/10; 
    let throttle_text = `${throttle_percentage}%`;
    this._throttle.text(throttle_text);

    // Handling direction
    let direction_text: string;
    switch (data.direction) {
      case Direction.DIRECTION_NEUTRAL:
        direction_text = "Neutral";
        break;
      case Direction.DIRECTION_FORWARD:
        direction_text = "Forward";
        break;
      case Direction.DIRECTION_REVERSE:
        direction_text = "Reverse";
        break;
      default:
        direction_text = `Invalid Direction: ${data.direction}`;
    }
    this._direction.text(direction_text)

    // Handling cruise control
    let cruise_control_kmh: number = data.cruise_control * 3.6 / 100;
    this._cruise_control_active.text(`${Math.round(cruise_control_kmh * 10) / 10}km/h`);

    // Handling mechanical brake state
    let brake_ratio = data.mechanical_brake_state/MiscConsts.DRIVE_OUTPUT_DENOMINATOR;
    // keeping 3 significant digits.
    let brake_percentage = Math.round(brake_ratio * 1000)/10; 
    let brake_text = `${brake_percentage}%`;
    this._mechanical_brake_state.text(brake_text);
  }

  private _process_cruise_target(data: any) {
    let cruise_control_kmh: number = data["target speed"] * 3.6 / 100;
    this._cruise_control_target.text(`${Math.round(cruise_control_kmh * 10) / 10}km/h`);
  }


}

export { Miscellaneous }
