import can
import sys
import time

if __name__ == '__main__':
  channel = sys.argv[1]
  can_bus = can.interface.Bus(bustype="pcan",
                              channel=channel,
                              receive_own_messages=False)

  for x in range(0, 10000):
    time.sleep(0.001)
    can_message = can.Message(arbitration_id=26, data=x.to_bytes(8, "little"), is_extended_id=False)
    can_bus.send(can_message)