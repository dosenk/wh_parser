var { create, Client, decryptMedia, ev } = require("@open-wa/wa-automate");
const fs = require("fs");

class WhatsAppController {
  constructor(io, name) {
    this.io = io;
    this.name = name;
    this.start();
    this.getQr();
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

  sendQrClient(imageBuffer, sessionId) {
    this.io.emit("qr", `qr_code${sessionId ? "_" + sessionId : ""}.png`);
  }

  async getQr() {
    create({
      sessionId: this.name,
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
