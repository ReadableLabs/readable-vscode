import * as vscode from "vscode";
import { ResyncFileInfo } from "./ResyncItem";
import { ResyncItemAddedEvent } from "./ResyncItemAddedEvent";

vscode.window.onDidChangeActiveColorTheme;
export class ResyncTree {
  private _onDidAddResyncItem: vscode.EventEmitter<ResyncItemAddedEvent>;
  private items: ResyncFileInfo[] = [];
  constructor() {
    this._onDidAddResyncItem = new vscode.EventEmitter<ResyncItemAddedEvent>();
  }

  public get onDidAddResyncItem(): vscode.Event<ResyncItemAddedEvent> {
    return this._onDidAddResyncItem.event;
  }

  public addItem(item: ResyncFileInfo) {
    this.items.push(item);
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
    let paths: string[] = [];
    this.items.map((item) => {
      if (!paths.includes(item.relativePath)) {
        paths.push(item.relativePath);
      }
    });

    return paths;
  }
}
