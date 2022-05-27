import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class ResyncOptionsProvider
  implements vscode.TreeDataProvider<ResyncItem>
{
  constructor(private root: string) {}

  getTreeItem(
    element: ResyncItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: ResyncItem): vscode.ProviderResult<ResyncItem[]> {
    // for each file in file data
    return [];
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
