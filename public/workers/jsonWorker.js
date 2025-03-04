// workers/jsonWorker.js
console.log("jsonWorker.js")

self.onmessage = function(event) {
  const fileData = event.data;
  // 結果を JSON 文字列に変換してメインスレッドへ送信
  self.postMessage(JSON.stringify(fileData));
};
