import axios from "axios";
const https = require("https");
import * as vscode from "vscode";
import { IProfile } from "../authentication/types";
https.globalAgent.options.rejectUnauthorized = false; // once bug gets fixed remove

export default abstract class TrialHelper {
  public static TrialEnded = false;

  public static numDaysBetween(d1: number, d2: number) {
    let diff = d1 - d2;
    return diff / (1000 * 60 * 60 * 24);
  }

  public static async checkTrial() {}

  public static async checkFirstLaunch(accessToken: string) {
    try {
      const { data } = await axios.post(
        "https://api.readable.so/api/v1/users/check-trial/",
        {
          place: "vscode",
        },
        {
          headers: {
            Authorization: `Token ${accessToken}`,
          },
        }
      );
      console.log(data);

      if (data === false) {
        let response = await vscode.window.showInformationMessage(
          "Welcome to the Readable trial! If you haven't already, check our website to see how Readable works.",
          "Open Readable website"
        );
        if (!response) {
          return;
        }
        if (response === "Open Readable Website") {
          vscode.env.openExternal(vscode.Uri.parse("https://readable.so"));
        }
      }
    } catch (err: any) {
      if (err.response) {
        vscode.window.showErrorMessage(err.response);
      }
    }
  }

  public static async showTrialNotification(trialEnd: string) {
    let parsedDate = Date.parse(trialEnd);
    let currentDate = new Date().getTime();

    let trialDate = this.numDaysBetween(parsedDate, currentDate);

    if (trialDate > 0) {
      let choice = await vscode.window.showInformationMessage(
        `You have ${trialDate.toPrecision(
          2
        )} days remaining in your Readable trial.`,
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
        "Your Readable trial is over! Please purchase Readable to continue using it.",
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

    console.log(trialDate);
    console.log(parsedDate);
  }
}
