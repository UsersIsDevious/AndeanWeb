'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'

const PlayerList = ({ players, teams }) => {
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [expandedPlayer, setExpandedPlayer] = useState(null)

  const toggleTeam = (teamId) => {
    if (expandedTeam === teamId) {
      setExpandedTeam(null)
    } else {
      setExpandedTeam(teamId)
    }
  }

  const togglePlayer = (playerId) => {
    if (expandedPlayer === playerId) {
      setExpandedPlayer(null)
    } else {
      setExpandedPlayer(playerId)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Teams</h3>
      {Object.entries(teams).map(([teamId, team]) => (
        <div key={teamId} className="border rounded p-2">
          <button
            className="w-full flex justify-between items-center"
            onClick={() => toggleTeam(teamId)}
          >
            <div className="flex items-center">
              <Image src={team.image} alt={team.name} width={24} height={24} className="mr-2" />
              <span>{team.name}</span>
            </div>
            {expandedTeam === teamId ? <ChevronUp /> : <ChevronDown />}
          </button>
          {expandedTeam === teamId && (
            <div className="mt-2 space-y-2">
              {team.player.map((playerId) => {
                const player = players.find(p => p.nucleusHash === playerId)
                return (
                  <div key={playerId} className="pl-4">
                    <button
                      className="w-full flex justify-between items-center"
                      onClick={() => togglePlayer(playerId)}
                    >
                      <span>{player.name}</span>
                      {expandedPlayer === playerId ? <ChevronUp /> : <ChevronDown />}
                    </button>
                    {expandedPlayer === playerId && (
                      <div className="mt-1 pl-4 space-y-1 text-sm">
                        <p>Legend: {player.legend}</p>
                        <p>HP: {player.currentHealth}/{player.maxHealth}</p>
                        <p>Shield: {player.shieldHealth}/{player.shieldMaxHealth}</p>
                        <p>Kills: {player.kills.total}</p>
                        <p>Damage Dealt: {player.damageDealt.total}</p>
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

