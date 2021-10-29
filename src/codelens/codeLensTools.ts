import * as vscode from "vscode";
import { CODELENS_COMMAND, CODELENS_TITLE, symbolKinds } from "./consts";

const getLenses = (symbols: vscode.SymbolInformation[]): vscode.CodeLens[] => {
  let lenses: vscode.CodeLens[] = [];
  symbols.map((symbol: any) => {
    if (symbol.children) {
      symbol.children.map((_symbol: vscode.SymbolInformation) => {
        if (
          _symbol.kind == vscode.SymbolKind.Method ||
          _symbol.kind == vscode.SymbolKind.Function
        ) {
          lenses.push(
            new vscode.CodeLens(_symbol.location.range, {
              command: CODELENS_COMMAND,
              arguments: [
                { range: _symbol.location.range, kind: _symbol.kind },
              ],
              title: CODELENS_TITLE,
              tooltip: `Generate a comment describing what the ${vscode.SymbolKind[
                _symbol.kind
              ].toLowerCase()} does.`, // todo: get the symbol list array with all the kinds
            })
          );
        }
      });
    }
    lenses.push(
      new vscode.CodeLens(symbol.location.range, {
        command: CODELENS_COMMAND,
        arguments: [{ range: symbol.location.range, kind: symbol.kind }],
        title: CODELENS_TITLE,
        tooltip: `Generate a comment describing what the ${vscode.SymbolKind[
          symbol.kind
        ].toLowerCase()} does.`,
      })
    );
  });
  return lenses;
};

export { getLenses };
