"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export default function PlaybackControls({
  totalFrames,
  stepInterval = 1,
  onFrameChange,
  onPlayPause
}) {
  const [value, setValue] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);
  const lastUpdatedFrameRef = useRef(0);
  // 60FPSの場合は約16ms間隔
  const FPS_INTERVAL = 1000 / 60;

  useEffect(() => {
    console.log("PlaybackControls mounted. totalFrames:", totalFrames);
  }, [totalFrames]);

  // シークバーの値変更時：100フレーム以上の変化があれば即時更新、また200ms後に最終値を更新
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

  // 再生状態に応じた自動再生処理（60FPS）
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

  // 再生／停止ボタンのトグル
  const togglePlayPause = () => {
    setPlaying((prev) => {
      const newPlaying = !prev;
      if (onPlayPause) {
        onPlayPause(newPlaying);
      }
      return newPlaying;
    });
  };

  return (
    <div className="w-full p-4 flex flex-col items-center">
      <input
        type="range"
        min={0}
        max={totalFrames - 1}
        step={stepInterval}
        value={value}
        onChange={(e) => {
          const newValue = Number(e.target.value);
          setValue(newValue);
        }}
        className="w-full"
      />
      <div className="mt-2">
        <Button variant="outline" size="sm" onClick={togglePlayPause}>
          {playing ? "停止" : "再生"}
        </Button>
      </div>
      <div className="mt-2 text-center text-sm">
        現在のフレーム: {value + 1} / {totalFrames}
      </div>
    </div>
  );
}
