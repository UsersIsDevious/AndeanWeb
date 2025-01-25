"use client"

import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  PlayIcon,
  PauseIcon,
  MonitorStopIcon as StopIcon,
  CircleDot,
  CircleOff,
  Skull,
  X,
  RotateCcw,
} from "lucide-react"

const TimeControl = ({
  updateTime,
  currentTime,
  maxTime,
  isPlaying,
  play,
  pause,
  stop,
  timelineEvents = [],
  reset,
}) => {
  const handleTimeChange = (value) => {
    updateTime(value[0], true)
  }

  const handlePinClick = (time) => {
    updateTime(time, true)
  }

  const getEventIcon = (event) => {
    switch (event.type) {
      case "ringStartClosing":
        return <CircleDot className="h-4 w-4 text-blue-500" />
      case "ringFinishedClosing":
        return <CircleOff className="h-4 w-4 text-red-500" />
      case "playerKilled":
        return <Skull className="h-4 w-4 text-gray-500" />
      case "squadEliminated":
        return <X className="h-4 w-4" style={{ color: event.color }} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4 p-4 bg-gray-100 rounded-t-lg">
      <div className="relative">
        <Label htmlFor="timeSlider">Time:</Label>
        <Slider
          id="timeSlider"
          min={0}
          max={maxTime}
          step={1}
          value={[currentTime]}
          onValueChange={handleTimeChange}
          className="mt-2"
        />
        <div className="absolute top-0 left-0 right-0">
          {timelineEvents &&
            timelineEvents.map((event, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="p-0 h-auto absolute transform -translate-y-full"
                style={{ left: `${(event.time / maxTime) * 100}%` }}
                onClick={() => handlePinClick(event.time)}
              >
                {getEventIcon(event)}
              </Button>
            ))}
        </div>
      </div>
      <div className="text-center">
        {(currentTime / 1000).toFixed(3)}s / {(maxTime / 1000).toFixed(3)}s (
        {((currentTime / maxTime) * 100).toFixed(2)}
        %)
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
        <Button type="button" onClick={reset} className="p-2">
          <RotateCcw className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}

export default TimeControl

