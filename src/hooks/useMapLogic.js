import { useState, useEffect, useRef } from "react"
import { BASE_PATH } from "../utils/constants"
import { teamColors, getTeamColor } from "../utils/teamColors"

const useMapLogic = (initialMatchData) => {
  const [matchData, setMatchData] = useState(initialMatchData)
  const [map, setMap] = useState(null)
  const [circleOptions, setCircleOptions] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlayerData, setCurrentPlayerData] = useState([])
  const [maxTime, setMaxTime] = useState(60 * 1000)
  const [skullMarkers, setSkullMarkers] = useState([])
  const [isClient, setIsClient] = useState(false)
  const [L, setL] = useState(null)
  const [showTeams0And1, setShowTeams0And1] = useState(false)
  const [customTeamColors, setCustomTeamColors] = useState(teamColors)
  const [ringEvents, setRingEvents] = useState([])

  const timerRef = useRef(null)

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
  }, [currentTime, matchData, maxTime]) // Added maxTime to dependencies

  useEffect(() => {
    if (matchData && matchData.packetLists) {
      const events = []
      Object.entries(matchData.packetLists).forEach(([time, packet]) => {
        if (packet.events) {
          packet.events.forEach((event) => {
            if (event.type === "ringStartClosing") {
              events.push({
                time: packet.t * 1000,
                type: event.type,
                stage: event.stage,
              })
            }
          })
        }
      })
      setRingEvents(events)
      setMaxTime(Math.max(...events.map((e) => e.time), maxTime))
    }
  }, [matchData])

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
    setCurrentTime(0)
    setIsPlaying(false)
    setCurrentPlayerData([])
    setSkullMarkers([])
    setMatchData(newMatchData)
  }

  const handleSettingsChange = (newSettings) => {
    setShowTeams0And1(newSettings.showTeams0And1)
    if (newSettings.customTeamColors) {
      setCustomTeamColors(newSettings.customTeamColors)
    }
  }

  const updateCircle = (newOptions) => {
    setCircleOptions((prevOptions) => ({ ...prevOptions, ...newOptions }))
  }

  const updateTime = (newTime, recreateState = false) => {
    setCurrentTime(newTime)
    if (recreateState) {
      processEventsUpToTime(newTime)
    }
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
                if (!currentCircleOptions) {
                  currentCircleOptions = {
                    center: event.center
                  }
                }
                currentCircleOptions = {
                  ...currentCircleOptions,
                  endCenter: event.center,
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
                    startCenter: event.center,
                    center: event.center,
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
    return currentPlayerData.filter((player) => showTeams0And1 || (player.teamId !== 0 && player.teamId !== 1))
  }

  const getCurrentRingData = () => {
    if (!circleOptions) return null

    const progress = Math.min(
      1,
      Math.max(0, (currentTime - circleOptions.startTime) / (circleOptions.endTime - circleOptions.startTime)),
    )
    const currentRadius = circleOptions.startRadius + (circleOptions.endRadius - circleOptions.startRadius) * progress
    if (!circleOptions.startCenter || !circleOptions.endCenter) {
      return {
        ...circleOptions,
        radius: currentRadius,
      }
    } else {
      const dx = circleOptions.startCenter[0] + (circleOptions.endCenter[0] - circleOptions.startCenter[0]) * progress
      const dy = circleOptions.startCenter[1] + (circleOptions.endCenter[1] - circleOptions.startCenter[1]) * progress
      const dz = circleOptions.startCenter[2] + (circleOptions.endCenter[2] - circleOptions.startCenter[2]) * progress
      return {
        ...circleOptions,
        radius: currentRadius,
        center: [dx, dy, dz],
      }
    }
  }

  return {
    matchData,
    map,
    circleOptions,
    currentTime,
    isPlaying,
    currentPlayerData,
    maxTime,
    skullMarkers,
    isClient,
    L,
    showTeams0And1,
    customTeamColors,
    ringEvents,
    play,
    pause,
    stop,
    handleJSONUpload,
    handleSettingsChange,
    updateCircle,
    updateTime,
    getCurrentPlayerData,
    getCurrentRingData,
  }
}

export default useMapLogic

