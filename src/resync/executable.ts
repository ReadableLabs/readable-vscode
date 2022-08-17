import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as https from "https";
import * as child_process from "child_process";
import ReadableLogger from "../Logger";
import { DownloadState } from "./types";

/**
 * provides a wrapper around the resync executable
 */
export default class Executable {
  private _onExecutableData: vscode.EventEmitter<string[]>;
  private dir: string;
  private bin: string;
  private downloading: boolean = false;
  private process?: child_process.ChildProcessWithoutNullStreams;

  constructor(public readonly context: vscode.ExtensionContext) {
    this.dir = context.globalStorageUri.fsPath;
    this.bin = path.join(this.dir, "resync");

    this._onExecutableData = new vscode.EventEmitter<string[]>();
  }

  public get onExecutableData(): vscode.Event<string[]> {
    return this._onExecutableData.event;
  }

  private async download(): Promise<DownloadState> {
    if (this.isDownloaded() || this.downloading) {
      return DownloadState.Ok;
    }

    return new Promise<DownloadState>((resolve, reject) => {
      try {
        ReadableLogger.log("Downloading resync");
        this.downloading = true;
        let platform = `resync_${process.platform}_${process.arch}`;
        let downloadUrl = `https://resync.readable.workers.dev/${platform}`;

        try {
          fs.mkdirSync(this.dir);
        } catch (err) {}

        https.get(downloadUrl, { rejectUnauthorized: false }, (res) => {
          let file = fs.createWriteStream(this.bin);
          res.pipe(file);

          file.on("finish", () => {
            ReadableLogger.log("Finished downloading resync");
            file.close();
            fs.chmodSync(this.bin, 0o755);
            this.downloading = false;
            return resolve(DownloadState.Ok);
          });

          file.on("error", (e) => {
            vscode.window.showErrorMessage(
              "Error writing file. Check the log for details"
            );
            ReadableLogger.log("Error downloading resync");
            ReadableLogger.log(e.message);
            this.downloading = false;
            return reject(DownloadState.Err);
          });
        });
      } catch (err: any) {
        vscode.window.showErrorMessage(
          "An error has occured while downloading resync"
        );
        this.downloading = false;
        ReadableLogger.log(err.toString());
        return reject(DownloadState.Err);
      }
    });
  }

  public isDownloaded(): boolean {
    return fs.existsSync(this.bin);
  }

  public async checkProject(folderPath: string) {
    return new Promise<void>(async (resolve, reject) => {
      try {
        this.process = child_process.spawn(this.bin, ["-d", folderPath, "-p"]);

        this.process.stdout.on("error", (error) => {
          ReadableLogger.log(error.message);
          return reject(error.message);
        });

        this.process.on("error", (error) => {
          ReadableLogger.log(error.message);
          return reject(error.message);
        });

        this.process.stdout.on("data", (data) => {
          const split = data.toString().split("\n");
          this._onExecutableData.fire(split);
        });

        this.process.stdout.on("end", () => {
          this.process = undefined;
          return resolve();
        });
      } catch (err: any) {
        ReadableLogger.log(err.toString());
        return reject();
      }
    });
  }

  public checkFile() {}

  public kill() {
    this.process?.kill("SIGINT");
    this.process = undefined;
  }

  public getVersion() {}
}
