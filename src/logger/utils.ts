export function getTitle(
  title?: string,
  message?: string,
  level?: string,
  extraInfo?: any
) {
  if (title) {
    return title;
  }

  // if (level === "error") {
  //   // there's got to be a better way of doing this
  //   if (extraInfo) {
  //     if (extraInfo.error) {
  //       if (extraInfo.error.name) {
  //         return extraInfo.error.name;
  //       }
  //     }
  //   }

  //   if (message) {
  //     let split = message.split("\n");
  //     if (split.length > 0) {
  //       return split[0];
  //     }
  //   }

  //   return "Error";
  // }

  if (message) {
    let split = message.split("\n");
    if (split.length > 0) {
      return split[0];
    }
  }

  if (level === "error") {
    return "Unnamed Error";
  }

  return "Unnamed";
}
