import * as child_process from "child_process";

export const sync = (folderName: string) => {
  return new Promise<void>((resolve, reject) => {
    child_process.exec(
      `comment_sync -d ${folderName} -s`,
      (error, stdout, stderr) => {
        if (!error) {
          resolve();
          return;
        }
        reject();
        return;
      }
    );
  });
};

const parseBlame = (blame: string) => {
  let blameSplit = blame.split("\n");
  blameSplit.pop();
  let lines: { [id: number]: number } = {};
  for (let line of blameSplit) {
    let split = line.split(":");
    let number = parseInt(split[0]);
    let time = parseInt(split[1]);
    lines[number] = time;
  }
  return lines;
};

export const blame = (folderName: string, fileName: string) => {
  return new Promise<{ [id: number]: number }>((resolve, reject) => {
    child_process.exec(
      `comment_sync -d ${folderName} -b ${fileName}`,
      (error, stdout, stderr) => {
        if (stdout) {
          resolve(parseBlame(stdout));
          return;
        }
        reject();
        return;
      }
    );
  });
};
