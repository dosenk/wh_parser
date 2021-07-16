// const SocketIoClient = require("./socketWhClient");
import SocketIoClient from "./socketWhClient.js";

class WhatsApp {
  constructor() {
    this.button = document.querySelector(".block-btn");
    this.buttonLogout = document.querySelector(".block-btn-logout");
    this.img = document.querySelector(".block-img");
    this.name = document.querySelector(".block-name");
    this.socketClient = new SocketIoClient();
    this.start();
  }

  start() {
    this.addListener();
    this.socketClient.listenSocketEvents(this.showImage.bind(this));
  }
  addListener() {
    this.button.addEventListener("click", () => {
      this.img.style.display = "none";
      this.request();
    });
    this.buttonLogout.addEventListener("click", () => {
      // console.log(11111);
      this.logout();
    });
  }

  showImage(img) {
    this.img.src = `http://192.168.1.31:3000/qrs/${img}`;
    this.img.style.display = "inline-block";
  }

  async logout() {
    console.log(this.name.value);
    this.socketClient.sendToServer("wh", "logout", this.name.value);
  }

  async request() {
    console.log(this.name.value);
    this.socketClient.sendToServer("wh", "start", this.name.value);
  }
}

const socket = new WhatsApp();
