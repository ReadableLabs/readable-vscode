import * as fs from "fs";
import * as vscode from "vscode";
import * as child_process from "child_process";
import * as path from "path";
import * as https from "https";
import { ResyncFileInfo } from "./ResyncItem";
import { ResyncTree } from "./ResyncTree";
import { report } from "process";

export class Resync {
  private warningIconPath;
  private highlightDecoratorType;

  private baseDir;
  private binLocation;
  private process?: child_process.ChildProcessWithoutNullStreams;
  public tree = new ResyncTree();

  // years to year
  constructor(public readonly context: vscode.ExtensionContext) {
    this.baseDir = context.globalStorageUri.fsPath.replace(" ", "\\ ");
    this.binLocation =
      "/Users/victorchapman/Desktop/p/resync/target/debug/resync";
    // this.binLocation = path.join(this.baseDir, "/bin/resync");
    this.warningIconPath =
      "/Users/victorchapman/Desktop/p/readable-vscode/src/pixil.png";
    // this.warningIconPath = path.join(this.baseDir, "assets/warning.png");
    this.highlightDecoratorType = vscode.window.createTextEditorDecorationType({
      // backgroundColor: "#cea7002D", // don't write file on change, just append to array to commit
      overviewRulerColor: "#facc15",
      gutterIconPath: vscode.Uri.file(this.warningIconPath),
      gutterIconSize: "contain",
      overviewRulerLane: vscode.OverviewRulerLane.Left,
    });

    console.log(this.baseDir);
    this.updateActive();
    vscode.window.onDidChangeActiveTextEditor(() => {
      this.updateActive();
    });
    vscode.workspace.onDidSaveTextDocument(() => {
      this.updateActive();
    });
    // this.checkProject();
  }

  public checkBin() {}

  public download() {
    let binPath = path.join(this.baseDir, "bin/");
    let assetPath = path.join(this.baseDir, "assets/");
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

    // escape current dir as well as relative file
    let command = `${this.binLocation} -s -d ${currentDir} -i ${relativeFile} -p`;

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
    vscode.window.withProgress(
      {
        title: "Fetching unsynced comments...",
        location: { viewId: "resync" },
      },
      (progess, token) => {
        let p = new Promise<void>(async (resolve, reject) => {
          try {
            if (!vscode.workspace.workspaceFolders) {
              return;
            }

            let currentDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
            let command = `${this.binLocation}`;

            console.log("spawning process");
            let process = child_process.spawn(this.binLocation, [
              "-s",
              "-d",
              `${currentDir}`,
              "-c",
              "-p",
            ]);

            process.on("error", (err) => {
              vscode.window.showErrorMessage("an error has occured");
              console.log(err.toString());
            });

            // let process = child_process.spawn("ls", ["-lh", "/usr"]);

            process.stdout.on("data", (data) => {
              console.log("data");
              let split = data.toString().split("\n");
              split.pop();
              // console.log("adding item");
              console.log(split);
              this.tree.addItem(new ResyncFileInfo(split));
              // console.log(new ResyncFileInfo(split));
              // console.log(data.toString());
            });

            process.stdout.on("end", () => {
              resolve();
            });
          } catch (error) {}
        });
        return p;
      }
    );
  }

  private updateDecorations(ranges: vscode.Range[]) {
    vscode.window.activeTextEditor?.setDecorations(
      this.highlightDecoratorType,
      ranges
    );
  }
}
