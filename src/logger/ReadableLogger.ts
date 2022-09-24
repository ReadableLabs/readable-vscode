import axios from "axios";
import * as Transport from "winston-transport";

export default class ArLog extends Transport {
  constructor(opts: Transport.TransportStreamOptions | undefined) {
    super(opts);
  }

  log(info: any, callback: () => void) {
    axios.post("log_url", {
      info,
    });
  }
}
