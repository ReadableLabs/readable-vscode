import * as Transport from "winston-transport";
import { setImmediate } from "timers";
import axios from "axios";

// how this will work:
// 1. batch logs up into compressed stuff
// 2. send that stuff over, non blocking, on a separate thread
// 3. it's all in an event queue
// the server will be disconnected from the application, since 1 user should not equal one more user to track. The server will simply act as a way to store logs
class LoggerQueue {
  private logBatch = [];
  public onDidAddLog?: () => void;

  // please just use events
  // we using machine learning batch size
  // 64 default because the gradients need to compute lol
  // it should be async, it should be able to accept logs while the batch size is being sent
  constructor(batch_size: number = 64) {}

  public addLog(log: any) {}

  private submitLog() {}
}

export default class LogOutputTransport extends Transport {
  constructor(opts: Transport.TransportStreamOptions | undefined) {
    super(opts);
  }

  log(info: any, callback: () => void) {
    setImmediate(async () => {
      console.log(info);
      try {
        await axios.post("http://localhost:8080/", info);
      } catch (err) {
        console.log("The logger failed");
      }
    });

    this.emit("logged");

    callback();
    // send log asyncronously but don't wait
  }
}
