'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import PlayerList from './PlayerList'

const ControlPanel = ({ 
  updateCircle,
  players,
  teams,
  currentPlayerData
}) => {
  const [color, setColor] = useState('#ff0000')

  const handleSubmit = (e) => {
    e.preventDefault()
    updateCircle({ color })
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="color">Ring Color:</Label>
          <Input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <Button type="submit">Update Ring Color</Button>
      </form>
      <PlayerList 
        players={players} 
        teams={teams} 
        currentPlayerData={currentPlayerData}
      />
    </div>
  )
}

export default ControlPanel

