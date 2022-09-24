import * as vscode from "vscode";
import * as Transport from "winston-transport";
import { setImmediate } from "timers";

interface VscodeTransportOptions extends Transport.TransportStreamOptions {
  name: string;
}

export default class VscodeOutputTransport extends Transport {
  private logger: vscode.OutputChannel;
  constructor(opts: VscodeTransportOptions | undefined) {
    super(opts);
    let name = opts?.name ? opts.name : "Default";
    this.logger = vscode.window.createOutputChannel(name);
  }

  log(info: any, callback: () => void) {
    this.logger.appendLine(`${info.level}: ${JSON.stringify(info.message)}`);
    setImmediate(() => {
      this.emit("logged");
    });

    callback();
  }
}
