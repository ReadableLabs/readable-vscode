export function getTitle(title?: string, message?: string, level?: string) {
  if (title) {
    return title;
  }

  if (message) {
    let split = message.split("\n");
    if (split.length > 0) {
      return split[0];
    }
  }

  if (level === "error") return "Error";

  return "Unnamed";
}
