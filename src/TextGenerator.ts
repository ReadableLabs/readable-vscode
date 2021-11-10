import axios from "axios";
export default class TextGenerator {
  private _baseUrl = "http://127.0.0.1:8000";
  private _completionUrl = this._baseUrl + "/complete/";

  private languages = ["typescript", "javascript", "cpp", "csharp", "python"];

  private _types = ["docstring", "summary", "in_line"];

  private languageInfo = [
    {
      keywords: /namespace|class|function|\{|\>|let|var|const/,
      keywordTypes: {
        namespace: "namespace",
        class: "Class",
        function: "Function",
        "{": "Function",
        ">": "Function",
        let: "Code",
        var: "Code",
        const: "Code",
      },
    },
  ];

  constructor() {}

  asdg() {}

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

  private formatText(language: string) {}

  public async generate(code: string, language: string, type: string) {
    if (this._types.indexOf(type) === -1) {
      throw new Error("Error: invalid comment type"); // TODO: check language
    }
  }

  public async generateSummary(
    code: string,
    language: string,
    commentType: string
  ) {
    let index = this.languages.indexOf(language);

    if (index < 0) {
      throw new Error("Error: unsupported language");
    }

    let keyword = code.match(this.languageInfo[index].keywords);
    console.log(keyword);
    const data = await this.makeApiRequest(
      this._completionUrl,
      code,
      language,
      commentType,
      "Function"
    );
    console.log(data);
    return data;
  }

  public generateDocstring(text: string) {}
}
