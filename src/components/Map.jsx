"use client";
import { useState, useEffect } from "react";
import MapDisplay from "./MapDisplay";
import DetailView from "./DetailView";
import PlaybackSlider from "./PlaybackSlider";

/**
 * 指定のフレーム番号（0始まり）に対応するフレームキーを算出する。
 * matchMeta.frameKeys がある場合はその配列から取得し、
 * なければ matchMeta.matchId + "_" + (frameNumber+1) で算出する。
 */
function computeFrameKey(matchMeta, frameNumber) {
  if (matchMeta.frameKeys && Array.isArray(matchMeta.frameKeys)) {
    return matchMeta.frameKeys[frameNumber];
  }
  return `${matchMeta.matchId}_${frameNumber + 1}`;
}

/**
 * 指定のフレームキーに対応するフレームを IndexedDB から取得する。
 * ワーカー (frameChunkWorker.js) を利用し、chunkSize:1 で取得する。
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
      matchId: matchMeta.matchId,
      offset: 0,
      chunkSize: 1,
      frameKeys: [frameKey]
    });
  });
}

export default function LeafletMap({ matchMeta }) {
  const [currentFrame, setCurrentFrame] = useState(null);
  const totalFrameCount =
    (matchMeta.frameKeys && matchMeta.frameKeys.length) || matchMeta.totalFrames || 0;

  /**
   * PlaybackSlider から渡されたフレーム番号（0始まり）を受け取り、
   * 該当するフレームキーを算出後、DBからそのフレームを取得して currentFrame を更新する。
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

  // コンポーネント読み込み時に1フレーム目を1回だけ取得する
  useEffect(() => {
    if (matchMeta) {
      handleFrameChange(0);
    }
  }, [matchMeta]);

  return (
    <div className="flex flex-col h-screen relative">
      <div className="flex flex-1">
        <div className="w-4/5 h-full">
          <MapDisplay matchMeta={matchMeta} currentFrame={currentFrame} />
        </div>
        <div className="w-1/5 h-full bg-gray-100 p-4 overflow-y-auto">
          <DetailView matchMeta={matchMeta} currentFrame={currentFrame}/>
        </div>
      </div>
      <div className="w-full">
        <PlaybackSlider
          totalFrames={totalFrameCount}
          stepInterval={1}
          onFrameChange={handleFrameChange}
        />
      </div>
    </div>
  );
}
