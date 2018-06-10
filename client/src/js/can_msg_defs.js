(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CanDevice;
    (function (CanDevice) {
        CanDevice[CanDevice["CAN_DEVICE_RESERVED"] = 0] = "CAN_DEVICE_RESERVED";
        CanDevice[CanDevice["CAN_DEVICE_PLUTUS"] = 1] = "CAN_DEVICE_PLUTUS";
        CanDevice[CanDevice["CAN_DEVICE_PLUTUS_SLAVE"] = 2] = "CAN_DEVICE_PLUTUS_SLAVE";
        CanDevice[CanDevice["CAN_DEVICE_CHAOS"] = 3] = "CAN_DEVICE_CHAOS";
        CanDevice[CanDevice["CAN_DEVICE_TELEMETRY"] = 4] = "CAN_DEVICE_TELEMETRY";
        CanDevice[CanDevice["CAN_DEVICE_LIGHTS_FRONT"] = 5] = "CAN_DEVICE_LIGHTS_FRONT";
        CanDevice[CanDevice["CAN_DEVICE_LIGHTS_REAR"] = 6] = "CAN_DEVICE_LIGHTS_REAR";
        CanDevice[CanDevice["CAN_DEVICE_MOTOR_CONTROLLER"] = 7] = "CAN_DEVICE_MOTOR_CONTROLLER";
        CanDevice[CanDevice["CAN_DEVICE_DRIVER_CONTROLS"] = 8] = "CAN_DEVICE_DRIVER_CONTROLS";
        CanDevice[CanDevice["CAN_DEVICE_DRIVER_DISPLAY"] = 9] = "CAN_DEVICE_DRIVER_DISPLAY";
        CanDevice[CanDevice["CAN_DEVICE_SOLAR_MASTER_FRONT"] = 10] = "CAN_DEVICE_SOLAR_MASTER_FRONT";
        CanDevice[CanDevice["CAN_DEVICE_SOLAR_MASTER_REAR"] = 11] = "CAN_DEVICE_SOLAR_MASTER_REAR";
        CanDevice[CanDevice["CAN_DEVICE_SENSOR_BOARD"] = 12] = "CAN_DEVICE_SENSOR_BOARD";
        CanDevice[CanDevice["CAN_DEVICE_CHARGER"] = 13] = "CAN_DEVICE_CHARGER";
        CanDevice[CanDevice["NUM_CAN_DEVICES"] = 14] = "NUM_CAN_DEVICES";
    })(CanDevice = exports.CanDevice || (exports.CanDevice = {}));
    var CanMessage;
    (function (CanMessage) {
        CanMessage[CanMessage["CAN_MESSAGE_BPS_HEARTBEAT"] = 0] = "CAN_MESSAGE_BPS_HEARTBEAT";
        CanMessage[CanMessage["CAN_MESSAGE_POWER_DISTRIBUTION_FAULT"] = 1] = "CAN_MESSAGE_POWER_DISTRIBUTION_FAULT";
        CanMessage[CanMessage["CAN_MESSAGE_BATTERY_RELAY_MAIN"] = 2] = "CAN_MESSAGE_BATTERY_RELAY_MAIN";
        CanMessage[CanMessage["CAN_MESSAGE_BATTERY_RELAY_SLAVE"] = 3] = "CAN_MESSAGE_BATTERY_RELAY_SLAVE";
        CanMessage[CanMessage["CAN_MESSAGE_MOTOR_RELAY"] = 4] = "CAN_MESSAGE_MOTOR_RELAY";
        CanMessage[CanMessage["CAN_MESSAGE_SOLAR_RELAY_REAR"] = 5] = "CAN_MESSAGE_SOLAR_RELAY_REAR";
        CanMessage[CanMessage["CAN_MESSAGE_SOLAR_RELAY_FRONT"] = 6] = "CAN_MESSAGE_SOLAR_RELAY_FRONT";
        CanMessage[CanMessage["CAN_MESSAGE_POWER_STATE"] = 7] = "CAN_MESSAGE_POWER_STATE";
        CanMessage[CanMessage["CAN_MESSAGE_POWERTRAIN_HEARTBEAT"] = 8] = "CAN_MESSAGE_POWERTRAIN_HEARTBEAT";
        CanMessage[CanMessage["CAN_MESSAGE_OVUV_DCDC_AUX"] = 16] = "CAN_MESSAGE_OVUV_DCDC_AUX";
        CanMessage[CanMessage["CAN_MESSAGE_MC_ERROR_LIMITS"] = 17] = "CAN_MESSAGE_MC_ERROR_LIMITS";
        CanMessage[CanMessage["CAN_MESSAGE_DRIVE_OUTPUT"] = 18] = "CAN_MESSAGE_DRIVE_OUTPUT";
        CanMessage[CanMessage["CAN_MESSAGE_CRUISE_TARGET"] = 19] = "CAN_MESSAGE_CRUISE_TARGET";
        CanMessage[CanMessage["CAN_MESSAGE_LIGHTS_SYNC"] = 23] = "CAN_MESSAGE_LIGHTS_SYNC";
        CanMessage[CanMessage["CAN_MESSAGE_LIGHTS_STATE"] = 24] = "CAN_MESSAGE_LIGHTS_STATE";
        CanMessage[CanMessage["CAN_MESSAGE_HORN"] = 25] = "CAN_MESSAGE_HORN";
        CanMessage[CanMessage["CAN_MESSAGE_CHARGER_CONN_STATE"] = 26] = "CAN_MESSAGE_CHARGER_CONN_STATE";
        CanMessage[CanMessage["CAN_MESSAGE_CHARGER_SET_RELAY_STATE"] = 27] = "CAN_MESSAGE_CHARGER_SET_RELAY_STATE";
        CanMessage[CanMessage["CAN_MESSAGE_STEERING_ANGLE"] = 28] = "CAN_MESSAGE_STEERING_ANGLE";
        CanMessage[CanMessage["CAN_MESSAGE_BATTERY_SOC"] = 31] = "CAN_MESSAGE_BATTERY_SOC";
        CanMessage[CanMessage["CAN_MESSAGE_BATTERY_VT"] = 32] = "CAN_MESSAGE_BATTERY_VT";
        CanMessage[CanMessage["CAN_MESSAGE_BATTERY_CURRENT"] = 33] = "CAN_MESSAGE_BATTERY_CURRENT";
        CanMessage[CanMessage["CAN_MESSAGE_MOTOR_CONTROLLER_VC"] = 35] = "CAN_MESSAGE_MOTOR_CONTROLLER_VC";
        CanMessage[CanMessage["CAN_MESSAGE_MOTOR_VELOCITY"] = 36] = "CAN_MESSAGE_MOTOR_VELOCITY";
        CanMessage[CanMessage["CAN_MESSAGE_MOTOR_ANGULAR_FREQUENCY"] = 37] = "CAN_MESSAGE_MOTOR_ANGULAR_FREQUENCY";
        CanMessage[CanMessage["CAN_MESSAGE_MOTOR_TEMPS"] = 38] = "CAN_MESSAGE_MOTOR_TEMPS";
        CanMessage[CanMessage["CAN_MESSAGE_MOTOR_AMP_HR"] = 39] = "CAN_MESSAGE_MOTOR_AMP_HR";
        CanMessage[CanMessage["CAN_MESSAGE_ODOMETER"] = 40] = "CAN_MESSAGE_ODOMETER";
        CanMessage[CanMessage["CAN_MESSAGE_AUX_DCDC_VC"] = 43] = "CAN_MESSAGE_AUX_DCDC_VC";
        CanMessage[CanMessage["CAN_MESSAGE_DCDC_TEMPS"] = 44] = "CAN_MESSAGE_DCDC_TEMPS";
        CanMessage[CanMessage["CAN_MESSAGE_SOLAR_DATA_FRONT"] = 45] = "CAN_MESSAGE_SOLAR_DATA_FRONT";
        CanMessage[CanMessage["CAN_MESSAGE_SOLAR_DATA_REAR"] = 46] = "CAN_MESSAGE_SOLAR_DATA_REAR";
        CanMessage[CanMessage["CAN_MESSAGE_LINEAR_ACCELERATION"] = 51] = "CAN_MESSAGE_LINEAR_ACCELERATION";
        CanMessage[CanMessage["CAN_MESSAGE_ANGULAR_ROTATION"] = 52] = "CAN_MESSAGE_ANGULAR_ROTATION";
        CanMessage[CanMessage["NUM_CAN_MESSAGES"] = 34] = "NUM_CAN_MESSAGES";
    })(CanMessage = exports.CanMessage || (exports.CanMessage = {}));
});
//# sourceMappingURL=can_msg_defs.js.map