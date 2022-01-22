import { privateEncrypt } from "crypto";
import * as vscode from "vscode";
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
      console.log("got editor");
      console.log(e);
      this._activeEditor = e;
    });
  }

  /**
   * Returns the number of spaces at the beginning of a line
   * @param {string} line - The line to check
   * @returns {number} - The number of spaces at the beginning of the line

  /**  
  * Gets the number of spaces from the beginning of a line.
  *
  * @param {string} line The line to get the number of spaces from.
  * @returns {number} The number of spaces from the beginning of the line.
  */

  public getSpacesFromLine(lineNumber: number): number {
    if (!this._activeEditor) {
      throw new Error("Error: no active text editor");
    }

    return this.getSpaces(this.getLine(lineNumber));
  }
  /**
   * Get the text of the current line
   * @returns {string}
   */
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
   * Returns the number of spaces in the given text.
   * @param text The text to count spaces in.
   * @returns The number of spaces in the given text.
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

  /**
   * @param {string} comment
   * @param {number} _spaces
   * @param {string} language
   * @returns {string}
   */
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
      throw new Error("Error: unable to retrieve language");
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

  // Gets the text from the active editor's selection
  public getTextFromSelection(selection: vscode.Selection): string {
    if (!this._activeEditor) {
      throw new Error("Error: unable to get active editor");
    }
    return this._activeEditor?.document.getText(
      new vscode.Range(selection.start, selection.end)
    );
  }

  /**
   * Gets the text of a symbol from the active editor
   * @param {vscode.DocumentSymbol} symbol - The symbol to get the text from
   * @returns {string} The text of the symbol
   */
  public getTextFromSymbol(symbol: vscode.DocumentSymbol) {
    if (!this._activeEditor) {
      throw new Error("Error: unable to get active editor");
    }
    return this._activeEditor.document.getText(symbol.range);
  }

  /**
   * Inserts text at the given position in the active editor
   * @param text The text to insert
   * @param position The position to insert the text
   * @returns A boolean indicating if the text was inserted
   */
  public async insertTextAtPosition(
    text: string,
    position: vscode.Position
  ): Promise<boolean> {
    let snippet = new vscode.SnippetString(text); // create a snippet
    let result = await this._activeEditor?.insertSnippet(snippet, position); // insert the snippet
    if (!result) {
      // if the snippet failed to insert
      throw new Error("Error: unable to insert text");
    }
    return result;
  }

  /**
   * Returns the selected text in the active editor.
   *
   * @returns {string} The selected text.
   */
  public getSelectedText(): string {
    if (!this._activeEditor) {
      throw new Error("Error: No active text editor");
    }
    return this._activeEditor.document.getText(this._activeEditor.selection);
  }
  /**
   * Returns true if the active text editor has a selection.
   *
   * @returns {boolean}
   */
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
      throw new Error("Error: unable to get cursor position");
    }

    return this._activeEditor.selection.active;
  }

  /**
   * Returns the current cursor position in the active editor
   * @returns {number}
   */
  public getCursorPosition(): number {
    if (!this._activeEditor) {
      throw new Error("Error: unable to get cursor position");
    }

    return this._activeEditor.selection.active.line;
  }

  public getTextInRange(range: vscode.Range): string {
    if (!this._activeEditor) {
      throw new Error("Error: unable to get active editor");
    }

    return this._activeEditor.document.getText(range);
  }

  /**
   * @param {vscode.Position} position
   * @param {number} lineCount
   * @returns {vscode.DocumentSymbol}
   */
  public async getOrCreateSymbolUnderCursor(
    position: vscode.Position,
    lineCount: number
  ): Promise<vscode.DocumentSymbol> {
    if (!this._activeEditor) {
      throw new Error("Error");
    }
    let codeSymbol = await this.getSymbolUnderCusor(position);
    if (!codeSymbol) {
      console.log("creating a new symbol");
      codeSymbol = new vscode.DocumentSymbol(
        "CurrentLineSymbol",
        "The symbol of the current line",
        vscode.SymbolKind.String,
        new vscode.Range(
          new vscode.Position(position.line - 8 > 0 ? position.line - 8 : 1, 0),
          new vscode.Position(
            position.line + 8 < lineCount ? position.line + 8 : lineCount,
            position.character
          )
        ),
        new vscode.Range(new vscode.Position(position.line, 0), position)
      );
    }
    return codeSymbol;
  }

  /**
   * @param {vscode.Position} position
   * @returns {vscode.DocumentSymbol | null}
   * @description Returns the symbol under the cursor
   */
  public async getSymbolUnderCusor(
    position: vscode.Position
  ): Promise<vscode.DocumentSymbol | null> {
    let symbols = await this.getAllSymbols();
    if (symbols === []) {
      throw new Error("Error: no symbols");
    }
    for (let i = 0; i < symbols.length; i++) {
      if (
        // if the current symbol is a letter
        symbols[i].range.start.line <= position.line &&
        symbols[i].range.end.line >= position.line
      ) {
        // if the symbol is in the range of the position
        console.log("found symbol");
        if (
          symbols[i].kind === vscode.SymbolKind.Class &&
          symbols[i].range.start.line !== position.line
        ) {
          console.log("symbol is class"); // logs the symbol
          for (let k = 0; k < symbols[i].children.length; k++) {
            console.log("going through symbols");
            if (
              (symbols[i].children[k].kind === vscode.SymbolKind.Method || // if the symbol is a method
                symbols[i].children[k].kind === vscode.SymbolKind.Function ||
                symbols[i].children[k].kind === vscode.SymbolKind.Constant) && // or a constant
              symbols[i].children[k].range.start.line <= position.line &&
              symbols[i].children[k].range.end.line >= position.line
            ) {
              console.log("found symbol"); // explain what the code does
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

  /**
   * A docstring for the above function
   * @param {vscode.TextDocument} document
   * @returns {Promise<vscode.DocumentSymbol[]>}
   */
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
