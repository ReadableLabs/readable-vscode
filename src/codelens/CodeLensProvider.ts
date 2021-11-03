import * as vscode from "vscode";
import { getLenses } from "./codeLensTools";
import { getSymbols } from "../symbols";
import { CODELENS_COMMAND, CODELENS_TITLE } from "./consts";

/* BROKEN - Coming in later release */
export class CodeLensProvider implements vscode.CodeLensProvider {
  private _textDocument: vscode.TextDocument | undefined;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor() {
    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });

    vscode.window.onDidChangeActiveTextEditor(
      this._onDidChangeActiveTextEditor
    );

    vscode.workspace.onDidOpenTextDocument(
      (textDocument: vscode.TextDocument) => {
        console.log("ok");
        this._textDocument = textDocument;
      }
    );
  }

  private _onDidChangeActiveTextEditor(
    textEditor: vscode.TextEditor | undefined
  ) {
    this._textDocument = textEditor?.document;
    console.log("changed");
  }

  private async _getSymbols(): Promise<vscode.SymbolInformation[]> {
    let symbols = await vscode.commands.executeCommand<
      vscode.SymbolInformation[]
    >("vscode.executeDocumentSymbolProvider", this._textDocument?.uri);
    if (!symbols) {
      throw new Error("Error: unable to fetch symbols for current editor");
    }
    return symbols;
  }

  private _createNewLens(symbol: vscode.SymbolInformation): vscode.CodeLens {
    return new vscode.CodeLens(symbol.location.range, {
      command: CODELENS_COMMAND,
      arguments: [{ range: symbol.location.range, kind: symbol.kind }],
      title: CODELENS_TITLE,
      tooltip: `Generate a comment describing what the ${vscode.SymbolKind[
        symbol.kind
      ].toLowerCase()} does`,
    });
  }

  private _getLenses(symbols: vscode.SymbolInformation[]): vscode.CodeLens[] {
    let lenses: vscode.CodeLens[] = [];
    console.log(symbols);
    symbols.map((symbol: any) => {
      if (symbol.children) {
        console.log("chil;d");
        symbol.children.map((symbolChild: vscode.SymbolInformation) => {
          if (
            symbolChild.kind === vscode.SymbolKind.Function ||
            symbolChild.kind === vscode.SymbolKind.Method
          ) {
            lenses.push(this._createNewLens(symbolChild));
          }
        });
      }
      lenses.push(this._createNewLens(symbol));
    });
    return lenses;
  }

  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ) {
    if (
      vscode.workspace.getConfiguration("commentai").get("enableCodeLens", true)
    ) {
      let symbols = await this._getSymbols();
      let lenses = await this._getLenses(symbols);

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
