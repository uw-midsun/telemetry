#! /bin/sh

# Kill any old instances of telemetry.
pkill telemetry

# Initialize CAN (PCAN dongle for now) 
sudo modprobe can
sudo modprobe can_raw
sudo modprobe vcan
sudo ip link set can0 up type can bitrate 500000

# Start serving the website. Use 'nice' so the process plays nice with
# scheduling priority otherwise it can overrun.
nice ./bin/telemetry start --socketcan=can0 --db=can.db \
  --schema=can_messages.asciipb &

# Start a very minimal version of Chromium in fullscreen.
chromium-browser --kiosk --incognito --noerrdialogs --disable-infobars \
  http://localhost:8080/driver_display.html &





