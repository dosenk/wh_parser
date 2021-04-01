const SOCKET_SERVER = "http://localhost:3000";

class WhatsApp {
  constructor() {
    this.button = document.querySelector(".block-btn");
    this.img = document.querySelector(".block-img");
    this.addListener();
  }

  addListener() {
    this.button.addEventListener("click", () => {
      this.img.style.display = "none";
      this.request("luntik");
    });
  }

  showImage(img) {
    this.img.src = `http://localhost:3000/qrs/${img}`;
    this.img.style.display = "inline-block";
  }

  async request(nameObject) {
    const body = JSON.stringify({
      name: nameObject,
    });

    const response = await fetch("http://localhost:3000/qr", {
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
    this.socket = io(SOCKET_SERVER);
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
    this.socket.on("qr", (img) => {
      // this.whatsApp.button.style.display = "none";
      this.whatsApp.showImage(img);
      console.log(img);
    });
  }
  sendMessage = (msg) => {
    this.socket.emit("broadcast", msg);
  };
}

const client = new SocketIoClient();
// client.sendName('qwe');
