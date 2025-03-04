"use client";
// pages/index.js
import dynamic from "next/dynamic";

// SSR を無効化してクライアントサイドでのみコンポーネントをレンダリング
const MapWithGlify = dynamic(() => import("@/components/MapWithGlify"), {
  ssr: false,
});

export default function Home() {
  return (
    <div>
      <h1 style={{ textAlign: "center" }}>Leaflet.glify サンプル</h1>
      <MapWithGlify />
    </div>
  );
}
