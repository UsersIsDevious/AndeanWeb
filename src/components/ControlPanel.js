'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import PlayerList from './PlayerList'

const ControlPanel = ({ 
  updateCircle,
  players
}) => {
  const [center, setCenter] = useState([0, 0])
  const [radius, setRadius] = useState(500)
  const [color, setColor] = useState('#ff0000')
  const [shrinkTo, setShrinkTo] = useState(250)
  const [shrinkDelay, setShrinkDelay] = useState(5000)
  const [animationSpeed, setAnimationSpeed] = useState(1)

  const handleSubmit = (e) => {
    e.preventDefault()
    updateCircle({ center, radius, color, shrinkTo, shrinkDelay, animationSpeed })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="centerX">Center X:</Label>
          <Input
            id="centerX"
            type="number"
            value={center[0]}
            onChange={(e) => setCenter([Number(e.target.value), center[1]])}
          />
        </div>
        <div>
          <Label htmlFor="centerY">Center Y:</Label>
          <Input
            id="centerY"
            type="number"
            value={center[1]}
            onChange={(e) => setCenter([center[0], Number(e.target.value)])}
          />
        </div>
        <div>
          <Label htmlFor="radius">Radius:</Label>
          <Input
            id="radius"
            type="number"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="color">Color:</Label>
          <Input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="shrinkTo">Shrink To:</Label>
          <Input
            id="shrinkTo"
            type="number"
            value={shrinkTo}
            onChange={(e) => setShrinkTo(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="shrinkDelay">Shrink Delay (ms):</Label>
          <Input
            id="shrinkDelay"
            type="number"
            value={shrinkDelay}
            onChange={(e) => setShrinkDelay(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="animationSpeed">Animation Speed:</Label>
          <Input
            id="animationSpeed"
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
          />
        </div>
        <Button type="submit">Update Circle</Button>
      </form>
      <PlayerList players={players} />
    </div>
  )
}

export default ControlPanel

