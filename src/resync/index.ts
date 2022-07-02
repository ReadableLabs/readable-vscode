import * as fs from "fs";
import * as vscode from "vscode";
import * as child_process from "child_process";
import * as path from "path";
import * as https from "https";
import { ResyncFileInfo } from "./ResyncItem";
import { ResyncTree } from "./ResyncTree";
import { report } from "process";
import { skeletonTemplate } from "@microsoft/fast-foundation";
import { request } from "http";

export class Resync {
  private warningIconPath;
  private highlightDecoratorType;

  private baseDir;
  private executableName;
  private binLocation;
  private process?: child_process.ChildProcessWithoutNullStreams;
  public tree = new ResyncTree();

  // years to year
  constructor(public readonly context: vscode.ExtensionContext) {
    this.baseDir = context.globalStorageUri.fsPath;
    this.executableName = `resync_${process.platform}_${process.arch}`;
    this.binLocation = path.join(this.baseDir, this.executableName);
    // this.binLocation = "/home/victor/Desktop/resync/target/debug/resync";
    this.warningIconPath = path.join(
      __filename,
      "..",
      "..",
      "media",
      "warning_icon.png"
    );

    // "Users/victorchapman/Desktop/p/readable-vscode/src/pixil.png";
    this.highlightDecoratorType = vscode.window.createTextEditorDecorationType({
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

    this.checkBin();
    // this.checkProject();
  }

  public checkBin() {
    if (!fs.existsSync(path.join(this.baseDir, "resync"))) {
      this.download();
    }
  }

  public download() {
    try {
      vscode.window.showInformationMessage("Downloading Resync");
      let platform = `resync_${process.platform}_${process.arch}`;
      let downloadUrl = `https://github.com/ReadableLabs/resync/releases/download/1.0/${platform}`;

      console.log(downloadUrl);

      let binPath = path.join(this.baseDir, "resync");
      console.log(binPath);
      try {
        fs.mkdirSync(this.baseDir);
      } catch (err) {
        // console.log(err);
      }

      // check if file exists

      let request = https.get(
        downloadUrl,
        { rejectUnauthorized: false },
        (res) => {
          console.log("getting file");
          let file = fs.createWriteStream(binPath);
          file.on("error", (e) => {
            console.log("error");
            console.log(e);
          });

          res.on("error", (e) => {
            console.log("res error");
            console.log(e);
          });

          res.on("data", (e) => {
            console.log("data");
            console.log(e);
          });
          res.pipe(file);

          file.on("finish", () => {
            vscode.window.showInformationMessage("Downloaded Resync");
            file.close();
          });

          file.on("error", (e) => {
            console.log("error");
            console.log(e);
          });
        }
      );

      request.on("response", (data) => {
        console.log(data);
        console.log(data.headers["content-length"]);
      });

      request.on("error", (e) => {
        console.log("error");
        console.log(e);
      });

      request.on("abort", () => {
        console.log("aborted");
      });
    } catch (err) {
      vscode.window.showErrorMessage(
        "An error has occured while downloading the file"
      );
      console.log(err);
    }
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

    child_process.exec(command, (error, stdout, stderr) => {
      let split = stdout.split("\n");
      split.pop(); // remove empty last line, might only be for linux

      if (stderr) {
        vscode.window.showErrorMessage(stderr);
      }

      this.updateTree(split);
      this.parseRanges(split);
    });
  }

  public updateTree(output: string[]) {
    let unsynced = [];

    for (let line of output) {
      let split = line.split("\t");
      unsynced.push(new ResyncFileInfo(split));
    }

    this.tree.updatePath(unsynced);
    // return new ResyncFileInfo(output);
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
              console.log("no workspace folders");
              resolve();
              return;
            }
            let currentDir = vscode.workspace.workspaceFolders[0].uri.fsPath;

            console.log("spawning process");
            this.process = child_process.spawn(this.binLocation, [
              "-d",
              `${currentDir}`,
              "-p",
            ]);

            this.process.stdout.on("error", (error) => {
              console.log(error);
              vscode.window.showErrorMessage("An error has occured");
            });

            this.process.on("error", (err) => {
              vscode.window.showErrorMessage("an error has occured");
              console.log(err.toString());
              resolve();
            });

            this.process.stdout.on("data", (data) => {
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

            this.process.stdout.on("end", () => {
              console.log("process end");
              this.process = undefined;
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

  public refreshResync() {
    if (!this.process) {
      this.tree.resetItems();
      this.checkProject();
      return;
    }

    vscode.window.showInformationMessage(
      "Try again when the resync process has concluded"
    );
  }

  public stopResync() {
    if (!this.process) {
      vscode.window.showInformationMessage(
        "No resync process currently running"
      );
      return;
    }
    this.process.kill("SIGINT");
    console.log(this.process.killed);
    this.process = undefined;
  }

  private updateDecorations(ranges: vscode.Range[]) {
    vscode.window.activeTextEditor?.setDecorations(
      this.highlightDecoratorType,
      ranges
    );
  }
}
