"use client";
import { useState } from "react";
import FileUploader from "@/components/FileUploader";
import MatchList from "@/components/MatchList";
import Map from "@/components/Map";

export default function Home() {
  // 選択されたマッチの情報を保持
  const [selectedMatch, setSelectedMatch] = useState(null);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">マッチ再現システム</h1>
      {!selectedMatch ? (
        <>
          {/* ファイルアップロードおよびマッチ一覧 UI を表示 */}
          <FileUploader />
          <MatchList onSelect={(matchMeta) => setSelectedMatch(matchMeta)} />
        </>
      ) : (
        <>
          {/* 選択後はアップロード一覧は非表示にして Leaflet で再現 */}
          <Map matchMeta={selectedMatch} />
        </>
      )}
    </div>
  );
}
