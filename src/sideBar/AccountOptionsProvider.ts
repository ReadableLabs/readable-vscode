import * as vscode from "vscode";
import * as path from "path";

const ACCOUNT_OPTIONS = ["Log in", "Sign up"];

export class AccountOptionsProvider
  implements vscode.TreeDataProvider<AccountOption>
{
  constructor() {}

  getTreeItem(element: AccountOption): vscode.TreeItem {
    return element;
  }

  getChildren(): AccountOption[] {
    // const options = ACCOUNT_OPTIONS.map((option) => {
    // const selected = option === currentValue;
    //   return new AccountOption(
    //     option,
    //     vscode.TreeItemCollapsibleState.None,
    //     false
    //   );
    // });
    // return options;
    return [];
  }
}

class AccountOption extends vscode.TreeItem {
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
