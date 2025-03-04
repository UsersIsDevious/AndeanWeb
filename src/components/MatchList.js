// MatchList.js
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchMatchMetaList, deleteMatchMeta } from "@/lib/db";

export default function MatchList({ onSelect }) {
  const [matchList, setMatchList] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMatchList = () => {
    fetchMatchMetaList()
      .then((matches) => {
        setMatchList(matches);
        setLoading(false);
      })
      .catch((error) => {
        console.error("マッチ一覧の取得エラー:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMatchList();
  }, []);

  const handleDelete = async (match) => {
    try {
      await deleteMatchMeta(match);
      // 全ての関連データの削除が完了したらページリロード
      window.location.reload();
    } catch (error) {
      console.error("マッチ削除エラー:", error);
    }
  };

  if (loading) {
    return <p className="text-center">読み込み中…</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">保存されたマッチデータ一覧</h2>
      {matchList.length === 0 ? (
        <p>保存されたマッチデータはありません</p>
      ) : (
        matchList.map((match) => (
          <Card key={match.matchId} className="shadow-sm">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">{match.matchName}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log("選択されたマッチ:", match);
                    onSelect(match);
                  }}
                >
                  選択
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(match)}
                >
                  削除
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{match.mapName}</p>
              <p className="text-sm text-muted-foreground">{match.playlistName}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
