import * as vscode from "vscode";
import { ResyncFileInfo } from "./ResyncItem";
import { ResyncItemAddedEvent } from "./events";

export class ResyncTree {
  private _onDidAddResyncItem: vscode.EventEmitter<ResyncItemAddedEvent>;
  private _onDidUpdatePaths: vscode.EventEmitter<string[]>;
  private _onDidChangeFileData: vscode.EventEmitter<ResyncItemAddedEvent>;
  private paths: string[] = [];
  private items: ResyncFileInfo[] = [];

  constructor() {
    this._onDidAddResyncItem = new vscode.EventEmitter<ResyncItemAddedEvent>();
    this._onDidUpdatePaths = new vscode.EventEmitter<string[]>();
    this._onDidChangeFileData = new vscode.EventEmitter<ResyncItemAddedEvent>();
  }

  public get onDidChangeFileData(): vscode.Event<ResyncItemAddedEvent> {
    return this._onDidChangeFileData.event;
  }

  public get onDidAddResyncItem(): vscode.Event<ResyncItemAddedEvent> {
    return this._onDidAddResyncItem.event;
  }

  public get onDidUpdatePaths(): vscode.Event<string[]> {
    return this._onDidUpdatePaths.event;
  }

  public updatePath(items: ResyncFileInfo[]) {
    if (items.length === 0) {
      return;
    }

    let path = items[0].relativePath;
    this.clearItemsByPath(path);

    for (let item of items) {
      this.addItem(item);
    }

    this._onDidUpdatePaths.fire([path]);
  }

  public resetItems() {
    this.items = [];
    this.paths = [];
  }

  public addItem(item: ResyncFileInfo) {
    this.items.push(item);

    if (!this.paths.includes(item.relativePath)) {
      this.paths.push(item.relativePath);
      this._onDidUpdatePaths.fire(this.paths);
    }
    this._onDidAddResyncItem.fire(item);
  }

  public clearItemsByPath(path: string) {
    this.items = this.items.filter((item) => {
      if (item.relativePath !== path) {
        return true;
      }
      return false;
    });
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
