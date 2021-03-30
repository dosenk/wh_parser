const SOCKET_SERVER = "http://localhost:3000";

class WhatsApp {
  constructor() {
      this.button = document.querySelector('.block-btn');
      this.addListener();
  }

  addListener(){
      this.button.addEventListener('click', ()=>{
          console.log(this.request('luntik'));
      });
  }

  async request(nameObject) {
      const body = JSON.stringify({
        name: nameObject
      });

      const response = await fetch('http://localhost:3000/qr', {
          method: 'post',
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
          },
          body,
        })
          .then((res) => console.log(res));
      return response;
  }
}

class SocketIoClient {
  constructor() {
    this.socket = io(SOCKET_SERVER);
    this.whatsApp = new WhatsApp();
    this.listenSocketEvents();
  }

  sendName(name) {
    this.socket.emit("broadcast", name);
  }

  listenSocketEvents() {
    this.socket.on('connect', () => {
      console.log(1)
    });
    this.socket.on('qr', (img) => {
      console.log('hello');
    });
  }
  sendMessage = (msg) => {
    this.socket.emit("broadcast", msg);
  };
}

const client = new SocketIoClient();
// client.sendName('qwe');
