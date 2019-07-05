#!/usr/bin/env python3

import sys
import can
import json
import time
import websocket

CAN_CHANNEL_SUFFIX="-can"

def can_message_to_binary(msg):
    return msg.is_extended_id.to_bytes(1, "little") + msg.arbitration_id.to_bytes(4, "little") + msg.data

def binary_to_can_message(binary):
    is_extended_id = bool.from_bytes(binary[:1], "little")
    arbitration_id = int.from_bytes(binary[1:5], "little", signed=False)
    data = binary[5:]
    return can.Message(arbitration_id=arbitration_id, data=data, is_extended_id=is_extended_id)

class WsInterface:
    def __init__(self, server_url, can_bus):
        self.ws = websocket.WebSocketApp(server_url,
                                         on_message = lambda a,b: self.on_message(a, b),
                                         on_error = lambda a,b: self.on_error(a, b),
                                         on_close = lambda a: self.on_close(a),
                                         on_open = lambda a: self.on_open(a))
        self.can_bus = can_bus

    def on_open(self, ws):
        print("### opened ###")

    def on_message(self, ws, raw_data):
        can_message = binary_to_can_message(bytearray(raw_data))

        print("Received message from websocket")

        try:
            self.can_bus.send(can_message)
            print("WS -> CAN")
        except can.CanError:
            print("Failed to send a message to the socketCAN")

    def on_error(self, ws, error):
        print(error)

    def on_close(self, ws):
        print("### closed ###")

    def run_forever(self):
        self.ws.run_forever()

class CanInterface(can.Listener):
    def __init__(self):
        pass

    def set_ws(self, ws):
        self.ws_interface = ws_interface

    def on_message_received(self, msg):
        binary = can_message_to_binary(msg)
        try:
            self.ws_interface.ws.send(binary, websocket.ABNF.OPCODE_BINARY)
            # print("CAN -> WS")
        except:
            pass

if __name__ == '__main__':
    websocket.enableTrace(True)

    config_path = sys.argv[1]

    with open(config_path, 'r') as settings_file:
        settings = json.loads(settings_file.read())
        server_url = settings.get("server_url", "ws://localhost:8080")
        channel = settings.get("channel", "vcan0")

    print("Server URL: " + server_url)

    can_bus = can.interface.Bus(bustype="socketcan",
                                channel=channel,
                                receive_own_messages=False)
    # can_bus = None

    ws_interface = WsInterface(server_url, can_bus)
    can_interface = CanInterface()
    can_interface.set_ws(ws_interface)

    notifier = can.Notifier(can_bus, [can_interface])
    while True:
        ws_interface.run_forever()
        time.sleep(0.5)