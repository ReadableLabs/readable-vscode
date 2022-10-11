export function getTitle(title?: string, level?: string) {
  console.log(level);
  if (title) {
    return title;
  }

  if (level === "error") return "Error";

  return "Unnamed";
}
