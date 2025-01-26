"use client"

import { useState } from "react"
import Map from "../components/Map/Map"
import DataInput from "../components/DataInput"

export default function Home() {
  const [matchData, setMatchData] = useState(null)

  const handleDataSubmit = (data) => {
    setMatchData(data)
  }

  return (
    <main className="min-h-screen">
      {!matchData ? <DataInput onDataSubmit={handleDataSubmit} /> : <Map initialMatchData={matchData} />}
    </main>
  )
}

