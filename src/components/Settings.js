import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SettingsIcon, Upload, Send, Palette } from "lucide-react"
import { teamColors } from "../utils/teamColors.js"

const Settings = ({ updateCircle, onJSONUpload, onSettingsChange }) => {
  const [color, setColor] = useState("#ff0000")
  const [jsonFile, setJsonFile] = useState(null)
  const [jsonInput, setJsonInput] = useState("")
  const [showTeams0And1, setShowTeams0And1] = useState(false)
  const [customTeamColors, setCustomTeamColors] = useState(teamColors)

  const handleColorChange = (e) => {
    const newColor = e.target.value
    setColor(newColor)
    updateCircle({ color: newColor })
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setJsonFile(e.target.files[0])
    }
  }

  const handleJSONUpload = () => {
    if (jsonFile) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result)
          onJSONUpload(jsonData)
        } catch (error) {
          console.error("Invalid JSON file:", error)
          alert("Invalid JSON file. Please check the file and try again.")
        }
      }
      reader.readAsText(jsonFile)
    }
  }

  const handleJSONInputSubmit = () => {
    try {
      const jsonData = JSON.parse(jsonInput)
      onJSONUpload(jsonData)
      setJsonInput("") // Clear the input after successful submission
    } catch (error) {
      console.error("Invalid JSON input:", error)
      alert("Invalid JSON input. Please check the input and try again.")
    }
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
          <Label htmlFor="jsonUpload" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload New JSON:</span>
          </Label>
          <div className="flex space-x-2">
            <Input id="jsonUpload" type="file" accept=".json" onChange={handleFileChange} className="flex-grow" />
            <Button onClick={handleJSONUpload} disabled={!jsonFile}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor="jsonInput" className="flex items-center space-x-2">
            <Send className="w-4 h-4" />
            <span>Input JSON:</span>
          </Label>
          <textarea
            id="jsonInput"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-32 p-2 border rounded"
            placeholder="Paste your JSON here"
          />
          <Button onClick={handleJSONInputSubmit} disabled={!jsonInput} className="mt-2">
            <Send className="w-4 h-4 mr-2" />
            Submit JSON
          </Button>
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

