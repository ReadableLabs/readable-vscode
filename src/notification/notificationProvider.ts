import * as vscode from "vscode";
import axios from "axios";
import {
  FEEDBACK_SELECTION_YES,
  FEEDBACK_SELECTION_NO,
  FEEDBACK_QUESTION_YESNO,
  THANKS_FOR_FEEDBACK,
} from "./consts";
import { FEEDBACK_URL } from "../globals/consts";

const showFeedbackMessage = (commentId: number) => {
  vscode.window
    .showInformationMessage(
      FEEDBACK_QUESTION_YESNO,
      FEEDBACK_SELECTION_YES,
      FEEDBACK_SELECTION_NO
    )
    .then(async (selection) => {
      if (selection) {
        const result = await axios.post(FEEDBACK_URL, {
          rating:
            selection == FEEDBACK_SELECTION_YES
              ? FEEDBACK_SELECTION_YES
              : FEEDBACK_SELECTION_NO,
          id: commentId,
        });
        vscode.window.showInformationMessage(THANKS_FOR_FEEDBACK);
      }
    });
};

export { showFeedbackMessage };
