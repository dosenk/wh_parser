var express = require("express");
var router = express.Router();
const WhatsAppController = require("../controller/whatsapp.controller");

class WhatsAppRouter {
  constructor(io) {
    this.io = io;
  }

  start() {
    // router.get("/", async (req, res) => {

    // });
    const whContr = new WhatsAppController(this.io);
    // whContr.start();
  }
}

module.exports = WhatsAppRouter;
