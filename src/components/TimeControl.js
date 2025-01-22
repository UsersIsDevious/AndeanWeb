"use client"

import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PlayIcon, PauseIcon, MonitorStopIcon as StopIcon } from "lucide-react"

const TimeControl = ({ updateTime, currentTime, maxTime, isPlaying, play, pause, stop }) => {
  const handleTimeChange = (value) => {
    updateTime(value[0], true)
  }

  return (
    <div className="space-y-4 p-4 bg-gray-100 rounded-t-lg">
      <div>
        <Label htmlFor="timeSlider">Time:</Label>
        <Slider id="timeSlider" min={0} max={maxTime} step={1} value={[currentTime]} onValueChange={handleTimeChange} />
        <div className="text-center">
          {(currentTime / 1000).toFixed(3)}s / {(maxTime / 1000).toFixed(3)}s (
          {((currentTime / maxTime) * 100).toFixed(2)}%)
        </div>
      </div>
      <div className="flex justify-center space-x-2">
        <Button type="button" onClick={play} disabled={isPlaying} className="p-2">
          <PlayIcon className="h-6 w-6" />
        </Button>
        <Button type="button" onClick={pause} disabled={!isPlaying} className="p-2">
          <PauseIcon className="h-6 w-6" />
        </Button>
        <Button type="button" onClick={stop} className="p-2">
          <StopIcon className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}

export default TimeControl

