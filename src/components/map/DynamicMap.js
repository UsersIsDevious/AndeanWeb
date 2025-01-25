"use client"

import { useEffect } from "react"
import CustomCircle from "./CustomCircle"
import PlayerMarker from "./PlayerMarker"
import SkullMarker from "./SkullMarker"
import { getTeamColor } from "../../utils/teamColors"

const DynamicMap = ({ map, L, getCurrentRingData, getCurrentPlayerData, skullMarkers }) => {
  useEffect(() => {
    if (map) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
      document.head.appendChild(link)

      return () => {
        document.head.removeChild(link)
      }
    }
  }, [map])

  if (!map || !L) return <div id="map" className="w-3/4 h-full"></div>

  return (
    <div id="map" className="w-3/4 h-full">
      <CustomCircle map={map} options={getCurrentRingData()} L={L} />
      {getCurrentPlayerData().map((player) => (
        <PlayerMarker key={player.nucleusHash} map={map} player={player} color={getTeamColor(player.teamId)} L={L} />
      ))}
      {skullMarkers.map((marker, index) => (
        <SkullMarker key={`skull-${marker.startTime}-${index}`} map={map} position={marker.position} L={L} />
      ))}
    </div>
  )
}

export default DynamicMap

