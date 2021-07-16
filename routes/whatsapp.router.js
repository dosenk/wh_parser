var express = require("express");
var router = express.Router();
const WhatsAppController = require("../controller/whatsapp.controller");
const wa = require("@open-wa/wa-automate");

router.post("/", async (req, res) => {
  const name = req.body.name;
  const whContr = new WhatsAppController(name);
  await whContr.getQr();
});

router.post("/logout", async (req, res) => {
  const name = req.body.name;
  // const whContr = new WhatsAppController(io, name);
  // await whContr.getQr();
  console.log(name);

  // console.log(JSON.stringify(wa.Client));
  // console.log(wa);
  // console.log(wa.useragent);
  // console.log(wa.Status);
});

module.exports = router;
