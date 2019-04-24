#! /bin/sh

# Kill any old instances of telemetry.
pkill telemetry

# Start serving the website. Use 'nice' so the process plays nice with
# scheduling priority otherwise it can overrun.
nice ./bin/telemetry start --tty=/dev/ttyAMA0 --db=can.db \
  --schema=can_messages.asciipb &

# Start a very minimal version of Chromium in fullscreen.
chromium-browser --kiosk --incognito --noerrdialogs --disable-infobars \
  http://localhost:8080/static/driver_display.html &
