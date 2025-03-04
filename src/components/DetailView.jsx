"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

/**
 * プレーヤーのステータス詳細を表示する関数。
 * HP関連とスコアのトータル値を抜粋して表示します。
 */
function renderPlayerStatus(playerStats) {
  if (!playerStats) return null;
  return (
    <div className="space-y-1">
      <p>
        <strong>HP:</strong> {playerStats.currentHealth} / {playerStats.maxHealth}{" "}
        (Shield: {playerStats.shieldHealth} / {playerStats.shieldMaxHealth})
      </p>
      <p>
        <strong>Kills:</strong> {playerStats.kills?.total || 0}
      </p>
      <p>
        <strong>Kills Received:</strong> {playerStats.killsReceived?.total || 0}
      </p>
      <p>
        <strong>Kill Assists:</strong> {playerStats.killAssists?.total || 0}
      </p>
      <p>
        <strong>Kill Assists Received:</strong> {playerStats.killAssistsReceived?.total || 0}
      </p>
      <p>
        <strong>Downs:</strong> {playerStats.downs?.total || 0}
      </p>
      <p>
        <strong>Downs Received:</strong> {playerStats.downsReceived?.total || 0}
      </p>
      <p>
        <strong>Damage Dealt:</strong> {playerStats.damageDealt?.total || 0}
      </p>
      <p>
        <strong>Damage Received:</strong> {playerStats.damageReceived?.total || 0}
      </p>
    </div>
  );
}

export default function DetailView({ matchMeta, progress, currentFrame }) {
  // 各チームの展開状態を管理
  const [expandedTeams, setExpandedTeams] = useState({});
  // 各プレーヤーの展開状態を管理（キーはプレーヤーID）
  const [expandedPlayers, setExpandedPlayers] = useState({});

  // チームカードのトグル処理
  const toggleTeam = (teamId) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));
  };

  // プレーヤーカードのトグル処理
  const togglePlayer = (playerId) => {
    setExpandedPlayers((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  // プレーヤーの表示名を取得（matchMeta.players から name を取得）
  const getPlayerDisplayName = (playerId) => {
    if (
      matchMeta.players &&
      matchMeta.players[playerId] &&
      matchMeta.players[playerId].name
    ) {
      return matchMeta.players[playerId].name;
    }
    return playerId;
  };

  return (
    <div className="space-y-4 h-full">
      {/* マッチ詳細カード */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">マッチ詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>マッチ名:</strong> {matchMeta.matchName}
          </p>
          <p>
            <strong>マップ名:</strong> {matchMeta.mapName}
          </p>
          <p>
            <strong>プレイリスト:</strong> {matchMeta.playlistName}
          </p>
        </CardContent>
      </Card>

      {/* チーム一覧：スクロール可能な領域に包む */}
      {matchMeta.teams && (
        <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
          <h3 className="mt-4 font-semibold">チーム一覧</h3>
          {Object.entries(matchMeta.teams).map(([teamId, team]) => {
            // チームの players 配列が存在し、かつ1人以上の場合のみ表示
            if (!team.players || team.players.length === 0) return null;
            return (
              <Card key={teamId} className="shadow-sm mb-2">
                <CardHeader
                  onClick={() => toggleTeam(teamId)}
                  className="cursor-pointer"
                >
                  <CardTitle className="text-md font-bold">
                    {team.teamName}
                  </CardTitle>
                </CardHeader>
                {expandedTeams[teamId] && (
                  <CardContent className="pl-4">
                    {team.players.map((playerId) => (
                      <Card key={playerId} className="mb-2 shadow-sm">
                        <CardHeader
                          onClick={() => togglePlayer(playerId)}
                          className="cursor-pointer"
                        >
                          <CardTitle className="text-sm">
                            {getPlayerDisplayName(playerId)}
                          </CardTitle>
                        </CardHeader>
                        {expandedPlayers[playerId] &&
                          currentFrame &&
                          currentFrame.players &&
                          currentFrame.players[playerId] && (
                            <CardContent className="pl-4">
                              {renderPlayerStatus(currentFrame.players[playerId])}
                            </CardContent>
                          )}
                      </Card>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="text-center text-sm">読み込み進捗: {progress}</div>
    </div>
  );
}
