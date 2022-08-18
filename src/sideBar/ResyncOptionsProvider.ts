import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ResyncTree } from "../resync/ResyncTree";
import { Resync } from "../resync";
import { ReadableAuthenticationProvider } from "../authentication/AuthProvider";
import { DownloadManager } from "../resync/downloadManager";
import { DownloadState } from "../resync/types";
import Executable from "../resync/executable";
import { ResyncFileInfo } from "../resync/ResyncItem";

export class ResyncOptionsProvider
  implements vscode.TreeDataProvider<ResyncItem>
{
  private context: vscode.ExtensionContext;
  private contextDir: string;
  private executable?: Executable;
  public resync?: Resync;
  public tree: ResyncTree;
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.contextDir = context.globalStorageUri.fsPath;
    this.tree = new ResyncTree();
    this.tree.onDidUpdatePaths(() => {
      this.refresh();
    });
    this.checkAccountPanel();
  }

  private async setupResync() {
    DownloadManager.setDir(this.contextDir);

    if (!DownloadManager.isDownloaded()) {
      const status = await vscode.window.withProgress(
        {
          title: "Downloading Resync",
          location: vscode.ProgressLocation.Notification,
          cancellable: false,
        },
        DownloadManager.download
      );
      if (status != DownloadState.Ok) {
        return;
      }
    }

    if (!vscode.workspace.workspaceFolders) {
      return;
    }

    this.executable = new Executable(this.context);
    this.executable.onExecutableData((lines) => {
      for (let line of lines) {
        let info = line.split("\t");
        this.tree.addItem(new ResyncFileInfo(info));
      }
    });

    await vscode.window.withProgress(
      {
        title: "Fetching out of sync comments",
        location: { viewId: "resync" },
      },
      (progress, token) => {
        return new Promise<void>(async (resolve, reject) => {
          if (!vscode.workspace.workspaceFolders) {
            return reject();
          }

          await this.executable?.checkProject(
            vscode.workspace.workspaceFolders[0].uri.fsPath
          );

          return resolve();
        });
      }
    );
  }

  private async checkAccountPanel() {
    const session = await vscode.authentication.getSession(
      ReadableAuthenticationProvider.id,
      [],
      { createIfNone: false }
    );

    if (session) {
      vscode.commands.executeCommand("readable.setLoggedIn");
    }
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
    if (!vscode.workspace.workspaceFolders) {
      return [];
    }

    let root = vscode.workspace.workspaceFolders[0].uri.fsPath;

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
            root,
            true,
            new CommentBounds(item.commentStart, item.commentEnd),
            vscode.TreeItemCollapsibleState.None,
            item.lastUpdate,
            item.commitDiff
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
          root,
          false,
          undefined,
          vscode.TreeItemCollapsibleState.Collapsed,
          "",
          0
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
    public readonly hasOpenCommand: boolean,
    public readonly commentBounds: CommentBounds | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly lastUpdate: string,
    public readonly commitDiff: number
  ) {
    super(label, collapsibleState);
    if (!hasOpenCommand) {
      return;
    }

    if (!commentBounds) {
      return;
    }
    this.contextValue = "comment";
    this.description = this.lastUpdate;

    this.command = {
      title: "Open in Editor",
      command: "vscode.open",
      arguments: [
        vscode.Uri.file(relativePath),
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
