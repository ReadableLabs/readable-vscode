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
      // if we have an editor, use it
      this._activeEditor = editor;
      console.log(editor.document);
    }

    vscode.window.onDidChangeActiveTextEditor((e) => {
      // if we change the active editor, update the active editor
      console.log("got editor");
      console.log(e);
      this._activeEditor = e;
    });
  }

  /**
   * Returns the language id of the active editor
   * @returns {string}
   */
  public getLanguageId() {
    if (!this._activeEditor) {
      throw new Error("Error: No active text editor");
    }
    return this._activeEditor.document.languageId; //returns the language id of the active editor
  }

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
      throw new Error("Error: unable to retrieve language");
    }

    if (_spaces < 0) {
      spaces = 0;
    } else {
      spaces = _spaces;
    }

    // check if \n is at end to not insert comment into text which will clip
    let formattedText = "";

    // formattedText = formattedText.trim();
    let formattedArray = comment.split("\n");
    for (let k = 0; k < formattedArray.length; k++) {
      // formattedArray[k] = formattedArray[k].trim();
      if (!/^\s+$/.test(formattedArray[k])) {
        formattedText +=
          " ".repeat(spaces) + " * " + formattedArray[k].trim() + "\n";
      }
    }

    formattedText = formattedText.replace(/\*\//, "");

    console.log(formattedText);

    let languageIndex = this.languages.indexOf(currentLanguage);

    if (languageIndex === -1) {
      throw new Error("Error: unsupported language."); // send axios request here for language
    }

    // this.languageInfo[languageIndex].replace.map((item) => {
    //   formattedText = formattedText.replace(item.start, item.end);
    // });

    // formattedText = this.wrap(formattedText, 110, spaces); // 38
    // stop writing mundane comments

    formattedText = " ".repeat(spaces) + "/**\n" + formattedText + " */\n"; // whenever there is a ., append new line to separate the comments better

    return formattedText;
  }

  public getTextFromSelection(selection: vscode.Selection): string {
    if (!this._activeEditor) {
      throw new Error("Error: unable to get active editor");
    }
    return this._activeEditor?.document.getText(
      new vscode.Range(selection.start, selection.end)
    );
  }

  public getTextFromSymbol(symbol: vscode.DocumentSymbol) {
    if (!this._activeEditor) {
      throw new Error("Error: unable to get active editor");
    }
    return this._activeEditor.document.getText(symbol.range);
  }

  public async insertTextAtPosition(
    text: string,
    position: vscode.Position
  ): Promise<boolean> {
    let snippet = new vscode.SnippetString(text);
    let result = await this._activeEditor?.insertSnippet(snippet, position);
    if (!result) {
      throw new Error("Error: unable to insert text");
    }
    return result;
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

  public async getSymbolUnderCusor(
    position: vscode.Position
  ): Promise<vscode.DocumentSymbol | null> {
    let symbols = await this.getAllSymbols();
    if (symbols === []) {
      throw new Error("Error: no symbols");
    }
    // let position = this.getCursorPosition();
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
          // check if cursor position is on line of the symbol. If it is and it's a class, generate it for teh class. Because of this, add an && to check
          for (let k = 0; k < symbols[i].children.length; k++) {
            console.log("going through symbols");
            if (
              (symbols[i].children[k].kind === vscode.SymbolKind.Method ||
                symbols[i].children[k].kind === vscode.SymbolKind.Function ||
                symbols[i].children[k].kind === vscode.SymbolKind.Constant) &&
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
    // vscode.window.showErrorMessage("Error: Unable to find valid symbol");
    console.log("Error: unable to find symbol under cursor");
    // throw new Error("Error: Unable to find valid symbol");
    return null;
  }

  /**
   * Get
   * @returns
   */
  public async getAllSymbols(): Promise<vscode.DocumentSymbol[]> {
    if (!this._activeEditor) {
      return [];
    }

    let symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      "vscode.executeDocumentSymbolProvider",
      this._activeEditor.document.uri
    );

    if (!symbols) {
      // no symbols found
      return [];
    }
    return symbols;
  }
}
