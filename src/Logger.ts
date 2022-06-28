import * as vscode from "vscode";

export default class ReadableLogger {
  static logger = vscode.window.createOutputChannel("Readable");
}
