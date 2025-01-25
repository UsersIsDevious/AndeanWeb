import type React from "react"
import { Button } from "@/components/ui/button"
import { User, MapIcon, Skull, CircleDot, Users, EyeOff, Eye } from "lucide-react"

interface MapControlPanelProps {
  showPlayerMarkers: boolean
  showPlayerTrails: boolean
  showSkullMarkers: boolean
  showRingEvents: boolean
  showTeamEliminationEvents: boolean
  togglePlayerMarkers: () => void
  togglePlayerTrails: () => void
  toggleSkullMarkers: () => void
  toggleRingEvents: () => void
  toggleTeamEliminationEvents: () => void
}

const MapControlPanel: React.FC<MapControlPanelProps> = ({
  showPlayerMarkers,
  showPlayerTrails,
  showSkullMarkers,
  showRingEvents,
  showTeamEliminationEvents,
  togglePlayerMarkers,
  togglePlayerTrails,
  toggleSkullMarkers,
  toggleRingEvents,
  toggleTeamEliminationEvents,
}) => {
  return (
    <div className="absolute top-4 left-4 bg-white bg-opacity-80 p-2 rounded-md shadow-md">
      <div className="flex flex-col space-y-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayerMarkers}
          title={showPlayerMarkers ? "Hide Player Markers" : "Show Player Markers"}
        >
          {showPlayerMarkers ? <User /> : <EyeOff />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayerTrails}
          title={showPlayerTrails ? "Hide Player Trails" : "Show Player Trails"}
        >
          {showPlayerTrails ? <MapIcon /> : <EyeOff />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSkullMarkers}
          title={showSkullMarkers ? "Hide Skull Markers" : "Show Skull Markers"}
        >
          {showSkullMarkers ? <Skull /> : <EyeOff />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleRingEvents}
          title={showRingEvents ? "Hide Ring Events" : "Show Ring Events"}
        >
          {showRingEvents ? <CircleDot /> : <EyeOff />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTeamEliminationEvents}
          title={showTeamEliminationEvents ? "Hide Team Elimination Events" : "Show Team Elimination Events"}
        >
          {showTeamEliminationEvents ? <Users /> : <EyeOff />}
        </Button>
      </div>
    </div>
  )
}

export default MapControlPanel

