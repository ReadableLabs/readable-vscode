import * as vscode from "vscode";
import { getLenses } from "./codelens/codeLensTools";
import { getSymbols } from "./symbols";

export class CodeLensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];

  private regex: RegExp;

  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor() {
    this.regex = /(def)/g;

    setInterval(async () => {});

    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  // vscode.CodeLens[] | Thenable<vscode.CodeLens[]>
  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ) {
    if (
      vscode.workspace.getConfiguration("commentai").get("enableCodeLens", true)
    ) {
      this.codeLenses = [];
      let lenses: vscode.CodeLens[] = [];
      let currentEditor = vscode.window.activeTextEditor;
      if (!currentEditor) return;
      let editorUri = currentEditor.document.uri;
      if (editorUri === undefined || editorUri === null) return;
      let symbols = await getSymbols();
      lenses = await getLenses(symbols);
      console.log(symbols);
      return lenses;
    }
    return [];
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ) {
    if (
      vscode.workspace.getConfiguration("commentai").get("enableCodeLens", true)
    ) {
      return codeLens;
    }
    return null;
  }
}
