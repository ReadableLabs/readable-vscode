import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ResyncTree } from "../resync/ResyncTree";
import { Resync } from "../resync";

export class ResyncOptionsProvider
  implements vscode.TreeDataProvider<ResyncItem>
{
  constructor() {}

  private _onDidChangeTreeData: vscode.EventEmitter<
    ResyncItem | undefined | null | void
  > = new vscode.EventEmitter<ResyncItem | undefined | null | void>();

  readonly onDidChangeTreeData?:
    | vscode.Event<void | ResyncItem | null | undefined>
    | undefined;

  getTreeItem(
    element: ResyncItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: ResyncItem): vscode.ProviderResult<ResyncItem[]> {
    // for each file in file data
    return [];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

class ResyncItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = this.label;
  }
}
