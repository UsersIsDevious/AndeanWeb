import { useEffect, useRef } from "react"

const DamageLine = ({ map, attacker, victim, L }) => {
  const lineRef = useRef(null)

  useEffect(() => {
    if (map && attacker && victim && L) {
      if (lineRef.current) {
        lineRef.current.remove()
      }

      lineRef.current = L.polyline([attacker.pos, victim.pos], {
        color: "red",
        weight: 2,
        opacity: 0.7,
        dashArray: "5, 5",
      }).addTo(map)
    }

    return () => {
      if (lineRef.current) {
        lineRef.current.remove()
      }
    }
  }, [map, attacker, victim, L])

  return null
}

export default DamageLine

