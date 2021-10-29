import * as vscode from "vscode";

const getSymbols = async (): Promise<vscode.SymbolInformation[]> => {
  let editorUri = vscode.window.activeTextEditor?.document.uri;
  if (editorUri === undefined || editorUri === null) return [];
  let symbols = await vscode.commands.executeCommand<
    // vscode.SymbolInformation[]
    vscode.SymbolInformation[]
  >("vscode.executeDocumentSymbolProvider", editorUri);
  if (symbols === undefined || symbols === null) return [];
  return symbols;
};

export { getSymbols };
