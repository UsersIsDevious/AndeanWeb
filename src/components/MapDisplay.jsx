"use client";
import React, { useState } from "react";
import { DeckGL } from "@deck.gl/react";
import { OrthographicView } from "@deck.gl/core";
import { BitmapLayer, IconLayer, PolygonLayer } from "@deck.gl/layers";

// アイコンマッピング情報（グレースケールのスプライトシート利用想定）
const iconMapping = {
  defaultIcon: { x: 0, y: 0, width: 128, height: 128, mask: true },
  shieldIcon: { x: 128, y: 0, width: 128, height: 128, mask: true },
  skullIcon: { x: 256, y: 0, width: 128, height: 128, mask: true }
};
const iconAtlas = "/AndeanWeb/img/icons.png";

// チームIDに応じたマーカー色
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

// コントロールパネルコンポーネント
function ControlPanel({ 
  showSkull, 
  setShowSkull, 
  showDown, 
  setShowDown, 
  showFrameData, 
  setShowFrameData 
}) {
  return (
    <div style={{
      position: "absolute",
      bottom: 10,
      left: 10,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      color: "#fff",
      padding: "10px",
      borderRadius: "4px",
      fontSize: "14px"
    }}>
      <div>
        <label>
          <input 
            type="checkbox" 
            checked={showSkull} 
            onChange={(e) => setShowSkull(e.target.checked)} 
          />{" "}
          ドクロアイコン表示
        </label>
      </div>
      <div>
        <label>
          <input 
            type="checkbox" 
            checked={showDown} 
            onChange={(e) => setShowDown(e.target.checked)} 
          />{" "}
          シールド（ダウン）アイコン表示
        </label>
      </div>
      <div>
        <label>
          <input 
            type="checkbox" 
            checked={showFrameData} 
            onChange={(e) => setShowFrameData(e.target.checked)} 
          />{" "}
          フレームデータ表示
        </label>
      </div>
    </div>
  );
}

export default function MapDisplay({ matchMeta, currentFrame }) {
  // コントロールパネル用の状態
  const [showSkull, setShowSkull] = useState(true);
  const [showDown, setShowDown] = useState(true);
  const [showFrameData, setShowFrameData] = useState(true);

  const viewState = {
    target: [0, 0],
    zoom: 0,
    minZoom: -5,
    maxZoom: 5
  };

  const layers = [];

  // 背景画像（BitmapLayer）
  layers.push(
    new BitmapLayer({
      id: "background-image",
      image: `/AndeanWeb/img/${matchMeta.mapName}.png`,
      // 画像の中心が (0,0) に来るように設定（必要に応じて調整してください）
      bounds: [-2048, 2048, 2048, -2048],
      opacity: 1
    })
  );

  if (currentFrame) {
    // マーカーを IconLayer で表示
    if (currentFrame.markers && currentFrame.markers.length > 0) {
      layers.push(
        new IconLayer({
          id: "markers",
          data: currentFrame.markers,
          iconAtlas,
          iconMapping,
          getIcon: (d) => {
            if (d.status === "killed" && showSkull) return "skullIcon";
            if (d.status === "down" && showDown) return "shieldIcon";
            return "defaultIcon";
          },
          getPosition: (d) => d.position,
          getSize: () => 32,
          sizeScale: 1,
          getColor: (d) => getMarkerColor(d.teamId),
          getAngle: (d) => d.angle - 90,
          pickable: true
        })
      );
    }

    // リングを PolygonLayer で描画
    if (currentFrame.ringPolygon && currentFrame.ringPolygon.polygon) {
      layers.push(
        new PolygonLayer({
          id: "ring-polygon",
          data: [currentFrame.ringPolygon],
          getPolygon: (d) => d.polygon,
          stroked: true,
          filled: true,
          getFillColor: [255, 165, 0, 200],
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
      <ControlPanel 
        showSkull={showSkull} 
        setShowSkull={setShowSkull}
        showDown={showDown} 
        setShowDown={setShowDown}
        showFrameData={showFrameData}
        setShowFrameData={setShowFrameData}
      />
      {/* フレームデータ表示パネル（表示ON/OFF切替：中央下部なども検討可能） */}
      {showFrameData && currentFrame && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            zIndex: 1000,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "#fff",
            padding: "10px",
            borderRadius: "4px",
            fontSize: "12px",
            maxHeight: "40%",
            overflowY: "auto"
          }}
        >
          <pre>{JSON.stringify(currentFrame, null, 2)}</pre>
        </div>
      )}
      {/* 生存情報表示パネル（右上） */}
      {currentFrame && (
        <div style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1000,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          color: "#fff",
          padding: "10px",
          borderRadius: "4px",
          fontSize: "16px",
          textAlign: "center"
        }}>
          <div>リング回数：{currentFrame.ringCount}</div>
          <div>生存プレイヤー数：{currentFrame.alivePlayerCount}</div>
          <div>生存チーム数：{currentFrame.aliveTeamCount}</div>
        </div>
      )}
    </div>
  );
}
