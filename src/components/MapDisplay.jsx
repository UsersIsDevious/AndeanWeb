"use client";
import React from "react";
import { DeckGL } from "@deck.gl/react";
import { OrthographicView } from "@deck.gl/core";
import { BitmapLayer, ScatterplotLayer, PolygonLayer } from "@deck.gl/layers";

// チームIDに応じたマーカー色を返す
function getMarkerColor(teamId) {
  switch (teamId) {
    case 1:
      return [255, 0, 0, 255]; // 赤
    case 2:
      return [0, 0, 255, 255]; // 青
    case 3:
      return [255, 165, 0, 255]; // オレンジ
    case 4:
      return [128, 0, 128, 255]; // 紫
    case 5:
      return [255, 255, 0, 255]; // 黄色
    case 6:
      return [0, 255, 255, 255]; // シアン
    case 7:
      return [75, 0, 130, 255]; // インディゴ
    case 8:
      return [255, 192, 203, 255]; // ピンク
    case 9:
      return [0, 128, 0, 255]; // ダークグリーン
    case 10:
      return [128, 128, 128, 255]; // グレー
    case 11:
      return [165, 42, 42, 255]; // ブラウン
    case 12:
      return [0, 100, 0, 255]; // フォレストグリーン
    case 13:
      return [139, 69, 19, 255]; // サドルブラウン
    case 14:
      return [255, 140, 0, 255]; // ダークオレンジ
    case 15:
      return [173, 216, 230, 255]; // ライトブルー
    case 16:
      return [220, 20, 60, 255]; // クリムゾン
    case 17:
      return [240, 230, 140, 255]; // カーキ
    case 18:
      return [70, 130, 180, 255]; // スチールブルー
    case 19:
      return [255, 20, 147, 255]; // ディープピンク
    case 20:
      return [0, 255, 127, 255]; // スプリンググリーン
    default:
      return [0, 255, 0, 255]; // その他は緑
  }
}

export default function MapDisplay({ matchMeta, currentFrame }) {
  // 画像中心を (0,0) に合わせるための viewState 設定
  const viewState = {
    target: [0, 0],
    zoom: 0,
    minZoom: -5,
    maxZoom: 5
  };

  const layers = [];

  // 背景画像 (BitmapLayer)
  layers.push(
    new BitmapLayer({
      id: "background-image",
      image: `/AndeanWeb/img/${matchMeta.mapName}.png`, // public配下の画像パスに合わせて調整
      // 画像の中心が (0,0) になるように bounds を設定
      bounds: [-2048, -2048, 2048, 2048],
      opacity: 1
    })
  );

  if (currentFrame) {
    // マーカー (ScatterplotLayer)
    if (currentFrame.markers && currentFrame.markers.length > 0) {
      layers.push(
        new ScatterplotLayer({
          id: "markers",
          data: currentFrame.markers,
          getPosition: (d) => d.position,
          getFillColor: (d) => getMarkerColor(d.teamId),
          radiusMinPixels: 5,
          radiusMaxPixels: 20,
          pickable: true,
          updateTriggers: {
            getPosition: currentFrame.markers.map((m) => m.position)
          }
        })
      );
    }

    // リング (PolygonLayer) → ドーナッツ型を描画
    if (currentFrame.ringPolygon && currentFrame.ringPolygon.polygon) {
      layers.push(
        new PolygonLayer({
          id: "ring-polygon",
          data: [currentFrame.ringPolygon],
          getPolygon: (d) => d.polygon,  // ドーナッツの場合、最初のリングが外側、以降が穴になります
          stroked: true,
          filled: true,
          getFillColor: [255, 165, 0, 200], // オレンジ色（半透明）
          lineWidthMinPixels: 2,
          getLineColor: [255, 255, 255],
          pickable: true
        })
      );
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <DeckGL
        initialViewState={viewState}
        controller={true}
        views={[new OrthographicView()]}
        layers={layers}
        style={{ width: "100%", height: "100%" }}
      />
      {currentFrame && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '5px',
            fontSize: '12px',
            maxHeight: '90%',
            overflowY: 'auto'
          }}
        >
          <pre>{JSON.stringify(currentFrame, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
