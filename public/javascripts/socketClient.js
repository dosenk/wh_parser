const SOCKET_SERVER = "http://localhost:3000";

class SocketIoClient {
  constructor() {
    this.socket = io(SOCKET_SERVER);
  }

  sendName(name) {
    this.socket.emit("broadcast", name);
  }

  listenSocketEvents() {
    this.socket.on(EVENT_CONNECT, () => {
      // событи будет сробатывать при подключении к сокету
    });
  }
  sendMessage = (msg) => {
    this.socket.emit("broadcast", msg);
  };
}

const client = new SocketIoClient();
// client.sendName('qwe');
