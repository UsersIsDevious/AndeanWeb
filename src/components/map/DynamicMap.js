import CustomCircle from "./CustomCircle"
import PlayerMarker from "./PlayerMarker"
import PlayerTrail from "./PlayerTrail"
import SkullMarker from "./SkullMarker"
import DamageLine from "./DamageLine"
import { getTeamColor } from "../../utils/teamColors"

const DynamicMap = ({ mapLogic }) => {
  const {
    map,
    L,
    showRingEvents,
    getCurrentRingData,
    firstRingEventTime,
    currentTime,
    showPlayerMarkers,
    getCurrentPlayerData,
    showPlayerTrails,
    playerTrails,
    playerTrailVisibility,
    matchData,
    showSkullMarkers,
    skullMarkers,
    showPlayerNames,
    showTeamNames,
    showPlayerStatus,
    getActiveDamageEvents,
    getActiveDownedPlayers,
  } = mapLogic

  const activeDamageEvents = getActiveDamageEvents()

  return (
    <>
      {showRingEvents && getCurrentRingData() && currentTime >= firstRingEventTime && (
        <CustomCircle
          map={map}
          options={{
            center: getCurrentRingData().center || [0, 0],
            radius: getCurrentRingData().radius || 4000,
            color: getCurrentRingData().color || "#ff0000",
          }}
          L={L}
        />
      )}
      {showPlayerMarkers &&
        getCurrentPlayerData().map((player) => (
          <PlayerMarker
            key={player.nucleusHash}
            map={map}
            player={player}
            color={getTeamColor(player.teamId)}
            L={L}
            showPlayerName={showPlayerNames}
            showTeamName={showTeamNames}
            showPlayerStatus={showPlayerStatus}
            isHighlighted={activeDamageEvents.some((event) => event.victim.id === player.nucleusHash)}
            isDowned={getActiveDownedPlayers().some((downedPlayer) => downedPlayer.id === player.nucleusHash)}
          />
        ))}
      {showPlayerTrails &&
        Object.entries(playerTrails).map(
          ([playerId, positions]) =>
            playerTrailVisibility[playerId] && (
              <PlayerTrail
                key={`trail-${playerId}`}
                map={map}
                positions={positions}
                color={getTeamColor(matchData.players[playerId].teamId)}
                L={L}
              />
            ),
        )}
      {showSkullMarkers &&
        skullMarkers.map((marker, index) => (
          <SkullMarker key={`skull-${marker.startTime}-${index}`} map={map} position={marker.position} L={L} />
        ))}
      {activeDamageEvents
        .filter((event) => event.attacker.id !== "World")
        .map((event, index) => (
          <DamageLine key={`damage-${index}`} map={map} attacker={event.attacker} victim={event.victim} L={L} />
        ))}
    </>
  )
}

export default DynamicMap

