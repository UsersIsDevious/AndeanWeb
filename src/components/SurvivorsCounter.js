import React from "react"
import { Users, UserCheck } from "lucide-react"

const SurvivorsCounter = ({ survivingPlayers, survivingTeams }) => {
  return (
    <div className="absolute top-4 right-4 bg-white bg-opacity-80 p-2 rounded-md shadow-md flex items-center space-x-4 z-[9999]">
      <div className="flex items-center space-x-2">
        <Users size={18} />
        <span className="font-semibold">{survivingPlayers} players</span>
      </div>
      <div className="flex items-center space-x-2">
        <UserCheck size={18} />
        <span className="font-semibold">{survivingTeams} teams</span>
      </div>
    </div>
  )
}

export default SurvivorsCounter

