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
    code: string,
    language: string,
    keyword: string,
    comment_type: string
  ): Promise<string> {
    try {
      const commentTypes = ["summary", "docstring", "detailed"];
      if (commentTypes.indexOf(comment_type) == -1) {
        throw new Error("Error: invalid comment type");
      }
      const { data } = await axios.post(COMPLETION_URL, {
        code,
        language,
        keyword,
        comment_type: comment_type,
      });
      if (data.status !== 200) {
        throw new Error("Error: Failed Generating comment");
      } else {
        return data;
      }
    } catch (err: any) {
      throw new Error(err.toString());
    }
  }
  public formatComment(comment: string): string {
    throw new Error("Not Implemented");
  }

  private _formatComment(comment: string): string {
    throw new Error("Not Implemented");
  }

  public async insertComment(
    comment: string,
    position: vscode.Position,
    editor: vscode.TextEditor
  ) {
    throw new Error("Not Implemented");
  }

  public async generateAndInsert(
    code: string,
    language: string,
    keyword: string,
    position: vscode.Position
  ) {
    let comment = await this.generateComment(
      code,
      language,
      keyword,
      "summary"
    );
    // await this.insertComment(comment, position, vscode.window.activeTextEditor);
  }
}
