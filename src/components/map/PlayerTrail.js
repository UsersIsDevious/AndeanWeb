"use client"

import { useEffect, useRef } from "react"

const PlayerTrail = ({ map, positions, color, L }) => {
  const polylineRef = useRef(null)

  useEffect(() => {
    if (map && positions && positions.length > 1 && L) {
      if (polylineRef.current) {
        polylineRef.current.remove()
      }

      polylineRef.current = L.polyline(positions, {
        color: color,
        weight: 2,
        opacity: 0.5,
      }).addTo(map)
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.remove()
      }
    }
  }, [map, positions, color, L])

  return null
}

export default PlayerTrail

