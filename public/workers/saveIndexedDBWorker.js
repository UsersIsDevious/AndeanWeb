// workers/saveIndexedDBWorker.js
//console.log("saveIndexedDBWorker.js");

// DB 接続のキャッシュ用変数
let cachedDB = null;

// IndexedDB の初期化関数
function openDB() {
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

// DB 接続をキャッシュするための関数
function getDB() {
  if (cachedDB) return Promise.resolve(cachedDB);
  return openDB().then(db => {
    cachedDB = db;
    //console.log("DBの用意完了");
    return db;
  });
}

// 保存処理用のヘルパー関数
async function saveData(storeName, data) {
  //console.log(`${storeName} にデータをセーブします`);
  //console.log(data)
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

// チャンク保存用の共通関数
async function saveChunk(storeName, items) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    items.forEach(item => {
      store.put(item);
    });
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

// Worker のメッセージ受信処理
self.onmessage = async function (e) {
  //console.log("受信:", e.data, typeof e.data);
  const data = e.data;
  try {
    switch (data.type) {
      case "saveMatchMeta":
        console.log(`saveMatchMeta : ${data.matchMeta}`);
        const matchMeta = { ...data.matchMeta, matchId: data.matchMeta.matchName }
        await saveData("matchMeta", matchMeta);
        //console.log("saveMatchMeta : セーブ完了");
        self.postMessage({ type: "saveSuccess", store: "matchMeta", id: matchMeta });
        break;
      case "saveFrame":
        //console.log(`saveFrame : ${data}`);
        await saveData("frames", data.frame);
        //console.log("saveFrame : セーブ完了");
        self.postMessage({ type: "saveSuccess", store: "frames", id: data.frame.id });
        break;
      case "saveFrameChunk":
        {
          if (Array.isArray(data.frames)) {
            await saveChunk("frames", data.frames);
            self.postMessage({ type: "saveSuccess", store: "frames", id: "chunk" });
          } else {
            self.postMessage({ type: "saveError", error: "saveFrameChunk: frames is not an array" });
          }
        }
        break;
      case "saveEvent":
        //console.log(`saveEvent : ${data}`);
        await saveData("events", data.event);
        //console.log("saveEvent : セーブ完了");
        self.postMessage({ type: "saveSuccess", store: "events", id: data.id || null });
        break;
      case "saveEventChunk":
        {
          if (Array.isArray(data.events)) {
            await saveChunk("events", data.events);
            self.postMessage({ type: "saveSuccess", store: "events", id: "chunk" });
          } else {
            self.postMessage({ type: "saveError", error: "saveEventChunk: events is not an array" });
          }
        }
        break;
      case "saveTrail":
        console.log(`saveTrail : ${JSON.stringify(data)}`);
        await saveData("trails", data.trail);
        console.log("saveTrail : セーブ完了");
        self.postMessage({ type: "saveSuccess", store: "trails", id: data.trail.id });
        break;
      case "saveTrailChunk":
        {
          if (Array.isArray(data.trails)) {
            await saveChunk("trails", data.trails);
            self.postMessage({ type: "saveSuccess", store: "trails", id: "chunk" });
          } else {
            self.postMessage({ type: "saveError", error: "saveTrailChunk: trails is not an array" });
          }
        }
        break;
      default:
        self.postMessage({ type: "saveError", error: "Unknown save type: " + data.type });
        break;
    }

  } catch (error) {
    self.postMessage({ type: "saveError", error: error.message, store: data.type });
  }
};
