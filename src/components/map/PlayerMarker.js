"use client"

import { useEffect, useRef } from "react"

const PlayerMarker = ({
  map,
  player,
  color,
  L,
  showPlayerName,
  showTeamName,
  showPlayerStatus,
  isHighlighted,
  isDowned,
}) => {
  const markerRef = useRef(null)

  useEffect(() => {
    if (map && player && player.hp[0] > 0) {
      if (!player.pos || player.pos[0] === undefined || player.pos[1] === undefined) {
        console.warn(`Invalid coordinates for player ${player.id}:`, player.pos)
        return
      }
      if (markerRef.current) {
        markerRef.current.remove()
      }

      const [x, y] = player.pos
      markerRef.current = L.circleMarker([x, y], {
        radius: 5,
        color: isDowned ? "yellow" : isHighlighted ? "white" : color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: isDowned ? 2 : isHighlighted ? 3 : 1,
        dashArray: isDowned ? "5, 5" : null,
      }).addTo(map)

      // Add a tooltip with player information
      let tooltipContent = ``
      if (showTeamName) {
        tooltipContent += `Team: ${player.teamName}<br>`
      }
      if (showPlayerName) {
        tooltipContent += `${player.name}<br>`
      }
      if (showPlayerStatus) {
        tooltipContent += `
          HP: ${player.hp[0]}/${player.hp[1]}<br>
          Shield: ${player.hp[2]}/${player.hp[3]}
        `
      }
      if (isDowned) {
        tooltipContent += `<br><strong>DOWNED</strong>`
      }

      markerRef.current.bindTooltip(tooltipContent, {
        permanent: showPlayerName || showTeamName || showPlayerStatus,
        direction: "top",
      })
    } else if (markerRef.current) {
      markerRef.current.remove()
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
      }
    }
  }, [map, player, color, L, showPlayerName, showTeamName, showPlayerStatus, isHighlighted, isDowned])

  return null
}

export default PlayerMarker

