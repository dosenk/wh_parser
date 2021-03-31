var { create, Client, decryptMedia, ev } = require("@open-wa/wa-automate");
const fs = require("fs");

class WhatsAppController {
  constructor(io) {
    this.io = io;
    this.start();
    this.getQr();
  }

  start() {
    console.log(123123);
    ev.on("qr.**", async (qrcode, sessionId) => {
      const imageBuffer = Buffer.from(
        qrcode.replace("data:image/png;base64,", ""),
        "base64"
      );

      this.sendQrClient(imageBuffer, sessionId);

      // пишет qr в файл
      fs.writeFileSync(
        `qrs/qr_code${sessionId ? "_" + sessionId : ""}.png`,
        imageBuffer
      );
    });
  }

  sendQrClient(imageBuffer, sessionId) {
    console.log("send qr to client");
    this.io.emit("qr", `qr_code${sessionId ? "_" + sessionId : ""}.png`);
  }

  async getQr() {
    create({
      sessionId: "name22",
      qrLogSkip: false,
      useChrome: true,
      sessionDataPath: "./sessions",
      eventMode: true,
    }).then((client) => {
      this.listenWhEvents(client);
    });
  }

  async listenWhEvents(client) {
    client.onAnyMessage(async (message) => {
      console.log(message.body);
      if (message.body === "Hi") {
        await client.sendText(message.from, "👋 Hello!");
      }
      if (message.body === "Сколько время?") {
        console.log(Date.now());
        await client.sendText(message.from, Date.now());
      }
    });
  }
}

module.exports = WhatsAppController;
