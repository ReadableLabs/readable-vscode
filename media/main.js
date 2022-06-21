//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  let comments = ["hello", "hello", "trash"];
  const ul = document.querySelector(".resync-list");
  for (const comment in comments) {
    // const li = document.createElement("li");
    // li.className = "file";

    // const filePreview = document.createElement("div");
    // filePreview.className = "file-preview";
    // filePreview.style.backgroundColor = "#ff0000";
    // li.appendChild(filePreview);

    // const text = document.createElement("h1");
    // text.innerText = comments[comment];
    // filePreview.appendChild(text);

    // ul?.appendChild(li);
    const item = `<li class="resync-item">
    <h4>${comments[comment]}</h4>
    <vscode-badge>1</vscode-badge>
    </li>`;
    ul?.insertAdjacentHTML("beforeend", item);
  }
})();
