import * as vscode from "vscode";
import * as child_process from "child_process";
import * as Diff from "diff";
import * as Git from "nodegit";
import * as fs from "fs";
import * as path from "path";
import CodeEditor from "../CodeEditor";
import { IChange } from "./types";
import { fileURLToPath } from "url";

export default class CommentSyncProvider {
  private _codeEditor: CodeEditor;
  private _document: string | undefined;
  private _path: string | undefined;
  constructor(codeEditor: CodeEditor) {
    this._codeEditor = codeEditor;
    this._document = this.getDocumentText();
    console.log(this._document);
    console.log("test");
    if (vscode.workspace.workspaceFolders) {
      // another test comment
      this._path = vscode.workspace.workspaceFolders[0].uri.path;
      console.log(this._path);
    }
    vscode.window.onDidChangeActiveTextEditor((e) => {
      this._document = this.getDocumentText();
    });
    vscode.workspace.onDidChangeWorkspaceFolders((e) => {
      this._path = e.added[0].uri.path;
    });
    // this doesn't always work
    vscode.workspace.onWillSaveTextDocument(async (e) => {
      if (!this._document) {
        return;
      }
      let text = this.getDocumentText();
      if (!text) {
        return;
      }

      // get the diff between the current document and the new document
      const diff = Diff.diffLines(this._document, text, {
        ignoreWhitespace: true,
      });
      const patch = Diff.createPatch(e.document.fileName, this._document, text);
      let format = Diff.parsePatch(patch);

      let linesChanged: IChange[] = [];
      let codePosition = 0;
      let symbols = await this._codeEditor.getAllSymbols();

      let revision = child_process
        .execSync("git rev-parse HEAD")
        .toString()
        .trim();
      // for each file changed (I think)
      for (let i = 0; i < format[0].hunks.length; i++) {
        codePosition = format[0].hunks[i].newStart;

        // for each line changed in file
        for (let k = 0; k < format[0].hunks[i].lines.length; k++) {
          if (
            format[0].hunks[i].lines[k].startsWith("+") ||
            format[0].hunks[i].lines[k].startsWith("-")
          ) {
            let name = await this._codeEditor.getSymbolFromPosition(
              symbols,
              new vscode.Position(
                k + codePosition,
                e.document.lineAt(
                  k + codePosition
                ).firstNonWhitespaceCharacterIndex
              )
            );

            if (!name) {
              return;
            }

            let fileName = e.document.fileName;

            let index = linesChanged.findIndex((e) => {
              if (e.file === fileName && e.function === (name as any).name) {
                return true;
              } else {
                return false;
              }
            });

            if (index !== -1) {
              linesChanged[index].changes_count += 1;
            } else {
              linesChanged.push({
                file: e.document.fileName,
                function: name.name,
                last_updated: revision, // git rev-parse HEAD maybe
                changes_count: 1,
              });
            }

            console.log(name.name);
            console.log(format[0].hunks[i].lines[k]);
            console.log(k + codePosition);
          }
        }
      }
      console.log(linesChanged);

      this._document = text;
      this.commitToFile();
      console.log("saving");
    });
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
        allChanges[index].changes_count += 1;
      } else {
        allChanges.push(change);
      }
    });
    return allChanges;
  }

  public commitToFile() {
    try {
      if (vscode.workspace.workspaceFolders) {
        const sync = path.join(
          vscode.workspace.workspaceFolders[0].uri.fsPath,
          "sync.json"
        );
        let fileData;
        if (!fs.existsSync(sync)) {
          fs.writeFileSync(sync, "[]");
          fileData = [];
        } else {
          fileData = JSON.parse(fs.readFileSync(sync, "utf-8"));
        }
        fileData.map((item: IChange) => {}); // find the index and do all of that stuff
        console.log(fileData);
        console.log(
          path.join(
            vscode.workspace.workspaceFolders[0].uri.fsPath,
            "sync.json"
          )
        );
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
