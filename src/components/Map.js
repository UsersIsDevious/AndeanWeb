'use client'

import { useEffect, useState, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import CustomCircle from './CustomCircle'
import PlayerMarker from './PlayerMarker'
import ControlPanel from './ControlPanel'
import TimeControl from './TimeControl'

const Map = () => {
  const [map, setMap] = useState(null)
  const [circle, setCircle] = useState(null)
  const [circleOptions, setCircleOptions] = useState({
    center: [0, 0],
    radius: 500,
    color: '#ff0000',
    shrinkTo: 250,
    shrinkDelay: 5000,
    animationSpeed: 1
  })
  const [timelineData, setTimelineData] = useState([
    { 
      "t": 0, 
      "data": [
        { "id": "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6", "pos": [12.3, 56.8,0], "hp": [100,100,50,50] },
        { "id": "Z9Y8X7W6V5U4T3S2R1Q0P9O8N7M6L5K4", "pos": [22.3, 46.8,0], "hp": [100,100,50,50] }
      ] 
    },
    { 
      "t": 0.01667, 
      "data": [
        { "id": "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6", "pos": [1000, 1000,0], "hp": [100,100,50,50] },
        { "id": "Z9Y8X7W6V5U4T3S2R1Q0P9O8N7M6L5K4", "pos": [22.3, 46.8,0], "hp": [100,100,50,50] }
      ] 
    },
    { 
      "t": 1, 
      "data": [
        { "id": "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6", "pos": [-2048, -2048,0], "hp": [100,100,50,50] },
        { "id": "Z9Y8X7W6V5U4T3S2R1Q0P9O8N7M6L5K4", "pos": [2048, 2048,0], "hp": [100,100,50,50] }
      ],
      "events": [
        { "type": "ringStartClosing", "stage":0, "center":[1076.234375,79.822443181818181818,0 ],"currentradius":2863.4225852272727273,"endradius":1000,"shrinkduration":10 }
      ]
    }
  ])
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const timerRef = useRef(null)

  const play = () => {
    setIsPlaying(true)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrentTime(prevTime => {
        const maxTime = getMaxTime()
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
    if (typeof window !== 'undefined' && !map) {
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
      const image = L.imageOverlay('/placeholder.svg?height=4096&width=4096', bounds).addTo(newMap)

      newMap.fitBounds(bounds)
      setMap(newMap)
    }
  }, [map])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const updateCircle = (newOptions) => {
    setCircleOptions({ ...circleOptions, ...newOptions })
  }

  const updateTime = (newTime) => {
    setCurrentTime(newTime)
  }

  const getCurrentPlayerData = () => {
    const currentTimeData = timelineData.find(data => data.t * 1000 <= currentTime) || timelineData[0]
    return currentTimeData.data
  }

  const getCurrentRingData = () => {
    const ringStartEvent = timelineData.find(data => data.events && data.events[0].type === 'ringStartClosing')
    if (!ringStartEvent) return null

    const event = ringStartEvent.events[0]
    const elapsedTime = (currentTime / 1000) - ringStartEvent.t
    const progress = Math.min(elapsedTime / event.shrinkduration, 1)
    const currentRadius = event.currentradius - (event.currentradius - event.endradius) * progress

    return {
      center: event.center,
      radius: currentRadius,
      color: '#ff0000',
    }
  }

  const getMaxTime = () => {
    const lastTimestamp = timelineData[timelineData.length - 1].t;
    const ringStartEvent = timelineData.find(data => data.events && data.events[0].type === 'ringStartClosing');
    const shrinkDuration = ringStartEvent ? ringStartEvent.events[0].shrinkduration : 0;
    return Math.max(lastTimestamp, ringStartEvent ? ringStartEvent.t + shrinkDuration : 0) * 1000;
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-grow flex">
        <div id="map" className="w-3/4 h-full"></div>
        <div className="w-1/4 p-4 overflow-y-auto">
          <ControlPanel 
            updateCircle={updateCircle}
            players={getCurrentPlayerData()}
          />
        </div>
      </div>
      <TimeControl 
        updateTime={updateTime}
        currentTime={currentTime}
        maxTime={getMaxTime()}
        isPlaying={isPlaying}
        play={play}
        pause={pause}
        stop={stop}
      />
      {map && (
        <>
          <CustomCircle
            map={map}
            options={getCurrentRingData() || circleOptions}
          />
          {getCurrentPlayerData().map((player, index) => (
            <PlayerMarker
              key={player.id}
              map={map}
              player={player}
              color={index === 0 ? '#0000FF' : '#00FF00'}
            />
          ))}
        </>
      )}
    </div>
  )
}

export default Map

