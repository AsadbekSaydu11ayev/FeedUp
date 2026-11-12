// SSE (Server-Sent Events) Broadcaster for Real-time Order Updates

let clients = [];

function addClient(res) {
  clients.push(res);
  res.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
}

function broadcastEvent(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch (err) {
      console.error('Error writing to client:', err.message);
    }
  }
}

function getActiveClientCount() {
  return clients.length;
}

module.exports = {
  addClient,
  broadcastEvent,
  getActiveClientCount
};

