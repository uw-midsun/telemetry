#! /bin/sh

# Start serving the website. Use 'nice' so the process plays nice with priority.
nice ./bin/telemetry start --fake &

chromium --kiosk --disable-infobars http://localhost:8080/driver_display.html &





