// workers/processorWorker.js
//console.log("processorWorker.js")

// 定数：チャンク保存サイズ
const CHUNK_SIZE = 500;

// ----- ヘルパー関数群 -----
// JSON の検証・パース
function validateAndParse(jsonString) {
  let jsonData;
  try {
    jsonData = JSON.parse(jsonString);
  } catch (err) {
    throw new Error("Invalid JSON format: " + err.message);
  }
  if (!jsonData.matchName || !jsonData.players || !jsonData.packetLists) {
    throw new Error("Missing required fields in JSON data.");
  }
  return jsonData;
}

// 初期 playersStatus の生成
function initPlayersStatus(players) {
  const output = {};
  Object.values(players).forEach(player => {
    if (player.teamId == 0 || player.teamId == 1) { return; }
    output[player.nucleusHash] = {};
    Object.keys(player).forEach(key => {
      output[player.nucleusHash][key] = player[key];
    });
  });
  return output;
}

// 初期 ringStatus の生成
function initRingStatus() {
  return {
    current: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    targetRadius: 4000,
    currentRadius: 4000,
    endTime: 0 // 終了タイミング（秒後）
  };
}

// プレイヤー状態更新関数（packetList.data のデータで更新）
function dataProcessing(packetData, playersStatus) {
  if (packetData && Array.isArray(packetData)) {
    packetData.forEach(item => {
      if (playersStatus[item.id]) {
        // dataから取得したposはdataPosとして保存
        playersStatus[item.id].dataPos = { x: item.pos[0], y: item.pos[1], z: item.pos[2] };
        playersStatus[item.id].currentHealth = item.hp[0];
      }
    });
  }
}

// グローバルなイベントカウンターを初期化
let eventCounter = 0;
// イベントデータ処理関数
async function eventProcessing(events, playersStatus, ringStatus, currentTime, matchId) {
  if (events && Array.isArray(events)) {
    events.forEach(async evt => {
      switch (evt.category) {
        case "CharacterSelected": {
          break;
        }
        case "MatchStateEnd": {
          break;
        }
        case "ringStartClosing": {
          ringCount++;
          if ("center" in evt) {
            console.log("リングデータの書き換え開始 (centerあり)");
            console.log(ringStatus);
            console.log(evt);

            // centerがある場合の更新処理
            ringStatus.target = { x: evt.center[0], y: evt.center[1] };
            ringStatus.targetRadius = evt.endradius;
            ringStatus.endTime = evt.shrinkduration;
            ringStatus.startTimeStamp = currentTime;

            console.log(ringStatus);
            console.log("リングデータの書き換え完了");

          } else if ("endCenter" in evt && "startCenter" in evt) {
            console.log("リングデータの書き換え開始 (endCenterとstartCenterあり)");
            console.log(ringStatus);
            console.log(evt);

            // endCenterとstartCenterがある場合の更新処理
            // ※ ここは仕様に合わせて適切に更新処理を記述してください
            ringStatus.target = { x: evt.endCenter[0], y: evt.endCenter[1] };
            ringStatus.start = { x: evt.startCenter[0], y: evt.startCenter[1] };
            ringStatus.targetRadius = evt.endradius;
            ringStatus.endTime = evt.shrinkduration;
            ringStatus.startTimeStamp = currentTime;

            console.log(ringStatus);
            console.log("リングデータの書き換え完了");

          } else {
            console.error("evtに必要なキーがありません");
          }
          break;
        }
        case "ringFinishedClosing": {
          break;
        }
        case "playerUltimateCharged": {
          const playerId = evt.id;
          if (playersStatus[playerId]) {
            //console.log(`playerUltimateCharged: Updating player ${playerId}`);
            playersStatus[playerId].currentHealth = evt.hp[0];
            playersStatus[playerId].maxHealth = evt.hp[1];
            playersStatus[playerId].shieldHealth = evt.hp[2];
            playersStatus[playerId].shieldMaxHealth = evt.hp[3];
            playersStatus[playerId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[playerId].angle = evt.ang;
            // 設定：究極能力チャージ済み
            playersStatus[playerId].ultimateCharged = true;
            playersStatus[playerId].linkedEntity = evt.linkedentity;
          } else {
            console.warn(`playerUltimateCharged: Player ${playerId} not found.`);
          }
          break;
        }

        case "playerUpgradeTierChanged": {
          const playerId = evt.id;
          if (playersStatus[playerId]) {
            //console.log(`playerUpgradeTierChanged: Updating player ${playerId} to level ${evt.level}`);
            playersStatus[playerId].level = evt.level;
            playersStatus[playerId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[playerId].currentHealth = evt.hp[0];
            playersStatus[playerId].maxHealth = evt.hp[1];
            playersStatus[playerId].shieldHealth = evt.hp[2];
            playersStatus[playerId].shieldMaxHealth = evt.hp[3];
            playersStatus[playerId].angle = evt.ang;
          } else {
            console.warn(`playerUpgradeTierChanged: Player ${playerId} not found.`);
          }
          break;
        }

        case "playerDamaged": {
          const victimId = evt.victim.id;
          if (playersStatus[victimId]) {
            //console.log(`playerDamaged: Updating damageReceived for victim ${victimId}`);
            // Update victim's current health
            playersStatus[victimId].currentHealth = evt.victim.hp[0];
            playersStatus[victimId].maxHealth = evt.victim.hp[1];
            playersStatus[victimId].shieldHealth = evt.victim.hp[2];
            playersStatus[victimId].shieldMaxHealth = evt.victim.hp[3];
            // 初回なら damageReceived オブジェクトを初期化
            if (!playersStatus[victimId].damageReceived) {
              playersStatus[victimId].damageReceived = { total: 0, weapons: {}, players: {}, legends: {} };
            }
            // 被ダメージとして加算
            playersStatus[victimId].damageReceived.total += evt.damageinflicted;
            playersStatus[victimId].eventPos = {
              x: evt.victim.pos[0],
              y: evt.victim.pos[1],
              z: evt.victim.pos[2]
            };
          } else {
            console.warn(`playerDamaged: Victim ${victimId} not found.`);
          }

          // 攻撃側（Worldは無視）
          if (evt.attacker && evt.attacker.id !== "World") {
            const attackerId = evt.attacker.id;
            if (playersStatus[attackerId]) {
              //console.log(`playerDamaged: Updating damageDealt for attacker ${attackerId}`);
              if (!playersStatus[attackerId].damageDealt) {
                playersStatus[attackerId].damageDealt = { total: 0, weapons: {}, players: {}, legends: {} };
              }
              playersStatus[attackerId].damageDealt.total += evt.damageinflicted;
              playersStatus[attackerId].currentHealth = evt.attacker.hp[0];
              playersStatus[attackerId].maxHealth = evt.attacker.hp[1];
              playersStatus[attackerId].shieldHealth = evt.attacker.hp[2];
              playersStatus[attackerId].shieldMaxHealth = evt.attacker.hp[3];
              playersStatus[attackerId].eventPos = {
                x: evt.attacker.pos[0],
                y: evt.attacker.pos[1],
                z: evt.attacker.pos[2]
              };
            } else {
              console.warn(`playerDamaged: Attacker ${attackerId} not found.`);
            }
          }
          break;
        }
        case "playerKilled": {
          const victimId = evt.victim.id;
          if (playersStatus[victimId]) {
            //console.log(`playerKilled: Marking victim ${victimId} as killed.`);
            playersStatus[victimId].currentHealth = 0;
            playersStatus[victimId].status = "killed";
            if (!playersStatus[victimId].killsReceived) {
              playersStatus[victimId].killsReceived = { total: 0, weapons: {}, players: {}, legends: {} };
            }
            playersStatus[victimId].killsReceived.total += 1;
            playersStatus[victimId].eventPos = {
              x: evt.victim.pos[0],
              y: evt.victim.pos[1],
              z: evt.victim.pos[2]
            };
          } else {
            console.warn(`playerKilled: Victim ${victimId} not found.`);
          }

          if (evt.attacker && evt.attacker.id !== "World") {
            const attackerId = evt.attacker.id;
            if (playersStatus[attackerId]) {
              //console.log(`playerKilled: Updating attacker ${attackerId} for kill.`);
              if (!playersStatus[attackerId].kills) {
                playersStatus[attackerId].kills = { total: 0, weapons: {}, players: {}, legends: {} };
              }
              playersStatus[attackerId].kills.total += 1;
              playersStatus[attackerId].currentHealth = evt.attacker.hp[0];
              playersStatus[attackerId].maxHealth = evt.attacker.hp[1];
              playersStatus[attackerId].shieldHealth = evt.attacker.hp[2];
              playersStatus[attackerId].shieldMaxHealth = evt.attacker.hp[3];
              playersStatus[attackerId].eventPos = {
                x: evt.attacker.pos[0],
                y: evt.attacker.pos[1],
                z: evt.attacker.pos[2]
              };
            } else {
              console.warn(`playerKilled: Attacker ${attackerId} not found.`);
            }
          }
          break;
        }

        case "playerDowned": {
          const victimId = evt.victim.id;
          if (playersStatus[victimId]) {
            //console.log(`playerDowned: Marking victim ${victimId} as downed.`);
            if (!playersStatus[victimId].downsReceived) {
              playersStatus[victimId].downsReceived = { total: 0, weapons: {}, players: {}, legends: {} };
            }
            playersStatus[victimId].downsReceived.total += 1;
            playersStatus[victimId].status = "downed";
            playersStatus[victimId].eventPos = {
              x: evt.victim.pos[0],
              y: evt.victim.pos[1],
              z: evt.victim.pos[2]
            };
          } else {
            console.warn(`playerDowned: Victim ${victimId} not found.`);
          }

          if (evt.attacker && evt.attacker.id !== "World") {
            const attackerId = evt.attacker.id;
            if (playersStatus[attackerId]) {
              //console.log(`playerDowned: Updating attacker ${attackerId} for down event.`);
              if (!playersStatus[attackerId].downs) {
                playersStatus[attackerId].downs = { total: 0, weapons: {}, players: {}, legends: {} };
              }
              playersStatus[attackerId].downs.total += 1;
              playersStatus[attackerId].currentHealth = evt.attacker.hp[0];
              playersStatus[attackerId].maxHealth = evt.attacker.hp[1];
              playersStatus[attackerId].shieldHealth = evt.attacker.hp[2];
              playersStatus[attackerId].shieldMaxHealth = evt.attacker.hp[3];
              playersStatus[attackerId].eventPos = {
                x: evt.attacker.pos[0],
                y: evt.attacker.pos[1],
                z: evt.attacker.pos[2]
              };
            } else {
              console.warn(`playerDowned: Attacker ${attackerId} not found.`);
            }
          }
          break;
        }

        case "playerAssist": {
          const assisterId = evt.attacker.id;
          if (playersStatus[assisterId]) {
            //console.log(`playerAssist: Updating assist info for player ${assisterId}`);
            if (!playersStatus[assisterId].killAssists) {
              playersStatus[assisterId].killAssists = { total: 0, weapons: {}, players: {}, legends: {} };
            }
            playersStatus[assisterId].killAssists.total += 1;
            playersStatus[assisterId].currentHealth = evt.attacker.hp[0];
            playersStatus[assisterId].maxHealth = evt.attacker.hp[1];
            playersStatus[assisterId].shieldHealth = evt.attacker.hp[2];
            playersStatus[assisterId].shieldMaxHealth = evt.attacker.hp[3];
            playersStatus[assisterId].eventPos = {
              x: evt.attacker.pos[0],
              y: evt.attacker.pos[1],
              z: evt.attacker.pos[2]
            };
            playersStatus[assisterId].angle = evt.attacker.ang;
          } else {
            console.warn(`playerAssist: Assister ${assisterId} not found.`);
          }
          break;
        }

        case "SquadEliminated": {
          break;
        }
        case "gibraltarShieldAbsorbed": {
          // 被ダメージ側（victim）の処理
          const victimId = evt.victim.id;
          if (playersStatus[victimId]) {
            //console.log(`gibraltarShieldAbsorbed: Updating victim ${victimId}`);
            playersStatus[victimId].currentHealth = evt.victim.hp[0];
            playersStatus[victimId].maxHealth = evt.victim.hp[1];
            playersStatus[victimId].shieldHealth = evt.victim.hp[2];
            playersStatus[victimId].shieldMaxHealth = evt.victim.hp[3];
            playersStatus[victimId].eventPos = {
              x: evt.victim.pos[0],
              y: evt.victim.pos[1],
              z: evt.victim.pos[2]
            };
            // 記録：被ダメージ側が吸収したシールドダメージ
            playersStatus[victimId].lastShieldAbsorbed = evt.damageinflicted;
          } else {
            console.warn(`gibraltarShieldAbsorbed: Victim ${victimId} not found in playersStatus.`);
          }

          // 攻撃側（attacker）の処理（attacker が "World" でない場合）
          const attackerId = evt.attacker.id;
          if (evt.attacker.id !== "World") {
            if (playersStatus[attackerId]) {
              //console.log(`gibraltarShieldAbsorbed: Updating attacker ${attackerId}`);
              playersStatus[attackerId].currentHealth = evt.attacker.hp[0];
              playersStatus[attackerId].maxHealth = evt.attacker.hp[1];
              playersStatus[attackerId].shieldHealth = evt.attacker.hp[2];
              playersStatus[attackerId].shieldMaxHealth = evt.attacker.hp[3];
              playersStatus[attackerId].eventPos = {
                x: evt.attacker.pos[0],
                y: evt.attacker.pos[1],
                z: evt.attacker.pos[2]
              };
              // 記録：攻撃側が与えたシールド吸収ダメージ
              playersStatus[attackerId].lastShieldAbsorbedInflicted = evt.damageinflicted;
            } else {
              console.warn(`gibraltarShieldAbsorbed: Attacker ${attackerId} not found in playersStatus.`);
            }
          }
          break;
        }

        case "RevenantForgedShadowDamaged": {
          break;
        }
        case "playerRespawnTeam": {
          // イベント送信者（リーダー）の更新
          const leaderId = evt.id;
          if (playersStatus[leaderId]) {
            //console.log(`playerRespawnTeam: Respawning leader ${leaderId}`);
            playersStatus[leaderId].currentHealth = evt.hp[0];
            playersStatus[leaderId].maxHealth = evt.hp[1];
            playersStatus[leaderId].shieldHealth = evt.hp[2];
            playersStatus[leaderId].shieldMaxHealth = evt.hp[3];
            playersStatus[leaderId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[leaderId].angle = evt.ang;
            playersStatus[leaderId].status = "alive";
          } else {
            console.warn(`playerRespawnTeam: Leader ${leaderId} not found in playersStatus.`);
          }

          // respawnedteammatesList に含まれる各プレーヤーの更新
          if (Array.isArray(evt.respawnedteammatesList)) {
            evt.respawnedteammatesList.forEach(teammate => {
              const teammateId = teammate.id;
              if (playersStatus[teammateId]) {
                //console.log(`playerRespawnTeam: Respawning teammate ${teammateId}`);
                playersStatus[teammateId].currentHealth = teammate.hp[0];
                playersStatus[teammateId].maxHealth = teammate.hp[1];
                playersStatus[teammateId].shieldHealth = teammate.hp[2];
                playersStatus[teammateId].shieldMaxHealth = teammate.hp[3];
                playersStatus[teammateId].eventPos = {
                  x: teammate.pos[0],
                  y: teammate.pos[1],
                  z: teammate.pos[2]
                };
                playersStatus[teammateId].angle = teammate.ang;
                playersStatus[teammateId].status = "alive";
              } else {
                console.warn(`playerRespawnTeam: Teammate ${teammateId} not found in playersStatus.`);
              }
            });
          } else {
            console.warn("playerRespawnTeam: respawnedteammatesList is not an array.");
          }
          break;
        }
        case "playerRevive": {
          // イベントオブジェクト内の "revived" プロパティから対象プレーヤー情報を取得
          if (evt.revived && evt.revived.id) {
            const revivedId = evt.revived.id;
            if (playersStatus[revivedId]) {
              //console.log(`playerRevive: Reviving player ${revivedId}`);
              // hp関連を更新
              playersStatus[revivedId].currentHealth = evt.revived.hp[0];
              playersStatus[revivedId].maxHealth = evt.revived.hp[1];
              playersStatus[revivedId].shieldHealth = evt.revived.hp[2];
              playersStatus[revivedId].shieldMaxHealth = evt.revived.hp[3];
              // 位置情報を更新（イベントで送られた位置を eventPos として保存）
              playersStatus[revivedId].eventPos = {
                x: evt.revived.pos[0],
                y: evt.revived.pos[1],
                z: evt.revived.pos[2]
              };
              // 角度情報を更新
              playersStatus[revivedId].angle = evt.revived.ang;
              // 状態を "alive" に更新
              playersStatus[revivedId].status = "alive";
            } else {
              console.warn(`playerRevive: Revived player ${revivedId} not found in playersStatus.`);
            }
          } else {
            console.warn("playerRevive: No revived object found in event.");
          }
          break;
        }
        case "inventoryPickUp": {
          const playerId = evt.id;
          if (playersStatus[playerId]) {
            //console.log(`inventoryPickUp: Updating inventory for player ${playerId}`);

            /* // インベントリの初期化（items をオブジェクトとして）
            if (!playersStatus[playerId].inventory) {
              playersStatus[playerId].inventory = { items: {} };
            }
            // 既存の数量に対して、今回の quantity を加算（なければ 0 から）
            const currentQuantity = playersStatus[playerId].inventory.items[evt.item] || 0;
            playersStatus[playerId].inventory.items[evt.item] = currentQuantity + evt.quantity; */

            // hp 関連の更新
            playersStatus[playerId].currentHealth = evt.hp[0];
            playersStatus[playerId].maxHealth = evt.hp[1];
            playersStatus[playerId].shieldHealth = evt.hp[2];
            playersStatus[playerId].shieldMaxHealth = evt.hp[3];

            // 位置情報と角度の更新
            playersStatus[playerId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[playerId].angle = evt.ang;
          } else {
            console.warn(`inventoryPickUp: Player ${playerId} not found in playersStatus.`);
          }
          break;
        }
        case "inventoryDrop": {
          const playerId = evt.id;
          if (playersStatus[playerId]) {
            //console.log(`inventoryDrop: Updating inventory for player ${playerId}`);

            /* // インベントリの初期化（items をオブジェクトとして）
            if (!playersStatus[playerId].inventory) {
              playersStatus[playerId].inventory = { items: {} };
            }
            const currentQuantity = playersStatus[playerId].inventory.items[evt.item] || 0;
            const newQuantity = currentQuantity - evt.quantity;
            if (newQuantity <= 0) {
              //console.log(`inventoryDrop: Removing item "${evt.item}" (quantity dropped ${evt.quantity} exceeds or equals current ${currentQuantity}).`);
              delete playersStatus[playerId].inventory.items[evt.item];
            } else {
              playersStatus[playerId].inventory.items[evt.item] = newQuantity;
              //console.log(`inventoryDrop: Updated quantity of "${evt.item}" is ${newQuantity}.`);
            } */

            // hp 関連の更新
            playersStatus[playerId].currentHealth = evt.hp[0];
            playersStatus[playerId].maxHealth = evt.hp[1];
            playersStatus[playerId].shieldHealth = evt.hp[2];
            playersStatus[playerId].shieldMaxHealth = evt.hp[3];

            // 位置情報と角度の更新
            playersStatus[playerId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[playerId].angle = evt.ang;

            // extradataList がある場合はログ出力（必要に応じた処理を追加可能）
            //console.log("inventoryDrop: extradataList:", evt.extradataList);
          } else {
            //console.warn(`inventoryDrop: Player ${playerId} not found in playersStatus.`);
          }
          break;
        }
        case "inventoryUse": {
          const playerId = evt.id;
          if (playersStatus[playerId]) {
            //console.log(`inventoryUse: Updating inventory for player ${playerId}`);
            // インベントリの初期化（items をオブジェクトとして）
            /*             if (!playersStatus[playerId].inventory) {
                          playersStatus[playerId].inventory = { items: {} };
                        }
                        // 既存の数量に対して、今回の使用数量を減算（なければ 0 から）
                        const currentQuantity = playersStatus[playerId].inventory.items[evt.item] || 0;
                        const newQuantity = currentQuantity - evt.quantity;
                        if (newQuantity <= 0) {
                          //console.log(`inventoryUse: Removing item "${evt.item}" because quantity dropped to ${newQuantity}`);
                          delete playersStatus[playerId].inventory.items[evt.item];
                        } else {
                          playersStatus[playerId].inventory.items[evt.item] = newQuantity;
                          //console.log(`inventoryUse: Updated quantity of "${evt.item}" is ${newQuantity}`);
                        } */

            // hp 関連の更新
            playersStatus[playerId].currentHealth = evt.hp[0];
            playersStatus[playerId].maxHealth = evt.hp[1];
            playersStatus[playerId].shieldHealth = evt.hp[2];
            playersStatus[playerId].shieldMaxHealth = evt.hp[3];

            // 位置情報と角度の更新
            playersStatus[playerId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[playerId].angle = evt.ang;
          } else {
            console.warn(`inventoryUse: Player ${playerId} not found in playersStatus.`);
          }
          break;
        }

        case "BannerCollected": {
          // バナー回収者の処理
          const collectorId = evt.id;
          if (playersStatus[collectorId]) {
            //console.log(`BannerCollected: Updating collector ${collectorId}`);
            // hp関連の更新
            playersStatus[collectorId].currentHealth = evt.hp[0];
            playersStatus[collectorId].maxHealth = evt.hp[1];
            playersStatus[collectorId].shieldHealth = evt.hp[2];
            playersStatus[collectorId].shieldMaxHealth = evt.hp[3];
            // 位置と角度の更新
            playersStatus[collectorId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[collectorId].angle = evt.ang;
            // バナー回収回数の更新（初回は初期化）
            if (!playersStatus[collectorId].bannerCollected) {
              playersStatus[collectorId].bannerCollected = { total: 0 };
            }
            playersStatus[collectorId].bannerCollected.total += 1;
            // 最後に回収した対象プレイヤーのIDを記録
            if (evt.collected && evt.collected.id) {
              playersStatus[collectorId].lastBannerCollected = evt.collected.id;
            }
          } else {
            console.warn(`BannerCollected: Collector ${collectorId} not found in playersStatus.`);
          }

          // 回収対象プレイヤーの処理
          if (evt.collected && evt.collected.id) {
            const collectedId = evt.collected.id;
            if (playersStatus[collectedId]) {
              //console.log(`BannerCollected: Marking collected player ${collectedId}`);
              // ここでは単純に bannerLost フラグを設定（必要に応じて詳細な処理を追加可能）
              playersStatus[collectedId].bannerLost = true;
            } else {
              console.warn(`BannerCollected: Collected player ${collectedId} not found in playersStatus.`);
            }
          } else {
            console.warn("BannerCollected: No collected player id provided.");
          }
          break;
        }

        case "playerAbilityUsed": {
          const playerId = evt.id;
          if (playersStatus[playerId]) {
            //console.log(`playerAbilityUsed: Updating ability usage for player ${playerId}`);
            // hp関連の更新
            playersStatus[playerId].currentHealth = evt.hp[0];
            playersStatus[playerId].maxHealth = evt.hp[1];
            playersStatus[playerId].shieldHealth = evt.hp[2];
            playersStatus[playerId].shieldMaxHealth = evt.hp[3];
            // 位置情報と角度の更新
            playersStatus[playerId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[playerId].angle = evt.ang;
            // abilityUseCount の更新（初回なら 0 からスタート）
            if (typeof playersStatus[playerId].abilityUseCount !== "number") {
              playersStatus[playerId].abilityUseCount = 0;
            }
            playersStatus[playerId].abilityUseCount += 1;
            // 最後に使用した能力の情報を記録（character と linkedentity）
            playersStatus[playerId].lastAbilityUsed = {
              character: evt.character,
              linkedentity: evt.linkedentity
            };
          } else {
            console.warn(`playerAbilityUsed: Player ${playerId} not found in playersStatus.`);
          }
          break;
        }

        case "LegendUpgradeSelected": {
          const playerId = evt.id;
          if (playersStatus[playerId]) {
            //console.log(`LegendUpgradeSelected: Updating legend upgrade for player ${playerId}`);
            // hp関連の更新
            playersStatus[playerId].currentHealth = evt.hp[0];
            playersStatus[playerId].maxHealth = evt.hp[1];
            playersStatus[playerId].shieldHealth = evt.hp[2];
            playersStatus[playerId].shieldMaxHealth = evt.hp[3];
            // 位置情報と角度の更新
            playersStatus[playerId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[playerId].angle = evt.ang;
            // レジェンドアップグレードの情報を保存
            playersStatus[playerId].legendUpgrade = {
              character: evt.character,
              upgradename: evt.upgradename,
              upgradedesc: evt.upgradedesc,
              level: evt.level
            };
          } else {
            console.warn(`LegendUpgradeSelected: Player ${playerId} not found in playersStatus.`);
          }
          break;
        }

        case "ziplineUsed": {
          const playerId = evt.id;
          if (playersStatus[playerId]) {
            //console.log(`ziplineUsed: Updating zipline usage for player ${playerId}`);
            // hp 関連の更新
            playersStatus[playerId].currentHealth = evt.hp[0];
            playersStatus[playerId].maxHealth = evt.hp[1];
            playersStatus[playerId].shieldHealth = evt.hp[2];
            playersStatus[playerId].shieldMaxHealth = evt.hp[3];
            // 位置情報と角度の更新
            playersStatus[playerId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[playerId].angle = evt.ang;
            // Zipline 使用情報の更新
            // 使用回数の更新
            if (typeof playersStatus[playerId].ziplineUseCount !== "number") {
              playersStatus[playerId].ziplineUseCount = 0;
            }
            playersStatus[playerId].ziplineUseCount += 1;
            // 直近使用した zipline の linkedentity を保存
            playersStatus[playerId].lastZiplineUsed = evt.linkedentity;
          } else {
            console.warn(`ziplineUsed: Player ${playerId} not found in playersStatus.`);
          }
          break;
        }
        case "grenadeThrown": {
          const playerId = evt.id;
          if (playersStatus[playerId]) {
            //console.log(`grenadeThrown: Updating grenade thrown info for player ${playerId}`);
            // hp 関連の更新
            playersStatus[playerId].currentHealth = evt.hp[0];
            playersStatus[playerId].maxHealth = evt.hp[1];
            playersStatus[playerId].shieldHealth = evt.hp[2];
            playersStatus[playerId].shieldMaxHealth = evt.hp[3];
            // 位置情報と角度の更新
            playersStatus[playerId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[playerId].angle = evt.ang;
            // grenadeThrownCount の更新（初回なら 0 から初期化）
            if (typeof playersStatus[playerId].grenadeThrownCount !== "number") {
              playersStatus[playerId].grenadeThrownCount = 0;
            }
            playersStatus[playerId].grenadeThrownCount += 1;
            // 最後に投げたグレネードの種類を記録
            playersStatus[playerId].lastGrenadeThrown = evt.linkedentity;
          } else {
            console.warn(`grenadeThrown: Player ${playerId} not found in playersStatus.`);
          }
          break;
        }

        case "BlackMarketAction": {
          const playerId = evt.id;
          if (playersStatus[playerId]) {
            //console.log(`BlackMarketAction: Updating player ${playerId}`);
            // hp 関連の更新
            playersStatus[playerId].currentHealth = evt.hp[0];
            playersStatus[playerId].maxHealth = evt.hp[1];
            playersStatus[playerId].shieldHealth = evt.hp[2];
            playersStatus[playerId].shieldMaxHealth = evt.hp[3];
            // 位置情報と角度の更新
            playersStatus[playerId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[playerId].angle = evt.ang;
            // BlackMarket の使用情報更新
            if (!playersStatus[playerId].blackMarket) {
              // 既存の構造に合わせ初期化
              playersStatus[playerId].blackMarket = { useCount: 0, items: {} };
            }
            playersStatus[playerId].blackMarket.useCount += 1;
            // 使用アイテムのカウントを更新
            const currentCount = playersStatus[playerId].blackMarket.items[evt.item] || 0;
            playersStatus[playerId].blackMarket.items[evt.item] = currentCount + 1;
          } else {
            console.warn(`BlackMarketAction: Player ${playerId} not found in playersStatus.`);
          }
          break;
        }

        case "wraithPortal": {
          const playerId = evt.id;
          if (playersStatus[playerId]) {
            //console.log(`wraithPortal: Updating player ${playerId}`);
            // hp 関連の更新
            playersStatus[playerId].currentHealth = evt.hp[0];
            playersStatus[playerId].maxHealth = evt.hp[1];
            playersStatus[playerId].shieldHealth = evt.hp[2];
            playersStatus[playerId].shieldMaxHealth = evt.hp[3];
            // 位置情報と角度の更新
            playersStatus[playerId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[playerId].angle = evt.ang;
            // wraithPortal 使用回数の更新
            if (typeof playersStatus[playerId].wraithPortalUseCount !== "number") {
              playersStatus[playerId].wraithPortalUseCount = 0;
            }
            playersStatus[playerId].wraithPortalUseCount += 1;
          } else {
            console.warn(`wraithPortal: Player ${playerId} not found in playersStatus.`);
          }
          break;
        }

        case "WarpGateUsed": {
          break;
        }
        case "ammoUsed": {
          const playerId = evt.id;
          if (playersStatus[playerId]) {
            //console.log(`ammoUsed: Updating ammo usage for player ${playerId}`);
            // hp 関連の更新
            playersStatus[playerId].currentHealth = evt.hp[0];
            playersStatus[playerId].maxHealth = evt.hp[1];
            playersStatus[playerId].shieldHealth = evt.hp[2];
            playersStatus[playerId].shieldMaxHealth = evt.hp[3];
            // 位置情報と角度の更新
            playersStatus[playerId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[playerId].angle = evt.ang;
            // AmmoUsed の情報を記録（最新の弾薬使用状況）
            playersStatus[playerId].lastAmmoUsed = {
              ammotype: evt.ammotype,
              amountused: evt.amountused,
              oldammocount: evt.oldammocount,
              newammocount: evt.newammocount
            };
            // オプション：インベントリ内の弾薬数を更新する場合は以下のようにする

            /*             if (playersStatus[playerId].inventory && playersStatus[playerId].inventory.ammo) {
                          playersStatus[playerId].inventory.ammo[evt.ammotype] = evt.newammocount;
                        } */

          } else {
            console.warn(`ammoUsed: Player ${playerId} not found in playersStatus.`);
          }
          break;
        }

        case "weaponSwitched": {
          const playerId = evt.id;
          if (playersStatus[playerId]) {
            //console.log(`weaponSwitched: Updating weapon for player ${playerId}`);
            // 基本情報の更新
            playersStatus[playerId].currentHealth = evt.hp[0];
            playersStatus[playerId].maxHealth = evt.hp[1];
            playersStatus[playerId].shieldHealth = evt.hp[2];
            playersStatus[playerId].shieldMaxHealth = evt.hp[3];
            playersStatus[playerId].eventPos = {
              x: evt.pos[0],
              y: evt.pos[1],
              z: evt.pos[2]
            };
            playersStatus[playerId].angle = evt.ang;
            // 武器情報の更新
            playersStatus[playerId].oldWeapon = evt.oldweapon; // 古い武器を記録
            playersStatus[playerId].inHand = evt.newweapon;      // 新しい武器に更新
          } else {
            console.warn(`weaponSwitched: Player ${playerId} not found in playersStatus.`);
          }
          break;
        }

      }
      // イベントの保存前にカウンターをインクリメント
      eventCounter++;
      const eventId = `${matchId}_${eventCounter}`;
      evt["matchId"] = matchId;
      evt["timestamp"] = currentTime;
      evt["id"] = eventId;

      eventKeys.push(eventId);
      chunkEvents.push(evt);
      if (chunkEvents.length >= CHUNK_SIZE) {
        saveIndexedDB({ type: "saveEventChunk", events: chunkEvents.slice() });
        chunkEvents = [];
      }
    });
    if (chunkEvents.length > 0) {
      saveIndexedDB({ type: "saveEventChunk", events: chunkEvents.slice() });
      chunkEvents = [];
    }
  }
  return events;
}

// calculateRingStatus: リングの現在状態を更新し、ドーナッツ型ポリゴンの頂点配列を生成
function calculateRingStatus(ringStatus, currentTime, numPoints = 64) {
  //console.log("calculateRingStatus: currentTime =", currentTime);

  // イベントが来る前は、startTimeStamp が未定義または currentTime が startTimeStamp より前の場合
  if (ringStatus.startTimeStamp === undefined || currentTime < ringStatus.startTimeStamp) {
    //console.log("No ring contraction event yet. Using default inner ring: center (0,0), radius = 2048");
    // 固定値として設定：内円は (0,0) 半径 2048
    ringStatus.current = { x: 0, y: 0 };
    ringStatus.currentRadius = 3000;
  } else {
    // イベントが発生している場合の補間処理
    //const elapsed = currentTime - ringStatus.startTimeStamp;
    const elapsed = (currentTime - ringStatus.startTimeStamp) / 1000;
    //console.log("Elapsed time since startTimeStamp:", elapsed, "seconds");
    if (elapsed < ringStatus.endTime) {
      const ratio = elapsed / ringStatus.endTime;
      //console.log("Interpolation ratio:", ratio);

      //console.log("Before interpolation - current.x:", ringStatus.current.x, "target.x:", ringStatus.target.x);
      ringStatus.current.x = ringStatus.current.x + ratio * (ringStatus.target.x - ringStatus.current.x);
      //console.log("After interpolation - current.x:", ringStatus.current.x);

      //console.log("Before interpolation - current.y:", ringStatus.current.y, "target.y:", ringStatus.target.y);
      ringStatus.current.y = ringStatus.current.y + ratio * (ringStatus.target.y - ringStatus.current.y);
      //console.log("After interpolation - current.y:", ringStatus.current.y);

      //console.log("Before interpolation - currentRadius:", ringStatus.currentRadius, "targetRadius:", ringStatus.targetRadius);
      ringStatus.currentRadius = ringStatus.currentRadius + ratio * (ringStatus.targetRadius - ringStatus.currentRadius);
      //console.log("After interpolation - currentRadius:", ringStatus.currentRadius);
    } else {
      //console.log("Elapsed time exceeds endTime. Setting current values to target values.");
      ringStatus.current = { ...ringStatus.target };
      ringStatus.currentRadius = ringStatus.targetRadius;
    }
  }

  ringStatus.currentTime = currentTime;
  //console.log("Updated ringStatus.currentTime:", ringStatus.currentTime);

  // 外側リングは固定: center [0,0]、半径 4000
  const outerCenter = [0, 0];
  const outerRadius = 4000;
  const outerPoints = createCirclePoints(outerCenter, outerRadius, numPoints);
  //console.log("Computed outerPoints (first 3 points):", outerPoints.slice(0, 3));

  // 内側リングは現在のリング状態を利用（イベント前は (0,0) 半径 2048 になる）
  const innerCenter = [ringStatus.current.x, -ringStatus.current.y];
  //console.log("innerCenter computed as:", innerCenter);
  const innerPoints = createCirclePoints(innerCenter, ringStatus.currentRadius, numPoints);
  //console.log("Computed innerPoints before reverse (first 3 points):", innerPoints.slice(0, 3));
  innerPoints.reverse(); // 内側リングは穴として反転
  //console.log("Computed innerPoints after reverse (first 3 points):", innerPoints.slice(0, 3));

  //console.log("calculateRingStatus returning updated ringStatus and polygon points.");
  return { ringStatus, outerPoints, innerPoints };
}

function createCirclePoints(center, radius, numPoints = 64) {
  //console.log("createCirclePoints: center =", center, "radius =", radius, "numPoints =", numPoints);
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const x = center[0] + radius * Math.cos(angle);
    const y = center[1] - radius * Math.sin(angle);
    points.push([x, y]);
  }
  //console.log("createCirclePoints generated", points.length, "points.");
  return points;
}



// --- 新フォーマット用フレーム生成関数 ---
// frameData の players はオブジェクト（キーが nucleusHash）で渡す
function createFrame(frameData) {
  // markers の作成：全プレイヤー分の位置情報を抽出
  const markers = [];
  for (const key in frameData.players) {
    const player = frameData.players[key];
    // player.posには、packet処理時に最終決定した座標が入っているはず
    markers.push({
      position: [player.pos.x, -player.pos.y],
      nucleusHash: player.nucleusHash,
      teamId: player.teamId,
      status: player.status
    });
  }

  // ringPolygon の作成はそのまま
  let ringPolygon = {};
  if (frameData.ring && frameData.ring.outerPoints && frameData.ring.innerPoints) {
    ringPolygon = {
      polygon: [frameData.ring.outerPoints, frameData.ring.innerPoints]
    };
  }

  // players から不要なposプロパティを除去
  const players = {};
  for (const key in frameData.players) {
    const { pos, ...rest } = frameData.players[key];
    players[key] = rest;
  }

  return {
    markers,
    ringPolygon,
    players
  };
}

// フレーム用データ作成関数
// ※ playersStatus をそのままオブジェクトとして渡す
function createFrameData(matchId, timestamp, playersStatus, currentRing) {
  return {
    matchId: matchId,
    timestamp: timestamp,
    players: playersStatus,
    ring: currentRing, // currentRing は { outerPoints, innerPoints } を含む
  };
}

// ----- パケット処理 -----
// frameCounter を初期化（フレームの通し番号）
let frameCounter = 1;
let prevPositions = {};

async function packetListprocess(packetList, packetSortedKeys, matchId, playersStatus, ringStatus, processedFrames) {
  packetSortedKeys.forEach(key => {
    const packet = packetList[key];
    const currentTime = packet.t;
    if (packet.events.length >= 1) {
      // イベントによる playersStatus の更新
      eventProcessing(packet.events, playersStatus, ringStatus, currentTime, matchId);
    }
    // packet.data による playersStatus の更新
    dataProcessing(packet.data, playersStatus);

    // 各プレイヤーの最終的な位置 (pos) を決定する
    for (const key in playersStatus) {
      let finalPos;
      if (playersStatus[key].eventPos) {
        // イベントデータにposがあればそれを採用
        finalPos = playersStatus[key].eventPos;
      } else if (playersStatus[key].dataPos) {
        // 次にdataのposを採用
        finalPos = playersStatus[key].dataPos;
      } else if (prevPositions[key]) {
        // どちらもなければ前フレームのpos
        finalPos = prevPositions[key];
      } else {
        // どれもなければデフォルトの0,0座標（zは0とする）
        finalPos = { x: 0, y: 0, z: 0 };
      }
      // 最終決定したposをplayersStatusにセット
      playersStatus[key].pos = finalPos;
      // 次フレームのためにprevPositionsを更新
      prevPositions[key] = finalPos;
      // 一時プロパティはクリア
      delete playersStatus[key].eventPos;
      delete playersStatus[key].dataPos;
    }

    // リングの現在状態計算
    const currentRing = calculateRingStatus(ringStatus, currentTime);
    // frameData の作成
    const frameData = createFrameData(matchId, currentTime, playersStatus, currentRing);
    // 新フォーマットのフレーム生成
    const newFrame = createFrame(frameData);
    // 生存プレーヤーを抽出（status が "alive" としている前提）
    const alivePlayers = Object.values(playersStatus).filter(p => p.status === "alive");
    const alivePlayerCount = alivePlayers.length;
    // 生存プレーヤーのチームIDを一意に集計
    const aliveTeamCount = new Set(alivePlayers.map(p => p.teamId)).size;
    // フレームID・タイトルを設定
    newFrame.id = `${matchId}_${frameCounter}`;
    newFrame.title = `${matchId}_${frameCounter}`;
    newFrame.matchId = matchId;
    newFrame.timestamp = currentTime;
    newFrame.ringCount = ringCount;
    newFrame.alivePlayerCount = alivePlayerCount;
    newFrame.aliveTeamCount = aliveTeamCount;
    processedFrames.push(newFrame);
    chunkFrames.push(newFrame);
    frameCounter++;

    if (chunkFrames.length >= CHUNK_SIZE) {
      saveIndexedDB({ type: "saveFrameChunk", frames: chunkFrames.slice() });
      chunkFrames = [];
    }
  });
  if (chunkFrames.length > 0) {
    saveIndexedDB({ type: "saveFrameChunk", frames: chunkFrames.slice() });
    chunkFrames = [];
  }
}

// トレイル生成：フレーム群から各プレイヤーの位置履歴を作成
async function processTrailsFromFrames(frames, playersReference, matchId) {
  //console.log("軌跡の処理開始");
  const trails = {};
  //console.log("プレーヤー毎の軌跡の器を作成");
  Object.keys(playersReference).forEach(playerId => {
    if (!(playerId in playersReference)) {
      return;
    }
    const teamId = playersReference[playerId].teamId;
    if (teamId == 0 || teamId == 1) { return; }
    trails[playerId] = {
      id: `${matchId}_${playerId}`,
      teamId: teamId,
      matchId: matchId,
      playerId: playerId,
      trail: []
    };
  });
  frames.forEach(frame => {
    const timestamp = frame.timestamp;
    // markers 配列から各プレイヤーの位置情報を取得
    frame.markers.forEach(marker => {
      const playerId = marker.nucleusHash;
      if (trails[playerId]) {
        trails[playerId].trail.push({
          timestamp,
          x: marker.position[0],
          y: marker.position[1]
        });
      }
    });
  });
  // 各プレイヤーのトレイルを timestamp 順にソート
  Object.values(trails).forEach(trailObj => {
    trailObj.trail.sort((a, b) => a.timestamp - b.timestamp);
  });
  return Object.values(trails);
}


const MAX_WORKERS = 30;
const workerPool = []; // { worker: Worker, busy: boolean } の配列
const taskQueue = [];

// プールの初期化
for (let i = 0; i < MAX_WORKERS; i++) {
  const worker = new Worker("/AndeanWeb/workers/saveIndexedDBWorker.js");
  workerPool.push({ worker, busy: false });
}

// タスクを割り当てる関数
function dispatchTask() {
  if (taskQueue.length === 0) return; // タスクがなければ終了

  // idle なワーカーを探す
  const idleWorkerObj = workerPool.find(wObj => !wObj.busy);
  if (!idleWorkerObj) return; // idle なワーカーがない場合はそのまま待機

  // キューからタスクを取り出す
  const task = taskQueue.shift();
  idleWorkerObj.busy = true;

  // ワーカーの onmessage ハンドラ設定（各タスク実行時に設定し直す）
  idleWorkerObj.worker.onmessage = function (event) {
    if (event.data.type === "saveSuccess") {
      totalSavedItems++;
      if (totalItemsToSave === totalSavedItems && processCompleteSent) {
        self.postMessage({ type: "processComplete", matchId: globalMatchId });
      } else {
        self.postMessage({
          type: "progressUpdate",
          saved: totalSavedItems,
          total: totalItemsToSave,
          percent: `${Math.floor((totalSavedItems / totalItemsToSave) * 100)}%`
        });
      }
    } else if (event.data.type === "saveError") {
      console.error({ type: "processError", error: event.data.error });
      self.postMessage({ type: "processError", error: event.data.error });
    }
    // タスク完了後、ワーカーを idle に戻し、次のタスクを割り当てる
    idleWorkerObj.busy = false;
    dispatchTask();
  };

  // タスクのメッセージをワーカーに送信
  idleWorkerObj.worker.postMessage(task.message);
}

async function saveIndexedDB(message) {
  totalItemsToSave++;
  // タスクをキューに追加
  taskQueue.push({ message });
  // タスク割り当てを試みる
  dispatchTask();
  return true;
}

/* async function saveIndexedDB(message) {
  //console.log(message.type)
  totalItemsToSave++;
  const saveWorker = new Worker("/AndeanWeb/workers/saveIndexedDBWorker.js");
  saveWorker.onmessage = function (event) {
    if (event.data.type === "saveSuccess") {
      totalSavedItems++;
      if (totalItemsToSave === totalSavedItems && processCompleteSent) {
        //console.log("マッチデータ処理完了");
        self.postMessage({ type: "processComplete", matchId: globalMatchId });
      } else {
        self.postMessage({
          type: "progressUpdate",
          saved: totalSavedItems,
          total: totalItemsToSave,
          percent: `${Math.floor((totalSavedItems / totalItemsToSave) * 100)}%`
        });
      }
      saveWorker.terminate();
    } else if (event.data.type === "saveError") {
      console.error({ type: "processError", error: event.data.error });
      self.postMessage({ type: "processError", error: event.data.error });
    }
  };
  saveWorker.postMessage(message);
  return true;
} */

// ----- チャンク保存用のグローバル変数 -----
let chunkFrames = [];
let chunkEvents = [];
let chunkTrails = [];
let eventKeys = [];
let trailKeys = [];
let totalSavedItems = 0;
let totalItemsToSave = 0;
let ringCount = 0;
let globalMatchId = null;
let processCompleteSent = false;

// ----- メイン処理 -----
// processorWorker.js はメインスレッドから JSON 文字列を受信
self.onmessage = async function (e) {
  try {
    // ① JSON の検証・パース
    const jsonData = validateAndParse(e.data);
    const matchId = jsonData.matchName;
    globalMatchId = matchId;

    // ② 初期 playersStatus と ringStatus の生成
    const playersStatus = initPlayersStatus(jsonData.players);
    let ringStatus = calculateRingStatus(
      { current: { x: 0, y: 0 }, target: { x: 0, y: 0 }, targetRadius: 4000, endTime: 0 },
      0
    );

    // ③ packetLists を数値のキーでソート
    const packetSortedKeys = await Object.keys(jsonData.packetLists).map(Number).sort((a, b) => a - b);

    // フレーム用データを保存する配列（トレイル作成用にも利用）
    const processedFrames = [];

    // ※ マッチデータ（matchMeta）の保存はフレーム処理後に行うため、
    // 以下では matchWorker の起動は行わず、後ほど matchMeta を生成する

    // パケット処理（フレーム作成）
    await packetListprocess(jsonData.packetLists, packetSortedKeys, matchId, playersStatus, ringStatus, processedFrames);

    // ----- トレイルの処理：フレームデータから生成 -----
    const trails = await processTrailsFromFrames(processedFrames.concat([]), jsonData.players, matchId);

    // 生成された各トレイルのIDを trailKeys 配列に格納
    trailKeys = await trails.map(trail => trail.id);


    // トレイルの保存処理（全件保存が完了するまで待つ）
    await Promise.all(trails.map(trail => saveIndexedDB({ type: "saveTrail", trail: trail })));

    /* await trails.forEach(trail => {
      saveIndexedDB({ type: "saveTrail", trail: trail });
    }); */

    // ----- マッチデータの保存（フレーム作成後に実施） -----
    // metaKeys に指定されたキーの値を jsonData から抽出して matchMeta を生成
    const metaKeys = [
      "matchName",
      "startTimeStamp",
      "endTimeStamp",
      "players",
      "teams",
      "maxPlayers",
      "mapName",
      "playlistName",
      "playlistDesc",
      "datacenter",
      "aimassiston",
      "anonymousMode",
      "serverId",
      "startingLoadout"
    ];
    const matchMeta = {};
    metaKeys.forEach(key => {
      if (jsonData[key] !== undefined) {
        matchMeta[key] = jsonData[key];
      }
    });
    // フレーム総数も追加
    matchMeta.totalFrames = processedFrames.length;
    // フレームkeyをフレーム順に保存
    matchMeta.frameKeys = processedFrames.map(frame => frame.id);
    // 追加：イベントキーとトレイルキーを保存
    matchMeta.eventKeys = eventKeys;
    matchMeta.trailKeys = trailKeys;

    //console.log("Saving matchMeta:", matchMeta);
    await saveIndexedDB({ type: "saveMatchMeta", matchMeta: matchMeta });

    processCompleteSent = true;
  } catch (err) {
    //console.error({ type: "processError", error: err.message });
    self.postMessage({ type: "processError", error: err.message });
  }
};
