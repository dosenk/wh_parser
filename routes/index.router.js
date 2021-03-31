var express = require("express");
var router = express.Router();

/* GET home page. */
class Main {
  constructor(data) {
    // this.socket = socket;
    this.data = data;
  }

  sendData() {
    console.log(this.data);
  }

  render(res) {
    res.render("index", { title: "Express whatsapp" });
  }
}

module.exports = Main;
