const { server } = require("../bin/www");
const redis = require("socket.io-redis");

const options = {
  cors: true,
  transports: ["websocket", "polling"],
  methods: ["GET", "POST"],
  origins: ["http://192.168.1.86:3000"],
};

const io = require("socket.io")(server, options);

io.adapter(redis({ host: "localhost", port: 6379 }));

// io.on("connection", (socket) => {
//   console.log("a user connected");
//   socket.on("logout", (message) => {
//     console.log(message, "logout event");
//     // console.log(this.setClients.get(message));
//   });

//   socket.on("disconnect", () => {
//     console.log("client disconected");
//   });
// });

module.exports = io;
