import * as vscode from "vscode";
import * as Diff from "diff";
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
    vscode.workspace.onWillSaveTextDocument(async (e) => {
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

      // const dmp = new diff_match_patch();
      // const diff = dmp.diff_main(this._document, text);
      // dmp.diff_cleanupSemantic(diff);
      // let patch_list = dmp.patch_make(this._document, text, diff); // do line by line patch insated of this
      // let patch_text = dmp.patch_toText(patch_list);
      // console.log(patch_text);

      const diff = Diff.diffLines(this._document, text, {
        ignoreWhitespace: true,
      }); // get file name
      const patch = Diff.createPatch("test3", this._document, text);
      let format = Diff.parsePatch(patch);
      const linesChanged = [];
      let codePosition = 0;
      for (let i = 0; i < format[0].hunks.length; i++) {
        codePosition = format[0].hunks[i].newStart;
        for (let k = 0; k < format[0].hunks[i].lines.length; k++) {
          if (
            format[0].hunks[i].lines[k].startsWith("+") ||
            format[0].hunks[i].lines[k].startsWith("-")
          ) {
            // so that we get at the end of th efunction, exports and consts might not eb countred
            // get all symbols before and enumerate them, not get all symbols for each call
            // make new function getSymbolFromPosition(symbols, position)
            let name = await this._codeEditor.getSymbolUnderCusor(
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
            console.log(name.name);
            console.log(format[0].hunks[i].lines[k]);
            console.log(k + codePosition);
          }
        }
      }

      // const diffs = patienceDiffPlus(
      //   // check if file has changed to change document, activeEditor changed get new document
      //   ["asdg"],
      //   [""]
      //   // this._document.split("\n"),
      //   // text.split("\n")
      // );
      // if (diffs.lineCountDeleted === 0 || diffs.lineCountInserted === 0) {
      //   return;
      // }
      // let foundLines = [];
      // for (let i = 0; i < diffs.lines.length; i++) {
      //   if (diffs.lines[i].aIndex !== diffs.lines[i].bIndex) {
      //     console.log("found");
      //     console.log(diffs.lines[i]); // get the line + 1
      //     foundLines.push({ type: diffs.lines[i] });
      //   }
      // }

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
