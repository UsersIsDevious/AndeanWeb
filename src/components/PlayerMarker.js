'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

const PlayerMarker = ({ map, player, color }) => {
  const markerRef = useRef(null)

  useEffect(() => {
    if (map && player) {
      if (markerRef.current) {
        markerRef.current.remove()
      }

      const [x, y] = player.pos
      markerRef.current = L.circleMarker([y, x], {
        radius: 5,
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
      }).addTo(map)

      // Add a tooltip with player information
      markerRef.current.bindTooltip(`
        ID: ${player.id.slice(0, 8)}...
        HP: ${player.hp[0]}/${player.hp[1]}
        Shield: ${player.hp[2]}/${player.hp[3]}
        Pos: (${x.toFixed(2)}, ${y.toFixed(2)})
      `, { permanent: false, direction: 'top' })
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
      }
    }
  }, [map, player, color])

  return null
}

export default PlayerMarker
