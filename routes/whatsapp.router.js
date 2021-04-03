var express = require("express");
var router = express.Router();
const io = require("../controller/socket.controller");
const WhatsAppController = require("../controller/whatsapp.controller");

router.post("/", async (req, res) => {
  const name = req.body.name;
  const whContr = new WhatsAppController(io, name);
  await whContr.getQr();
});

module.exports = router;
