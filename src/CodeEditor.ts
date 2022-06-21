import { privateEncrypt } from "crypto";
import * as vscode from "vscode";
import { emailLogin } from "./authentication/EmailLogin";
import { getLineNumber, getSafeStartPosition } from "./completion/utils";
/**
 * Gets the symbols for the current document.
 * @returns {Promise<vscode.DocumentSymbol[]>}
 */
export default class CodeEditor {
  private languages = [
    "typescript",
    "javascript",
    "cpp",
    "csharp",
    "python",
    "php",
  ];

  private _activeEditor: vscode.TextEditor | undefined;
  constructor(editor?: vscode.TextEditor) {
    // vscode.window.activeTextEditor = vscode.window.activeTextEditor;

    vscode.window.onDidChangeActiveTextEditor((e) => {
      //   vscode.window.activeTextEditor = e;
    });
  }
  public static getSpacesFromLine(lineNumber: number): number {
    return this.getSpaces(this.getLine(lineNumber));
  }

  public static getLine(lineNumber: number): string {
    if (!vscode.window.activeTextEditor) {
      throw new Error("Error: No active text editor");
    }

    return vscode.window.activeTextEditor.document.lineAt(lineNumber).text;
  }

  public static getLanguageId() {
    if (!vscode.window.activeTextEditor) {
      throw new Error("Error: No active text editor");
    }
    return vscode.window.activeTextEditor.document.languageId; //returns the language id of the active editor
  }

  /**
   * Returns the number of spaces at the beginning of the string.
   * @param {string} text - the string to get the number of spaces from
   * @returns {number} the number of spaces at the beginning of the string
   */
  public static getSpaces(text: string): number {
    return text.search(/\S/); // ok
  }

  private wrap = (s: string, w: number, spaces: number) => {
    // make wrapPython
    // make sure to append to the front and the bottom with the find and replace thing with the spaces string format
    // let formatted = s.replace(
    //   new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, "g"),
    //   " ".repeat(spaces) + " $1\n"
    // );
    // let formatted = s.replace(/\*/, "");
    // formatted = formatted.replace(/\n/, "\n" + " ".repeat(spaces));
    // let formattedArray = formatted.split(""); // todo: replace \t with ""
    // let indexLast = formattedArray.lastIndexOf("\n");
    // formattedArray.splice(indexLast + 1, 0, " ".repeat(spaces), " ", "*", " ");
    // formatted = formattedArray.join("");
    // return formatted;
    // let formatted = s.replace(/\n/, "\n" + " ".repeat(spaces));
    // formatted = " ".repeat(spaces) + formatted;
    // return formatted;
    return s;
  };

  /**
   * something
   * @param comment
   * @param _spaces
   * @param language
   * @returns hafjsdhfuadf
   */
  public static formatText(
    comment: string,
    _spaces: number,
    language?: string
  ): string {
    let spaces = 0; // a comment4
    let currentLanguage = language // 2
      ? language
      : vscode.window.activeTextEditor?.document.languageId;
    if (!currentLanguage) {
      throw new Error("Error: Unable to retrieve language");
    }

    if (_spaces < 0) {
      spaces = 0;
    } else {
      spaces = _spaces + 1;
    }

    // check if \n is at end to not insert comment into text which will clip
    let formattedText = "";

    formattedText = formattedText.trim();
    let formattedArray = comment.split("\n");
    for (let k = 0; k < formattedArray.length; k++) {
      formattedArray[k] = formattedArray[k].trim();
      if (!/^\s+$/.test(formattedArray[k])) {
        // if the line is not empty
        formattedText += " ".repeat(spaces) + formattedArray[k].trim();
        if (k !== formattedArray[k].length) {
          formattedText += "\n";
        }
      }
    }

    // formattedText = formattedText.replace(/\*\//, "");

    // let languageIndex = this.languages.indexOf(currentLanguage);

    // if (languageIndex === -1) {
    //   throw new Error("Error: unsupported language."); // send axios request here for language
    // }

    // this.languageInfo[languageIndex].replace.map((item) => {
    //   formattedText = formattedText.replace(item.start, item.end);
    // });

    // formattedText = this.wrap(formattedText, 110, spaces); // 38
    // stop writing mundane comments

    if (!formattedText.trimLeft().startsWith("/*")) {
      formattedText = " ".repeat(spaces) + "/**" + formattedText;
    }

    if (!formattedText.trimRight().endsWith("*/")) {
      formattedText += " ".repeat(spaces) + "*/";
    }

    // formattedText = " ".repeat(spaces) + "/**\n" + formattedText + " */\n"; // whenever there is a ., append new line to separate the comments better

    formattedText = "\n" + formattedText;
    return formattedText;
  }

  /**
   * Gets the text from the current selection.
   * @param {vscode.Selection} selection - the current selection.
   * @returns {string} the text from the current selection.
   */
  public static getTextFromSelection(selection: vscode.Selection): string {
    if (!vscode.window.activeTextEditor) {
      throw new Error("Error: Unable to get active editor");
    }
    return vscode.window.activeTextEditor.document.getText(
      new vscode.Range(selection.start, selection.end)
    );
  }

  /**
   * Gets the text from the given symbol.
   * @param {vscode.DocumentSymbol} symbol - the symbol to get the text from.
   * @returns {string} the text from the given symbol.
   */
  public static getTextFromSymbol(symbol: vscode.DocumentSymbol) {
    if (!vscode.window.activeTextEditor) {
      // if there's no active editor, throw an error
      throw new Error("Error: Unable to get active editor");
    }
    return vscode.window.activeTextEditor.document.getText(symbol.range);
  }

  public static async insertTextAtPosition(
    text: string,
    position: vscode.Position
  ): Promise<void> {
    if (!vscode.window.activeTextEditor) {
      throw new Error("Error: No active text editor");
    }

    await vscode.window.activeTextEditor.edit((editBuilder) => {
      // insert the snippet
      editBuilder.insert(position, text);
    });
    // let snippet = new vscode.SnippetString(text); // create a snippet
    // let result = await vscode.window.activeTextEditor?.insertSnippet(snippet, position); // insert the snippet
    // if (!result) {
    // if the snippet failed to insert
    // throw new Error("Error: unable to insert text");
    // }
    // return result;
  }

  public static getSelectedText(): string {
    if (!vscode.window.activeTextEditor) {
      throw new Error("Error: No active text editor");
    }
    return vscode.window.activeTextEditor.document.getText(
      vscode.window.activeTextEditor.selection
    );
  }

  public static hasSelection(): boolean {
    if (!vscode.window.activeTextEditor) {
      throw new Error("Error: No active text editor");
    }
    if (
      vscode.window.activeTextEditor.selection.start.line ===
        vscode.window.activeTextEditor.selection.end.line &&
      vscode.window.activeTextEditor.selection.start.character ===
        vscode.window.activeTextEditor.selection.end.character
    ) {
      return false;
    } else {
      return true;
    }
  }

  public static getSelection() {
    if (!vscode.window.activeTextEditor) {
      throw new Error("Error: No active text editor");
    }
    return vscode.window.activeTextEditor.selection;
  }

  public static getCursor(): vscode.Position {
    if (!vscode.window.activeTextEditor) {
      throw new Error("Error: Unable to get cursor position");
    }

    return vscode.window.activeTextEditor.selection.active;
  }

  public static getCursorPosition(): number {
    if (!vscode.window.activeTextEditor) {
      throw new Error("Error: Unable to get cursor position");
    }

    return vscode.window.activeTextEditor.selection.active.line;
  }

  public static getTextInRange(range: vscode.Range): string {
    // if (!vscode.window.activeTextEditor) {
    //   throw new Error("Error: Unable to get active editor");
    // }

    if (!vscode.window.activeTextEditor) {
      throw new Error("Error: Unable to get active editor");
    }

    return vscode.window.activeTextEditor.document.getText(range);
  }

  // Two scenarios.
  // 1st: The function is less than 20 lines
  // 2nd: THe function is greater than 20 lines

  public static getFirstAndLastText(symbol: vscode.DocumentSymbol) {
    if (!vscode.window.activeTextEditor) {
      throw new Error("Error: Unable to get active editor");
    }
    let startLine = 0,
      endLine = 0;
    if (symbol.range.start.line + 20 <= symbol.range.end.line) {
      // get the first 10 lines of the symbol's range.
      let startStart = symbol.range.start.line;
      let startEnd = symbol.range.start.line + 10;

      // get the end line of the symbol
      let endStart = symbol.range.end.line - 10;
      let endEnd = symbol.range.end.line;

      const first10Lines = vscode.window.activeTextEditor.document.getText(
        new vscode.Range(
          new vscode.Position(startStart, 0),
          new vscode.Position(startEnd, 0)
        )
      );
      const last10Lines = vscode.window.activeTextEditor.document.getText(
        new vscode.Range(
          new vscode.Position(endStart, 0),
          new vscode.Position(endEnd, 0)
        )
      );
      return first10Lines + "\n" + last10Lines;
    } else {
      return vscode.window.activeTextEditor.document.getText(symbol.range);
    }

    // if (symbol.range.end.line - 10 <= symbol.range.start.line) {
    //   endLine = symbol.range.start.line; // } else {
    //   endLine = symbol.range.end.line - 11;
    // }
  }

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

  public static getSymbolFromName(
    symbols: vscode.DocumentSymbol[],
    name: string
  ) {
    for (let symbol of symbols) {
      if (symbol.name === name) {
        return symbol;
      }
      if (symbol.children) {
        for (let child of symbol.children) {
          if (child.name === name) {
            return child;
          }
        }
      }
    }
    return null;
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
