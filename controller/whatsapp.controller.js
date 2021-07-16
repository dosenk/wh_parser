const { create, Client, ev } = require("@open-wa/wa-automate");
const fs = require("fs");
const Parser = require("../controller/parser.controller");
const EVENT_IMG = "EVENT_IMG";
const io = require("socket.io");
const redisIo = require("socket.io-redis");
const pm2 = require("pm2");
const redis = require("redis");

const options = {
  cors: true,
  transports: ["websocket", "polling"],
  methods: ["GET", "POST"],
  origins: ["http://192.168.1.86:3000"],
};

class WhatsAppController {
  constructor(server) {
    this.server = server;
    this.io = io(server, options);
    this.ParserObj = new Parser(this.io);
    this.setClients = new Map();
    this.redisClient = redis.createClient();
  }

  start() {
    console.log("start");
    this.io.adapter(redisIo({ host: "localhost", port: 6379 }));

    this.listenSocketEvents();
    this.listenWhEvents();
  }

  listenWhEvents() {
    ev.on("qr.**", async (qrcode, sessionId) => {
      const imageBuffer = Buffer.from(
        qrcode.replace("data:image/png;base64,", ""),
        "base64"
      );

      fs.writeFileSync(
        `qrs/qr_code${sessionId ? "_" + sessionId : ""}.png`,
        imageBuffer
      );

      this.sendQrClient(sessionId);
    });
  }

  getPmId(currentPid) {
    pm2.list((err, list) => {
      list.forEach((pmElem) => {
        if (currentPid === pmElem.pid) {
          return pmElem.pm_id;
        }
      });
    });
  }

  listenSocketEvents = () => {
    process.on("message", (packet) => {
      console.log(packet, " - incoming packet");
      const number = packet.data.number;
      console.log(this.setClients.get(`${number}`));
    });

    this.io.on("connection", (socket) => {
      console.log("a user connected");

      socket.on("wh", (EVENT, data) => {
        if (EVENT === "start") this.startParse(data.number, data.id);
        if (EVENT === "logout") {
          this.redisClient.get(data.number, (err, reply) => {
            const response = JSON.parse(reply);
            pm2.connect(() =>
              this.sendDataToSameProcPM2(response.pmId, data.number)
            );
          });
        }
      });

      socket.on("status", (EVENT, data) => {
        if (EVENT === "GETSTATUS") {
          for (let client of this.setClients.values()) {
            client
              .getConnectionState()
              .then((res) => console.log(res))
              .catch((err) => console.log(err.message));
          }
          // this.io.emit("CONNECTION_STATUS", this.setClients);
        }
      });

      socket.on("disconnect", () => console.log("client disconected"));
    });
  };

  sendDataToSameProcPM2(pmId, number) {
    pm2.sendDataToProcessId(
      {
        id: pmId,
        type: "process:msg",
        data: {
          number: number,
        },
        topic: true,
      },
      (err, res) => {}
    );
  }

  logout(name) {
    console.log(name);
  }

  sendQrClient(sessionId) {
    this.io.emit(
      "qr",
      EVENT_IMG,
      `qr_code${sessionId ? "_" + sessionId : ""}.png`
    );
  }

  stopQr(idOtm) {
    this.io.emit("qr", "STOP", idOtm);
  }

  async startParse(number, idOtm) {
    create({
      sessionId: number,
      qrTimeout: 60,
      qrLogSkip: false,
      useChrome: true,
      sessionDataPath: "./sessions",
      eventMode: false,
    })
      .then(async (client) => {
        // this.resetRedis();
        // в этом процессе node js записываем клиентов в Map
        this.setClients.set(number, client);

        this.redisClient.get(number, (err, reply) => {
          const currPM2id = this.getPmId(process.pid);
          if (err) console.log(err);
          if (!reply) this.writePidToRedis(number, currPM2id);
          // else if (reply.pm_id !== currPM2id)
        });

        this.stopQr(idOtm);
        this.ParserObj.start(client, number, idOtm);
      })
      .catch((err) => {
        if (err.message === "QR Timeout") {
          this.stopQr(idOtm);
        } else {
          console.log(err);
        }
      });
  }

  // нужно хранить клиентов(pid, pm_id) в РЕДИСЕ, так как при запросе с web не всегда получаешь доступ к нужному процессу node js (из-за pm2)
  writePidToRedis(number, currPM2id) {
    // pm2.list((err, list) => {
    //   if (err) console.log(err);
    //   list.forEach((pmElem) => {
    //     if (currentPid === pmElem.pid) {
    const data = {
      pid: process.pid,
      pmId: currPM2id,
    };
    this.redisClient.set(number, JSON.stringify(data));
    //     }
    //   });
    // });
  }

  resetRedis = () => {
    // очистить REDIS
    this.redisClient.flushall("ASYNC", () => {});
  };
}

module.exports = WhatsAppController;
