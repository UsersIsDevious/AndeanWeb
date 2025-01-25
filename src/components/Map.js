"use client"

import Image from "next/image"
import { useEffect, useState, useRef } from "react"
import CustomCircle from "./map/CustomCircle"
import PlayerMarker from "./map/PlayerMarker"
import PlayerTrail from "./map/PlayerTrail"
import SkullMarker from "./map/SkullMarker"
import MapControlPanel from "./map/MapControlPanel"
import ControlPanel from "./control-panel/ControlPanel"
import TimeControl from "./time-control/TimeControl"
import SurvivorsCounter from "./SurvivorsCounter"
import LeafletCSS from "./LeafletCSS"
import { BASE_PATH } from "../utils/constants"
import { teamColors, getTeamColor } from "../utils/teamColors"
import useMapLogic from "../hooks/useMapLogic"

const Map = ({ initialMatchData }) => {
  const {
    matchData,
    map,
    circleOptions,
    currentTime,
    isPlaying,
    currentPlayerData,
    maxTime,
    skullMarkers,
    isClient,
    L,
    showTeams0And1,
    customTeamColors,
    timelineEvents,
    play,
    pause,
    stop,
    handleJSONUpload,
    handleSettingsChange,
    updateCircle,
    updateTime,
    getCurrentPlayerData,
    getCurrentRingData,
    eliminatedTeams,
    survivingPlayers,
    survivingTeams,
    resetRingState,
    firstRingEventTime,
    playerTrails,
    showPlayerMarkers,
    showPlayerTrails,
    showSkullMarkers,
    showRingEvents,
    showTeamEliminationEvents,
    togglePlayerMarkers,
    togglePlayerTrails,
    toggleSkullMarkers,
    toggleRingEvents,
    toggleTeamEliminationEvents,
  } = useMapLogic(initialMatchData)

  if (!initialMatchData) {
    return <div>No match data available. Please input data first.</div>
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-grow flex overflow-hidden">
        <div id="map" className="w-3/4 h-full relative">
          <SurvivorsCounter survivingPlayers={survivingPlayers} survivingTeams={survivingTeams} />
          <MapControlPanel
            showPlayerMarkers={showPlayerMarkers}
            showPlayerTrails={showPlayerTrails}
            showSkullMarkers={showSkullMarkers}
            showRingEvents={showRingEvents}
            showTeamEliminationEvents={showTeamEliminationEvents}
            togglePlayerMarkers={togglePlayerMarkers}
            togglePlayerTrails={togglePlayerTrails}
            toggleSkullMarkers={toggleSkullMarkers}
            toggleRingEvents={toggleRingEvents}
            toggleTeamEliminationEvents={toggleTeamEliminationEvents}
          />
        </div>
        <div className="w-1/4 h-full flex flex-col">
          <div className="flex-grow overflow-y-auto">
            <ControlPanel
              updateCircle={updateCircle}
              players={matchData.players}
              teams={matchData.teams}
              currentPlayerData={currentPlayerData}
              onJSONUpload={handleJSONUpload}
              onSettingsChange={handleSettingsChange}
              showTeams0And1={showTeams0And1}
              customTeamColors={customTeamColors}
              ringEvents={timelineEvents}
              eliminatedTeams={eliminatedTeams}
            />
          </div>
        </div>
      </div>
      <TimeControl
        updateTime={updateTime}
        currentTime={currentTime}
        maxTime={maxTime}
        isPlaying={isPlaying}
        play={play}
        pause={pause}
        stop={stop}
        timelineEvents={timelineEvents}
        reset={stop}
      />
      {isClient && <LeafletCSS />}
      {map && L && (
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
              />
            ))}
          {showPlayerTrails &&
            Object.entries(playerTrails).map(([playerId, positions]) => (
              <PlayerTrail
                key={`trail-${playerId}`}
                map={map}
                positions={positions}
                color={getTeamColor(matchData.players[playerId].teamId)}
                L={L}
              />
            ))}
          {showSkullMarkers &&
            skullMarkers.map((marker, index) => (
              <SkullMarker key={`skull-${marker.startTime}-${index}`} map={map} position={marker.position} L={L} />
            ))}
        </>
      )}
    </div>
  )
}

export default Map

