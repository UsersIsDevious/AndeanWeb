import { useEffect } from "react"
import dynamic from "next/dynamic"
import MapControlPanel from "./MapControlPanel"
import ControlPanel from "../ControlPanel/ControlPanel"
import TimeControl from "../TimeControl/TimeControl"
import SurvivorsCounter from "../SurvivorsCounter"
import LeafletCSS from "../LeafletCSS"
import useMapLogic from "../../hooks/useMapLogic"

const DynamicMap = dynamic(() => import("./DynamicMap"), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
})

const Map = ({ initialMatchData }) => {
  const mapLogic = useMapLogic(initialMatchData)

  const {
    matchData,
    map,
    L,
    isClient,
    currentTime,
    maxTime,
    isPlaying,
    survivingPlayers,
    survivingTeams,
    play,
    pause,
    stop,
    updateTime,
    handleJSONUpload,
    handleSettingsChange,
    updateCircle,
    getNearestPacketTime,
  } = mapLogic

  useEffect(() => {
    if (!map && matchData) {
      mapLogic.initializeMap()
    }
  }, [map, matchData, mapLogic])

  if (!initialMatchData) {
    return <div>No match data available. Please input data first.</div>
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-grow flex overflow-hidden">
        <div id="map" className="w-3/4 h-full relative">
          <SurvivorsCounter survivingPlayers={survivingPlayers} survivingTeams={survivingTeams} />
          <MapControlPanel {...mapLogic} />
        </div>
        <div className="w-1/4 h-full flex flex-col">
          <div className="flex-grow overflow-y-auto">
            <ControlPanel
              updateCircle={updateCircle}
              players={matchData.players}
              teams={matchData.teams}
              currentPlayerData={mapLogic.currentPlayerData}
              onJSONUpload={handleJSONUpload}
              onSettingsChange={handleSettingsChange}
              showTeams0And1={mapLogic.showTeams0And1}
              customTeamColors={mapLogic.customTeamColors}
              ringEvents={mapLogic.timelineEvents}
              eliminatedTeams={mapLogic.eliminatedTeams}
              playerTrailVisibility={mapLogic.playerTrailVisibility}
              togglePlayerTrail={mapLogic.togglePlayerTrail}
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
        timelineEvents={mapLogic.timelineEvents}
        reset={stop}
        nearestPacketTime={getNearestPacketTime(currentTime)}
      />
      {isClient && <LeafletCSS />}
      {map && L && <DynamicMap mapLogic={mapLogic} />}
    </div>
  )
}

export default Map

