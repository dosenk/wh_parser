const process = require("process");
const rdl = require("readline");

class LoadingBar {
  static start(size) {
    let cursor = 0;
    // let timer = null;
    process.stdout.write("\x1B[?25l");
    for (let i = 0; i < size; i++) {
      process.stdout.write("\u2591");
    }
    rdl.cursorTo(process.stdout, cursor, 0);
    // timer = setInterval(() => {
    //   process.stdout.write("\u2588");
    //   cursor++;
    //   if (cursor >= size) {
    //     clearTimeout(timer);
    //   }
    // }, 100);
  }

  static write(nums = 1) {
    const symbol = "\u2588";
    process.stdout.write(symbol.repeat(nums));
  }

  static clear() {
    process.stdout.write("\x1Bc");
    rdl.cursorTo(process.stdout, 0, 0);
  }
}

module.exports = LoadingBar;
