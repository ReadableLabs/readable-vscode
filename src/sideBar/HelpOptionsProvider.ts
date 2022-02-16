import * as vscode from "vscode";
import * as path from "path";

// Must match in package.json
const HELP_OPTIONS = [
  "Have a question?",
  "Configure comment style",
  "More info",
];

export class HelpOptionsProvider
  implements vscode.TreeDataProvider<HelpOption>
{
  constructor() {}

  getTreeItem(element: HelpOption): vscode.TreeItem {
    return element;
  }

  getIconPath(element: String): string {
    if (element === "Have a question?") {
      return "discord";
    } else if (element === "Configure comment style") {
      return "settings-gear";
    }
    return "info";
  }

  getChildren(): HelpOption[] {
    const readableConfig = vscode.workspace.getConfiguration("readable");
    const currentValue = readableConfig.get("help");
    const options = HELP_OPTIONS.map((option) => {
      const selected = option === currentValue;
      return new HelpOption(
        option,
        vscode.TreeItemCollapsibleState.None,
        selected,
        this.getIconPath(option)
      );
    });
    return options;
  }
}

class HelpOption extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly selected: boolean = false,
    public readonly iconName: string
  ) {
    super(label, collapsibleState);
    this.tooltip = this.label;
    this.setIconPath();
  }

  setIconPath() {
    if (this.iconName !== "discord") {
      this.iconPath = new vscode.ThemeIcon(this.iconName);
    } else {
      this.iconPath = {
        light: path.join(
          __filename,
          "..",
          "..",
          "media",
          "dark",
          "discord.svg"
        ),
        dark: path.join(__filename, "..", "..", "media", "dark", "discord.svg"),
      };
    }
  }
}
