import * as vscode from "vscode";
import * as child_process from "child_process";
import * as path from "path";

export class Resync {
  private highlightDecoratorType = vscode.window.createTextEditorDecorationType(
    // set decoration range behavior
    {
      // backgroundColor: "#cea7002D", // don't write file on change, just append to array to commit
      overviewRulerColor: "#facc15",
      gutterIconPath: vscode.Uri.file(
        "/home/nevin/Desktop/Readable/src/pixil.png"
      ),
      gutterIconSize: "contain",
      overviewRulerLane: vscode.OverviewRulerLane.Left,
    }
  );
  constructor(public readonly context: vscode.ExtensionContext) {
    this.updateActive();
    vscode.window.onDidChangeActiveTextEditor(() => {
      this.updateActive();
    });
    vscode.workspace.onDidSaveTextDocument(() => {
      this.updateActive();
    });
  }

  public checkBin() {}

  public download() {
    // fs mkdir recursive since the global dir might not exist
  }

  /**
   * Checks the active file for out of sync comments
   */
  public updateActive() {
    let baseDir = this.context.globalStorageUri?.fsPath;
    if (!baseDir) {
      return;
    }

    if (!vscode.workspace.workspaceFolders) {
      return;
    }

    let currentDir = vscode.workspace.workspaceFolders[0].uri.fsPath;

    let currentFile = vscode.window.activeTextEditor?.document.uri.fsPath;

    if (!currentFile) {
      return;
    }

    let relativeFile = path.relative(currentDir, currentFile);
    console.log(relativeFile);
    console.log(currentDir);

    baseDir = path.join(baseDir, "/bin");

    let command = `${baseDir}/resync -s -d ${currentDir} -i ${relativeFile} -p`;

    let result = child_process.exec(command, (error, stdout, stderr) => {
      let split = stdout.split("\n");
      split.pop(); // remove empty last line, might only be for linux

      console.log(stdout);
      this.parse(split);
    });
    console.log(this.context.globalStorageUri?.fsPath);
  }

  public parse(output: string[]) {
    let unsynced = [];
    let l = output.length / 5;
    for (let i = 0; i < l; i++) {
      let offset = i * 5;

      const start = output[offset + 3];
      const end = output[offset + 4];

      const startInt = parseInt(start);
      const endInt = parseInt(end);

      const range = new vscode.Range(
        new vscode.Position(startInt - 1, 0),
        new vscode.Position(endInt - 1, 0)
      );

      unsynced.push(range);
    }

    console.log(unsynced);
    this.updateDecorations(unsynced);
  }

  public checkProject() {}

  private updateDecorations(ranges: vscode.Range[]) {
    vscode.window.activeTextEditor?.setDecorations(
      this.highlightDecoratorType,
      ranges
    );
  }
}
