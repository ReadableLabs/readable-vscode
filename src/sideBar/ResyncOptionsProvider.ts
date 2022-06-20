import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ResyncTree } from "../resync/ResyncTree";
import { Resync } from "../resync";

export class ResyncOptionsProvider
  implements vscode.TreeDataProvider<ResyncItem>
{
  private root?: string;
  private resync?: Resync;
  constructor(context: vscode.ExtensionContext) {
    if (!vscode.workspace.workspaceFolders) {
      return;
    }

    this.root = vscode.workspace.workspaceFolders[0].uri.fsPath;
    this.resync = new Resync(context);
    this.resync.checkProject();
    this.resync.tree.onDidUpdatePaths((paths) => {
      this.refresh();
    });
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    ResyncItem | undefined | null | void
  > = new vscode.EventEmitter<ResyncItem | undefined | null | void>();

  readonly onDidChangeTreeData?: vscode.Event<
    void | ResyncItem | null | undefined
  > = this._onDidChangeTreeData.event;

  getTreeItem(
    element: ResyncItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: ResyncItem): vscode.ProviderResult<ResyncItem[]> {
    if (!this.root) {
      return [];
    }

    if (element) {
      let allItems = [];
      let items = this.resync?.tree.getItemsByRelativePath(
        element.relativePath
      );
      if (!items) {
        return [];
      }

      for (let item of items) {
        allItems.push(
          new ResyncItem(
            `${item.commentStart} - ${item.commentEnd}`,
            item.relativePath,
            this.root,
            true,
            new CommentBounds(item.commentStart, item.commentEnd),
            vscode.TreeItemCollapsibleState.None
          )
        );
      }

      return allItems;
    }
    let items = [];
    let paths = this.resync?.tree.getAllUniquePaths();
    if (!paths) {
      return [];
    }

    for (let path of paths) {
      let fileName = this.resync?.tree.getFileNameFromRelativePath(path);
      if (!fileName) {
        continue;
      }

      items.push(
        new ResyncItem(
          fileName,
          path,
          this.root,
          false,
          undefined,
          vscode.TreeItemCollapsibleState.Collapsed
        )
      );
    }
    // for each file in file data
    return items;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

class CommentBounds {
  constructor(public readonly start: number, public readonly end: number) {}
}

class ResyncItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly relativePath: string,
    public readonly rootPath: string,
    hasOpenCommand: boolean,
    commentBounds: CommentBounds | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = this.label;
    this.contextValue = "file";
    if (!hasOpenCommand) {
      return;
    }

    if (!commentBounds) {
      return;
    }

    this.command = {
      title: "Open in Editor",
      command: "vscode.open",
      arguments: [
        vscode.Uri.file(path.join(rootPath, relativePath)),
        {
          preserveFocus: false,
          preview: false,
          selection: new vscode.Range(
            new vscode.Position(commentBounds.end - 1, 0),
            new vscode.Position(commentBounds.end - 1, 0)
          ),
          viewColumn: vscode.ViewColumn.Active,
        },
      ],
    };
  }
}
