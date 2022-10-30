import * as vscode from "vscode";
import * as path from "path";
import * as child_process from "child_process";
import { logger } from "../extension";

/**
 * provides a wrapper around the resync executable
 */
export default class Executable {
  private _onExecutableData: vscode.EventEmitter<string[]>;
  private dir: string;
  private bin: string;
  private process?: child_process.ChildProcessWithoutNullStreams;

  constructor(public readonly context: vscode.ExtensionContext) {
    this.dir = context.globalStorageUri.fsPath;
    this.bin = path.join(this.dir, "resync");

    this._onExecutableData = new vscode.EventEmitter<string[]>();
  }

  public get onExecutableData(): vscode.Event<string[]> {
    return this._onExecutableData.event;
  }

  public async checkProject(folderPath: string) {
    throw new Error("Failed checking project");
    return new Promise<void>(async (resolve, reject) => {
      try {
        logger.info("Checking project");
        this.process = child_process.spawn(this.bin, ["-d", folderPath, "-p"]);

        this.process.stdout.on("error", (error) => {
          logger.error("Error in process stdout", error);
          return reject(error.message);
        });

        this.process.on("error", (error) => {
          logger.error("Error in process", error);
          return reject(error.message);
        });

        this.process.stdout.on("data", (data) => {
          logger.info(data.toString());
          let split = data.toString().split("\n");
          split.pop();
          this._onExecutableData.fire(split);
        });

        this.process.stdout.on("end", () => {
          logger.info("Readable process exited");
          this.process = undefined;
          return resolve();
        });
      } catch (err: any) {
        logger.error("Unknown error", err);
        return reject();
      }
    });
  }

  public checkFile(baseDir: string, relativeFilePath: string) {
    return new Promise<string[]>((resolve, reject) => {
      try {
        const command = `${this.bin.replace(
          " ",
          "\\ "
        )} -d ${baseDir} -i ${relativeFilePath} -p`;

        child_process.exec(command, (error, stdout, stderr) => {
          let split = stdout.split("\n");
          split.pop();

          if (stderr) {
            logger.log("Error in checking file", stderr);
          }

          return resolve(split);
        });
      } catch (err: any) {
        logger.error("Unknown error", err);
        return reject(err.toString());
      }
    });
  }

  public kill() {
    this.process?.kill("SIGINT");
    this.process = undefined;
  }

  public getVersion() {}
}
