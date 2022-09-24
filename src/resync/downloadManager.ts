import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { logger } from "../extension";

export enum DownloadState {
  Ok,
  Err,
}

export class DownloadManager {
  public static downloading: boolean = false;
  public static dir: string;
  public static bin: string;

  public static setDir(directory: string) {
    DownloadManager.dir = directory;
    DownloadManager.bin = path.join(DownloadManager.dir, "resync");
  }

  public static isDownloaded() {
    return fs.existsSync(DownloadManager.bin);
  }

  public static download(): Promise<DownloadState> {
    if (DownloadManager.isDownloaded() || DownloadManager.downloading) {
      return new Promise<DownloadState>((resolve, reject) =>
        resolve(DownloadState.Ok)
      );
    }

    return new Promise<DownloadState>((resolve, reject) => {
      try {
        logger.info("Downloading Resync");
        DownloadManager.downloading = true;
        let platform = `resync_${process.platform}_${process.arch}`;
        let downloadUrl = `https://resync.readable.workers.dev/${platform}`;

        try {
          fs.mkdirSync(DownloadManager.dir);
        } catch (err) {}

        https.get(downloadUrl, { rejectUnauthorized: false }, (res) => {
          let file = fs.createWriteStream(DownloadManager.bin);
          res.pipe(file);

          file.on("finish", () => {
            try {
              file.close();
              // TODO: don't do this on windows
              fs.chmodSync(DownloadManager.bin, 0o755);
              DownloadManager.downloading = false;
              logger.info("Finished downloading resync");
              return resolve(DownloadState.Ok);
            } catch (err) {
              logger.error("Failed chmoding resync executable");
              return reject();
            }
          });

          file.on("error", (e) => {
            logger.error("Error downloading resync", e);
            DownloadManager.downloading = false;
            return reject(DownloadState.Err);
          });
        });
      } catch (err: any) {
        // vscode.window.showErrorMessage(
        //   "An error has occured while downloading resync"
        // );
        logger.error("Failed downloading resync", err);
        DownloadManager.downloading = false;
        return reject(DownloadState.Err);
      }
    });
  }
}
