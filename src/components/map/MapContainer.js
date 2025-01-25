"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"
import ControlPanel from "../control-panel/ControlPanel"
import TimeControl from "../time-control/TimeControl"
import useMapLogic from "../../hooks/useMapLogic"
import { BASE_PATH } from "../../utils/constants"

const DynamicMap = dynamic(() => import("./DynamicMap"), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
})

const MapContainer = ({ initialMatchData }) => {
  const {
    matchData,
    map,
    circleOptions,
    currentTime,
    isPlaying,
    currentPlayerData,
    maxTime,
    skullMarkers,
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
  } = useMapLogic(initialMatchData)

  useEffect(() => {
    if (typeof window !== "undefined" && !map && matchData) {
      import("leaflet").then((LeafletModule) => {
        const customCRS = LeafletModule.default.extend({}, LeafletModule.default.CRS.Simple, {
          transformation: new LeafletModule.default.Transformation(1, 2048, -1, 2048),
          projection: {
            project: (latlng) => new LeafletModule.default.Point(latlng.lat, latlng.lng),
            unproject: (point) => new LeafletModule.default.LatLng(point.x, point.y),
          },
          bounds: LeafletModule.default.bounds([-2048, -2048], [2048, 2048]),
        })

        const newMap = LeafletModule.default.map("map", {
          crs: customCRS,
          minZoom: -3,
          maxZoom: 3,
          center: [0, 0],
          zoom: 0,
        })

        const bounds = [
          [-2048, -2048],
          [2048, 2048],
        ]
        LeafletModule.default.imageOverlay(`${BASE_PATH}/img/${matchData.mapName}.png`, bounds).addTo(newMap)

        newMap.fitBounds(bounds)
      })
    }
  }, [map, matchData])

  if (!initialMatchData) {
    return <div>No match data available. Please input data first.</div>
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-grow flex overflow-hidden">
        <DynamicMap
          map={map}
          L={L}
          getCurrentRingData={getCurrentRingData}
          getCurrentPlayerData={getCurrentPlayerData}
          skullMarkers={skullMarkers}
        />
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
      />
    </div>
  )
}

export default MapContainer

