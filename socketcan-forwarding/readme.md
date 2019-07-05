SocketCAN packet forwarding - WIP

- Use virtualenv
- Dependencies: python-can, websocket-client, pip3 install -r requirements.txt

- sudo ip link add dev vcan1 type vcan
- sudo ip link set up vcan1

- node install ws

Usage
- python3 pi.py config-receiver.json
- Broadcasts CAN on vcan1; can configure by changing config json.
- Can use cantools; e.g. to log: candump -L vcan1 > something.log