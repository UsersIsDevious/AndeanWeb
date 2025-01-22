"use client"

import { useEffect } from "react"

const LeafletCSS = () => {
  useEffect(() => {
    import("leaflet/dist/leaflet.css")
  }, [])

  return null
}

export default LeafletCSS

