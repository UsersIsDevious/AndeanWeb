import React, { useState } from "react";
import L from 'leaflet';
import { MapContainer, ImageOverlay, Circle, Marker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MapView = ({ gameData, currentTime, selectedTeam }) => {
  const [activeMarkers, setActiveMarkers] = useState({}); // プレイヤーアイコン状態管理

  const mapBounds = [[0, 0], [4096, 4096]];

  const handleMarkerClick = (playerId) => {
    setActiveMarkers((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={mapBounds}
      style={{ height: "100%", width: "100%" }}
    >
      <ImageOverlay
        url="/apex_map.png"
        bounds={mapBounds}
      />
      {/* プレイヤーマーカー */}
      {gameData &&
        gameData.players
          .filter(player => player.timestamp <= currentTime)
          .map(player => (
            <Marker
              key={player.id}
              position={[player.position.y, player.position.x]}
              icon={L.divIcon({
                className: "custom-marker",
                html: activeMarkers[player.id]
                  ? `<img src="${player.characterImage}" style="border: 2px solid ${player.teamColor}; border-radius: 50%; width: 24px; height: 24px;" />`
                  : `<div style="border: 2px solid ${player.teamColor}; border-radius: 50%; width: 12px; height: 12px; background: ${player.teamColor};"></div>`
              })}
              eventHandlers={{
                click: () => handleMarkerClick(player.id),
              }}
            >
              <Tooltip>{player.name}</Tooltip>
            </Marker>
          ))}
      {/* リング収縮イベント */}
      {gameData &&
        gameData.events
          .filter(event => event.type === "ring")
          .map((ring, index) => (
            <Circle
              key={index}
              center={[ring.center.y, ring.center.x]}
              radius={ring.radius}
              pathOptions={{ color: "red", weight: 1 }}
            />
          ))}
    </MapContainer>
  );
};

export default MapView;
