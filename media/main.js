// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const vscode = acquireVsCodeApi();

  console.log("Hello there from javascript");
  // alert("hello");

  document.getElementById("myButton").addEventListener("click", () => {
    console.log("helo");
  });
})();
