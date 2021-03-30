const { server } = require("../bin/www");

const io = require("socket.io")(server);

io.on("connection", (socket) => {
  console.log("a user connected");
});

module.exports = io;
