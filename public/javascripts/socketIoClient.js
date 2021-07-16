const SOCKET_SERVER = "http://192.168.1.31:3000";
const EVENT_IMG = "EVENT_IMG";

export default class SocketIoClient {
  constructor(table) {
    this.table = table;
    this.socket = io(SOCKET_SERVER, { transports: ["websocket", "polling"] });
  }

  start() {
    console.log("status");
    this.socket.emit("status", "GETSTATUS", null);
  }

  sendToServer(socketEvent, EVENT, data) {
    this.socket.emit(socketEvent, EVENT, data);
  }

  listenSocketEvents(showImage) {
    this.socket.on("connect", () => {
      console.log("connect to socket: succses");
    });

    this.socket.on("qr", (event, img) => {
      if (event === EVENT_IMG) showImage(img);
      if (event === "STOP") showImage(null);
    });

    this.socket.on("status", (event, data) => {
      if (event === "CONNECTION_STATUS") {
        // const clients = data.clients;
        console.log(data);
      }
    });

    this.socket.on("messanges", (event, data, name) => {
      // event: MSG_COUNT or MSG_NUMS
      if (event === "MSG_NUMS") {
        //общее количество сообщений в чате
        this.countMsg = data.countMsg;
        this.table.updateOrAddData([{ id: data.id, chat: data.chat }]);
      }
      if (event === "MSG_COUNT") {
        // когда спарсил сообщение сюда придет его порядковый  номер. 1, 2 , 3 и т.д.
        let newData = {
          id: data.id,
          progress: (data.numberMsg * 100) / this.countMsg,
        };
        // console.log(newData);
        this.table.updateOrAddData([newData]);
      }
      if (event === "FINISH_PARSE") {
        this.table.updateOrAddData([
          { id: data.id, chat: "FINISH: ALL", progress: 0 },
        ]);
      }
    });
  }

  sendMessage = (EVENT, msg) => {
    this.socket.emit(EVENT, msg);
  };
}
