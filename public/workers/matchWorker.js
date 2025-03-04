// workers/matchWorker.js
console.log("matchWorker.js")

self.onmessage = function (event) {
  console.log("マッチ基本データの処理の開始");
  // 必要なキー一覧
  const metaKeys = [
    "matchName",
    "startTimeStamp",
    "endTimeStamp",
    "players",
    "teams",
    "maxPlayers",
    "mapName",
    "playlistName",
    "playlistDesc",
    "datacenter",
    "aimassiston",
    "anonymousMode",
    "serverId",
    "startingLoadout"
  ];

  let jsonData;
  try {
    jsonData = event.data;
  } catch (error) {
    //console.log(error)
    // エラー発生時はオブジェクトではなく文字列で返す
    self.postMessage("matchWorker: JSON のパースに失敗しました - " + error.message);
    return;
  }

  // 受信データがオブジェクトであるかチェック
  if (!jsonData || typeof jsonData !== 'object') {
    self.postMessage("matchWorker: 受信したデータがオブジェクトではありません");
    return;
  }

  // 必須項目 matchName があるかチェック
  if (!jsonData.matchName) {
    self.postMessage("matchWorker: matchName が存在しません");
    return;
  }
  //console.log("データの処理終了");
  // metaKeys に基づいて matchData オブジェクトを生成
  const matchData = metaKeys.reduce((acc, key) => {
    acc[key] = jsonData[key] !== undefined ? jsonData[key] : null;
    return acc;
  }, {});

  // マッチメタとしての識別用 type を追加
  matchData.type = "matchMeta";

  //console.log("matchWorker: matchData の生成完了", matchData);

  // 生成した matchData をメインスレッドへ返す
  self.postMessage(matchData);
};

self.onerror = function(e) {
  console.error("matchWorker error:", e.message);
  // エラー情報をメインスレッドに送信（必要なら）
  self.postMessage({ error: String(e.message) });
};