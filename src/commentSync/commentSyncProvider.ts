import * as vscode from "vscode";
import * as child_process from "child_process";
import * as Diff from "diff";
import * as Git from "nodegit";
import * as fs from "fs";
import * as path from "path";
import CodeEditor from "../CodeEditor";
import { IChange, ICommentBounds } from "./types";
import { fileURLToPath } from "url";
export default class CommentSyncProvider {
  private _supportedLanguages = [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "php",
    "python",
  ];
  private _highlightDecoratorType;
  private _codeEditor: CodeEditor;
  private _document: string | undefined;
  private _path: string | undefined;
  constructor(codeEditor: CodeEditor) {
    this._codeEditor = codeEditor;
    this._document = this.getDocumentText();
    let warningColor = new vscode.ThemeColor("minimap.warningHighlight"); // doesn't work editorWarning.
    console.log(warningColor);
    this._highlightDecoratorType = vscode.window.createTextEditorDecorationType(
      // set decoration range behavior
      {
        outlineWidth: "1px",
        outlineStyle: "solid",
        outlineColor: "#cea700",
        overviewRulerColor: "#cea700", // get all decorations function, do it on file load, check if over 10, reset if text change is on one of the comments, store comment ranges somewhere in memory after save
        overviewRulerLane: vscode.OverviewRulerLane.Right,
      }
    );
    if (vscode.workspace.workspaceFolders) {
      this._path = vscode.workspace.workspaceFolders[0].uri.path;
    }
    vscode.window.onDidChangeActiveTextEditor(this.onTextEditorChange);
    vscode.workspace.onDidChangeWorkspaceFolders(this.onWorkspaceChange);
    // this doesn't always work
    vscode.workspace.onWillSaveTextDocument(async (e) => {
      // add prompt which asks user if they want to enable comment sync for this project, set global variable in this class
      // TODO: clean up this code to run as least as possible
      if (!vscode.workspace.workspaceFolders) {
        return;
      }
      if (!this._document) {
        return;
      }
      if (!this._supportedLanguages.includes(e.document.languageId)) {
        return;
      }
      let text = this.getDocumentText();
      if (!text) {
        return;
      }

      // here
      let format = this.getDiffLines(this._document, text, e.document.fileName);

      let linesChanged: IChange[] = [];
      let codePosition = 0;
      let symbols = await this._codeEditor.getAllSymbols();

      console.log(symbols);

      let path = vscode.workspace.workspaceFolders[0].uri.fsPath;

      let revision = child_process
        .execSync("git -C " + path + " rev-parse HEAD")
        .toString()
        .trim();
      // for each file changed (I think)
      // but since you can only save one file at a time, just get the first file
      console.log(format);
      codePosition = format[0].hunks[0].newStart; // filter to remove all the non retarded lines
      for await (let [index, line] of format[0].hunks[0].lines.entries()) {
        if (line.startsWith("+" || line.startsWith("-"))) {
          let name = await this._codeEditor.getSymbolFromPosition(
            symbols,
            new vscode.Position(
              index + codePosition,
              e.document.lineAt(
                index + codePosition
              ).firstNonWhitespaceCharacterIndex // check for supported file type, symbol found
            )
          );
          console.log(name);
          if (!name) {
            continue;
          }
          if (!this.checkComment(name)) {
            continue;
          }
          let fileName = e.document.fileName;

          let idx = linesChanged.findIndex((e) => {
            if (e.file === fileName && e.function === (name as any).name) {
              return true;
            } else {
              return false;
            }
          });

          if (idx !== -1) {
            linesChanged[idx].changesCount += 1;
          } else {
            linesChanged.push({
              file: e.document.fileName, // get start line instead of end line
              function: name.name,
              lastUpdated: revision, // git rev-parse HEAD maybe
              changesCount: 1,
            });
          }

          console.log(name.name);
          console.log(line);
          console.log(index + codePosition);
          console.log(linesChanged);
        }
      }

      console.log("lines changing");
      console.log(linesChanged);

      this._document = text;
      linesChanged = this.syncWithFileChanges(linesChanged);
      this.writeToFile(linesChanged);
      this.updateDecorations(linesChanged); // get initial vscode highlight color
      console.log("saving");
    });
  }

  private onTextEditorChange(e: vscode.TextEditor | undefined) {
    this._document = this.getDocumentText();
  }

  private onWorkspaceChange(e: vscode.WorkspaceFoldersChangeEvent) {
    // make work with multiple workspace folders
    this._path = e.added[0].uri.path;
  }

  private getDiffLines(document: string, text1: string, fileName: string) {
    // get the diff between the current document and the new document
    const diff = Diff.diffLines(document, text1, {
      ignoreWhitespace: true,
    });
    const patch = Diff.createPatch(fileName, document, text1);
    let format = Diff.parsePatch(patch);
    return format;
  }

  public getCommentBounds(symbol: vscode.DocumentSymbol) {
    if (!vscode.window.activeTextEditor) {
      return;
    }
    const documentText = this.getDocumentText()?.split("\n");
    if (!documentText) {
      return;
    }
    const commentEnd = symbol.range.start.line - 1;
    let i = commentEnd;
    while (!documentText[i].includes("/*")) {
      if (i < 0) {
        return; // handle null checking in the parent function
      }
      i--;
    }
    return { start: i, end: commentEnd };
  }

  private async updateDecorations(changes: IChange[]) {
    if (!vscode.window.activeTextEditor) {
      return;
    }
    let symbols = await this._codeEditor.getAllSymbols();
    let allBounds: ICommentBounds[] = [];
    let allRanges: vscode.Range[] = [];
    for (let change of changes) {
      let symbol = this._codeEditor.getSymbolFromName(symbols, change.function);
      if (!symbol) {
        continue;
      }
      if (!this.checkComment(symbol)) {
        return;
      }
      let bounds = this.getCommentBounds(symbol);
      if (bounds) {
        allBounds.push(bounds);
      }
    }
    for (let bound of allBounds) {
      allRanges.push(
        new vscode.Range(
          new vscode.Position(bound.start, 0), // get non whitespace character
          new vscode.Position(bound.end + 1, 0)
        )
      );
    }
    vscode.window.activeTextEditor.setDecorations(
      this._highlightDecoratorType,
      allRanges
    );
    // we have the changes, now we need to get the lines in between to tell where to update decorations for
  }

  public syncWithNewChanges(
    changes: IChange[],
    newChanges: IChange[]
  ): IChange[] {
    let allChanges: IChange[] = changes;
    newChanges.map((change) => {
      let index = changes.findIndex((e) => {
        if (e.file === change.file && e.function === change.function) {
          return true;
        } else {
          return false;
        }
      });
      if (index !== -1) {
        allChanges[index].changesCount += change.changesCount; // check if comment is above
      } else {
        allChanges.push(change);
      }
    });
    return allChanges;
  }

  public checkComment(symbol: vscode.DocumentSymbol): boolean {
    if (symbol.range.start.line - 1 < 0) {
      return false;
    }
    const line = vscode.window.activeTextEditor?.document.lineAt(
      symbol.range.start.line - 1
    ).text;
    if (!line) {
      return false;
    }
    if (line.includes("*/") || line.includes("//")) {
      return true;
    } else {
      return false;
    }
  }

  public getCurrentInfo(sync: string) {
    if (!fs.existsSync(sync)) {
      return [];
    } else {
      return JSON.parse(fs.readFileSync(sync, "utf-8"));
    }
  }

  public syncWithFileChanges(changes: IChange[]) {
    if (vscode.workspace.workspaceFolders) {
      const sync = path.join(
        vscode.workspace.workspaceFolders[0].uri.fsPath,
        "sync.json"
      );
      let fileData;
      if (!fs.existsSync(sync)) {
        fileData = [];
      } else {
        fileData = JSON.parse(fs.readFileSync(sync, "utf-8"));
      }
      const allChanges = this.syncWithNewChanges(fileData, changes);
      return allChanges;
    }
    throw new Error("Error: no workspace folders");
  }

  public writeToFile(changes: IChange[]) {
    try {
      if (vscode.workspace.workspaceFolders) {
        const sync = path.join(
          vscode.workspace.workspaceFolders[0].uri.fsPath,
          "sync.json"
        );
        if (!fs.existsSync(sync)) {
          fs.writeFileSync(sync, "[]");
        }
        fs.writeFileSync(sync, JSON.stringify(changes));
        // let fileData;
        // if (!fs.existsSync(sync)) {
        //   fs.writeFileSync(sync, "[]");
        //   fileData = [];
        // } else {
        //   fileData = JSON.parse(fs.readFileSync(sync, "utf-8"));
        // }
        // let updatedChanges = this.syncWithNewChanges(fileData, newChanges);
        // fs.writeFileSync(sync, JSON.stringify(updatedChanges));
        // console.log(updatedChanges);
        // console.log(fileData);
        // console.log(
        //   path.join(
        //     vscode.workspace.workspaceFolders[0].uri.fsPath,
        //     "sync.json"
        //   )
        // );
      }
      // const fileData = fs.readFileSync()
    } catch (err: any) {
      console.log(err);
      vscode.window.showErrorMessage(err);
    }
  }

  private getDocumentText() {
    return vscode.window.activeTextEditor?.document.getText(
      new vscode.Range(
        // gets all the lines in the document
        new vscode.Position(0, 0),
        new vscode.Position(
          vscode.window.activeTextEditor.document.lineCount,
          vscode.window.activeTextEditor.document.lineAt(
            vscode.window.activeTextEditor.document.lineCount - 1
          ).lineNumber
        )
      )
    );
  }

  public checkGit() {}

  public async getFunctionName(symbol: vscode.DocumentSymbol) {}
}
