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
        throw new Error("Error: Failed Generating comment");
      } else {
        return data.code;
      }
    } catch (err: any) {
      throw new Error(err.toString());
    }
  }

  public async insertComment(comment: string, position: vscode.Position) {
    throw new Error("Not Implemented");
  }

  public async generateAndInsert(
    text: string,
    language: string,
    kind: number,
    position: vscode.Position
  ) {
    let comment = await this.generateComment(text, language, kind);
    await this.insertComment(comment, position);
  }
}
