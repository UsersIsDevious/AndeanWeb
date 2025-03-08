"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export default function PlaybackControls({
  totalFrames,
  stepInterval = 1,
  onFrameChange,
  onRequestEvents
}) {
  const [value, setValue] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showEventIcons, setShowEventIcons] = useState(true);
  const [requestedEvents, setRequestedEvents] = useState([]);
  const timerRef = useRef(null);
  const lastUpdatedFrameRef = useRef(0);
  const FPS_INTERVAL = 1000 / 60;

  useEffect(() => {
    console.log("PlaybackControls mounted. totalFrames:", totalFrames);
  }, [totalFrames]);

  // シークバーの変更処理（デバウンス付き）
  useEffect(() => {
    if (Math.abs(value - lastUpdatedFrameRef.current) >= 100) {
      onFrameChange(value);
      lastUpdatedFrameRef.current = value;
    }
    const handler = setTimeout(() => {
      if (value !== lastUpdatedFrameRef.current) {
        onFrameChange(value);
        lastUpdatedFrameRef.current = value;
      }
    }, 200);
    return () => clearTimeout(handler);
  }, [value, onFrameChange]);

  // 60FPSの自動再生処理
  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setValue((prev) => {
          const newVal = prev + 1;
          if (newVal >= totalFrames) {
            clearInterval(timerRef.current);
            setPlaying(false);
            return totalFrames - 1;
          }
          onFrameChange(newVal);
          lastUpdatedFrameRef.current = newVal;
          return newVal;
        });
      }, FPS_INTERVAL);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, totalFrames, onFrameChange]);

  // ユーザーがイベント表示を切り替えたときの処理
  const toggleEventDisplay = () => {
    const newVal = !showEventIcons;
    setShowEventIcons(newVal);
    // ここで特定イベントのみをリクエスト（例："ringStartClosing"）
    if (newVal) {
      onRequestEvents(["ringStartClosing"]);
    } else {
      setRequestedEvents([]);
    }
  };

  return (
    <div className="w-full p-4 flex flex-col items-center">
      <input
        type="range"
        min={0}
        max={totalFrames - 1}
        step={1}
        value={value}
        onChange={(e) => {
          const newValue = Number(e.target.value);
          setValue(newValue);
        }}
        className="w-full"
      />
      <div className="mt-2 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setPlaying((prev) => !prev)}>
          {playing ? "停止" : "再生"}
        </Button>
        <Button variant="outline" size="sm" onClick={toggleEventDisplay}>
          {showEventIcons ? "イベント非表示" : "イベント表示"}
        </Button>
      </div>
      <div className="mt-2 text-center text-sm">
        現在のフレーム: {value + 1} / {totalFrames}
      </div>
      {/* イベントアイコン表示エリア（例：シークバー上にオーバーレイ表示） */}
      {showEventIcons && requestedEvents.length > 0 && (
        <div style={{
          position: "relative",
          width: "100%",
          height: "30px",
          marginTop: "10px",
          backgroundColor: "rgba(0,0,0,0.1)"
        }}>
          {requestedEvents.map((evt, idx) => {
            // evt には frameIndex（またはタイムスタンプ）情報が含まれると仮定
            // シークバーの幅に対して位置を計算（ここでは簡易的に）
            const leftPercent = (evt.frameIndex / totalFrames) * 100;
            return (
              <img 
                key={idx}
                src="/AndeanWeb/img/ringIcon.png" // 表示するアイコンのパス
                alt="リング収縮開始"
                style={{
                  position: "absolute",
                  left: `${leftPercent}%`,
                  transform: "translateX(-50%)",
                  height: "24px",
                  filter: `drop-shadow(0 0 2px rgb(${getMarkerColor(evt.teamId).join(',')}))`
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
