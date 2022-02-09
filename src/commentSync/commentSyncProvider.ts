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
  private _comments: vscode.Range[];
  private _commentsToDelete: vscode.Range[];
  private _path: string | undefined;
  constructor(codeEditor: CodeEditor) {
    this._codeEditor = codeEditor;
    this._document = this.getDocumentText();
    this._comments = [];
    this._commentsToDelete = [];
    this._highlightDecoratorType = vscode.window.createTextEditorDecorationType(
      // set decoration range behavior
      {
        backgroundColor: "#cea7002D", // don't write file on change, just append to array to commit
        overviewRulerColor: "#cea7002D", // get all decorations function, do it on file load, check if over 10, reset if text change is on one of the comments, store comment ranges somewhere in memory after save
        overviewRulerLane: vscode.OverviewRulerLane.Right,
      }
    );
    // get list of code and comments to that code with that initial diff, then you can check which comments have been edited
    /**
     * So like {
     *   Code {
     *      functionName, all that stuff
     *      Comment: { start, end }
     *    }
     * }
     */
    if (vscode.workspace.workspaceFolders) {
      this._path = vscode.workspace.workspaceFolders[0].uri.path;
    }
    vscode.workspace.onDidChangeTextDocument((e) => {
      // queue up the changes on edit, save them on save
      // console.log(e.contentChanges[0].range); // this might be useful
      let edit = e.contentChanges[0].range.start.line;
      for (let comment of this._comments) {
        if (edit >= comment.start.line && edit <= comment.end.line) {
          // maybe store comment range so we can calculate that
          this._commentsToDelete.push(comment); // get symbol at one plus range end of comment assuming text at range end is */, do a while loop
          console.log(comment);
        }
      }
    });
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
      let editedComments = [];
      console.log(format);
      codePosition = format[0].hunks[0].newStart; // filter to remove all the non retarded lines
      for await (let [index, line] of format[0].hunks[0].lines.entries()) {
        if (line.startsWith("+" || line.startsWith("-"))) {
          // do changed comments in onTextChange
          // for (let comment of this._comments) {
          //   if (
          //     index + codePosition >= comment.start.line &&
          //     index + codePosition <= comment.end.line
          //   ) {
          //     editedComments.push(comment);
          //     console.log(comment);
          //   }
          // }
          let name = await this._codeEditor.getSymbolFromPosition(
            symbols,
            new vscode.Position(
              index + codePosition,
              e.document.lineAt(
                index + codePosition // if anything happens above the current function, but below the function above
              ).firstNonWhitespaceCharacterIndex // check for supported file type, symbol found
            )
          );
          console.log(name);
          if (!name) {
            // check if comment
            continue;
          } // put else here
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
      let allComments = await this.getCommentRanges(linesChanged); // refactor this to be run within one function, one at a time
      if (!allComments) {
        console.log("comments not found");
        return;
      }
      this.updateDecorations(allComments); // get initial vscode highlight color
      this._comments = allComments;
      console.log("saving");
    });
  }

  private onTextEditorChange(e: vscode.TextEditor | undefined) {
    this._document = this.getDocumentText(); // get the document text from the editor
  }

  private onWorkspaceChange(e: vscode.WorkspaceFoldersChangeEvent) {
    // make work with multiple workspace folders
    this._path = e.added[0].uri.path;
  }

  public async getCommentRanges(changes: IChange[]) {
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

      // get the start and end ranges from the comments
      let bounds = this.getCommentBounds(symbol); // pass in document to this to avoid getting document 10 times
      if (bounds) {
        allRanges.push(
          // why not put an on edit so that you delete the symbol from the array once it's been updated, 20 quintillion symbol checks before a write is made
          new vscode.Range(
            new vscode.Position(bounds.start, 0),
            new vscode.Position(bounds.end + 1, 0) // kind of hacky so we don't need to get the last character
          )
        );
        // allBounds.push(bounds);
      }
    }
    // for (let bound of allBounds) {
    //   allRanges.push(
    //     new vscode.Range(
    //       new vscode.Position(bound.start, 0), // get non whitespace character
    //       new vscode.Position(bound.end + 1, 0)
    //     )
    //   );
    // }
    return allRanges;

    // we have the changes, now we need to get the lines in between to tell where to update decorations for
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

  private async updateDecorations(ranges: vscode.Range[]) {
    if (!vscode.window.activeTextEditor) {
      return;
    }
    vscode.window.activeTextEditor.setDecorations(
      this._highlightDecoratorType,
      ranges
    );
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
