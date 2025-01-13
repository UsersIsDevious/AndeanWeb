'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

const CustomCircle = ({ map, options }) => {
  const circleRef = useRef(null)

  useEffect(() => {
    if (map && options) {
      if (circleRef.current) {
        circleRef.current.remove()
      }

      circleRef.current = L.circle(options.center, {
        radius: options.radius,
        color: options.color,
        fill: false,
        weight: 3
      }).addTo(map)
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.remove()
      }
    }
  }, [map, options])

  return null
}

export default CustomCircle

