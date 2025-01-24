"use client"

import Image from "next/image"
import { useEffect, useState, useRef } from "react"
import CustomCircle from "./CustomCircle.js"
import PlayerMarker from "./PlayerMarker.js"
import SkullMarker from "./SkullMarker.js"
import ControlPanel from "./ControlPanel.js"
import TimeControl from "./TimeControl.js"
import LeafletCSS from "./LeafletCSS.js"
import { BASE_PATH } from "../utils/constants.js"

const Map = ({ initialMatchData }) => {
  if (!initialMatchData) {
    return <div>No match data available. Please input data first.</div>
  }
  const [matchData, setMatchData] = useState(initialMatchData)
  const [map, setMap] = useState(null)
  const [circleOptions, setCircleOptions] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlayerData, setCurrentPlayerData] = useState([])
  const [maxTime, setMaxTime] = useState(60 * 1000) // デフォルト値を60秒に設定
  const [skullMarkers, setSkullMarkers] = useState([])
  const [isClient, setIsClient] = useState(false)
  const [L, setL] = useState(null)

  const timerRef = useRef(null)

  const play = () => {
    setIsPlaying(true)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrentTime((prevTime) => {
        if (prevTime >= maxTime) {
          clearInterval(timerRef.current)
          setIsPlaying(false)
          return prevTime
        }
        return prevTime + 1
      })
    }, 1)
  }

  const pause = () => {
    setIsPlaying(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const stop = () => {
    setIsPlaying(false)
    if (timerRef.current) clearInterval(timerRef.current)
    setCurrentTime(0)
  }

  const handleJSONUpload = (newMatchData) => {
    // Reset the map state
    setCurrentTime(0)
    setIsPlaying(false)
    setCurrentPlayerData([])
    setSkullMarkers([])

    // Update the match data
    setMatchData(newMatchData)
  }

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && !map && matchData) {
      import("leaflet").then((LeafletModule) => {
        setL(LeafletModule.default)
        const customCRS = LeafletModule.default.extend({}, LeafletModule.default.CRS.Simple, {
          transformation: new LeafletModule.default.Transformation(1, 2048, -1, 2048),
          projection: {
            project: (latlng) => new LeafletModule.default.Point(latlng.lat, latlng.lng),
            unproject: (point) => new LeafletModule.default.LatLng(point.x, point.y),
          },
          bounds: LeafletModule.default.bounds([-2048, -2048], [2048, 2048]),
        })

        const newMap = LeafletModule.default.map("map", {
          crs: customCRS,
          minZoom: -3,
          maxZoom: 3,
          center: [0, 0],
          zoom: 0,
        })

        const bounds = [
          [-2048, -2048],
          [2048, 2048],
        ]
        const image = LeafletModule.default
          .imageOverlay(`${BASE_PATH}/img/${matchData.mapName}.png`, bounds)
          .addTo(newMap)

        newMap.fitBounds(bounds)
        setMap(newMap)
      })
    }
  }, [map, matchData])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (matchData && matchData.packetLists) {
      let maxTimeFromEvents = 0
      Object.values(matchData.packetLists).forEach((packet) => {
        if (packet.events) {
          packet.events.forEach((event) => {
            if (event.type === "ringStartClosing") {
              const eventEndTime = (packet.t + event.shrinkduration) * 1000
              if (eventEndTime > maxTimeFromEvents) {
                maxTimeFromEvents = eventEndTime
              }
            }
          })
        }
      })

      const lastDataPointTime = Math.max(...Object.keys(matchData.packetLists).map(Number)) * 1000
      setMaxTime(Math.max(maxTimeFromEvents, lastDataPointTime))

      processEventsUpToTime(currentTime)
    }
  }, [currentTime, matchData])

  const updateCircle = (newOptions) => {
    setCircleOptions((prevOptions) => ({ ...prevOptions, ...newOptions }))
  }

  const updateTime = (newTime) => {
    setCurrentTime(newTime)
    processEventsUpToTime(newTime)
  }

  const processEventsUpToTime = (targetTime) => {
    if (!matchData || !matchData.packetLists) return

    const updatedPlayerData = Object.values(matchData.players).map((player) => ({
      ...player,
      hp: [player.currentHealth, player.maxHealth, player.shieldHealth, player.shieldMaxHealth],
      pos: [player.pos.x, player.pos.y, player.pos.z],
      kills: { total: 0 },
      damageDealt: { total: 0 },
    }))

    let currentCircleOptions = null
    const newSkullMarkers = []

    Object.entries(matchData.packetLists).forEach(([time, packet]) => {
      if (packet.t * 1000 <= targetTime) {
        packet.data.forEach((playerUpdate) => {
          const playerIndex = updatedPlayerData.findIndex((p) => p.nucleusHash === playerUpdate.id)
          if (playerIndex !== -1) {
            updatedPlayerData[playerIndex] = {
              ...updatedPlayerData[playerIndex],
              ...playerUpdate,
              pos: playerUpdate.pos || updatedPlayerData[playerIndex].pos,
            }
          }
        })

        if (packet.events) {
          packet.events.forEach((event) => {
            switch (event.type) {
              case "ringStartClosing":
                currentCircleOptions = {
                  center: event.center,
                  startRadius: event.currentradius,
                  endRadius: event.endradius,
                  color: circleOptions ? circleOptions.color : "#ff0000",
                  startTime: packet.t * 1000,
                  endTime: (packet.t + event.shrinkduration) * 1000,
                }
                break
              case "ringFinishedClosing":
                if (currentCircleOptions) {
                  currentCircleOptions = {
                    ...currentCircleOptions,
                    startRadius: event.currentradius,
                    endRadius: event.currentradius,
                  }
                }
                break
              case "playerKilled":
                const victimIndex = updatedPlayerData.findIndex((p) => p.nucleusHash === event.victim.id)
                const attackerIndex = updatedPlayerData.findIndex((p) => p.nucleusHash === event.attacker.id)
                if (victimIndex !== -1) {
                  updatedPlayerData[victimIndex] = {
                    ...updatedPlayerData[victimIndex],
                    hp: [0, updatedPlayerData[victimIndex].hp[1], 0, updatedPlayerData[victimIndex].hp[3]],
                    pos: event.victim.pos,
                  }
                }
                if (attackerIndex !== -1) {
                  updatedPlayerData[attackerIndex] = {
                    ...updatedPlayerData[attackerIndex],
                    kills: {
                      ...updatedPlayerData[attackerIndex].kills,
                      total: (updatedPlayerData[attackerIndex].kills?.total || 0) + 1,
                    },
                    pos: event.attacker.pos,
                  }
                }
                newSkullMarkers.push({
                  position: event.victim.pos,
                  startTime: packet.t * 1000,
                  endTime: packet.t * 1000 + 5000,
                })
                break
            }
          })
        }
      }
    })

    setCurrentPlayerData(updatedPlayerData)
    if (currentCircleOptions) {
      setCircleOptions(currentCircleOptions)
    }
    setSkullMarkers(newSkullMarkers.filter((marker) => marker.startTime <= targetTime && marker.endTime > targetTime))
  }

  const getCurrentPlayerData = () => {
    return currentPlayerData
  }

  const getCurrentRingData = () => {
    if (!circleOptions) return null

    const progress = (currentTime - circleOptions.startTime) / (circleOptions.endTime - circleOptions.startTime)
    const currentRadius = circleOptions.startRadius + (circleOptions.endRadius - circleOptions.startRadius) * progress

    return {
      ...circleOptions,
      radius: currentRadius,
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-grow flex overflow-hidden">
        <div id="map" className="w-3/4 h-full"></div>
        <div className="w-1/4 h-full flex flex-col">
          <div className="flex-grow overflow-y-auto">
            <ControlPanel
              updateCircle={updateCircle}
              players={matchData.players}
              teams={matchData.teams}
              currentPlayerData={currentPlayerData}
              onJSONUpload={handleJSONUpload}
            />
          </div>
        </div>
      </div>
      <TimeControl
        updateTime={updateTime}
        currentTime={currentTime}
        maxTime={maxTime}
        isPlaying={isPlaying}
        play={play}
        pause={pause}
        stop={stop}
      />
      {isClient && <LeafletCSS />}
      {map && L && (
        <>
          <CustomCircle map={map} options={getCurrentRingData()} L={L} />
          {getCurrentPlayerData().map((player) => {
            const teamId = matchData.players[player.nucleusHash]?.teamId
            return (
              <PlayerMarker
                key={player.nucleusHash}
                map={map}
                player={player}
                color={teamId === 1 ? "#0000FF" : "#00FF00"}
                L={L}
              />
            )
          })}
          {skullMarkers.map((marker, index) => (
            <SkullMarker key={`skull-${marker.startTime}-${index}`} map={map} position={marker.position} L={L} />
          ))}
        </>
      )}
    </div>
  )
}

export default Map

