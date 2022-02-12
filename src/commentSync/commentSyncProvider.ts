import * as vscode from "vscode";
import * as child_process from "child_process";
import * as Diff from "diff";
import * as Git from "nodegit";
import * as fs from "fs";
import * as path from "path";
import CodeEditor from "../CodeEditor";
import { IChange, ICommentBounds } from "./types";
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
    // vscode.workspace.onDidChangeTextDocument((e) => {
    //   // queue up the changes on edit, save them on save
    //   // console.log(e.contentChanges[0].range); // this might be useful
    //   let edit = e.contentChanges[0].range.start.line;
    //   for (let comment of this._comments) {
    //     if (edit >= comment.start.line && edit <= comment.end.line) {
    //       // maybe store comment range so we can calculate that
    //       this._commentsToDelete.push(comment); // get symbol at one plus range end of comment assuming text at range end is */, do a while loop
    //       console.log(comment);
    //     }
    //   }
    // });
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

      let path = vscode.workspace.workspaceFolders[0].uri.fsPath;

      // let revision = child_process
      //   .execSync("git -C " + path + " rev-parse HEAD")
      //   .toString()
      //   .trim();
      // for each file changed (I think)
      // but since you can only save one file at a time, just get the first file
      console.log(format);
      if (!format[0].hunks[0]) {
        return;
      }
      codePosition = format[0].hunks[0].newStart; // filter to remove all the non retarded lines
      for await (let [index, line] of format[0].hunks[0].lines.entries()) {
        if (line.startsWith("+" || line.startsWith("-"))) {
          console.log(index);
          console.log(codePosition);
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
          // instead of check comment, get comment
          let range = this.getCommentRange(name, symbols, text.split("\n"));
          if (!range) {
            continue; // no range
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
              range,
              changesCount: 1,
            });
          }

          console.log(name.name);
          console.log(line);
          console.log(index + codePosition);
          console.log(linesChanged);
        }
      }

      console.log("lines changing"); // open new folder update decorations from sync file
      console.log(linesChanged);

      this._document = text;
      linesChanged = this.syncWithFileChanges(linesChanged); // add deleted array which runs a filter for the name
      console.log(linesChanged);
      this.writeToFile(linesChanged);
      // let allComments = await this.getCommentRanges(linesChanged); // run before
      // if (!allComments) {
      //   console.log("comments not found");
      //   return;
      // }
      this.updateDecorations(linesChanged); // get initial vscode highlight color
      // this._comments = allComments;
      console.log("saving");
    });
  }

  private onTextEditorChange(e: vscode.TextEditor | undefined) {
    if (!e) {
      return;
    }
    if (!this._supportedLanguages.includes(e.document.languageId)) {
      return;
    }
    this._document = this.getDocumentText(); // get the document text from the editor
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

  public getCommentRange(
    symbol: vscode.DocumentSymbol,
    symbols: vscode.DocumentSymbol[],
    document: string[]
  ): vscode.Range | undefined {
    if (!vscode.window.activeTextEditor) {
      throw new Error("Error: no active text editor");
    }
    let i = symbol.range.start.line - 1;

    if (i < 0) {
      return;
    }

    console.log(document[i]);
    if (!document[i].includes("*/") && !document[i].includes("//")) {
      return;
    }

    while (!document[i].includes("/*")) {
      console.log(document[i]);
      // do a check to see if the current line doesn't include // in this
      if (i - 1 < 0) {
        console.log("failed to find comment");
        return;
      }
      i--;
    }
    const startLine = i;
    const startCharacter =
      vscode.window.activeTextEditor.document.lineAt(
        startLine
      ).firstNonWhitespaceCharacterIndex;
    const endLine = symbol.range.start.line - 1; // fix 15 instead of 16
    const endCharacter =
      // vscode.window.activeTextEditor.document.lineAt(endLine).text.length;
      document[endLine].length;
    return new vscode.Range(
      new vscode.Position(startLine, startCharacter),
      new vscode.Position(endLine, endCharacter)
    );
  }

  private async updateDecorations(changes: any) {
    console.log(changes);
    let allRanges: vscode.Range[] = [];

    for (let change of changes) {
      // on did change active text editor update decorations
      allRanges.push(
        new vscode.Range(
          new vscode.Position(change.range[0].line, change.range[0].character),
          new vscode.Position(change.range[1].line, change.range[1].character)
        )
      );
    }

    if (!vscode.window.activeTextEditor) {
      return;
    }
    vscode.window.activeTextEditor.setDecorations(
      this._highlightDecoratorType,
      allRanges
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

  /**
   * Comment | null
   * @param symbol
   * @returns comment | null
   */
  public getComment(symbol: vscode.DocumentSymbol): boolean {
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
    // fix bug in constructor
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
