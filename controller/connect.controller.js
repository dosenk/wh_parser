var { create, Client, decryptMedia, ev } = require("@open-wa/wa-automate");
const fs = require("fs");
const io = require("../app");
console.log(io, "asd");
ev.on("qr.**", async (qrcode, sessionId) => {
  const imageBuffer = Buffer.from(
    qrcode.replace("data:image/png;base64,", ""),
    "base64"
  );

  fs.writeFileSync(
    `qr_code${sessionId ? "_" + sessionId : ""}.png`,
    imageBuffer
  );
});

class ConnectController {
  static async getQr(req, res) {
    const { name } = req.query;
    console.log(req.query);
    res.render("index", { title: "Express" });

    create({
      sessionId: name,
      qrLogSkip: false,
      useChrome: true,
      sessionDataPath: "./sessions",
      eventMode: true,
    }).then((client) => {
      ConnectController.start(client);
    });
  }

  static async start(client) {
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

module.exports = ConnectController;
