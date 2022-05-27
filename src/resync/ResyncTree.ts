import * as vscode from "vscode";
import { ResyncFileInfo } from "./ResyncItem";
import { ResyncItemAddedEvent } from "./ResyncItemAddedEvent";

export class ResyncTree {
  private _onDidAddResyncItem: vscode.EventEmitter<ResyncItemAddedEvent>;
  private _onDidUpdatePaths: vscode.EventEmitter<string[]>;
  private paths: string[] = [];
  private items: ResyncFileInfo[] = [];
  constructor() {
    this._onDidAddResyncItem = new vscode.EventEmitter<ResyncItemAddedEvent>();
    this._onDidUpdatePaths = new vscode.EventEmitter<string[]>();
  }

  public get onDidAddResyncItem(): vscode.Event<ResyncItemAddedEvent> {
    return this._onDidAddResyncItem.event;
  }

  public get onDidUpdatePaths(): vscode.Event<string[]> {
    return this._onDidUpdatePaths.event;
  }

  public addItem(item: ResyncFileInfo) {
    this.items.push(item);

    if (!this.paths.includes(item.relativePath)) {
      this.paths.push(item.relativePath);
      this._onDidUpdatePaths.fire(this.paths);
    }
    this._onDidAddResyncItem.fire(item);
  }

  public getItemsByRelativePath(path: string) {
    return this.items.filter((item) => {
      if (item.relativePath === path) {
        return true;
      }
      return false;
    });
  }

  public getAllUniquePaths() {
    return this.paths;
  }

  public getFileNameFromRelativePath(relativePath: string) {
    let item = this.items.find((item) => item.relativePath === relativePath);
    return item?.fileName;
  }
}
