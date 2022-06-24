import * as fs from "fs";
import * as vscode from "vscode";
import * as child_process from "child_process";
import * as path from "path";
import * as https from "https";
import { ResyncFileInfo } from "./ResyncItem";
import { ResyncTree } from "./ResyncTree";
import { report } from "process";
import { skeletonTemplate } from "@microsoft/fast-foundation";

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
    // this.binLocation = "/home/victor/Desktop/resync/target/debug/resync";
    this.binLocation =
      "/Users/victorchapman/Desktop/p/resync/target/debug/resync";
    // this.binLocation = path.join(this.baseDir, "/bin/resync");
    // this.warningIconPath = "/home/victor/Desktop/readable-vscode/src/pixil.png";
    this.warningIconPath =
      "Users/victorchapman/Desktop/p/readable-vscode/src/pixil.png";
    this.highlightDecoratorType = vscode.window.createTextEditorDecorationType({
      // backgroundColor: "#cea7002D", // don't write file on change, just append to array to commit
      overviewRulerColor: "#facc15",
      gutterIconPath: vscode.Uri.file(this.warningIconPath),
      gutterIconSize: "contain",
      overviewRulerLane: vscode.OverviewRulerLane.Left,
    });

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
    let command = `${this.binLocation} -d ${currentDir} -i ${relativeFile} -p`;

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

    for (let line of output) {
      let split = line.split("\t");
      const start = parseInt(split[4]);
      const end = parseInt(split[5]);

      const range = new vscode.Range(
        new vscode.Position(start - 1, 0),
        new vscode.Position(end - 1, 0)
      );

      unsynced.push(range);
    }

    console.log("unsynced");
    console.log(unsynced);

    this.updateDecorations(unsynced);
    //Do SOMETHING
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
              console.log("no workspace folders");
              resolve();
              return;
            }

            let currentDir = vscode.workspace.workspaceFolders[0].uri.fsPath;

            console.log("spawning process");
            let process = child_process.spawn(this.binLocation, [
              "-d",
              `${currentDir}`,
              "-p",
            ]);

            process.stdout.on("error", (error) => {
              console.log(error);
              vscode.window.showErrorMessage("An error has occured");
            });

            process.on("error", (err) => {
              vscode.window.showErrorMessage("an error has occured");
              console.log(err.toString());
              resolve();
            });

            process.stdout.on("data", (data) => {
              let split = data.toString().split("\n");
              split.pop();

              // console.log(split);
              // console.log(split.length / 6);

              for (let line of split) {
                let chunk = line.split("\t");
                console.log(chunk);
                this.tree.addItem(new ResyncFileInfo(chunk));
              }

              // for (let i = 0; i < split.length; i += 6) {
              //   let chunk = split.slice(i, i + 6);
              // this.tree.addItem(new ResyncFileInfo(chunk));
              // }
            });

            process.stdout.on("end", () => {
              console.log("process end");
              resolve();
            });
          } catch (error) {
            console.log(error);
            vscode.window.showErrorMessage("An error has occured");
          }
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
