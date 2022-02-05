import * as vscode from "vscode";
import { diff_match_patch, DIFF_EQUAL, DIFF_DELETE } from "diff-match-patch";
import * as Git from "nodegit";
import * as path from "path";
import CodeEditor from "./CodeEditor";
import { patienceDiff, patienceDiffPlus } from "./diff_match_patch/diff";

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
    vscode.workspace.onDidChangeWorkspaceFolders((e) => {
      this._path = e.added[0].uri.path;
    });
    // this doesn't always work
    vscode.workspace.onWillSaveTextDocument((e) => {
      if (!this._document) {
        return;
      }
      let text = this.getDocumentText();
      if (!text) {
        return;
      }

      // const diff = new diff_match_patch(); // start up a new task as to not delay saving
      // const diffs = diff.diff_main(this._document, text);
      // const diffs = this.diff_linemode(this._document, text);
      // for (let i = 0; i < diffs.length; i++) {
      //   if (diffs[i][0] !== DIFF_EQUAL) {
      //     console.log(text.indexOf(diffs[i][1]));
      //     if (diffs[i][0] === DIFF_DELETE) {
      //       const textSplit = this._document.split("\n");
      //     }
      //     console.log(diffs[i]);
      //   }
      // }

      const diffs = patienceDiffPlus(
        this._document.split("\n"),
        text.split("\n")
      );
      if (diffs.lineCountDeleted === 0 || diffs.lineCountInserted === 0) {
        return;
      }
      let foundLines = [];
      for (let i = 0; i < diffs.lines.length; i++) {
        if (diffs.lines[i].aIndex !== diffs.lines[i].bIndex) {
          console.log("found");
          console.log(diffs.lines[i]); // get the line + 1
          foundLines.push({ type: diffs.lines[i] });
        }
      }

      this._document = text;
      console.log("saving");
    });
  }

  private getDocumentText() {
    return vscode.window.activeTextEditor?.document.getText(
      new vscode.Range(
        // gets all text of document
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

  public diff_linemode(text1: string, text2: string) {
    const dmp = new diff_match_patch();
    const a = dmp.diff_linesToChars_(text1, text2);
    var lineText1 = a.chars1;
    var lineText2 = a.chars2;
    var lineArray = a.lineArray;
    var diffs = dmp.diff_main(lineText1, lineText2, false);
    dmp.diff_charsToLines_(diffs, lineArray);
    return diffs;
  }

  public checkGit() {}

  public async getFunctionName(symbol: vscode.DocumentSymbol) {}
}
