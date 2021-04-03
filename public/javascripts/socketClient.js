const SOCKET_SERVER = "http://192.168.1.31:3000";
const EVENT_IMG = "EVENT_IMG";
class WhatsApp {
  constructor() {
    this.button = document.querySelector(".block-btn");
    this.img = document.querySelector(".block-img");
    this.name = document.querySelector(".block-name");
    this.addListener();
  }

  addListener() {
    this.button.addEventListener("click", () => {
      this.img.style.display = "none";
      this.request("luntik");
    });
  }

  showImage(img) {
    this.img.src = `http://192.168.1.31:3000/qrs/${img}`;
    this.img.style.display = "inline-block";
  }

  async request() {
    const body = JSON.stringify({
      name: this.name.value,
    });
    console.log(this.name.value);
    const response = await fetch("http://192.168.1.31:3000/qr", {
      method: "post",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
      body,
    }).then((res) => console.log(res));
    return response;
  }
}

class SocketIoClient {
  constructor() {
    this.socket = io(SOCKET_SERVER, { transports: ["websocket", "polling"] });
    //, { transports: ["websocket", "polling"] }
    this.whatsApp = new WhatsApp();
    this.listenSocketEvents();
  }

  sendName(name) {
    this.socket.emit("broadcast", name);
  }

  listenSocketEvents() {
    this.socket.on("connect", () => {
      console.log(1);
    });

    this.socket.on("qr", (event, img) => {
      event === EVENT_IMG ? this.whatsApp.showImage(img) : console.log("erer");
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
    });
  }
  sendMessage = (msg) => {
    this.socket.emit("broadcast", msg);
  };
}

const client = new SocketIoClient();
// client.sendName('qwe');
