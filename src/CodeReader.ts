import * as vscode from "vscode";
export default class CodeReader {
  private _activeEditor: vscode.TextEditor | undefined;
  constructor() {
    console.log("new codereader");
    vscode.workspace.onDidChangeConfiguration((_) => {
      let editor = vscode.window.activeTextEditor;
      this._activeEditor = editor;
      console.log("got active text editor");
    });

    vscode.workspace.onDidChangeTextDocument((e) => {
      // may be really intensive, idk if we should use this one. Just get the active text editor in a function somewhere
      console.log("updated text editor");
    });
  }

  public async getAllSymbols(): Promise<vscode.SymbolInformation[]> {
    if (this._activeEditor) return [];

    let symbols = await vscode.commands.executeCommand<
      vscode.SymbolInformation[]
    >("vscode.executeDocumentSymbolProvider");

    if (!symbols) return [];
    return symbols;
  }
}
