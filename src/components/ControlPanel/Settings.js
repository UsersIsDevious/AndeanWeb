import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SettingsIcon, Palette } from "lucide-react"
import { teamColors } from "../../utils/teamColors.js"

const Settings = ({ updateCircle, onSettingsChange }) => {
  const [color, setColor] = useState("#ff0000")
  const [showTeams0And1, setShowTeams0And1] = useState(false)
  const [customTeamColors, setCustomTeamColors] = useState(teamColors)

  const handleColorChange = (e) => {
    const newColor = e.target.value
    setColor(newColor)
    updateCircle({ color: newColor })
  }

  const handleShowTeams0And1Change = (e) => {
    setShowTeams0And1(e.target.checked)
    onSettingsChange({ showTeams0And1: e.target.checked })
  }

  const handleTeamColorChange = (index, newColor) => {
    const updatedColors = [...customTeamColors]
    updatedColors[index] = newColor
    setCustomTeamColors(updatedColors)
    onSettingsChange({ customTeamColors: updatedColors })
  }

  return (
    <div className="space-y-6 p-6 bg-gray-100 rounded-lg">
      <div className="flex items-center space-x-2">
        <SettingsIcon className="w-6 h-6" />
        <h3 className="text-lg font-semibold">Settings</h3>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="ringColor" className="flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span>Ring Color:</span>
          </Label>
          <Input id="ringColor" type="color" value={color} onChange={handleColorChange} className="h-10" />
        </div>
        <div>
          <Label htmlFor="showTeams0And1" className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showTeams0And1"
              checked={showTeams0And1}
              onChange={handleShowTeams0And1Change}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span>Show Teams 0 and 1</span>
          </Label>
        </div>
        <div>
          <Label className="flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span>Team Colors:</span>
          </Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {customTeamColors.map((color, index) => (
              <Input
                key={index}
                type="color"
                value={color}
                onChange={(e) => handleTeamColorChange(index, e.target.value)}
                className="h-8 w-8 p-0 border-none"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

