import { useState, useEffect, useRef, useMemo } from "react"
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
  const [timelineEvents, setTimelineEvents] = useState([])
  const [eliminatedTeams, setEliminatedTeams] = useState([])
  const [firstRingEventTime, setFirstRingEventTime] = useState(null)
  const [playerTrails, setPlayerTrails] = useState({})
  const [showPlayerMarkers, setShowPlayerMarkers] = useState(true)
  const [showPlayerTrails, setShowPlayerTrails] = useState(false) // Updated: Set to false
  const [showSkullMarkers, setShowSkullMarkers] = useState(true)
  const [showRingEvents, setShowRingEvents] = useState(true)
  const [showTeamEliminationEvents, setShowTeamEliminationEvents] = useState(true)
  const [playerTrailVisibility, setPlayerTrailVisibility] = useState({})
  const [showPlayerNames, setShowPlayerNames] = useState(false)
  const [showTeamNames, setShowTeamNames] = useState(false)
  const [showPlayerStatus, setShowPlayerStatus] = useState(true)
  const [damageEvents, setDamageEvents] = useState([])
  const [downedPlayers, setDownedPlayers] = useState([])
  const DAMAGE_EVENT_DURATION = 2000 // 2 seconds

  const timerRef = useRef(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!map && matchData) {
      initializeMap()
    }
  }, [map, matchData])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (matchData && matchData.packetLists) {
      updateMaxTime()
      processEventsUpToTime(currentTime)
    }
  }, [currentTime, matchData])

  useEffect(() => {
    if (matchData && matchData.packetLists) {
      processTimelineEvents()
    }
  }, [matchData])

  useEffect(() => {
    if (matchData && matchData.players) {
      initializePlayerTrailVisibility()
    }
  }, [matchData])

  const updateMaxTime = () => {
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
  }

  const processTimelineEvents = () => {
    const events = []
    let firstRingTime = null
    Object.entries(matchData.packetLists).forEach(([time, packet]) => {
      if (packet.events) {
        packet.events.forEach((event) => {
          if (
            event.type === "ringStartClosing" ||
            event.type === "ringFinishedClosing" ||
            event.type === "playerKilled" ||
            event.type === "squadEliminated"
          ) {
            if (event.type === "ringStartClosing" && firstRingTime === null) {
              firstRingTime = packet.t * 1000
            }
            events.push({
              time: packet.t * 1000,
              type: event.type,
              stage: event.stage,
              teamId: event.teamId,
              color: event.type === "squadEliminated" ? getTeamColor(event.teamId) : undefined,
            })
          }
        })
      }
    })
    setTimelineEvents(events)
    setFirstRingEventTime(firstRingTime)
    setMaxTime(Math.max(...events.map((e) => e.time), maxTime))

    processEventsUpToTime(Math.max(...events.map((e) => e.time)))
    resetRingState()
  }

  const initializePlayerTrailVisibility = () => {
    // Updated function
    const initialVisibility = Object.keys(matchData.players).reduce((acc, playerId) => {
      acc[playerId] = false // Set to false by default
      return acc
    }, {})
    setPlayerTrailVisibility(initialVisibility)
  }

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
    updateTime(0, true)
  }

  const handleJSONUpload = (newMatchData) => {
    setCurrentTime(0)
    setIsPlaying(false)
    setCurrentPlayerData([])
    setSkullMarkers([])
    setDownedPlayers([])
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
    if (recreateState || newTime === 0) {
      processEventsUpToTime(newTime)
      if (newTime === 0) {
        resetRingState()
      }
    }
  }

  const processEventsUpToTime = (targetTime) => {
    if (!matchData || !matchData.packetLists) return

    const updatedPlayerData = initializePlayerData()
    const currentCircleOptions = null
    const newSkullMarkers = []
    const newEliminatedTeams = []
    const newPlayerTrails = {}

    Object.entries(matchData.packetLists).forEach(([time, packet]) => {
      if (packet.t * 1000 <= targetTime) {
        updatePlayerPositions(packet, updatedPlayerData, newPlayerTrails)
        if (packet.events) {
          packet.events.forEach((event) => {
            processEvent(event, packet, updatedPlayerData, newSkullMarkers, newEliminatedTeams, currentCircleOptions)
          })
        }
      }
    })

    setCurrentPlayerData(updatedPlayerData)
    if (currentCircleOptions) {
      setCircleOptions(currentCircleOptions)
    }
    setSkullMarkers(newSkullMarkers.filter((marker) => marker.startTime <= targetTime && marker.endTime > targetTime))
    setEliminatedTeams(newEliminatedTeams)
    setPlayerTrails(newPlayerTrails)
  }

  const initializePlayerData = () => {
    return Object.values(matchData.players).map((player) => ({
      ...player,
      hp: [player.currentHealth, player.maxHealth, player.shieldHealth, player.shieldMaxHealth],
      pos: [player.pos.x, player.pos.y, player.pos.z],
      kills: { total: 0 },
      damageDealt: { total: 0 },
      downs: 0,
      isDown: false,
    }))
  }

  const updatePlayerPositions = (packet, updatedPlayerData, newPlayerTrails) => {
    packet.data.forEach((playerUpdate) => {
      const playerIndex = updatedPlayerData.findIndex((p) => p.nucleusHash === playerUpdate.id)
      if (playerIndex !== -1) {
        updatedPlayerData[playerIndex] = {
          ...updatedPlayerData[playerIndex],
          ...playerUpdate,
          pos: playerUpdate.pos || updatedPlayerData[playerIndex].pos,
        }

        if (!newPlayerTrails[playerUpdate.id]) {
          newPlayerTrails[playerUpdate.id] = []
        }
        newPlayerTrails[playerUpdate.id].push(playerUpdate.pos)
      }
    })
  }

  const processEvent = (
    event,
    packet,
    updatedPlayerData,
    newSkullMarkers,
    newEliminatedTeams,
    currentCircleOptions,
  ) => {
    switch (event.type) {
      case "ringStartClosing":
      case "ringFinishedClosing":
        currentCircleOptions = processRingEvent(event, packet, currentCircleOptions)
        break
      case "playerKilled":
        processPlayerKilledEvent(event, updatedPlayerData, newSkullMarkers, packet)
        break
      case "squadEliminated":
        newEliminatedTeams.push(event.teamId)
        break
      case "playerDamaged":
        processPlayerDamagedEvent(event, updatedPlayerData, packet)
        break
      case "playerDowned":
        processPlayerDownedEvent(event, updatedPlayerData, packet)
        break
    }
  }

  const processRingEvent = (event, packet, currentCircleOptions) => {
    if (event.type === "ringStartClosing") {
      if (!currentCircleOptions) {
        currentCircleOptions = { center: event.center }
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
    } else if (event.type === "ringFinishedClosing") {
      if (currentCircleOptions) {
        currentCircleOptions = {
          ...currentCircleOptions,
          startRadius: event.currentradius,
          endRadius: event.currentradius,
          startCenter: event.center,
          center: event.center,
        }
      }
    }
    return currentCircleOptions
  }

  const processPlayerKilledEvent = (event, updatedPlayerData, newSkullMarkers, packet) => {
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
  }

  const processPlayerDamagedEvent = (event, updatedPlayerData, packet) => {
    const damageAttackerIndex = updatedPlayerData.findIndex((p) => p.nucleusHash === event.attacker.id)
    const damageVictimIndex = updatedPlayerData.findIndex((p) => p.nucleusHash === event.victim.id)

    if (damageAttackerIndex !== -1 && event.attacker.pos) {
      updatedPlayerData[damageAttackerIndex].pos = event.attacker.pos
    }
    if (damageVictimIndex !== -1 && event.victim.pos) {
      updatedPlayerData[damageVictimIndex].pos = event.victim.pos
    }

    if (damageVictimIndex !== -1) {
      updatedPlayerData[damageVictimIndex].hp = event.victim.hp
    }
    const newDamageEvent = {
      attacker: event.attacker,
      victim: event.victim,
      startTime: packet.t * 1000,
      endTime: packet.t * 1000 + DAMAGE_EVENT_DURATION,
    }
    setDamageEvents((prev) => [...prev, newDamageEvent])
  }

  const processPlayerDownedEvent = (event, updatedPlayerData, packet) => {
    const downedAttackerIndex = updatedPlayerData.findIndex((p) => p.nucleusHash === event.attacker.id)
    const downedVictimIndex = updatedPlayerData.findIndex((p) => p.nucleusHash === event.victim.id)

    if (downedAttackerIndex !== -1 && event.attacker.pos) {
      updatedPlayerData[downedAttackerIndex].pos = event.attacker.pos
      updatedPlayerData[downedAttackerIndex].downs = (updatedPlayerData[downedAttackerIndex].downs || 0) + 1
    }
    if (downedVictimIndex !== -1 && event.victim.pos) {
      updatedPlayerData[downedVictimIndex].pos = event.victim.pos
      updatedPlayerData[downedVictimIndex].hp = event.victim.hp
      updatedPlayerData[downedVictimIndex].isDown = true
    }
    setDownedPlayers((prev) => [
      ...prev,
      {
        id: event.victim.id,
        startTime: packet.t * 1000,
        endTime: packet.t * 1000 + 5000, // Assume downed state lasts for 5 seconds
      },
    ])
  }

  const resetRingState = () => {
    setCircleOptions(null)
    setCurrentPlayerData(initializePlayerData())
    setSkullMarkers([])
    setEliminatedTeams([])
    setDownedPlayers([])
  }

  const getCurrentPlayerData = () => {
    return currentPlayerData.filter((player) => showTeams0And1 || (player.teamId !== 0 && player.teamId !== 1))
  }

  const getCurrentRingData = () => {
    if (!circleOptions || firstRingEventTime === null || currentTime < firstRingEventTime) return null

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

  const survivingPlayers = useMemo(() => {
    return currentPlayerData.filter((player) => player.hp && player.hp[0] > 0).length
  }, [currentPlayerData])

  const survivingTeams = useMemo(() => {
    const teamIds = new Set(
      currentPlayerData.filter((player) => player.hp && player.hp[0] > 0).map((player) => player.teamId),
    )
    return teamIds.size
  }, [currentPlayerData])

  const togglePlayerMarkers = () => setShowPlayerMarkers((prev) => !prev)
  const togglePlayerTrails = () => setShowPlayerTrails((prev) => !prev)
  const toggleSkullMarkers = () => setShowSkullMarkers((prev) => !prev)
  const toggleRingEvents = () => setShowRingEvents((prev) => !prev)
  const toggleTeamEliminationEvents = () => setShowTeamEliminationEvents((prev) => !prev)
  const togglePlayerNames = () => setShowPlayerNames((prev) => !prev)
  const toggleTeamNames = () => setShowTeamNames((prev) => !prev)
  const togglePlayerStatus = () => setShowPlayerStatus((prev) => !prev)

  const togglePlayerTrail = (playerId) => {
    setPlayerTrailVisibility((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }))
  }

  const getNearestPacketTime = (targetTime) => {
    if (!matchData || !matchData.packetLists) return null
    const packetTimes = Object.keys(matchData.packetLists).map(Number)
    return packetTimes.reduce((prev, curr) =>
      Math.abs(curr * 1000 - targetTime) < Math.abs(prev * 1000 - targetTime) ? curr : prev,
    )
  }

  const initializeMap = () => {
    if (typeof window !== "undefined" && !map && matchData) {
      import("leaflet").then((LeafletModule) => {
        setL(LeafletModule.default)
        const mapContainer = document.getElementById("map")
        if (mapContainer && !mapContainer._leaflet_id) {
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
          LeafletModule.default.imageOverlay(`${BASE_PATH}/img/${matchData.mapName}.png`, bounds).addTo(newMap)

          newMap.fitBounds(bounds)
          setMap(newMap)
        }
      })
    }
  }

  const getActiveDamageEvents = () => {
    return damageEvents.filter((event) => event.startTime <= currentTime && event.endTime > currentTime)
  }

  const getActiveDownedPlayers = () => {
    return downedPlayers.filter((player) => player.startTime <= currentTime && player.endTime > currentTime)
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
    timelineEvents,
    eliminatedTeams,
    firstRingEventTime,
    survivingPlayers,
    survivingTeams,
    play,
    pause,
    stop,
    handleJSONUpload,
    handleSettingsChange,
    updateCircle,
    updateTime,
    getCurrentPlayerData,
    getCurrentRingData,
    resetRingState,
    playerTrails,
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
    playerTrailVisibility,
    togglePlayerTrail,
    getNearestPacketTime,
    showPlayerNames,
    showTeamNames,
    togglePlayerNames,
    toggleTeamNames,
    showPlayerStatus,
    togglePlayerStatus,
    initializeMap,
    damageEvents,
    getActiveDamageEvents,
    downedPlayers,
    getActiveDownedPlayers,
  }
}

export default useMapLogic

