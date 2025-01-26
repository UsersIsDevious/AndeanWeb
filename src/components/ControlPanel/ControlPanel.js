import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SettingsIcon } from "lucide-react"
import PlayerList from "./PlayerList"
import Settings from "./Settings"

const ControlPanel = ({
  updateCircle,
  players,
  teams,
  currentPlayerData,
  onJSONUpload,
  onSettingsChange,
  showTeams0And1,
  customTeamColors,
  ringEvents,
  eliminatedTeams,
  playerTrailVisibility,
  togglePlayerTrail,
}) => {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="h-full overflow-y-auto p-4">
      <Button onClick={() => setShowSettings(!showSettings)} className="mb-4 flex items-center space-x-2">
        <SettingsIcon className="w-4 h-4" />
        <span>{showSettings ? "Hide Settings" : "Show Settings"}</span>
      </Button>
      {showSettings && (
        <Settings
          updateCircle={updateCircle}
          onJSONUpload={onJSONUpload}
          onSettingsChange={onSettingsChange}
          customTeamColors={customTeamColors}
        />
      )}
      <PlayerList
        players={players}
        teams={teams}
        currentPlayerData={currentPlayerData}
        showTeams0And1={showTeams0And1}
        customTeamColors={customTeamColors}
        eliminatedTeams={eliminatedTeams}
        playerTrailVisibility={playerTrailVisibility}
        togglePlayerTrail={togglePlayerTrail}
      />
    </div>
  )
}

export default ControlPanel

