import { privateEncrypt } from "crypto";
import * as vscode from "vscode";
import { emailLogin } from "./authentication/EmailLogin";
import { getLineNumber, getSafeStartPosition } from "./completion/utils";
/**
 * Gets the symbols for the current document.
 * @returns {Promise<vscode.DocumentSymbol[]>}
 */
export default class CodeEditor {
  public static getSpacesFromLine(lineNumber: number): number {
    return this.getSpaces(this.getLine(lineNumber));
  }

  public static getLine(lineNumber: number): string {
    if (!vscode.window.activeTextEditor) {
      throw new Error("Error: No active text editor");
    }

    return vscode.window.activeTextEditor.document.lineAt(lineNumber).text;
  }

  /**
   * Returns the number of spaces at the beginning of the string.
   * @param {string} text - the string to get the number of spaces from
   * @returns {number} the number of spaces at the beginning of the string
   */
  public static getSpaces(text: string): number {
    return text.search(/\S/); // ok
  }

  // Two scenarios.
  // 1st: The function is less than 20 lines
  // 2nd: THe function is greater than 20 lines

  public static async getOrCreateSymbolUnderCursor(
    position: vscode.Position,
    lineCount: number
  ): Promise<vscode.DocumentSymbol> {
    // if (!vscode.window.activeTextEditor) {
    //   throw new Error("Error: No active text editor");
    // }
    if (!vscode.window.activeTextEditor) {
      throw new Error("Error: no active text editor");
    }
    let codeSymbol = await this.getSymbolUnderCusor(position);
    if (!codeSymbol) {
      // if no symbol is found, create a new symbol
      codeSymbol = new vscode.DocumentSymbol(
        "CurrentLineSymbol",
        "The symbol of the current line",
        vscode.SymbolKind.String,
        new vscode.Range(
          new vscode.Position(
            position.line - 1 > 0 ? position.line - 1 : position.line,
            0
          ), // FIX THIS SHIT, TODO most important thing in the world
          new vscode.Position(
            position.line + 3 < lineCount ? position.line + 3 : lineCount - 1,
            position.character
          )
        ),
        new vscode.Range(new vscode.Position(position.line, 0), position)
      );
    }
    return codeSymbol;
  }

  /*
   * A test comment
   */
  public static async getSymbolFromPosition(
    symbols: vscode.DocumentSymbol[],
    position: vscode.Position
  ) {
    for (let i = 0; i < symbols.length; i++) {
      if (
        symbols[i].range.start.line <= position.line &&
        symbols[i].range.end.line >= position.line
      ) {
        if (
          symbols[i].kind === vscode.SymbolKind.Class &&
          symbols[i].range.start.line !== position.line
        ) {
          for (let k = 0; k < symbols[i].children.length; k++) {
            if (
              (symbols[i].children[k].kind === vscode.SymbolKind.Method ||
                symbols[i].children[k].kind === vscode.SymbolKind.Function ||
                symbols[i].children[k].kind === vscode.SymbolKind.Constant) &&
              symbols[i].children[k].range.start.line <= position.line &&
              symbols[i].children[k].range.end.line >= position.line
            ) {
              return symbols[i].children[k];
            }
          }
          return symbols[i];
        } else {
          return symbols[i];
        }
      }
    }
    return null;
  }

  public static async getSymbolUnderCusor(
    position: vscode.Position
  ): Promise<vscode.DocumentSymbol | null> {
    let symbols = await this.getAllSymbols();
    if (symbols === []) {
      throw new Error("Error: No symbols");
    }
    return await CodeEditor.getSymbolFromPosition(symbols, position);
  }

  public static async getAllSymbols(): Promise<vscode.DocumentSymbol[]> {
    // if (!vscode.window.activeTextEditor) {
    //   return [];
    // }

    if (!vscode.window.activeTextEditor) {
      return [];
    }

    // this is the problem, you're using the active editor and not getting it from the whatever
    let symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      "vscode.executeDocumentSymbolProvider", // command name
      vscode.window.activeTextEditor.document.uri // command arguments
    );

    if (!symbols) {
      return [];
    }
    return symbols;
  }
}
