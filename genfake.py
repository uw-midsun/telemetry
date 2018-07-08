from SimpleWebSocketServer import SimpleWebSocketServer, WebSocket
import json
import sys
import time
import random
import math
from enum import Enum

try:
    import thread
except ImportError:
    import _thread as thread

class CAN_DEVICE(Enum):
  SYSTEM_CAN_DEVICE_RESERVED = 0
  SYSTEM_CAN_DEVICE_PLUTUS = 1
  SYSTEM_CAN_DEVICE_PLUTUS_SLAVE = 2
  SYSTEM_CAN_DEVICE_CHAOS = 3
  SYSTEM_CAN_DEVICE_TELEMETRY = 4
  SYSTEM_CAN_DEVICE_LIGHTS_FRONT = 5
  SYSTEM_CAN_DEVICE_LIGHTS_REAR = 6
  SYSTEM_CAN_DEVICE_MOTOR_CONTROLLER = 7
  SYSTEM_CAN_DEVICE_DRIVER_CONTROLS = 8
  SYSTEM_CAN_DEVICE_DRIVER_DISPLAY = 9
  SYSTEM_CAN_DEVICE_SOLAR_MASTER_FRONT = 10
  SYSTEM_CAN_DEVICE_SOLAR_MASTER_REAR = 11
  SYSTEM_CAN_DEVICE_SENSOR_BOARD = 12
  SYSTEM_CAN_DEVICE_CHARGER = 13

class CAN_MESSAGE(Enum):
  SYSTEM_CAN_MESSAGE_BPS_HEARTBEAT = 0
  SYSTEM_CAN_MESSAGE_POWER_DISTRIBUTION_FAULT = 1
  SYSTEM_CAN_MESSAGE_BATTERY_RELAY_MAIN = 2
  SYSTEM_CAN_MESSAGE_BATTERY_RELAY_SLAVE = 3
  SYSTEM_CAN_MESSAGE_MOTOR_RELAY = 4
  SYSTEM_CAN_MESSAGE_SOLAR_RELAY_REAR = 5
  SYSTEM_CAN_MESSAGE_SOLAR_RELAY_FRONT = 6
  SYSTEM_CAN_MESSAGE_POWER_STATE = 7
  SYSTEM_CAN_MESSAGE_POWERTRAIN_HEARTBEAT = 8
  SYSTEM_CAN_MESSAGE_OVUV_DCDC_AUX = 16
  SYSTEM_CAN_MESSAGE_MC_ERROR_LIMITS = 17
  SYSTEM_CAN_MESSAGE_DRIVE_OUTPUT = 18
  SYSTEM_CAN_MESSAGE_CRUISE_TARGET = 19
  SYSTEM_CAN_MESSAGE_LIGHTS_SYNC = 23
  SYSTEM_CAN_MESSAGE_LIGHTS_STATE = 24
  SYSTEM_CAN_MESSAGE_HORN = 25
  SYSTEM_CAN_MESSAGE_CHARGER_CONN_STATE = 26
  SYSTEM_CAN_MESSAGE_CHARGER_SET_RELAY_STATE = 27
  SYSTEM_CAN_MESSAGE_STEERING_ANGLE = 28
  SYSTEM_CAN_MESSAGE_BATTERY_SOC = 31
  SYSTEM_CAN_MESSAGE_BATTERY_VT = 32
  SYSTEM_CAN_MESSAGE_BATTERY_CURRENT = 33
  SYSTEM_CAN_MESSAGE_MOTOR_CONTROLLER_VC = 35
  SYSTEM_CAN_MESSAGE_MOTOR_VELOCITY = 36
  SYSTEM_CAN_MESSAGE_MOTOR_ANGULAR_FREQUENCY = 37
  SYSTEM_CAN_MESSAGE_MOTOR_TEMPS = 38
  SYSTEM_CAN_MESSAGE_MOTOR_AMP_HR = 39
  SYSTEM_CAN_MESSAGE_ODOMETER = 40
  SYSTEM_CAN_MESSAGE_AUX_DCDC_VC = 43
  SYSTEM_CAN_MESSAGE_DCDC_TEMPS = 44
  SYSTEM_CAN_MESSAGE_SOLAR_DATA_FRONT = 45
  SYSTEM_CAN_MESSAGE_SOLAR_DATA_REAR = 46
  SYSTEM_CAN_MESSAGE_LINEAR_ACCELERATION = 51
  SYSTEM_CAN_MESSAGE_ANGULAR_ROTATION = 52

class PWR_DIST_FAULT(Enum):
  EE_POWER_DISTRIBUTION_FAULT_REASON_BPS_HB = 0
  EE_POWER_DISTRIBUTION_FAULT_REASON_BPS_HB_WATCHDOG = 1
  EE_POWER_DISTRIBUTION_FAULT_REASON_POWERTRAIN_HB_WATCHDOG = 2
  EE_POWER_DISTRIBUTION_FAULT_REASON_RELAY_RETRY_EXPIRY = 3
  EE_POWER_DISTRIBUTION_FAULT_REASON_SEQUENCE_RETRY_EXPIRY = 4


class GenFake():
    _module_id = 0
    _NUM_CELLS = 36
    def genBatteryVT(self):
        msg = {
            "id" : CAN_MESSAGE.SYSTEM_CAN_MESSAGE_BATTERY_VT.value,
            "source" : CAN_DEVICE.SYSTEM_CAN_DEVICE_PLUTUS.value,
            "rtr": False,
            "data" : {
                "module_id" : self._module_id,
                "voltage" : 30000 + round(random.uniform(0, 16000), 1),
                "temperature" : 20000 + round(random.uniform(0, 4000), 1)
            }
        }
        self._module_id += 1
        self._module_id = self._module_id % self._NUM_CELLS
        return msg

    _pwr_dist_faut = 0
    _NUM_PWR_DIST_FAULTS = 5
    def genPowerDistFault(self):
        msg = {
            "id" : CAN_MESSAGE.SYSTEM_CAN_MESSAGE_POWER_DISTRIBUTION_FAULT.value,
            "rtr": False,
            "source" : CAN_DEVICE.SYSTEM_CAN_DEVICE_CHAOS.value,
            "data" : {
                "reason" : self._pwr_dist_faut 
            }
        }
        self._pwr_dist_faut += 1
        self._pwr_dist_faut = self._pwr_dist_faut % self._NUM_PWR_DIST_FAULTS
        return msg

    def genSteeringAngle(self):
        msg = {
            "id" : CAN_MESSAGE.SYSTEM_CAN_MESSAGE_STEERING_ANGLE.value,
            "rtr": False,
            "source" : CAN_DEVICE.SYSTEM_CAN_DEVICE_DRIVER_CONTROLS.value,
            "data" : {
                "steering_angle" : round(20 * math.sin(time.time()), 3)
            }
        }
        return msg

    def genPowerState(self):
        msg = {
            "id" : CAN_MESSAGE.SYSTEM_CAN_MESSAGE_POWER_STATE.value,
            "rtr": False,
            "source" : CAN_DEVICE.SYSTEM_CAN_DEVICE_DRIVER_CONTROLS.value,
            "data" : {
                "power_state" : random.randint(0,2)
            }
        }
        return msg

    def genDriveOutput(self):
        msg = {
            "id" : CAN_MESSAGE.SYSTEM_CAN_MESSAGE_DRIVE_OUTPUT.value,
            "rtr": False,
            "source" : CAN_DEVICE.SYSTEM_CAN_DEVICE_DRIVER_CONTROLS.value,
            "data" : {
                "throttle" : abs(math.sin(time.time()) * (1 << 12)),
                "direction" : random.randint(0,2),
                "cruise_control" : 600 + abs(math.sin(math.pi/2 + time.time()) * 1300),
                "mechanical_brake_state" : abs(math.sin(math.pi/2 + time.time()) * (1 << 12))
            }
        }
        return msg

    def genCruiseTarget(self):
        msg = {
            "id" : CAN_MESSAGE.SYSTEM_CAN_MESSAGE_BPS_HEARTBEAT.value,
            "source" : CAN_DEVICE.SYSTEM_CAN_DEVICE_PLUTUS.value,
            "rtr": False,
            "data": {
                "status": 0 
            }
        }
        return msg

    _heartbeat_status = 1
    _NUM_HEARTBEAT_STATUS = 5
    def genBpsHeartbeatFault(self):
        msg = {
            "id" : CAN_MESSAGE.SYSTEM_CAN_MESSAGE_BPS_HEARTBEAT.value,
            "source" : CAN_DEVICE.SYSTEM_CAN_DEVICE_PLUTUS.value,
            "rtr": False,
            "data" : {
                "status" : self._heartbeat_status 
            }
        }
        self._heartbeat_status = (1 << random.randint(0, self._NUM_HEARTBEAT_STATUS - 1))
        return msg
    def genBpsHeartbeat(self):
        msg = {
            "id" : CAN_MESSAGE.SYSTEM_CAN_MESSAGE_BPS_HEARTBEAT.value,
            "source" : CAN_DEVICE.SYSTEM_CAN_DEVICE_PLUTUS.value,
            "rtr": False,
            "data": {
                "status": 0 
            }
        }
        return msg
    def genAck(self, msgID, source):
        msg = {
            "id" : msgID,
            "source" : source,
            "rtr": True,
            "data" : {
            }
        }
        return msg

# gen heartbeat periodically.
# gen ack's with some probability.
# gen 

port = 8081

genfake = GenFake()

class SimpleEcho(WebSocket):

    _connected = True

    def sendTimestampedMessage(self, msg):
        if msg is None:
            return
        msg["timestamp"] = time.time() * 1000
        self.sendMessage(unicode(json.dumps(msg)))

    def handleConnected(self):
        def run(*args):
            while self._connected:
                time.sleep(0.3)

                msg = genfake.genBatteryVT()
                self.sendTimestampedMessage(msg)
                msg = None

                if random.randint(1,101) < 50:
                    if random.randint(1,101) < 10:
                        msg = genfake.genPowerDistFault()
                else:
                    if random.randint(1,101) < 15:
                        msg = genfake.genBpsHeartbeatFault()
                self.sendTimestampedMessage(msg)

                msg = genfake.genBpsHeartbeat()
                self.sendTimestampedMessage(msg)
                if random.randint(1, 101) < 90:
                    msg = genfake.\
                        genAck(CAN_MESSAGE.SYSTEM_CAN_MESSAGE_BPS_HEARTBEAT.value,
                                CAN_DEVICE.SYSTEM_CAN_DEVICE_PLUTUS_SLAVE.value)
                    self.sendTimestampedMessage(msg)
                if random.randint(1, 101) < 90:
                    msg = genfake.\
                        genAck(CAN_MESSAGE.SYSTEM_CAN_MESSAGE_BPS_HEARTBEAT.value,
                                CAN_DEVICE.SYSTEM_CAN_DEVICE_CHAOS.value)
                    self.sendTimestampedMessage(msg)
                if random.randint(1, 101) < 90:
                    msg = genfake.\
                        genAck(CAN_MESSAGE.SYSTEM_CAN_MESSAGE_BPS_HEARTBEAT.value,
                                CAN_DEVICE.SYSTEM_CAN_DEVICE_DRIVER_CONTROLS.value)
                    self.sendTimestampedMessage(msg)
                
                msg = genfake.genSteeringAngle()
                self.sendTimestampedMessage(msg)

                if random.randint(1, 100) <= 5:
                    msg = genfake.genPowerState()
                    self.sendTimestampedMessage(msg)
                msg = genfake.genDriveOutput()
                self.sendTimestampedMessage(msg)

        thread.start_new_thread(run, ())

    def handleClose(self):
        self._connected = False
        print(self.address, 'closed')

server = SimpleWebSocketServer('', port, SimpleEcho)

server.serveforever()
