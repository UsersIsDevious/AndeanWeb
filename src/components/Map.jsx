// Map.jsx
"use client";
import { useState, useEffect } from "react";
import MapDisplay from "./MapDisplay";
import DetailView from "./DetailView";
import PlaybackSlider from "./PlaybackSlider";

/**
 * 指定のイベント種類に対するキー一覧から、イベントを非同期取得する
 */
function fetchEventsForType(matchMeta, eventType) {
  return new Promise((resolve, reject) => {
    // ここでは eventFetcherWorker.js を利用する前提
    const worker = new Worker("/AndeanWeb/workers/eventFetcherWorker.js");
    worker.onmessage = (e) => {
      const data = e.data;
      if (data.type === "eventFetchSuccess") {
        resolve(data.events);
      } else if (data.type === "eventFetchError") {
        reject(new Error(data.error));
      }
      worker.terminate();
    };
    // matchMeta.eventKeys はオブジェクト: { "ringStartClosing": [key1, key2, ...], ... }
    const keys = (matchMeta.eventKeys && matchMeta.eventKeys[eventType]) || [];
    worker.postMessage({ matchId: matchMeta.matchName, eventType, keys });
  });
}

export default function LeafletMap({ matchMeta, onEventsFetched }) {
  const [currentFrame, setCurrentFrame] = useState(null);
  const [fetchedEvents, setFetchedEvents] = useState([]); // 取得したイベント群
  const totalFrameCount =
    (matchMeta.frameKeys && matchMeta.frameKeys.length) ||
    matchMeta.totalFrames ||
    0;

  /**
   * PlaybackSlider から渡されたフレーム番号（0始まり）に対応するフレームキーを算出
   */
  function computeFrameKey(matchMeta, frameNumber) {
    if (matchMeta.frameKeys && Array.isArray(matchMeta.frameKeys)) {
      return matchMeta.frameKeys[frameNumber];
    }
    return `${matchMeta.matchName}_${frameNumber + 1}`;
  }

  /**
   * 指定のフレームキーのフレームをDBから取得する関数
   */
  function fetchFrameFromDB(matchMeta, frameKey) {
    return new Promise((resolve, reject) => {
      const worker = new Worker("/AndeanWeb/workers/frameChunkWorker.js");
      worker.onmessage = (e) => {
        const data = e.data;
        if (data.type === "frameChunk") {
          if (data.frames && data.frames.length > 0) {
            resolve(data.frames[0]);
          } else {
            reject(new Error("該当フレームが見つかりません"));
          }
          worker.terminate();
        } else if (data.type === "frameChunkError") {
          reject(new Error(data.error));
          worker.terminate();
        }
      };
      worker.postMessage({
        matchId: matchMeta.matchName,
        offset: 0,
        chunkSize: 1,
        frameKeys: [frameKey]
      });
    });
  }

  /**
   * PlaybackSlider のフレーム変更時のハンドラー
   */
  const handleFrameChange = async (frameNumber) => {
    try {
      const key = computeFrameKey(matchMeta, frameNumber);
      const frame = await fetchFrameFromDB(matchMeta, key);
      console.log("取得したフレーム key:", key, frame);
      setCurrentFrame(frame);
    } catch (error) {
      console.error("フレーム取得エラー:", error);
    }
  };

  // コンポーネント読み込み時に1フレーム目を取得
  useEffect(() => {
    if (matchMeta) {
      handleFrameChange(0);
    }
  }, [matchMeta]);

  // ここで特定イベント（例：ringStartClosing）のデータ取得リクエストを受ける
  // たとえば、PlaybackControls から onRequestEvents イベントでリクエストが来たとする
  async function requestEvents(eventTypes) {
    // eventTypes は配列（例：["ringStartClosing"]）
    let allEvents = [];
    for (const type of eventTypes) {
      try {
        const events = await fetchEventsForType(matchMeta, type);
        console.log("matchMeta.eventKeys:", matchMeta.eventKeys);
        console.log("ringStartClosing keys:", matchMeta.eventKeys && matchMeta.eventKeys["ringStartClosing"]);
        console.log(`${type} イベント取得:`, events);
        allEvents = allEvents.concat(events);
      } catch (error) {
        console.error(`${type} イベント取得エラー:`, error);
      }
    }
    setFetchedEvents(allEvents);
    // コールバックで返す場合：
    if (onEventsFetched) {
      onEventsFetched(allEvents);
    }
  }

  return (
    <div className="flex flex-col h-screen relative">
      <div className="flex flex-1">
        <div className="w-4/5 h-full">
          <MapDisplay matchMeta={matchMeta} currentFrame={currentFrame} events={fetchedEvents} />
        </div>
        <div className="w-1/5 h-full bg-gray-100 p-4 overflow-y-auto">
          <DetailView matchMeta={matchMeta} currentFrame={currentFrame} />
        </div>
      </div>
      <div className="w-full">
        <PlaybackSlider
          totalFrames={totalFrameCount}
          stepInterval={1}
          onFrameChange={handleFrameChange}
          onRequestEvents={(eventTypes) => requestEvents(eventTypes)}
        />
      </div>
    </div>
  );
}
