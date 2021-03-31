var express = require("express");
var router = express.Router();
const io = require("../controller/socket.controller");
const WhatsAppController = require("../controller/whatsapp.controller");

router.get("/", async (req, res) => {
  const whContr = new WhatsAppController(io);
  res.send("asdasdasd");
});

module.exports = router;
