import axios from "axios";
import { window } from "vscode";
export default class TextGenerator {
  private _baseUrl = "http://127.0.0.1:8000";
  private _completionUrl = this._baseUrl + "/complete/";

  private languages = ["typescript", "javascript", "cpp", "csharp", "python"];

  private _types = ["docstring", "summary", "in_line"];

  private languageInfo = [
    {
      keywords: /namespace|class|function|\{|\>|let|var|const/,
      keywordTypes: [
        "namespace",
        "class",
        "function",
        "{",
        ">",
        "let",
        "var",
        "const",
      ],
      keywordMeanings: [
        "Namespace",
        "Class",
        "Function",
        "Function",
        "Function",
        "Code",
        "Code",
        "Code",
      ],
    },
    {
      keywords: /namespace|class|function|\{|\>|let|var|const/,
      keywordTypes: [
        "namespace",
        "class",
        "function",
        "{",
        ">",
        "let",
        "var",
        "const", // add return, else, if here to check for code
      ],
      keywordMeanings: [
        "Namespace",
        "Class",
        "Function",
        "Function",
        "Function",
        "Code",
        "Code",
        "Code",
      ],
    },
  ];

  constructor() {}

  private async makeApiRequest(
    route: string,
    code: string,
    language: string,
    commentType: string,
    keyword: string
  ): Promise<any> {
    const { data, status } = await axios.post(route, {
      code,
      language,
      keyword,
      commentType,
    });
    if (status !== 200) {
      throw new Error(
        "Error: API Request failed with status " +
          status +
          ". Additional info: " +
          data
      );
    }
    return data;
  }

  public async generate(code: string, language: string, type: string) {
    if (this._types.indexOf(type) === -1) {
      throw new Error("Error: invalid comment type"); // TODO: check language
    }
  }

  private _getLanguageIndex(language: string): number {
    let index = this.languages.indexOf(language);

    if (index < 0 || !index) {
      window.showErrorMessage("Error: unsupported language");
      throw new Error("Error: unsupported language");
    }

    return index;
  }

  private _getKeyword(code: string, index: number): RegExpMatchArray {
    let keyword = code.match(this.languageInfo[index].keywords);

    if (!keyword) {
      window.showErrorMessage("Error: unable to match token");
      throw new Error("Error: unable to match token");
    }

    return keyword;
  }

  private _getKeywordIndex(keyword: string, index: number): number {
    return this.languageInfo[index].keywordTypes.indexOf(keyword);
  }

  private _getCodeType(index: number, keywordIndex: number) {
    return this.languageInfo[index].keywordMeanings[keywordIndex];
  }

  private _getCodeName(code: string, keyword: string) {
    let separatedCode = code.split(" ");
    let keywordIndex = separatedCode.indexOf(keyword);
    return separatedCode[keywordIndex + 1];
  }

  public async generateSummary(code: string, language: string) {
    // let index = this.languages.indexOf(language);

    let index = this._getLanguageIndex(language);

    let keyword = this._getKeyword(code, index);

    let keywordIndex = this._getKeywordIndex(keyword[0], index);

    let codeType = this._getCodeType(index, keywordIndex);

    let codeName = "This";

    if (keyword[0] === "class") {
      codeName = this._getCodeName(code, keyword[0]);
    }

    const data = await this.makeApiRequest(
      this._completionUrl,
      code,
      language,
      "summary",
      codeType
    );
    console.log(data);
    return data.replace(codeType + " 1", codeName);
  }

  public generateDocstring(text: string) {}
}
