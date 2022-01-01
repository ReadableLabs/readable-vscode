import * as vscode from "vscode";
import { IProfile } from "../authentication/types";

export default abstract class TrialHelper {
  public static TrialEnded = false;

  public static numDaysBetween(d1: number, d2: number) {
    let diff = d1 - d2;
    return diff / (1000 * 60 * 60 * 24);
  }

  public static async CheckTrial(profile: IProfile): Promise<void> {
    if (profile.plan === "Premium") {
      return;
    }

    let parsedDate = Date.parse(profile.trial_end);
    let currentDate = new Date().getTime();

    let trialDate = this.numDaysBetween(parsedDate, currentDate);

    if (trialDate < 3 && trialDate > 0) {
      let choice = await vscode.window.showInformationMessage(
        "You have less than 3 days remaining in your Readable Trial.",
        "Purchase Readable"
      );
      if (!choice) {
        return;
      }
      if (choice === "Purchase Readable") {
        await vscode.env.openExternal(
          vscode.Uri.parse("https://readable.so/pricing")
        );
      }
    }

    if (trialDate <= 0) {
      TrialHelper.TrialEnded = true;
      let choice = await vscode.window.showInformationMessage(
        "Your Readable trial is over! Please purchase Readable to continue using it."
      );
      if (!choice) {
        return;
      }
      if (choice === "Purchase Readable") {
        await vscode.env.openExternal(
          vscode.Uri.parse("https://readable.so/pricing")
        );
      }
    }

    console.log(trialDate);
    console.log(parsedDate);
  }
}
