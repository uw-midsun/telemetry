import canDefs = require('./can_msg_defs');

// Date
function updateDate(): void {
  const date = new Date();
  document.getElementById('date-text').innerHTML =
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Updates
window.setInterval(() => {
  updateDate();
}, 30000);

// Initializations
const ws = new WebSocket(
  'ws://' + window.location.hostname + ':' + window.location.port + '/ws'
);
updateDate();


ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.id) {
    case canDefs.CanMessage.CAN_MESSAGE_BATTERY_VT:
      document.getElementById('bat-voltage-' + msg.data.id.toString()).innerHTML =
        msg.data.voltage;
      break;
    case canDefs.CanMessage.CAN_MESSAGE_SOLAR_DATA_FRONT:
      document.getElementById('solar-front-voltage-' + msg.data.id.toString()).innerHTML =
        msg.data.voltage;
      break;
    case canDefs.CanMessage.CAN_MESSAGE_SOLAR_DATA_REAR:
      document.getElementById('solar-rear-voltage-' + msg.data.id.toString()).innerHTML =
        msg.data.voltage;
      break;
    default:
      //console.log(`No handler found: data=${event.data}`);
      break;
  }
};

ws.onclose = (event) => {
  console.error('WebSocket closed observed:', event);
};

ws.onerror = (event) => {
  console.error('WebSocket error observed:', event);
};