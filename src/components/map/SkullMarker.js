"use client"

import { useEffect, useRef } from "react"

const SkullMarker = ({ map, position, L }) => {
  const markerRef = useRef(null)

  useEffect(() => {
    if (map && position && L) {
      const skullIcon = L.divIcon({
        html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>',
        className: "skull-icon",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      markerRef.current = L.marker(position, { icon: skullIcon }).addTo(map)
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
      }
    }
  }, [map, position, L])

  return null
}

export default SkullMarker

