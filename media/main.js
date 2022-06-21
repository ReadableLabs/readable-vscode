//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  // @ts-ignore
  console.log("I'm working");
  // @ts-ignore
  const vscode = acquireVsCodeApi();
  console.log(vscode);
  let comments = [
    {
      id: 1,
      fileName: "index.ts",
      unsyncedComments: 15,
    },
    {
      id: 2,
      fileName: "main.rs",
      unsyncedComments: 4,
    },
    {
      id: 3,
      fileName: "CodeEditor.ts",
      unsyncedComments: 7,
    },
  ];

  const ul = document.querySelector(".resync-list");
  let active = null;

  function removeHighlight(item, index) {
    if (item.id.toString() !== active) {
      let thing = document.getElementById(item.id.toString());
      thing?.classList.remove("highlight");
    }
  }
  function updateActive(id) {
    let thing = document.getElementById(id);
    thing?.classList.add("highlight");
    comments.forEach(removeHighlight);
  }
  for (const comment in comments) {
    const item = `<li class="resync-item" id="${comments[comment].id}">
    <h4>${comments[comment].fileName}</h4>
    <vscode-badge>${comments[comment].unsyncedComments}</vscode-badge>
    </li>`;
    window.addEventListener("load", main);
    function main() {
      let thing = document.getElementById(comments[comment].id.toString());
      thing?.addEventListener("click", handleClick);
    }
    function handleClick() {
      active = comments[comment].id.toString();
      updateActive(active);
      vscode.postMessage({
        command: "select",
        text: "hey tehre",
      });
    }
    ul?.insertAdjacentHTML("beforeend", item);
  }
})();
