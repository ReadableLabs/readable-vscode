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

  private languageInfo = [
    {
      // typescript
      start: "/*",
      formattedStart: "/**",
      commentCharacter: "*",
      end: "*/",
      replace: [
        { start: "/*", end: "" },
        { start: "*/", end: "" },
        { start: /^\s*[\r\n]/gm, end: "" },
        { start: " *", end: "" },
      ],
    },
    {
      // variable instead of code
      // javascript
      start: "/*",
      formattedStart: "/**",
      commentCharacter: "*",
      end: "*/",
      replace: [
        { start: "/*", end: "" },
        { start: "*/", end: "" },
        { start: /^\s*[\r\n]/gm, end: "" },
        { start: " *", end: "" },
      ],
    },
    {
      // cpp
      start: "/*",
      formattedStart: "/**",
      commentCharacter: "*",
      end: "*/",
      replace: [
        { start: "/*", end: "" },
        { start: "*/", end: "" },
        { start: /^\s*[\r\n]/gm, end: "" },
        { start: "  ", end: "" },
        { start: " *", end: "" },
      ],
    },
    {
      // cs
      start: "/*",
      formattedStart: "/**",
      commentCharacter: "*",
      end: "*/",
      replace: [
        { start: "/*", end: "" },
        { start: "*/", end: "" },
        { start: /^\s*[\r\n]/gm, end: "" },
        { start: " *", end: "" },
      ],
    },
    {
      // python
      start: '"""',
      formattedStart: '"""',
      commentCharacter: "*",
      end: '"""',
      replace: [
        { start: '"""', end: "" },
        { start: /^\s*[\r\n]/gm, end: "" },
      ],
    }, // generate when command
    {
      // php
      start: "/*",
      formattedStart: "/**",
      commentCharacter: "*",
      end: "*/",
      replace: [
        { start: "/*", end: "" },
        { start: "*/", end: "" },
        { start: /^\s*[\r\n]/gm, end: "" },
        { start: " *", end: "" },
      ],
    },
  ];

  private _activeEditor: vscode.TextEditor | undefined;
  constructor(editor?: vscode.TextEditor) {
    console.log("new codereader");

    if (editor) {
      this._activeEditor = editor;
      console.log(editor.document);
    }

    vscode.window.onDidChangeActiveTextEditor((e) => {
      console.log("got editor");
      this._activeEditor = e;
    });
  }

  public getLanguageId() {
    if (!this._activeEditor) {
      throw new Error("Error: No active text editor");
    }
    return this._activeEditor.document.languageId;
  }

  public getSpaces(text: string): number {
    return text.search(/\S/);
  }

  private wrap = (s: string, w: number, spaces: number) => {
    // make wrapPython
    // make sure to append to the front and the bottom with the find and replace thing with the spaces string format
    let formatted = s.replace(
      new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, "g"),
      " ".repeat(spaces) + " * $1\n"
    );
    let formattedArray = formatted.split(""); // todo: replace \t with ""
    let indexLast = formattedArray.lastIndexOf("\n");
    formattedArray.splice(indexLast + 1, 0, " ".repeat(spaces), " ", "*", " ");
    formatted = formattedArray.join("");
    return formatted;
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
    let formattedText = comment;

    formattedText = formattedText.trim();

    let languageIndex = this.languages.indexOf(currentLanguage);

    if (languageIndex === -1) {
      throw new Error("Error: unsupported language."); // send axios request here for language
    }

    this.languageInfo[languageIndex].replace.map((item) => {
      formattedText = formattedText.replace(item.start, item.end);
    });

    formattedText = this.wrap(formattedText, 38, spaces);
    // stop writing mundane comments

    formattedText =
      " ".repeat(spaces) +
      "/**\n" +
      formattedText +
      "\n" +
      " ".repeat(spaces) +
      " */\n"; // whenever there is a ., append new line to separate the comments better

    return formattedText;
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

  public async getAllSymbols(): Promise<vscode.DocumentSymbol[]> {
    if (!this._activeEditor) {
      console.log("hello");
      return [];
    }

    let symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      "vscode.executeDocumentSymbolProvider",
      this._activeEditor.document.uri
    );

    if (!symbols) {
      return [];
    }
    return symbols;
  }
}
