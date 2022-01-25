import * as vscode from "vscode";
import * as sqlite3 from "sqlite3";

export default class DatabaseTools {
  private _dbPath: string;
  constructor(dbPath: string) {
    this._dbPath = dbPath;
  }

  public createDb() {}

  public checkDbExists() {}
}
