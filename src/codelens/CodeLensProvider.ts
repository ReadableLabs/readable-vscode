import * as vscode from "vscode";
import { getLenses } from "./codeLensTools";
import { getSymbols } from "../symbols";

export class CodeLensProvider implements vscode.CodeLensProvider {
  private codeLenses: vscode.CodeLens[] = [];

  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor() {
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
      let symbols = await getSymbols();
      let lenses = await getLenses(symbols);

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
