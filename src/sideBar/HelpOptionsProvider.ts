import * as vscode from "vscode";
import * as path from "path";

const CUSTOM_ICONS = ["discord"];

interface IHelpOption {
  label: string;
  iconPath: string;
  command: vscode.Command;
}

// Must match in package.json
const HELP_OPTIONS: IHelpOption[] = [
  {
    label: "Join the community",
    iconPath: "discord",
    command: {
      command: "readable.openLink",
      arguments: ["https://discord.com/invite/UkMNCJu2x3"],
      title: "Open Discord",
    },
  },
  {
    label: "Open an Issue",
    iconPath: "github",
    command: {
      command: "readable.openLink",
      arguments: ["https://github.com/ReadableLabs/readable-vscode"],
      title: "Manage Account",
    },
  },
  {
    label: "Manage your account",
    iconPath: "account",
    command: {
      command: "readable.openLink",
      arguments: ["https://readable.so/account"],
      title: "Manage Account",
    },
  },
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
      return new HelpOption(option);
    });
    return options;
  }
}

class HelpOption extends vscode.TreeItem {
  constructor(public readonly option: IHelpOption) {
    super(option.label, vscode.TreeItemCollapsibleState.None);
    this.tooltip = option.label;
    this.iconPath = this.getIconPath();
    this.command = option.command;
  }

  getIconPath() {
    if (CUSTOM_ICONS.includes(this.option.iconPath)) {
      return {
        light: path.join(
          __filename,
          "..",
          "..",
          "media",
          "light",
          `${this.option.iconPath}.svg`
        ),
        dark: path.join(
          __filename,
          "..",
          "..",
          "media",
          "dark",
          `${this.option.iconPath}.svg`
        ),
      };
    }
    return new vscode.ThemeIcon(this.option.iconPath);
  }
}
