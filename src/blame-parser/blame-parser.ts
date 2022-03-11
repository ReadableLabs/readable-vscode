import IParsedBlame from "./types/IParsedBlame";

export const parseBlame = (blame: string[]): IParsedBlame[] => {
  let totalLines = blame.length / 13; // 52, so 4 times
  let totalBlames: IParsedBlame[] = [];
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
    let blameLine = {
      commit: commitId,
      originalLine: originalLine,
      finalLine: finalLine,
      commitLine: lineGroup,
    };
    // just push to the blame instead of this shit or make an IParsedBlame object and push that
    let author = getStringValue(blame[offset + 1]);
    let authorMail = getStringValue(blame[offset + 2]);
    let authorTime = getStringValue(blame[offset + 3]);
    let authorTz = getStringValue(blame[offset + 4]);
    let commiter = getStringValue(blame[offset + 5]);
    let commiterMail = getStringValue(blame[offset + 6]);
    let commiterTime = getIntValue(blame[offset + 7]);
    let commiterTz = getStringValue(blame[offset + 8]);
    let summary = getStringValue(blame[offset + 9]);
    let boundary = getStringValue(blame[offset + 10]);
    let fileName = getStringValue(blame[offset + 11]);
    let line = getStringValue(blame[offset + 12]);
    let blameInfo = {
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
    totalBlames.push({
      info: blameInfo,
      line: blameLine,
    });
    //   }
    // might be 14 lines
    // }
  }
  return totalBlames;
};

const getStringValue = (line: string): string | undefined => {
  let splitLine = line.split(" ");
  if (splitLine.length < 2) {
    return;
  }
  return splitLine[1];
};

const getIntValue = (line: string) => {
  let value = getStringValue(line);
  if (!value) {
    return;
  }
  return parseInt(value);
};

const getDateValue = (line: string) => {
  let value = getStringValue(line);
  if (!value) {
    return;
  }

  return Date.parse(value);
};
