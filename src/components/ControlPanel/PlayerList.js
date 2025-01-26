"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Skull, Zap, X, MapPin, User, UserMinus } from "lucide-react"
import Image from "next/image"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { BASE_PATH } from "../../utils/constants.js"
import { getTeamColor } from "../../utils/teamColors.js"

const legendIcons = {
  Bloodhound: "/img/legends/bloodhound.png",
  Gibraltar: "/img/legends/gibraltar.png",
  Lifeline: "/img/legends/lifeline.png",
  Pathfinder: "/img/legends/pathfinder.png",
  Wraith: "/img/legends/wraith.png",
  Bangalore: "/img/legends/bangalore.png",
  Caustic: "/img/legends/caustic.png",
  Mirage: "/img/legends/mirage.png",
  Octane: "/img/legends/octane.png",
  Wattson: "/img/legends/wattson.png",
  Crypto: "/img/legends/crypto.png",
  Revenant: "/img/legends/revenant.png",
  Loba: "/img/legends/loba.png",
  Rampart: "/img/legends/rampart.png",
  Horizon: "/img/legends/horizon.png",
  Fuse: "/img/legends/fuse.png",
  Valkyrie: "/img/legends/valkyrie.png",
  Seer: "/img/legends/seer.png",
  Ash: "/img/legends/ash.png",
  "Mad Maggie": "/img/legends/mad_maggie.png",
  Newcastle: "/img/legends/newcastle.png",
  Vantage: "/img/legends/vantage.png",
  Catalyst: "/img/legends/catalyst.png",
  Conduit: "/img/legends/conduit.png",
  Alter: "/img/legends/alter.png",
  Ballistic: "/img/legends/ballistic.png",
}

const PlayerList = ({
  players,
  teams,
  currentPlayerData,
  showTeams0And1,
  customTeamColors = [],
  eliminatedTeams,
  playerTrailVisibility = {},
  togglePlayerTrail = () => {},
}) => {
  const [expandedTeams, setExpandedTeams] = useState([])
  const [expandedPlayers, setExpandedPlayers] = useState([])

  useEffect(() => {
    // Initialize expandedTeams and expandedPlayers if needed.
    // This is a placeholder, adjust as needed based on your application logic.
  }, [])

  const toggleTeam = (teamId) => {
    setExpandedTeams((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]))
  }

  const togglePlayer = (playerId) => {
    setExpandedPlayers((prev) => (prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]))
  }

  const getPlayerData = (playerId) => {
    const currentData = currentPlayerData.find((p) => p.nucleusHash === playerId) || {}
    const staticData = players[playerId] || {}
    return { ...staticData, ...currentData }
  }

  const getPlayerStatValue = (player, statKey) => {
    if (typeof player[statKey] === "object" && player[statKey] !== null) {
      return player[statKey].total || 0
    }
    return player[statKey] || 0
  }

  const filteredTeams = Object.entries(teams || {}).filter(
    ([teamId, team]) =>
      (showTeams0And1 || (teamId !== "0" && teamId !== "1")) && team.players && team.players.length > 0,
  )

  if (!players || !teams || !currentPlayerData || Object.keys(teams).length === 0) {
    return <div>No player data available.</div>
  }

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-semibold">Teams</h3>
      {filteredTeams.map(([teamId, team]) => (
        <div key={teamId} className="border rounded p-2">
          <button className="w-full flex justify-between items-center" onClick={() => toggleTeam(teamId)}>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: getTeamColor(teamId) }}></div>
              <div className="relative">
                <Image
                  src={team.teamImg || `${BASE_PATH}/placeholder.svg`}
                  alt={team.teamName}
                  width={24}
                  height={24}
                  className="mr-2"
                />
                {eliminatedTeams.includes(teamId) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <X className="text-red-500" size={20} />
                  </div>
                )}
              </div>
              <span>{team.teamName || `Team ${teamId}`}</span>
            </div>
            {expandedTeams.includes(teamId) ? <ChevronUp /> : <ChevronDown />}
          </button>
          {expandedTeams.includes(teamId) && (
            <div className="mt-2 space-y-2">
              {(team.players || []).map((playerId) => {
                const player = getPlayerData(playerId)
                if (!player) return null
                const isDead = player.hp && player.hp[0] <= 0
                return (
                  <div key={playerId} className="pl-4">
                    <div className="flex justify-between items-center">
                      <button className="flex items-center" onClick={() => togglePlayer(playerId)}>
                        <div className="flex items-center">
                          {legendIcons[player.legend] && (
                            <div className="w-6 h-6 rounded-full overflow-hidden mr-2 relative">
                              <Image
                                src={`${BASE_PATH}${legendIcons[player.legend] || "/placeholder.svg"}`}
                                alt={player.legend}
                                width={24}
                                height={24}
                                className="object-cover"
                              />
                              {isDead && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                  <X className="text-red-500" size={20} />
                                </div>
                              )}
                            </div>
                          )}
                          <span>{player.name}</span>
                        </div>
                        {expandedPlayers.includes(playerId) ? (
                          <ChevronUp className="ml-2" />
                        ) : (
                          <ChevronDown className="ml-2" />
                        )}
                      </button>
                      <div className="flex items-center space-x-2">
                        <MapPin size={16} />
                        <span className="text-xs mr-1">Trail:</span>
                        <Switch
                          checked={playerTrailVisibility[playerId] || false}
                          onCheckedChange={() => togglePlayerTrail(playerId)}
                        />
                      </div>
                    </div>
                    {expandedPlayers.includes(playerId) && player.hp && (
                      <div className="mt-2 pl-4 space-y-2 text-sm bg-gray-100 p-3 rounded-md">
                        <div className="flex items-center space-x-2">
                          <span className="w-16">Shield:</span>
                          <Progress value={(player.hp[2] / player.hp[3]) * 100} className="w-full h-2" />
                          <span className="w-16 text-right">{`${player.hp[2]}/${player.hp[3]}`}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-16">HP:</span>
                          <Progress value={(player.hp[0] / player.hp[1]) * 100} className="w-full h-2" />
                          <span className="w-16 text-right">{`${player.hp[0]}/${player.hp[1]}`}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1">
                            <Skull className="w-4 h-4" />
                            <span>Kills: {getPlayerStatValue(player, "kills")}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Zap className="w-4 h-4" />
                            <span>Damage: {getPlayerStatValue(player, "damageDealt")}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>Downs: {getPlayerStatValue(player, "downs")}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <UserMinus className="w-4 h-4" />
                            <span>Downed: {getPlayerStatValue(player, "downsReceived")}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default PlayerList

