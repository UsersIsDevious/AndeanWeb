'use client'

import { useEffect, useState, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import CustomCircle from './CustomCircle'
import PlayerMarker from './PlayerMarker'
import ControlPanel from './ControlPanel'
import TimeControl from './TimeControl'

const Map = ({ matchData }) => {
  const [map, setMap] = useState(null)
  const [circleOptions, setCircleOptions] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlayerData, setCurrentPlayerData] = useState([])
  const [maxTime, setMaxTime] = useState(60 * 1000) // デフォルト値を60秒に設定

  const timerRef = useRef(null)

  const play = () => {
    setIsPlaying(true)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrentTime(prevTime => {
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

  useEffect(() => {
    if (typeof window !== 'undefined' && !map && matchData) {
      const customCRS = L.extend({}, L.CRS.Simple, {
        transformation: new L.Transformation(1, 2048, -1, 2048),
        projection: {
          project: function (latlng) {
            return new L.Point(latlng.lat, latlng.lng);
          },
          unproject: function (point) {
            return new L.LatLng(point.x, point.y);
          }
        },
        bounds: L.bounds([-2048, -2048], [2048, 2048])
      });

      const newMap = L.map('map', {
        crs: customCRS,
        minZoom: -3,
        maxZoom: 3,
        center: [0, 0],
        zoom: 0,
      })

      const bounds = [[-2048, -2048], [2048, 2048]]
      const image = L.imageOverlay(`/img/${matchData.mapName}.png`, bounds).addTo(newMap)

      newMap.fitBounds(bounds)
      setMap(newMap)
    }
  }, [map, matchData])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (matchData && matchData.datalist) {
      let maxTimeFromEvents = 0
      matchData.datalist.forEach(dataPoint => {
        if (dataPoint.events) {
          dataPoint.events.forEach(event => {
            if (event.type === 'ringStartClosing') {
              const eventEndTime = (dataPoint.t + event.shrinkduration) * 1000
              if (eventEndTime > maxTimeFromEvents) {
                maxTimeFromEvents = eventEndTime
              }
            }
          })
        }
      })

      const lastDataPointTime = matchData.datalist[matchData.datalist.length - 1].t * 1000
      setMaxTime(Math.max(maxTimeFromEvents, lastDataPointTime))

      processEventsUpToTime(currentTime);
    }
  }, [currentTime, matchData])

  const updateCircle = (newOptions) => {
    setCircleOptions(prevOptions => ({ ...prevOptions, ...newOptions }))
  }

  const updateTime = (newTime, seeked = false) => {
    setCurrentTime(newTime);
    if (seeked) {
      processEventsUpToTime(newTime);
    }
  };

  const processEventsUpToTime = (targetTime) => {
    if (!matchData || !matchData.datalist) return;

    let currentCircleOptions = null;
    let updatedPlayerData = [...currentPlayerData];

    matchData.datalist.forEach(dataPoint => {
      if (dataPoint.t * 1000 <= targetTime) {
        // Update player data
        updatedPlayerData = dataPoint.data;

        // Process events
        if (dataPoint.events) {
          dataPoint.events.forEach(event => {
            switch (event.type) {
              case 'ringStartClosing':
                currentCircleOptions = {
                  center: event.center,
                  startRadius: event.currentradius,
                  endRadius: event.endradius,
                  color: circleOptions ? circleOptions.color : '#ff0000',
                  startTime: dataPoint.t * 1000,
                  endTime: (dataPoint.t + event.shrinkduration) * 1000,
                };
                break;
              case 'ringFinishedClosing':
                if (currentCircleOptions) {
                  currentCircleOptions = {
                    ...currentCircleOptions,
                    startRadius: event.currentradius,
                    endRadius: event.currentradius,
                  };
                }
                break;
              case 'playerKilled':
                updatedPlayerData = updatedPlayerData.map(player =>
                  player.id === event.victim.id ? { ...player, hp: [0, player.hp[1], 0, player.hp[3]] } : player
                );
                break;
              // Add more event types as needed
            }
          });
        }
      }
    });

    setCurrentPlayerData(updatedPlayerData);
    if (currentCircleOptions) {
      setCircleOptions(currentCircleOptions);
    }
  };


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
              players={Object.values(matchData.players)}
              teams={matchData.teams}
              currentPlayerData={currentPlayerData}
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
      {map && (
        <>
          <CustomCircle
            map={map}
            options={getCurrentRingData()}
          />
          {getCurrentPlayerData().map((player) => (
            <PlayerMarker
              key={player.id}
              map={map}
              player={player}
              color={matchData.players[player.id].teamId === 1 ? '#0000FF' : '#00FF00'}
            />
          ))}
        </>
      )}
    </div>
  )
}

export default Map

