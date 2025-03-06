"use client";
import React, { useState, useMemo } from "react";
import { DeckGL } from "@deck.gl/react";
import { OrthographicView } from "@deck.gl/core";
import { BitmapLayer, IconLayer, PolygonLayer } from "@deck.gl/layers";

// アイコンマッピング情報（スプライトシート上の各アイコンの位置とサイズ）
const iconMapping = {
  defaultIcon: { x: 0, y: 0, width: 128, height: 128, mask: true },
  shieldIcon: { x: 128, y: 0, width: 128, height: 128, mask: true },
  skullIcon: { x: 256, y: 0, width: 128, height: 128, mask: true }
};

const iconAtlas = "/AndeanWeb/img/icons.png";

// チームIDに応じたマーカー色を返す
function getMarkerColor(teamId) {
  switch (teamId) {
    case 1:
      return [6, 131, 149, 255];
    case 2:
      return [27, 71, 105, 255];
    case 3:
      return [31, 84, 205, 255];
    case 4:
      return [68, 42, 96, 255];
    case 5:
      return [110, 44, 111, 255];
    case 6:
      return [173, 45, 119, 255];
    case 7:
      return [176, 28, 81, 255];
    case 8:
      return [195, 0, 11, 255];
    case 9:
      return [197, 67, 32, 255];
    case 10:
      return [120, 30, 19, 255];
    case 11:
      return [159, 59, 13, 255];
    case 12:
      return [119, 75, 0, 255];
    case 13:
      return [204, 121, 19, 255];
    case 14:
      return [150, 125, 0, 255];
    case 15:
      return [133, 147, 10, 255];
    case 16:
      return [73, 88, 3, 255];
    case 17:
      return [112, 151, 67, 255];
    case 18:
      return [57, 137, 52, 255];
    case 19:
      return [47, 90, 26, 255];
    case 20:
      return [0, 116, 88, 255];
    default:
      return [0, 255, 0, 255];
  }
}

export default function MapDisplay({ matchMeta, currentFrame }) {
  // viewState は背景画像中心を (0,0) に合わせる
  const viewState = {
    target: [0, 0],
    zoom: 0,
    minZoom: -5,
    maxZoom: 5
  };

  // コントロールパネルの表示・非表示トグル用ステート
  const [showSkull, setShowSkull] = useState(true);
  const [showDown, setShowDown] = useState(true);
  const [showFrameData, setShowFrameData] = useState(true);

  // currentFrame.markers のうち、トグル状態に応じて表示するマーカーだけを抽出
  const filteredMarkers = useMemo(() => {
    if (!currentFrame || !currentFrame.markers) return [];
    return currentFrame.markers.filter(m => {
      if (m.status === "killed" && !showSkull) return false;
      if (m.status === "down" && !showDown) return false;
      return true;
    });
  }, [currentFrame, showSkull, showDown]);

  // 生存プレイヤー・チーム数の計算（players オブジェクトを利用）
  const { alivePlayerCount, aliveTeamCount } = useMemo(() => {
    if (!currentFrame || !currentFrame.players) return { alivePlayerCount: 0, aliveTeamCount: 0 };
    const alivePlayers = Object.values(currentFrame.players).filter(p => p.status === "alive");
    return {
      alivePlayerCount: alivePlayers.length,
      aliveTeamCount: new Set(alivePlayers.map(p => p.teamId)).size
    };
  }, [currentFrame]);

  const layers = [];

  // 背景画像（BitmapLayer）
  layers.push(
    new BitmapLayer({
      id: "background-image",
      image: `/AndeanWeb/img/${matchMeta.mapName}.png`,
      // ここは画像の向きに合わせて適切な bounds を設定（例として以下）
      bounds: [-2048, 2048, 2048, -2048],
      opacity: 1
    })
  );

  if (currentFrame) {
    // マーカー（IconLayer）※ filteredMarkers を使用
    layers.push(
      new IconLayer({
        id: "markers",
        data: filteredMarkers,
        iconAtlas,
        iconMapping,
        getIcon: (d) => {
          if (d.status === "down") return "shieldIcon";
          if (d.status === "killed") return "skullIcon";
          return "defaultIcon";
        },
        getPosition: (d) => d.position,
        getSize: 32,
        sizeScale: 1,
        getColor: (d) => getMarkerColor(d.teamId),
        pickable: true
      })
    );

    // リング（PolygonLayer）
    if (currentFrame.ringPolygon && currentFrame.ringPolygon.polygon) {
      layers.push(
        new PolygonLayer({
          id: "ring-polygon",
          data: [currentFrame.ringPolygon],
          getPolygon: (d) => d.polygon,
          stroked: true,
          filled: true,
          getFillColor: [255, 165, 0, 100],
          lineWidthMinPixels: 2,
          getLineColor: [255, 255, 255],
          pickable: true
        })
      );
    }
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <DeckGL
        initialViewState={viewState}
        controller={true}
        views={[new OrthographicView()]}
        layers={layers}
        style={{ width: "100%", height: "100%" }}
      />

      {/* コントロールパネル（左下） */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          backgroundColor: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "10px",
          borderRadius: "4px",
          fontSize: "14px",
          zIndex: 1000
        }}
      >
        <div>
          <label>
            <input
              type="checkbox"
              checked={showSkull}
              onChange={() => setShowSkull(!showSkull)}
            />
            骸骨表示
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={showDown}
              onChange={() => setShowDown(!showDown)}
            />
            ダウン表示
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={showFrameData}
              onChange={() => setShowFrameData(!showFrameData)}
            />
            フレームデータ表示
          </label>
        </div>
      </div>

      {/* 現在のフレームデータ表示（オプション） */}
      {showFrameData && currentFrame && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "10px",
            borderRadius: "4px",
            fontSize: "12px",
            maxHeight: "40%",
            overflowY: "auto",
            zIndex: 1000
          }}
        >
          <pre>{JSON.stringify(currentFrame, null, 2)}</pre>
        </div>
      )}

      {/* 右上の生存チーム数・生存プレイヤー数表示 */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          backgroundColor: "rgba(255,255,255,0.9)",
          padding: "10px",
          borderRadius: "4px",
          fontSize: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          zIndex: 1000
        }}
      >
        <div>生存チーム数: {aliveTeamCount}</div>
        <div>生存プレイヤー数: {alivePlayerCount}</div>
      </div>
    </div>
  );
}
