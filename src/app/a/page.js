"use client";

import React, { useState, useEffect } from "react";
import { DeckGL } from "@deck.gl/react";
import { OrthographicView } from "@deck.gl/core";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";

// 初期ビュー設定（背景画像の中央付近を target に）
const INITIAL_VIEW_STATE = {
  target: [2048, 2048, 0],
  zoom: 0,
};

export default function MapPage() {
  // マーカー情報は position と playerId のみ保持する
  const [markers, setMarkers] = useState([]);
  // 吹き出し表示のグローバルオン/オフ
  const [showLabels, setShowLabels] = useState(false);
  // 各ステータス項目（HP, MP, EXP）の表示オン/オフ状態
  const [statusToggles, setStatusToggles] = useState({
    HP: true,
    MP: true,
    EXP: true,
  });

  // ローカル変数：playerId をキーとしてプレーヤーのステータス情報を管理
  const playerStatus = {
    Player1: { HP: 100, MP: 50, EXP: 1200 },
    Player2: { HP: 80, MP: 70, EXP: 900 },
    Player3: { HP: 120, MP: 60, EXP: 1500 },
    Player4: { HP: 95, MP: 40, EXP: 1100 },
    Player5: { HP: 75, MP: 80, EXP: 800 },
  };

  useEffect(() => {
    // サンプルのマーカー情報（位置とプレーヤーIDのみ）
    const sampleMarkers = [
      { position: [0, 0], playerId: "Player1" },
      { position: [100, 100], playerId: "Player2" },
      { position: [500, 300], playerId: "Player3" },
      { position: [800, 600], playerId: "Player4" },
      { position: [1200, 900], playerId: "Player5" },
    ];
    setMarkers(sampleMarkers);
  }, []);

  // ScatterplotLayer によるマーカー描画
  const markerLayer = new ScatterplotLayer({
    id: "marker-layer",
    data: markers,
    getPosition: (d) => d.position,
    getFillColor: [0, 128, 255, 255],
    radius: 10,
    radiusMinPixels: 5,
    pickable: true,
  });

  // TextLayer で吹き出し表示（マーカー上にプレーヤーIDと、トグルでオンのステータス項目を表示）
  const textLayer = new TextLayer({
    id: "text-layer",
    data: markers,
    getPosition: (d) => d.position,
    getText: (d) => {
      // プレーヤーIDをもとにステータスを取得
      const status = playerStatus[d.playerId];
      // 吹き出しのテキストは、まずプレーヤーID、その後改行して各ステータス項目を表示
      let text = d.playerId;
      if (status) {
        Object.keys(statusToggles).forEach((key) => {
          if (statusToggles[key]) {
            text += `\n${key}: ${status[key]}`;
          }
        });
      }
      return text;
    },
    getSize: 16,
    getColor: [0, 0, 0, 255],
    // マーカー上に表示するために上方向にオフセット（ピクセル単位）
    getPixelOffset: [0, -20],
  });

  // layers 配列には常にマーカー（ScatterplotLayer）を含み、
  // 吹き出し表示（TextLayer）は showLabels がオンのときのみ追加
  const layers = [markerLayer, ...(showLabels ? [textLayer] : [])];

  // 各ステータス項目のトグルを操作するためのハンドラ
  const handleToggle = (key) => {
    setStatusToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div style={{ position: "relative" }}>
      {/* マップ外のトグルスイッチUI */}
      <div
        style={{
          position: "absolute",
          zIndex: 1,
          top: 10,
          left: 10,
          background: "white",
          padding: "10px",
          borderRadius: "4px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      >
        <div>
          <label>
            <input
              type="checkbox"
              checked={showLabels}
              onChange={() => setShowLabels(!showLabels)}
            />
            &nbsp;吹き出し表示
          </label>
        </div>
        <div style={{ marginTop: "10px" }}>
          <strong>ステータス表示</strong>
          <div>
            <label>
              <input
                type="checkbox"
                checked={statusToggles.HP}
                onChange={() => handleToggle("HP")}
              />
              HP
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={statusToggles.MP}
                onChange={() => handleToggle("MP")}
              />
              MP
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={statusToggles.EXP}
                onChange={() => handleToggle("EXP")}
              />
              EXP
            </label>
          </div>
        </div>
      </div>

      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        views={new OrthographicView()}
        layers={layers}
        style={{ width: "100vw", height: "100vh" }}
      />
    </div>
  );
}
