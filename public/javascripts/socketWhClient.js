const SOCKET_SERVER = "http://192.168.1.31:3000";
const EVENT_IMG = "EVENT_IMG";

export default class SocketIoClient {
  constructor() {
    this.socket = io(SOCKET_SERVER, { transports: ["websocket", "polling"] });
  }

  sendToServer(socketEvent, EVENT, data) {
    this.socket.emit(socketEvent, EVENT, data);
  }

  listenSocketEvents(showImage) {
    this.socket.on("connect", () => {
      console.log("connect to socket: succses");
    });

    this.socket.on("qr", (event, img) => {
      event === EVENT_IMG ? showImage(img) : console.log("error");
    });

    this.socket.on("messanges", (event, msg, name) => {
      // event: MSG_COUNT or MSG_NUMS
      if (event === "MSG_NUMS") {
        //общее количество сообщений в чате
        console.log(msg);
      }
      if (event === "MSG_COUNT") {
        // когда спарсил сообщение сюда придет его порядковый  номер. 1, 2 , 3 и т.д.
        console.log(msg, name);
      }
      if (event === "MSG_TEXT") {
        // когда спарсил сообщение сюда придет его порядковый  номер. 1, 2 , 3 и т.д.
        console.log(name + ': ', msg);
      }
    });
  }
  sendMessage = (msg) => {
    this.socket.emit("broadcast", msg);
  };
}

// module.exports = SocketIoClient;
