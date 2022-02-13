import * as vscode from "vscode";
import * as path from "path";

const HELP_OPTIONS = ["Discord", "Config"];

export class HelpOptionsProvider
  implements vscode.TreeDataProvider<HelpOption>
{
  constructor() {}

  getTreeItem(element: HelpOption): vscode.TreeItem {
    return element;
  }

  getChildren(): HelpOption[] {
    const readableConfig = vscode.workspace.getConfiguration("readable");
    const currentValue = readableConfig.get("help");
    const options = HELP_OPTIONS.map((option) => {
      const selected = option === currentValue;
      return new HelpOption(
        option,
        vscode.TreeItemCollapsibleState.None,
        selected
      );
    });
    return options;
  }
}

class HelpOption extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly selected: boolean = false
  ) {
    super(label, collapsibleState);
    this.tooltip = this.label;
  }

  iconPath = {
    light: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "light",
      "dependency.svg"
    ),
    dark: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "dark",
      "dependency.svg"
    ),
  };
}
