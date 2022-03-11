import IParsedBlame from "./types/IParsedBlame";

export const parseBlame = (blame: string[]): IParsedBlame[] => {
  let totalLines = blame.length / 13; // 52, so 4 times
  let totalBlames = new Array<IParsedBlame>(totalLines);
  for (let i = 0; i < totalLines; i++) {
    let offset = i * 13; // so 13 * 0 = 0 = 1st line. 13 * 1 = 13th line = 2nd blame
    // for (let k = offset; k < offset + 13; k++) {
    // unnecesary for loop
    //   if (offset) {
    // first line in blame
    let splitLine = blame[offset].split(" ");
    let commitId = splitLine[0];
    let originalLine = parseInt(splitLine[1]);
    let finalLine = parseInt(splitLine[2]);
    let lineGroup = splitLine.length > 3 ? parseInt(splitLine[3]) : undefined;
    totalBlames[i].line = {
      commit: commitId,
      originalLine: originalLine,
      finalLine: finalLine,
      commitLine: lineGroup,
    };
    // just push to the blame instead of this shit or make an IParsedBlame object and push that
    let author = blame[offset + 1];
    let authorMail = blame[offset + 2];
    let authorTime = parseInt(blame[offset + 3]);
    let authorTz = blame[offset + 4];
    let commiter = blame[offset + 5];
    let commiterMail = blame[offset + 6];
    let commiterTime = blame[offset + 7];
    let commiterTz = blame[offset + 8];
    let summary = blame[offset + 9];
    let boundary = blame[offset + 10];
    let fileName = blame[offset + 11];
    let line = blame[offset + 12];
    totalBlames[i].info = {
      author,
      authorMail,
      authorTime,
      authorTz,
      commiter,
      commiterMail,
      commiterTime,
      commiterTz,
      summary,
      boundary,
      fileName,
      line,
    };
    //   }
    // might be 14 lines
    // }
  }
  return totalBlames;
};
