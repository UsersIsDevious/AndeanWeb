// eventFetcherWorker.js
console.log("eventFetcherWorker.js が読み込まれました");

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AndeanWeb", 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("events")) {
        const store = db.createObjectStore("events", { keyPath: "id" });
        store.createIndex("matchId", "matchId", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function fetchEvents(matchId, eventType, keys) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("events", "readonly");
    const store = transaction.objectStore("events");
    const events = [];
    let remaining = keys.length;
    if (remaining === 0) {
      resolve([]);
      return;
    }
    keys.forEach((key) => {
      const request = store.get(key);
      request.onsuccess = (e) => {
        const eventData = e.target.result;
        // イベントオブジェクトが見つかり、かつ type が一致するかチェック
        if (eventData && eventData.type === eventType) {
          events.push(eventData);
        }
        remaining--;
        if (remaining === 0) {
          resolve(events);
        }
      };
      request.onerror = (e) => {
        remaining--;
        if (remaining === 0) {
          resolve(events);
        }
      };
    });
  });
}

self.onmessage = async function(e) {
  const data = e.data;
  const { matchId, eventType, keys } = data;
  try {
    const events = await fetchEvents(matchId, eventType, keys);
    console.log(`${eventType} イベント取得完了:`, events);
    self.postMessage({ type: "eventFetchSuccess", events });
  } catch (error) {
    self.postMessage({ type: "eventFetchError", error: error.message });
  }
};
