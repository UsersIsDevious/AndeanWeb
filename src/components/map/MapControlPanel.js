import React from "react"
import { Button } from "@/components/ui/button"
import { User, MapPin, Skull, CircleDot, Users, EyeOff, Eye, Tag, Activity, Footprints } from "lucide-react"

const MapControlPanel = ({
  showPlayerMarkers,
  showPlayerTrails,
  showSkullMarkers,
  showRingEvents,
  showTeamEliminationEvents,
  showPlayerNames,
  showTeamNames,
  togglePlayerMarkers,
  togglePlayerTrails,
  toggleSkullMarkers,
  toggleRingEvents,
  toggleTeamEliminationEvents,
  togglePlayerNames,
  toggleTeamNames,
  showPlayerStatus,
  togglePlayerStatus,
}) => {
  const controlButtons = [
    { show: showPlayerMarkers, toggle: togglePlayerMarkers, icon: User, activeColor: "blue", title: "Player Markers" },
    {
      show: showPlayerTrails,
      toggle: togglePlayerTrails,
      icon: Footprints,
      activeColor: "green",
      title: "Player Trails",
    },
    { show: showSkullMarkers, toggle: toggleSkullMarkers, icon: Skull, activeColor: "red", title: "Skull Markers" },
    { show: showRingEvents, toggle: toggleRingEvents, icon: CircleDot, activeColor: "purple", title: "Ring Events" },
    {
      show: showTeamEliminationEvents,
      toggle: toggleTeamEliminationEvents,
      icon: Users,
      activeColor: "orange",
      title: "Team Elimination Events",
    },
    { show: showPlayerNames, toggle: togglePlayerNames, icon: Tag, activeColor: "indigo", title: "Player Names" },
    { show: showTeamNames, toggle: toggleTeamNames, icon: Users, activeColor: "pink", title: "Team Names" },
    {
      show: showPlayerStatus,
      toggle: togglePlayerStatus,
      icon: Activity,
      activeColor: "yellow",
      title: "Player Status",
    },
  ]

  return (
    <div className="absolute bottom-4 left-4 bg-white bg-opacity-80 p-2 rounded-md shadow-md z-[9999]">
      <div className="flex flex-col space-y-2">
        {controlButtons.map(({ show, toggle, icon: Icon, activeColor, title }) => (
          <Button
            key={title}
            variant="ghost"
            size="icon"
            onClick={toggle}
            title={`${show ? "Hide" : "Show"} ${title}`}
            className={show ? `text-${activeColor}-500` : "text-gray-500"}
          >
            <Icon className={!show ? "opacity-50" : ""} />
          </Button>
        ))}
      </div>
    </div>
  )
}

export default MapControlPanel

