import SocketIoClient from "./socketIoClient.js";

class WhatsApp {
  constructor() {
    this.parenElement = document.querySelector("#root");
    this.img = document.querySelector(".block-img");
    this.qrLayout = document.querySelector(".qr__text");
    this.start();
  }

  start() {
    fetch("http://192.168.100.202/whatsApp/getWhObjects.php", {
      method: "GET", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *client
    })
      .then((response) => response.json())
      .then((res) => {
        this.renderTable(res);
        this.socketClient = new SocketIoClient(this.table);
        this.socketClient.listenSocketEvents(this.showImage.bind(this));
        this.socketClient.start();
      });
  }

  renderTable(data) {
    let startBtn = function (row) {
      let btn = document.createElement("button");
      btn.className = "btn-start";
      btn.innerText = "start";
      btn.onclick = (e) => {
        const number = row.getData().number;
        const id = row.getData().id;
        this.startParse(number, id);
      };
      return btn;
    };
    let logoutBtn = function (row) {
      let btn = document.createElement("button");
      btn.className = "btn-logout";
      btn.innerText = "logout";
      btn.onclick = (e) => {
        const number = row.getData().number;
        this.logout(number);
      };
      return btn;
    };

    this.table = new Tabulator("#table", {
      data: data, //assign data to table
      layout: "fitColumns", //fit columns to width of table (optional)
      footerElement: "<button>Custom Button</button>",
      columns: [
        { title: "id", field: "id", print: false, width: 50 },
        { title: "OTM", field: "otm", width: 80 },
        { title: "Object", field: "object", width: 150 },
        {
          title: "number",
          field: "number",
          width: 150,
        },
        {
          title: "chat",
          field: "chat",
          width: 200,
        },
        {
          title: "progress",
          field: "progress",
          formatter: "progress",
          minWidth: 360,
          formatterParams: {
            min: 0,
            max: 100,
            color: ["green", "orange", "red"],
            legendColor: "#000000",
            legendAlign: "left",
          },
        },
        {
          title: "res",
          field: "buttonTick",
          formatter: "progress",
          width: 40,
        },
        {
          title: "start",
          formatter: startBtn.bind(this),
          width: 80,
        },
        {
          title: "logout",
          formatter: logoutBtn.bind(this),
          width: 80,
        },
      ],
    });
  }

  // updateTable(data) {

  // }

  // updateTableChatProgress(data) {
  //   let newData = {
  //     id: data.id,
  //     progress: (data.countMsg * 100) / this.countMsg,
  //   };
  //   this.table.updateOrAddData([newData]);
  // }

  showImage(img) {
    if (img === null) {
      this.qrLayout.removeAttribute("style");
      this.img.removeAttribute("style");
    } else {
      this.qrLayout.style.display = "none";
      this.img.src = `http://192.168.1.31:3000/qrs/${img}`;
      this.img.style.display = "inline-block";
    }
  }

  async logout(number) {
    this.socketClient.sendToServer("wh", "logout", { number });
  }

  async startParse(number, id) {
    this.socketClient.sendToServer("wh", "start", { number, id });
  }
}

const socket = new WhatsApp();
