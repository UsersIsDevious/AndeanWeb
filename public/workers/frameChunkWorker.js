console.log("frameChunkWorker.js が読み込まれました");

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AndeanWeb", 1);
    request.onupgradeneeded = function (e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("frames")) {
        const store = db.createObjectStore("frames", { keyPath: "id" });
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

async function fetchFramesChunk(matchId, offset = 0, chunkSize = 10, frameKeys = null) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    if (Array.isArray(frameKeys)) {
      // 指定された frameKeys 配列から該当するキーでフレームを取得
      const keysToFetch = frameKeys.slice(offset, offset + chunkSize);
      const transaction = db.transaction("frames", "readonly");
      const store = transaction.objectStore("frames");
      let remaining = keysToFetch.length;
      const frames = [];
      keysToFetch.forEach((key, i) => {
        const req = store.get(key);
        req.onsuccess = (e) => {
          frames[i] = e.target.result; // インデックス順を保持
          remaining--;
          if (remaining === 0) {
            resolve(frames);
          }
        };
        req.onerror = (e) => {
          reject(e.target.error);
        };
      });
    } else {
      // frameKeys が無い場合は従来の方法
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
    }
  });
}

self.onmessage = async function (e) {
  const { matchId, offset, chunkSize, frameKeys } = e.data;
  try {
    const frames = await fetchFramesChunk(matchId, offset, chunkSize, frameKeys);
    self.postMessage({ type: "frameChunk", frames });
  } catch (error) {
    self.postMessage({ type: "frameChunkError", error: String(error.message) });
  }
};

