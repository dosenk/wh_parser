const { create, Client, ev } = require("@open-wa/wa-automate");
const fs = require("fs");
// const { Parser } = require("webpack");
const Parser = require("../controller/parser.controller");
const EVENT_IMG = "EVENT_IMG";

class WhatsAppController {
  constructor(io, name) {
    this.io = io;
    this.name = name;
    this.ParserObj = new Parser(io);
    this.start();
  }

  start() {
    ev.on("qr.**", async (qrcode, sessionId) => {
      const imageBuffer = Buffer.from(
        qrcode.replace("data:image/png;base64,", ""),
        "base64"
      );

      fs.writeFileSync(
        `qrs/qr_code${sessionId ? "_" + sessionId : ""}.png`,
        imageBuffer
      );

      this.sendQrClient(imageBuffer, sessionId);
    });
  }

  sendQrClient(sessionId) {
    this.io.emit(
      "qr",
      EVENT_IMG,
      `qr_code${sessionId ? "_" + sessionId : ""}.png`
    );
  }

  async getQr() {
    create({
      sessionId: this.name,
      qrLogSkip: false,
      useChrome: true,
      sessionDataPath: "./sessions",
      eventMode: false,
    }).then(async (client) => this.ParserObj.start(client, this.name));
    // this.listenWhEvents(client);
  }

  // async listenWhEvents(client) {
  //   console.log("qwe");
  //   client.onAnyMessage(async (message) => {
  //     console.log(1);
  //     console.log(message);
  //     if (message.body === "Hi") {
  //       await client.sendText(message.from, "👋 Hello!");
  //     }
  //     if (message.body === "Сколько время?") {
  //       console.log(Date.now());
  //       await client.sendText(message.from, Date.now());
  //     }
  //   });
  // }
}

module.exports = WhatsAppController;
