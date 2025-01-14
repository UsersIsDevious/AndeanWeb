'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

const CustomCircle = ({ map, options }) => {
  const polygonRef = useRef(null)

  const createCirclePoints = (center, radius, numPoints = 64) => {
    const points = []
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * (2 * Math.PI)
      const x = center[0] + radius * Math.cos(angle)
      const y = center[1] + radius * Math.sin(angle)
      points.push([x, y])
    }
    return points
  }

  useEffect(() => {
    if (map && options) {
      if (polygonRef.current) {
        polygonRef.current.remove()
      }

      const outerCenter = [0, 0]
      const outerRadius = 4000
      const innerCenter = options.center
      const innerRadius = options.radius

      const outerPoints = createCirclePoints(outerCenter, outerRadius)
      const innerPoints = createCirclePoints(innerCenter, innerRadius)

      polygonRef.current = L.polygon([outerPoints, innerPoints.reverse()], {
        color: options.color,
        fillColor: options.color,
        fillOpacity: 0.2,
        weight: 2
      }).addTo(map)
    }

    return () => {
      if (polygonRef.current) {
        polygonRef.current.remove()
      }
    }
  }, [map, options])

  return null
}

export default CustomCircle

