import * as Transport from "winston-transport";
import { setImmediate } from "timers";
import axios from "axios";

// use kafka and other tools already designed for this stuff, make it easy for the end user

// how this will work:
// 1. batch logs up into compressed stuff
// 2. send that stuff over, non blocking, on a separate thread
// 3. it's all in an event queue
// the server will be disconnected from the application, since 1 user should not equal one more user to track. The server will simply act as a way to store logs

export default class LogOutputTransport extends Transport {
  private logQueue: any[] = [];
  constructor(opts: Transport.TransportStreamOptions | undefined) {
    super(opts);

    this.on("submitLog", async () => {
      // create copy in case more logs get added quickly
      let logs = JSON.parse(JSON.stringify(this.logQueue));
      this.logQueue = [];
      await axios.post("http://localhost:8080/", logs);
    });
  }

  log(info: any, callback: () => void) {
    setImmediate(async () => {
      console.log(info);
      try {
        this.logQueue.push(info);

        if (this.logQueue.length > 64) {
          this.emit("submitLog");
        }
      } catch (err) {
        console.log("The logger failed");
      }
    });

    this.emit("logged");

    callback();
    // send log asyncronously but don't wait
  }
}
