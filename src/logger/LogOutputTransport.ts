import * as Transport from "winston-transport";
import { setImmediate } from "timers";

export default class LogOutputTransport extends Transport {
  constructor(opts: Transport.TransportStreamOptions | undefined) {
    super(opts);
  }

  log(info: any, callback: () => void) {
    // send log asyncronously but don't wait
  }
}
