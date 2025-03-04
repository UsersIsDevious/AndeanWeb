// "/img/mp_rr_tropic_island_mu2.png"
"use client";

import React, { useState, useEffect } from "react";
import { DeckGL } from "@deck.gl/react";
import { OrthographicView } from "@deck.gl/core";
import { BitmapLayer, ScatterplotLayer } from "@deck.gl/layers";

// 初期表示のビュー設定（背景画像の中央付近を target に）
const INITIAL_VIEW_STATE = {
  target: [2048, 2048, 0],
  zoom: 0,
};

export default function MapPage() {
  const [layers, setLayers] = useState([]);

  useEffect(() => {
    // 背景画像用の BitmapLayer を作成
    const bitmapLayer = new BitmapLayer({
      id: "bitmap-layer",
      image: "/img/mp_rr_tropic_island_mu2.png", // public フォルダ内の画像
      // bounds: [左, 下, 右, 上] の順。ここでは左下原点の場合
      bounds: [0, 0, 4096, 4096],
    });

    // ScatterplotLayer で緑色のマーカー（0,0）を描画
    const greenMarkerLayer = new ScatterplotLayer({
      id: "green-marker-layer",
      data: [{ position: [0, 0] }],
      getPosition: (d) => d.position,
      getFillColor: () => [0, 255, 0, 255], // RGBA：緑色
      radius: 20,
      radiusMinPixels: 5,
      pickable: true,
    });

    // ScatterplotLayer で赤色のマーカー（100,100）を描画
    const redMarkerLayer = new ScatterplotLayer({
      id: "red-marker-layer",
      data: [{ position: [100, 100] }],
      getPosition: (d) => d.position,
      getFillColor: () => [255, 0, 0, 255], // RGBA：赤色
      radius: 20,
      radiusMinPixels: 5,
      pickable: true,
    });

    setLayers([bitmapLayer, greenMarkerLayer, redMarkerLayer]);
  }, []);

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      views={new OrthographicView()}
      layers={layers}
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
