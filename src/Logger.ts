import * as vscode from "vscode";

export default class ReadableLogger {
  static logger: vscode.OutputChannel;
  public static init() {
    this.logger = vscode.window.createOutputChannel("Readable");
  }

  public static log(info: string) {
    if (!this.logger) {
      throw Error("Logger not initialized");
    }
    this.logger.appendLine(info);
  }
}
