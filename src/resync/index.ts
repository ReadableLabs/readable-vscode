import * as fs from "fs";
import * as vscode from "vscode";
import * as child_process from "child_process";
import * as path from "path";
import * as https from "https";
import { ResyncFileInfo } from "./ResyncItem";
import { ResyncTree } from "./ResyncTree";

export class Resync {
  private warningIconPath = path.join(
    this.context.globalStorageUri.fsPath,
    "assets/warning.png"
  );
  private highlightDecoratorType = vscode.window.createTextEditorDecorationType(
    {
      // backgroundColor: "#cea7002D", // don't write file on change, just append to array to commit
      overviewRulerColor: "#facc15",
      gutterIconPath: vscode.Uri.file(this.warningIconPath),
      gutterIconSize: "contain",
      overviewRulerLane: vscode.OverviewRulerLane.Left,
    }
  );
  private binDir = path.join(this.context.globalStorageUri.fsPath, "/bin");
  private process?: child_process.ChildProcessWithoutNullStreams;
  public tree = new ResyncTree();

  constructor(public readonly context: vscode.ExtensionContext) {
    this.updateActive();
    vscode.window.onDidChangeActiveTextEditor(() => {
      this.updateActive();
    });
    vscode.workspace.onDidSaveTextDocument(() => {
      this.updateActive();
    });
    this.checkProject();
  }

  public checkBin() {}

  public download() {
    let basePath = this.context.globalStorageUri.fsPath;
    let binPath = path.join(basePath, "bin/");
    let assetPath = path.join(basePath, "assets/");
    try {
      fs.mkdirSync(binPath);
    } catch (err) {}

    try {
      fs.mkdirSync(assetPath);
    } catch (err) {}

    https.get("https://nevin.cc/files/warning.png", (res) => {
      const file = fs.createWriteStream(this.warningIconPath);
      res.pipe(file);

      file.on("finish", () => {
        file.close();
      });
    });
    // fs mkdir recursive since the global dir might not exist
  }

  /**
   * Checks the active file for out of sync comments
   */
  public updateActive() {
    // check if exe exists
    if (!vscode.workspace.workspaceFolders) {
      return;
    }

    let currentDir = vscode.workspace.workspaceFolders[0].uri.fsPath;

    let currentFile = vscode.window.activeTextEditor?.document.uri.fsPath;

    if (!currentFile) {
      return;
    }

    let relativeFile = path.relative(currentDir, currentFile);

    let command = `${this.binDir}/resync -s -d ${currentDir} -i ${relativeFile} -p`;

    let result = child_process.exec(command, (error, stdout, stderr) => {
      let split = stdout.split("\n");
      split.pop(); // remove empty last line, might only be for linux

      if (stderr) {
        vscode.window.showErrorMessage(stderr);
      }

      this.parseRanges(split);
    });
  }

  public parseFileInfo(output: string[]) {
    return new ResyncFileInfo(output);
  }

  public parseRanges(output: string[]) {
    let unsynced = [];
    let l = output.length / 6;
    for (let i = 0; i < l; i++) {
      let offset = i * 6;

      const start = output[offset + 4];
      const end = output[offset + 5];

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

  public checkProject() {
    console.log(vscode.workspace.workspaceFolders);
    if (!vscode.workspace.workspaceFolders) {
      return;
    }

    let currentDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
    let command = `${this.binDir}/resync`;

    console.log("spawning process");
    let process = child_process.spawn(command, [
      "-s",
      "-d",
      `${currentDir}`,
      "-c",
      "-p",
    ]);

    // let process = child_process.spawn("ls", ["-lh", "/usr"]);

    process.stdout.on("data", (data) => {
      let split = data.toString().split("\n");
      split.pop();
      // console.log("adding item");
      this.tree.addItem(new ResyncFileInfo(split));
      // console.log(new ResyncFileInfo(split));
      // console.log(data.toString());
    });

    process.stdout.on("end", () => {
      console.log(this.tree.getAllUniquePaths());
    });
  }

  private updateDecorations(ranges: vscode.Range[]) {
    vscode.window.activeTextEditor?.setDecorations(
      this.highlightDecoratorType,
      ranges
    );
  }
}
