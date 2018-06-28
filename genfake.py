from SimpleWebSocketServer import SimpleWebSocketServer, WebSocket
import json
import sys
import time
import random
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

NUM_CELLS = 36
module_id = 0

class GenFake():
    _module_id = 0
    def genBatteryVT(self):
        msg = {
            "id" : CAN_MESSAGE.SYSTEM_CAN_MESSAGE_BATTERY_VT.value,
            "source" : CAN_DEVICE.SYSTEM_CAN_DEVICE_PLUTUS.value,
            "data" : {
                "module_id" : self._module_id,
                "voltage" : 2600 + round(random.uniform(0, 1600),1),
                "temperature" : 25 + round(random.uniform(0, 30),1)
            }
        }
        self._module_id += 1
        self._module_id = self._module_id % NUM_CELLS
        return msg

port = 8081

genfake = GenFake()

class SimpleEcho(WebSocket):

    _connected = True

    def handleConnected(self):
        def run(*args):
            while self._connected:
                time.sleep(0.05)
                msg = genfake.genBatteryVT()
                self.sendMessage(unicode(json.dumps(msg)))
        thread.start_new_thread(run, ())

    def handleClose(self):
        self._connected = False
        print(self.address, 'closed')

server = SimpleWebSocketServer('', port, SimpleEcho)

server.serveforever()
