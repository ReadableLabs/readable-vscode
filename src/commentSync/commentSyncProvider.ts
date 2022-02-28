import * as vscode from "vscode";
import * as child_process from "child_process";
import * as Diff from "diff";
import * as fs from "fs";
import * as path from "path";
import CodeEditor from "../CodeEditor";
import { IChange, ICommentBounds, IParsedChange } from "./interfaces";
import {
  getAllSymbolsFromDocument,
  getCurrentChanges,
  getDocumentText,
  getDocumentTextFromEditor,
  getFileChanges,
  getParametersRange,
  getSymbolFromName,
  isInComment,
  updateDecorations,
} from "./utils";
import {
  getCommentRange,
  getNewCommentRanges,
  getSymbolFromCommentRange,
  getValidCommentRanges,
} from "./comments";
import { API, GitExtension } from "../@types/git";
export default class CommentSyncProvider {
  private _codeEditor: CodeEditor;
  private _document: string | null;
  private _git: API | undefined;
  // private _repository: Git.Repository | undefined;
  private _comments: vscode.Range[];
  private _commentsToDelete: vscode.Range[];
  private _path: string | undefined;
  constructor(codeEditor: CodeEditor) {
    this._codeEditor = codeEditor;
    this._document = getDocumentText();
    this._comments = [];
    this._commentsToDelete = [];
    const gitExtension =
      vscode.extensions.getExtension<GitExtension>("vscode.git");
    if (gitExtension) {
      const git = gitExtension.exports.getAPI(1);
      this._git = git;
      console.log(git);
    }
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
    vscode.window.onDidChangeActiveTextEditor((e) => {
      try {
        let _supportedLanguages = [
          "javascript",
          "javascriptreact",
          "typescript",
          "typescriptreact",
          "php",
          "python",
        ];
        console.log("ok");
        if (!e) {
          return;
        }
        if (!_supportedLanguages.includes(e.document.languageId)) {
          return;
        }
        console.log(e.document.languageId);
        if (!vscode.workspace.workspaceFolders) {
          return;
        }
        let filePath = path.join(
          vscode.workspace.workspaceFolders[0].uri.fsPath,
          "sync.json"
        );
        this._document = "";
        this._document = getDocumentTextFromEditor(e.document); // get the document text from the editor
        let ranges: vscode.Range[] = [];
        const changes = getFileChanges(filePath, e.document.fileName);
        console.log(changes);
        console.log(changes);
        if (!changes) {
          return;
        }
        updateDecorations(changes);
      } catch (err: any) {
        console.log(err);
        vscode.window.showErrorMessage(err);
      }
    });
    vscode.workspace.onDidChangeWorkspaceFolders(this.onWorkspaceChange);
    // this doesn't always work
    vscode.workspace.onWillSaveTextDocument((e) => {
      console.log("reason");
      console.log(e.reason);
    });
    vscode.workspace.onDidSaveTextDocument(async (e) => {
      console.log();
      // change on will save to on did save
      let _supportedLanguages = [
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact",
        "php",
        "python",
      ];
      // add prompt which asks user if they want to enable comment sync for this project, set global variable in this class
      // TODO: clean up this code to run as least as possible
      if (!vscode.workspace.workspaceFolders) {
        return;
      }
      if (!this._document) {
        return;
      }
      if (!_supportedLanguages.includes(e.languageId)) {
        return;
      }
      let text = getDocumentTextFromEditor(e);
      if (!text) {
        return;
      }

      // const repository = await Repository.open(
      //   vscode.workspace.workspaceFolders[0].uri.fsPath
      // );
      // console.log(repository);

      // here
      let format = this.getDiffLines(this._document, text, e.fileName);

      let changedComments: string[] = [];

      let linesChanged: IChange[] = [];
      let codePosition = 0;
      let symbols = await getAllSymbolsFromDocument(e);

      // let path = vscode.workspace.workspaceFolders[0].uri;

      // const folder = await this._git?.openRepository(path);
      // let file = await folder?.blame("Dockerfile");
      // console.log(file);
      // console.log(await folder?.blame("Dockerfile"));

      // let revision = child_process
      //   .execSync("git -C " + path + " rev-parse HEAD")
      //   .toString()
      //   .trim();
      // for each file changed (I think)
      // but since you can only save one file at a time, just get the first file
      console.log(format); // it's throwing an error
      if (!format[0].hunks[0]) {
        // use get comment range and compare to see if it's in it
        return;
      } // run a foreach through the hunks so you can get the newline and oldline

      let lines: string[] = [];
      let lastNormalLine: number = 0;
      let hasParametersChanged: boolean = false;
      let hasReturnChanged: boolean = false;
      for (let hunk of format[0].hunks) {
        codePosition = hunk.newStart;
        lines = hunk.lines;
        lastNormalLine = hunk.newStart;
        // codePosition = format[0].hunks[0].newStart; // filter to remove all the non retarded lines
        // const lines = format[0].hunks[0].lines;
        // let lastNormalLine: number = format[0].hunks[0].newStart;
        for await (let [index, _line] of lines.entries()) {
          hasParametersChanged = false;
          hasReturnChanged = false;
          // just do _line[0] === '+' instead
          // if (_line.startsWith("+") || _line.startsWith("-")) {
          if (_line[0] === "+" || _line[0] === "-") {
            if (_line.includes("return")) {
              hasReturnChanged = true;
            }
            // do something if it's a minus
            // last normal line, so if it's a minus, the position will be the last normal line
            let line = 0;
            // if (_line.startsWith("+")) {
            if (_line[0] === "+") {
              line = index + codePosition;
            } else {
              line = lastNormalLine;
            }
            // let line = index + codePosition;
            console.log(line);
            let characterIndex =
              e.lineAt(line).firstNonWhitespaceCharacterIndex;
            let symbolPosition = new vscode.Position(
              line,
              characterIndex
              // e.document.lineAt(line).firstNonWhitespaceCharacterIndex // this is throwing an error
            );

            let symbol = await CodeEditor.getSymbolFromPosition(
              symbols,
              symbolPosition
            );
            if (!symbol) {
              let range = getCommentRange(line, text.split("\n")); // because we're freaking cool

              if (!range) {
                continue;
              }

              let comment = await getSymbolFromCommentRange(symbols, range); // just delete the comment from the symbol range in sync
              console.log("comemnte edited");
              if (comment) {
                changedComments.push(comment.name);
              }
              console.log(comment?.name);
              // get function from comment range
              // check if comment
              continue;
            } // put else here
            // instead of check comment, get comment
            let range = getCommentRange(
              symbol.range.start.line - 2,
              text.split("\n")
            );

            console.log("symbol range");
            console.log(symbol.selectionRange);

            if (symbol.kind === vscode.SymbolKind.Class) {
              let functionRange = getCommentRange(line, text.split("\n"));
              if (functionRange) {
                let comment = await getSymbolFromCommentRange(
                  symbols,
                  functionRange
                ); // just delete the comment from the symbol range in sync
                console.log("comemnte edited");
                if (comment) {
                  changedComments.push(comment.name);
                }
                console.log(comment?.name);
                continue;
              }
            }

            let parametersRange = getParametersRange(symbol, text.split("\n"));
            if (!parametersRange) {
              hasParametersChanged = false;
            }
            if (parametersRange) {
              if (
                lastNormalLine >= parametersRange.start.line &&
                lastNormalLine <= parametersRange.end.line
              ) {
                hasParametersChanged = true;
              }
            }
            console.log("parameters");
            console.log(parametersRange);

            if (!range) {
              continue; // no range
            }

            let fileName = e.fileName;

            let idx = linesChanged.findIndex((e) => {
              if (!symbol) {
                return false;
              }
              if (e.file === fileName && e.function === symbol.name) {
                return true;
              } else {
                return false;
              }
            });

            if (idx !== -1) {
              linesChanged[idx].changesCount += 1;
              linesChanged[idx].isArgsChanged =
                linesChanged[idx].isArgsChanged === true
                  ? true
                  : hasParametersChanged;
              linesChanged[idx].isReturnChanged =
                linesChanged[idx].isReturnChanged === true
                  ? true
                  : hasReturnChanged;
              linesChanged[idx].range = range;
            } else {
              linesChanged.push({
                file: e.fileName,
                function: symbol.name,
                range,
                changesCount: 1,
                isArgsChanged: hasParametersChanged,
                isReturnChanged: hasReturnChanged,
              });
            }
          } else {
            lastNormalLine = index + codePosition;
          }
        }
      }
      console.log("lines changing"); // open new folder update decorations from sync file
      console.log(linesChanged);

      this._document = text;
      linesChanged = this.syncWithFileChanges(
        linesChanged,
        changedComments,
        symbols
      );
      let validRanges = getNewCommentRanges(
        symbols,
        linesChanged,
        e.fileName,
        text.split("\n")
      );

      // let validRanges = getValidCommentRanges(
      //   updatedRanges,
      //   text.split("\n"),
      //   e.document.fileName
      // );

      console.log(validRanges);
      this.writeToFile(validRanges);
      let filteredChanges = validRanges.filter((change) => {
        if (change.file !== e.fileName) {
          return false;
        }
        return true;
      }); // check if function name has been changed
      updateDecorations(filteredChanges); // get initial vscode highlight color
      console.log("saving");
    });
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

  public syncWithNewChanges(
    changes: IChange[],
    newChanges: IChange[],
    commentsToDelete: string[],
    symbols: vscode.DocumentSymbol[]
  ): IChange[] {
    let allChanges: IChange[] = changes;
    for (let change of newChanges) {
      let index = changes.findIndex((e) => {
        if (e.file === change.file && e.function === change.function) {
          return true;
        } else {
          return false;
        }
      });
      if (index !== -1) {
        allChanges[index].changesCount += change.changesCount; // check if comment is above
        allChanges[index].range = change.range; // update comment range
        allChanges[index].isArgsChanged =
          allChanges[index].isArgsChanged === true
            ? true
            : change.isArgsChanged;
        allChanges[index].isReturnChanged =
          allChanges[index].isReturnChanged === true
            ? true
            : change.isReturnChanged;
        // allChanges[index].isArgsChanged =
        //   allChanges[index].isArgsChanged === true
        //     ? true
        //     : change.isArgsChanged;
        // allChanges[index].isReturnChanged =
        //   allChanges[index].isReturnChanged === true
        //     ? true
        //     : change.isReturnChanged;
      } else {
        allChanges.push(change);
      }
    }

    // delete the filtered comments
    let filtered = allChanges.filter((change) => {
      for (let functionName of commentsToDelete) {
        if (change.function === functionName) {
          return false;
        }
      }
      return true;
    });

    return filtered;
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

  public syncWithFileChanges(
    changes: IChange[],
    commentsToDelete: string[],
    symbols: vscode.DocumentSymbol[]
  ) {
    if (vscode.workspace.workspaceFolders) {
      const sync = path.join(
        vscode.workspace.workspaceFolders[0].uri.fsPath,
        "sync.json"
      );
      let fileData: IChange[] | undefined;
      if (!fs.existsSync(sync)) {
        fileData = [];
      } else {
        fileData = getCurrentChanges(sync);
        // fileData = JSON.parse(fs.readFileSync(sync, "utf-8"));
      }
      if (!fileData) {
        fileData = [];
      }
      const allChanges = this.syncWithNewChanges(
        fileData,
        changes,
        commentsToDelete,
        symbols
      );
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

  public checkGit() {}

  public async getFunctionName(symbol: vscode.DocumentSymbol) {}
}
