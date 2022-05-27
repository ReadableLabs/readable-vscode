import * as vscode from "vscode";
import * as path from "path";

const CUSTOM_ICONS = ["discord"];

// Must match in package.json
const HELP_OPTIONS = [
  { label: "Join the community", iconPath: "discord" },
  { label: "Configure comment style", iconPath: "settings-gear" },
  { label: "More info", iconPath: "info" },
];

export class HelpOptionsProvider
  implements vscode.TreeDataProvider<HelpOption>
{
  constructor() {}

  getTreeItem(element: HelpOption): vscode.TreeItem {
    return element;
  }

  getChildren(): HelpOption[] {
    const options = HELP_OPTIONS.map((option) => {
      return new HelpOption(option.label, option.iconPath);
    });
    return options;
  }
}

class HelpOption extends vscode.TreeItem {
  constructor(public readonly label: string, public readonly iconName: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.tooltip = this.label;
    this.iconPath = this.getIconPath();
  }

  getIconPath() {
    if (CUSTOM_ICONS.includes(this.iconName)) {
      return {
        light: path.join(
          __filename,
          "..",
          "..",
          "media",
          "light",
          `${this.iconName}.svg`
        ),
        dark: path.join(
          __filename,
          "..",
          "..",
          "media",
          "dark",
          `${this.iconName}.svg`
        ),
      };
    }
    return new vscode.ThemeIcon(this.iconName);
  }
}
