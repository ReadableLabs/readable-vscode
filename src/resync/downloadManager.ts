import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import ReadableLogger from "../Logger";
import { DownloadState } from "./types";

export abstract class DownloadManager {
  public static downloading: boolean = false;
  public static dir: string;
  public static bin: string;

  public static setDir(directory: string) {
    this.dir = directory;
    this.bin = path.join(this.dir, "resync");
  }

  public static isDownloaded() {
    return fs.existsSync(this.bin);
  }

  public static download(): Promise<DownloadState> {
    if (this.isDownloaded() || DownloadManager.downloading) {
      return new Promise<DownloadState>((resolve, reject) =>
        resolve(DownloadState.Ok)
      );
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
            // vscode.window.showErrorMessage(
            //   "Error writing file. Check the log for details"
            // );
            ReadableLogger.log("Error downloading resync");
            ReadableLogger.log(e.message);
            this.downloading = false;
            return reject(DownloadState.Err);
          });
        });
      } catch (err: any) {
        // vscode.window.showErrorMessage(
        //   "An error has occured while downloading resync"
        // );
        this.downloading = false;
        ReadableLogger.log(err.toString());
        return reject(DownloadState.Err);
      }
    });
  }
}
