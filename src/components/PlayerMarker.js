'use client'

import { useEffect, useRef } from 'react'

const PlayerMarker = ({ map, player, color, L }) => {
  const markerRef = useRef(null)

  useEffect(() => {
    if (map && player && player.hp[0] > 0) {
      if (markerRef.current) {
        markerRef.current.remove()
      }

      const [x, y] = player.pos
      markerRef.current = L.circleMarker([x, y], {
        radius: 5,
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
      }).addTo(map)

      // Add a tooltip with player information
      markerRef.current.bindTooltip(`
        ID: ${player.id}
        HP: ${player.hp[0]}/${player.hp[1]}
        Shield: ${player.hp[2]}/${player.hp[3]}
      `, { permanent: false, direction: 'top' })
    } else if (markerRef.current) {
      markerRef.current.remove()
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

