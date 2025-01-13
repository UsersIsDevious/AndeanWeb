'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const PlayerList = ({ players }) => {
  const [expandedPlayer, setExpandedPlayer] = useState(null)

  const togglePlayer = (playerId) => {
    if (expandedPlayer === playerId) {
      setExpandedPlayer(null)
    } else {
      setExpandedPlayer(playerId)
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Players</h3>
      {players.map((player) => (
        <div key={player.id} className="border rounded p-2">
          <button
            className="w-full flex justify-between items-center"
            onClick={() => togglePlayer(player.id)}
          >
            <span>{player.id.slice(0, 8)}...</span>
            {expandedPlayer === player.id ? <ChevronUp /> : <ChevronDown />}
          </button>
          {expandedPlayer === player.id && (
            <div className="mt-2 space-y-1">
              <p>HP: {player.hp[0]}/{player.hp[1]}</p>
              <p>Shield: {player.hp[2]}/{player.hp[3]}</p>
              <p>Position: ({player.pos[0]}, {player.pos[1]})</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default PlayerList

