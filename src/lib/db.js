// db.js

// IndexedDB の初期化関数
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AndeanWeb", 1);
    request.onupgradeneeded = function (e) {
      const db = e.target.result;
      // matchMeta の作成
      if (!db.objectStoreNames.contains("matchMeta")) {
        db.createObjectStore("matchMeta", { keyPath: "matchId" });
      }
      // frames の作成
      if (!db.objectStoreNames.contains("frames")) {
        const store = db.createObjectStore("frames", { keyPath: "id" });
        store.createIndex("matchId", "matchId", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
      // events の作成
      if (!db.objectStoreNames.contains("events")) {
        const store = db.createObjectStore("events", { keyPath: "id", autoIncrement: true });
        store.createIndex("matchId", "matchId", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
      // trails の作成
      if (!db.objectStoreNames.contains("trails")) {
        const store = db.createObjectStore("trails", { keyPath: "id" });
        store.createIndex("matchId", "matchId", { unique: false });
      }
      // teamStatus の作成（必要に応じて）
      if (!db.objectStoreNames.contains("teamStatus")) {
        const store = db.createObjectStore("teamStatus", { keyPath: "id" });
        store.createIndex("matchId", "matchId", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
    request.onsuccess = function (e) {
      resolve(e.target.result);
    };
    request.onerror = function (e) {
      reject(e.target.error);
    };
  });
}
  
// マッチ一覧を取得する関数
export function fetchMatchMetaList() {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const transaction = db.transaction("matchMeta", "readonly");
      const store = transaction.objectStore("matchMeta");
      const request = store.getAll();
      request.onsuccess = function (e) {
        resolve(e.target.result);
      };
      request.onerror = function (e) {
        reject(e.target.error);
      };
    }).catch(reject);
  });
}
  
// 選択されたマッチのフレームを時系列順に取得する関数
export function fetchFramesForMatch(matchId) {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const transaction = db.transaction("frames", "readonly");
      const store = transaction.objectStore("frames");
      const index = store.index("matchId");
      const request = index.getAll(IDBKeyRange.only(matchId));
      request.onsuccess = function (e) {
        let frames = e.target.result;
        // timestamp 順にソート
        frames.sort((a, b) => a.timestamp - b.timestamp);
        resolve(frames);
      };
      request.onerror = function (e) {
        reject(e.target.error);
      };
    }).catch(reject);
  });
}
  
// 選択されたマッチのイベントを時系列順に取得する関数
export function fetchEventsForMatch(matchId) {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const transaction = db.transaction("events", "readonly");
      const store = transaction.objectStore("events");
      const index = store.index("matchId");
      const request = index.getAll(IDBKeyRange.only(matchId));
      request.onsuccess = function (e) {
        let events = e.target.result;
        events.sort((a, b) => a.timestamp - b.timestamp);
        resolve(events);
      };
      request.onerror = function (e) {
        reject(e.target.error);
      };
    }).catch(reject);
  });
}
  
// 選択されたマッチのトレイルデータを取得する関数
export function fetchTrailsForMatch(matchId) {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const transaction = db.transaction("trails", "readonly");
      const store = transaction.objectStore("trails");
      const index = store.index("matchId");
      const request = index.getAll(IDBKeyRange.only(matchId));
      request.onsuccess = function (e) {
        resolve(e.target.result);
      };
      request.onerror = function (e) {
        reject(e.target.error);
      };
    }).catch(reject);
  });
}
  
// チャンクでフレームデータを取得する関数
export function fetchFramesChunk(matchId, offset = 0, chunkSize = 50) {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const transaction = db.transaction("frames", "readonly");
      const store = transaction.objectStore("frames");
      const index = store.index("matchId");
      const request = index.openCursor(IDBKeyRange.only(matchId));
      const frames = [];
      let skipped = 0;
      request.onsuccess = function (e) {
        const cursor = e.target.result;
        if (cursor) {
          if (skipped < offset) {
            skipped++;
            cursor.continue();
          } else if (frames.length < chunkSize) {
            frames.push(cursor.value);
            cursor.continue();
          } else {
            resolve(frames);
            return;
          }
        } else {
          resolve(frames);
        }
      };
      request.onerror = function (e) {
        reject(e.target.error);
      };
    }).catch(reject);
  });
}
  
// 指定した matchId のフレーム総件数を取得する関数
export function fetchFrameCountForMatch(matchId) {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const transaction = db.transaction("frames", "readonly");
      const store = transaction.objectStore("frames");
      const index = store.index("matchId");
      const countRequest = index.count(IDBKeyRange.only(matchId));
      countRequest.onsuccess = (event) => {
        resolve(event.target.result);
      };
      countRequest.onerror = (event) => {
        reject(event.target.error);
      };
    }).catch(reject);
  });
}
  
// 指定した matchId のフレームをオフセット＋チャンクサイズ分取得する関数
export function fetchFramesForMatchRange(matchId, offset = 0, chunkSize = 10) {
  return new Promise((resolve, reject) => {
    openDB().then((db) => {
      const transaction = db.transaction("frames", "readonly");
      const store = transaction.objectStore("frames");
      const index = store.index("matchId");
      const request = index.openCursor(IDBKeyRange.only(matchId));
      const frames = [];
      let skipped = 0;
      request.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
          if (skipped < offset) {
            skipped++;
            cursor.continue();
          } else if (frames.length < chunkSize) {
            frames.push(cursor.value);
            cursor.continue();
          } else {
            resolve(frames);
            return;
          }
        } else {
          resolve(frames);
        }
      };
      request.onerror = function (event) {
        reject(event.target.error);
      };
    }).catch(reject);
  });
}
  
// ここから、マッチデータ削除の関数を追加
/**
 * 選択されたマッチに関連するデータ（matchMeta, frames, events, trails）を全て削除する
 * @param {object} matchMeta - 削除対象のマッチデータ。matchMeta.matchId、frameKeys、eventKeys、trailKeys を含む
 * @returns {Promise<void>}
 */
// deleteMatchMeta: 選択されたマッチに関連するデータ（matchMeta, frames, events, trails）を全て削除する
export function deleteMatchMeta(matchMeta) {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        // matchMeta, frames, events, trails の4つのストアに対する readwrite トランザクションを作成
        const tx = db.transaction(
          ["matchMeta", "frames", "events", "trails"],
          "readwrite"
        );
        const matchMetaStore = tx.objectStore("matchMeta");
        const framesStore = tx.objectStore("frames");
        const eventsStore = tx.objectStore("events");
        const trailsStore = tx.objectStore("trails");

        // ① matchMeta 自体を削除
        const reqMeta = matchMetaStore.delete(matchMeta.matchId);
        reqMeta.onerror = (e) => {
          console.error("Error deleting matchMeta:", e.target.error);
          reject(e.target.error);
        };

        // ② frames の削除：matchMeta.frameKeys に入っているキーで削除
        if (matchMeta.frameKeys && Array.isArray(matchMeta.frameKeys)) {
          matchMeta.frameKeys.forEach((key) => {
            if (key !== undefined && key !== null) {
              framesStore.delete(key);
            } else {
              console.warn("Undefined/null key in frameKeys:", key);
            }
          });
        }

        // ③ events の削除：matchMeta.eventKeys に入っているキーで削除
        if (matchMeta.eventKeys && Array.isArray(matchMeta.eventKeys)) {
          matchMeta.eventKeys.forEach((key) => {
            if (key !== undefined && key !== null) {
              eventsStore.delete(key);
            } else {
              console.warn("Undefined/null key in eventKeys:", key);
            }
          });
        }

        // ④ trails の削除：matchMeta.trailKeys に入っているキーで削除
        if (matchMeta.trailKeys && Array.isArray(matchMeta.trailKeys)) {
          matchMeta.trailKeys.forEach((key) => {
            if (key !== undefined && key !== null) {
              trailsStore.delete(key);
            } else {
              console.warn("Undefined/null key in trailKeys:", key);
            }
          });
        }

        tx.oncomplete = () => {
          console.log("全ての関連データが削除されました");
          resolve();
        };

        tx.onerror = (e) => {
          console.error("トランザクションエラー:", e.target.error);
          reject(e.target.error);
        };
      })
      .catch(reject);
  });
}
