'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import { Shield, Skull, Zap, X } from 'lucide-react'
import { Progress } from "@/components/ui/progress"

// レジェンドのアイコンマッピング
const legendIcons = {
  Loba: '/img/legends/loba.png',
  // 他のレジェンドのアイコンをここに追加
}

const PlayerList = ({ players, teams, currentPlayerData }) => {
  const [expandedTeams, setExpandedTeams] = useState([])
  const [expandedPlayers, setExpandedPlayers] = useState([])

  const toggleTeam = (teamId) => {
    setExpandedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    )
  }

  const togglePlayer = (playerId) => {
    setExpandedPlayers(prev => 
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  const getPlayerData = (playerId) => {
    const currentData = currentPlayerData.find(p => p.id === playerId)
    const staticData = players.find(p => p.nucleusHash === playerId)
    return { ...staticData, ...currentData }
  }

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-semibold">Teams</h3>
      {Object.entries(teams).map(([teamId, team]) => (
        <div key={teamId} className="border rounded p-2">
          <button
            className="w-full flex justify-between items-center"
            onClick={() => toggleTeam(teamId)}
          >
            <div className="flex items-center">
              <Image src={team.image || "/placeholder.svg"} alt={team.name} width={24} height={24} className="mr-2" />
              <span>{team.name}</span>
            </div>
            {expandedTeams.includes(teamId) ? <ChevronUp /> : <ChevronDown />}
          </button>
          {expandedTeams.includes(teamId) && (
            <div className="mt-2 space-y-2">
              {team.player.map((playerId) => {
                const player = getPlayerData(playerId)
                const isDead = player.hp[0] <= 0
                return (
                  <div key={playerId} className="pl-4">
                    <button
                      className="w-full flex justify-between items-center"
                      onClick={() => togglePlayer(playerId)}
                    >
                      <div className="flex items-center">
                        {legendIcons[player.legend] && (
                          <div className="w-6 h-6 rounded-full overflow-hidden mr-2 relative">
                            <Image 
                              src={legendIcons[player.legend] || "/placeholder.svg"} 
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
                      {expandedPlayers.includes(playerId) ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    {expandedPlayers.includes(playerId) && (
                      <div className="mt-2 pl-4 space-y-2 text-sm bg-gray-100 p-3 rounded-md">
                        <div className="flex items-center space-x-2">
                          <span className="w-16">HP:</span>
                          <Progress 
                            value={(player.hp[0] / player.hp[1]) * 100} 
                            className="w-full h-2"
                          />
                          <span className="w-16 text-right">
                            {`${player.hp[0]}/${player.hp[1]}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-16">Shield:</span>
                          <Progress 
                            value={(player.hp[2] / player.hp[3]) * 100} 
                            className="w-full h-2"
                          />
                          <span className="w-16 text-right">
                            {`${player.hp[2]}/${player.hp[3]}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1">
                            <Skull className="w-4 h-4" />
                            <span>Kills: {player.kills?.total || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Zap className="w-4 h-4" />
                            <span>Damage: {player.damageDealt?.total || 0}</span>
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

