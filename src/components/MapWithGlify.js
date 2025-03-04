"use client";

import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.glify";

const MapWithGlify = () => {
  useEffect(() => {
    // マップコンテナに既にマップが初期化されている場合はリセット
    const mapContainer = document.getElementById("map");
    if (mapContainer && mapContainer._leaflet_id) {
      mapContainer._leaflet_id = null;
    }

    // マップを初期化
    const map = L.map("map").setView([35.6895, 139.6917], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // デバッグ用に1つのポイントデータを [lat, lng, value] 形式で用意
    const point = [35.6895, 139.6917, 1];

    // leaflet.glify を利用して1つのポイントを描画
    if (L.glify && L.glify.points) {

      const a = L.glify.points({
        map: map,
        data: [point],
        click: (e, point) => {
          console.log("クリックしたポイント:", point);
        },
        size: 20,        // デバッグ用に少し大きめのサイズに設定
        color: "#ff0000" // 赤色で表示
      });

      console.log(a)
    }

    // クリーンアップ: コンポーネントのアンマウント時にマップを削除
    return () => {
      map.remove();
    };
  }, []);

  return <div id="map" style={{ width: "100%", height: "100vh" }} />;
};

export default MapWithGlify;
