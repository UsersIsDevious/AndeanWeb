"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import PlayerList from "./PlayerList.js"
import Settings from "./Settings.js"
import { SettingsIcon } from "lucide-react"

const ControlPanel = ({ updateCircle, players, teams, currentPlayerData, onJSONUpload }) => {
  const [color, setColor] = useState("#ff0000")
  const [showSettings, setShowSettings] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    updateCircle({ color })
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <Button onClick={() => setShowSettings(!showSettings)} className="mb-4 flex items-center space-x-2">
        <SettingsIcon className="w-4 h-4" />
        <span>{showSettings ? "Hide Settings" : "Show Settings"}</span>
      </Button>
      {showSettings && <Settings updateCircle={updateCircle} onJSONUpload={onJSONUpload} />}
      <PlayerList players={players} teams={teams} currentPlayerData={currentPlayerData} />
    </div>
  )
}

export default ControlPanel

