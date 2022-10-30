import * as Transport from "winston-transport";
import { setImmediate } from "timers";
import axios from "axios";
import { getTitle } from "./utils";

// use kafka and other tools already designed for this stuff, make it easy for the end user

// how this will work:
// 1. batch logs up into compressed stuff
// 2. send that stuff over, non blocking, on a separate thread
// 3. it's all in an event queue
// the server will be disconnected from the application, since 1 user should not equal one more user to track. The server will simply act as a way to store logs

export interface ErLogOutputTransportStreamOptions
  extends Transport.TransportStreamOptions {
  logUrl: string;
}

export default class LogOutputTransport extends Transport {
  private logUrl: string;
  constructor(opts: ErLogOutputTransportStreamOptions) {
    super(opts);
    this.setMaxListeners(999);
    this.logUrl = opts.logUrl;

    // if it's async, it's async
    this.on("submitLog", async (info) => {
      try {
        // remove title message and level from extra info log
        let extraInfo = (({ title, level, message, ...o }) => o)(info);
        const logTitle = getTitle(
          info.title,
          info.message,
          info.level,
          info.extraInfo
        );

        console.log(logTitle);

        await axios.post(this.logUrl, {
          logType: info.level,
          title: logTitle,
          message: info.message,
          extraData: extraInfo,
        });

        console.log("submitted");
      } catch (err) {
        console.log("the logger failed");
        console.log(err);
      }
    });
  }

  log(info: any, callback: () => void) {
    setImmediate(async () => {
      console.log("set immediate");
      this.emit("submitLog", info);
    });

    this.emit("logged");

    callback();
    // send log asyncronously but don't wait
  }
}
