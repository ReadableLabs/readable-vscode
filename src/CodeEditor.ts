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
    console.log("new codereader");
    this._activeEditor = vscode.window.activeTextEditor;

    if (editor) {
      this._activeEditor = editor;
      console.log(editor.document);
    }

    vscode.window.onDidChangeActiveTextEditor((e) => {
      this._activeEditor = e;
    });
  }
  public getSpacesFromLine(lineNumber: number): number {
    if (!this._activeEditor) {
      throw new Error("Error: No active text editor");
    }

    return this.getSpaces(this.getLine(lineNumber));
  }

  public getLine(lineNumber: number): string {
    if (!this._activeEditor) {
      throw new Error("Error: No active text editor");
    }

    return this._activeEditor.document.lineAt(lineNumber).text;
  }

  public getLanguageId() {
    if (!this._activeEditor) {
      throw new Error("Error: No active text editor");
    }
    return this._activeEditor.document.languageId; //returns the language id of the active editor
  }

  /**
   * Returns the number of spaces at the beginning of the string.
   * @param {string} text - the string to get the number of spaces from
   * @returns {number} the number of spaces at the beginning of the string
   */
  public getSpaces(text: string): number {
    return text.search(/\S/);
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

  public formatText(
    comment: string,
    _spaces: number,
    language?: string
  ): string {
    let spaces = 0;
    let currentLanguage = language
      ? language
      : this._activeEditor?.document.languageId;
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
  public getTextFromSelection(selection: vscode.Selection): string {
    if (!this._activeEditor) {
      throw new Error("Error: Unable to get active editor");
    }
    return this._activeEditor?.document.getText(
      new vscode.Range(selection.start, selection.end)
    );
  }

  /**
   * Gets the text from the given symbol.
   * @param {vscode.DocumentSymbol} symbol - the symbol to get the text from.
   * @returns {string} the text from the given symbol.
   */
  public getTextFromSymbol(symbol: vscode.DocumentSymbol) {
    if (!this._activeEditor) {
      // if there's no active editor, throw an error
      throw new Error("Error: Unable to get active editor");
    }
    return this._activeEditor.document.getText(symbol.range);
  }

  public async insertTextAtPosition(
    text: string,
    position: vscode.Position
  ): Promise<void> {
    if (!this._activeEditor) {
      throw new Error("Error: No active text editor");
    }

    await this._activeEditor.edit((editBuilder) => {
      // insert the snippet
      editBuilder.insert(position, text);
    });
    // let snippet = new vscode.SnippetString(text); // create a snippet
    // let result = await this._activeEditor?.insertSnippet(snippet, position); // insert the snippet
    // if (!result) {
    // if the snippet failed to insert
    // throw new Error("Error: unable to insert text");
    // }
    // return result;
  }

  public getSelectedText(): string {
    if (!this._activeEditor) {
      throw new Error("Error: No active text editor");
    }
    return this._activeEditor.document.getText(this._activeEditor.selection);
  }

  public hasSelection(): boolean {
    if (!this._activeEditor) {
      throw new Error("Error: No active text editor");
    }
    if (
      this._activeEditor.selection.start.line ===
        this._activeEditor.selection.end.line &&
      this._activeEditor.selection.start.character ===
        this._activeEditor.selection.end.character
    ) {
      return false;
    } else {
      return true;
    }
  }

  public getSelection() {
    if (!this._activeEditor) {
      throw new Error("Error: No active text editor");
    }
    return this._activeEditor.selection;
  }

  public getCursor(): vscode.Position {
    if (!this._activeEditor) {
      throw new Error("Error: Unable to get cursor position");
    }

    return this._activeEditor.selection.active;
  }

  public getCursorPosition(): number {
    if (!this._activeEditor) {
      throw new Error("Error: Unable to get cursor position");
    }

    return this._activeEditor.selection.active.line;
  }

  public getTextInRange(range: vscode.Range): string {
    if (!this._activeEditor) {
      throw new Error("Error: Unable to get active editor");
    }

    return this._activeEditor.document.getText(range);
  }

  // Two scenarios.
  // 1st: The function is less than 20 lines
  // 2nd: THe function is greater than 20 lines

  public async getFirstAndLastText(symbol: vscode.DocumentSymbol) {
    if (!this._activeEditor) {
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

      const first10Lines = this._activeEditor.document.getText(
        new vscode.Range(
          new vscode.Position(startStart, 0),
          new vscode.Position(startEnd, 0)
        )
      );
      const last10Lines = this._activeEditor.document.getText(
        new vscode.Range(
          new vscode.Position(endStart, 0),
          new vscode.Position(endEnd, 0)
        )
      );
      return first10Lines + "\n" + last10Lines;
    } else {
      // console.log(this._activeEditor.document.getText(symbol.range));
      return this._activeEditor.document.getText(symbol.range);
    }

    // if (symbol.range.end.line - 10 <= symbol.range.start.line) {
    //   endLine = symbol.range.start.line; // } else {
    //   endLine = symbol.range.end.line - 11;
    // }
  }

  public async getOrCreateSymbolUnderCursor(
    position: vscode.Position,
    lineCount: number
  ): Promise<vscode.DocumentSymbol> {
    if (!this._activeEditor) {
      throw new Error("Error: No active text editor");
    }
    let codeSymbol = await this.getSymbolUnderCusor(position);
    if (!codeSymbol) {
      // if no symbol is found, create a new symbol
      console.log("creating a new symbol");
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
    console.log(codeSymbol);
    return codeSymbol;
  }

  public getSymbolFromName(symbols: vscode.DocumentSymbol[], name: string) {
    for (let symbol of symbols) {
      if (symbol.name === name) {
        return symbol;
      }
      if (symbol.children) {
        for (let child of symbol.children) {
          if (child.name === name) {
            return symbol;
          }
        }
      }
    }
    return null;
  }

  public async getSymbolFromPosition(
    symbols: vscode.DocumentSymbol[],
    position: vscode.Position
  ) {
    for (let i = 0; i < symbols.length; i++) {
      if (
        symbols[i].range.start.line <= position.line &&
        symbols[i].range.end.line >= position.line
      ) {
        console.log("found symbol");
        if (
          symbols[i].kind === vscode.SymbolKind.Class &&
          symbols[i].range.start.line !== position.line
        ) {
          console.log("symbol is class");
          for (let k = 0; k < symbols[i].children.length; k++) {
            console.log("going through symbols");
            if (
              (symbols[i].children[k].kind === vscode.SymbolKind.Method ||
                symbols[i].children[k].kind === vscode.SymbolKind.Function ||
                symbols[i].children[k].kind === vscode.SymbolKind.Constant ||
                symbols[i].children[k].kind === vscode.SymbolKind.Property) &&
              symbols[i].children[k].range.start.line <= position.line &&
              symbols[i].children[k].range.end.line >= position.line
            ) {
              console.log("found symbol");
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

  public async getSymbolUnderCusor(
    position: vscode.Position
  ): Promise<vscode.DocumentSymbol | null> {
    let symbols = await this.getAllSymbols();
    // console.log(symbols);
    if (symbols === []) {
      throw new Error("Error: No symbols");
    }
    return await this.getSymbolFromPosition(symbols, position);
  }

  public async getAllSymbols(): Promise<vscode.DocumentSymbol[]> {
    if (!this._activeEditor) {
      return [];
    }

    let symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      "vscode.executeDocumentSymbolProvider", // command name
      this._activeEditor.document.uri // command arguments
    );

    if (!symbols) {
      return [];
    }
    return symbols;
  }
}
