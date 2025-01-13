"use client"
import { useState, useEffect } from 'react'
import Map from '../components/Map'

export default function Home() {
  const [maxTime, setMaxTime] = useState(0)

  useEffect(() => {
    // Fetch or calculate the max time here
    const fetchedMaxTime = 257.25 // This should be the maximum of the last timestamp and the shrinkduration
    setMaxTime(fetchedMaxTime)
  }, [])

  return (
    <main className="min-h-screen">
      <Map maxTime={maxTime} />
    </main>
  )
}

