import * as vscode from "vscode";
import * as fs from "fs";
import * as sqlite3 from "sqlite3";

export default class DatabaseTools {
  private _version;
  private _dbPath: string;
  constructor(dbPath: string, version: string) {
    this._version = version;
    this._dbPath = dbPath;
  }

  public createDb() {}

  public checkDbExists() {}

  public resetDb() {}
}
