import axios from "axios";
import * as vscode from "vscode";
import { showFeedback } from "../configuration";
import { COMPLETION_URL } from "../globals/consts";
import { showFeedbackMessage } from "../notification/notificationProvider";
import {
  DETAILED_DESCRIPTION,
  DETAILED_LABEL,
  DOCSTRING_DETAIL,
  DOCSTRING_LABEL,
  SIMPLE_DESCRIPTION,
  SIMPLE_LABEL,
} from "./consts";

export class CommentProvider {
  public quickPickItems: vscode.QuickPickItem[] = [
    {
      label: DOCSTRING_LABEL,
      detail: DOCSTRING_DETAIL,
      picked: true, // todo: get default
    },
    {
      label: SIMPLE_LABEL,
      detail: SIMPLE_DESCRIPTION,
      picked: false,
    },
    {
      label: DETAILED_LABEL,
      detail: DETAILED_DESCRIPTION,
      picked: false,
    },
  ];
  public async generateComment(
    text: string,
    language: string,
    kind: number
  ): Promise<string> {
    try {
      const { data } = await axios.post(COMPLETION_URL, {
        code: text,
        language: language,
        kind: kind,
      });
      if (data.status !== 200) {
        // vscode.window.showErrorMessage(data.message);
        throw new Error("Error: Failed Generating comment");
      } else {
        // if (showFeedback()) {
        //   showFeedbackMessage(data.comment_id);
        // }
        return data.code;
      }
    } catch (err: any) {
      throw new Error(err.toString());
    }
  }
}
