import * as vscode from "vscode";
export default class CodeEditor {
  private languages = ["typescript", "javascript", "cpp", "csharp", "python"];

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
      ],
    },
    {
      // javascript
      start: "/*",
      formattedStart: "/**",
      commentCharacter: "*",
      end: "*/",
      replace: [
        { start: "/*", end: "" },
        { start: "*/", end: "" },
        { start: /^\s*[\r\n]/gm, end: "" },
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
    },
  ];

  private _activeEditor: vscode.TextEditor | undefined;
  constructor(editor?: vscode.TextEditor) {
    console.log("new codereader");

    vscode.window.onDidChangeActiveTextEditor((e) => {
      console.log("got editor");
      this._activeEditor = e;
    });
  }

  private wrap = (s: string, w: number) =>
    // s.replace(
    //   new RegExp(`(?![^\\n]{1,${w}}$)([^\\n]{1,${w}})\\s`, "g"),
    //   "* $1\n"
    // );
    s.concat("\n").replace(`/(?![^\n]{1,${w}}$)([^\n]{1,${w}})\s/g`, "[$1]\n"); // may work, may not, I have no idea. Use the other one but then the last line doesn't get the * appended to it. Workaround would be to just split the string by \n's, and then append a * right before the last one assuming the string has no whitespace trailing

  public formatText(comment: string, language?: string): string {
    let currentLanguage = language
      ? language
      : this._activeEditor?.document.languageId;
    if (!currentLanguage) {
      throw new Error("Error: unable to retrieve language");
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

    formattedText = this.wrap(formattedText, 38);

    // formattedText =
    //   this.languageInfo[languageIndex].formattedStart +
    //   "\n " +
    //   this.languageInfo[languageIndex].commentCharacter +
    //   " " +
    //   formattedText +
    //   "\n " +
    //   this.languageInfo[languageIndex].end +
    //   "\n";

    return formattedText;
  }

  public async insertTextAtPosition(
    text: string,
    position: vscode.Position,
    format: boolean = false
  ): Promise<boolean> {
    if (format === true) {
      text = this.formatText(text);
    }
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

  public getSelection() {
    if (!this._activeEditor) {
      throw new Error("Error: No active text editor");
    }
    return this._activeEditor.selection;
  }

  public async getAllSymbols(): Promise<vscode.SymbolInformation[]> {
    if (this._activeEditor) {
      return [];
    }

    let symbols = await vscode.commands.executeCommand<
      vscode.SymbolInformation[]
    >("vscode.executeDocumentSymbolProvider");

    if (!symbols) {
      return [];
    }
    return symbols;
  }
}
